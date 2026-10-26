using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shop.Api.Data;
using Shop.Api.Dtos;
using Shop.Api.Models;

namespace Shop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        [FromQuery] string sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, pattern) || EF.Functions.ILike(p.Description, pattern));
        }

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(
                p.Id, p.Name, p.Description, p.Price, p.Stock, p.ImageUrl, p.CategoryId, p.Category!.Name))
            .ToListAsync();

        return Ok(new PagedResult<ProductDto>(items, page, pageSize, total));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProductDto(
                p.Id, p.Name, p.Description, p.Price, p.Stock, p.ImageUrl, p.CategoryId, p.Category!.Name))
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(ProductRequest req)
    {
        var category = await db.Categories.FindAsync(req.CategoryId);
        if (category is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Category does not exist.");

        var product = new Product
        {
            Name = req.Name.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            Price = req.Price,
            Stock = req.Stock,
            ImageUrl = string.IsNullOrWhiteSpace(req.ImageUrl) ? null : req.ImageUrl.Trim(),
            CategoryId = category.Id
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToDto(product, category.Name));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductRequest req)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        var category = await db.Categories.FindAsync(req.CategoryId);
        if (category is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Category does not exist.");

        product.Name = req.Name.Trim();
        product.Description = req.Description?.Trim() ?? string.Empty;
        product.Price = req.Price;
        product.Stock = req.Stock;
        product.ImageUrl = string.IsNullOrWhiteSpace(req.ImageUrl) ? null : req.ImageUrl.Trim();
        product.CategoryId = category.Id;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "This product was changed by someone else. Reload and try again.");
        }

        return Ok(ToDto(product, category.Name));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        if (await db.OrderItems.AnyAsync(i => i.ProductId == id))
            return Problem(statusCode: StatusCodes.Status409Conflict,
                detail: "This product appears in existing orders and cannot be deleted. Set its stock to 0 instead.");

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ProductDto ToDto(Product p, string categoryName) =>
        new(p.Id, p.Name, p.Description, p.Price, p.Stock, p.ImageUrl, p.CategoryId, categoryName);
}
