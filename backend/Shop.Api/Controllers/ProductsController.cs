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
        [FromQuery] int pageSize = 12,
        [FromQuery] bool inStockOnly = false)
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

        // Apply stock filtering before counting and pagination so results stay accurate.
        if (inStockOnly)
            query = query.Where(p => p.Stock > 0);

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => (p.SalePrice.HasValue && p.SalePrice.Value < p.Price ? p.SalePrice.Value : p.Price)),
            "price_desc" => query.OrderByDescending(p => (p.SalePrice.HasValue && p.SalePrice.Value < p.Price ? p.SalePrice.Value : p.Price)),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(
                p.Id, p.Name, p.Description, p.Price, p.SalePrice, p.Stock, p.ImageUrl, p.CategoryId, p.Category!.Name))
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
                p.Id, p.Name, p.Description, p.Price, p.SalePrice, p.Stock, p.ImageUrl, p.CategoryId, p.Category!.Name))
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product);
    }

    // "You may also like": same category first, then closest price, then best-selling.
    [HttpGet("{id:int}/recommendations")]
    public async Task<ActionResult<List<ProductDto>>> GetRecommendations(int id, [FromQuery] int count = 8)
    {
        count = Math.Clamp(count, 1, 20);

        var source = await db.Products.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new { p.Id, p.CategoryId, Price = p.SalePrice.HasValue && p.SalePrice.Value < p.Price ? p.SalePrice.Value : p.Price })
            .FirstOrDefaultAsync();
        if (source is null) return NotFound();

        var sameCategory = await db.Products.AsNoTracking()
            .Where(p => p.Id != id && p.Stock > 0 && p.CategoryId == source.CategoryId)
            .Select(p => new { Product = p, Eff = p.SalePrice.HasValue && p.SalePrice.Value < p.Price ? p.SalePrice.Value : p.Price })
            .OrderBy(x => Math.Abs(x.Eff - source.Price))
            .Take(count)
            .Select(x => new ProductDto(x.Product.Id, x.Product.Name, x.Product.Description, x.Product.Price, x.Product.SalePrice,
                x.Product.Stock, x.Product.ImageUrl, x.Product.CategoryId, x.Product.Category!.Name))
            .ToListAsync();

        if (sameCategory.Count < count)
        {
            var taken = sameCategory.Select(p => p.Id).Append(id).ToList();
            var filler = await PopularQuery(taken).Take(count - sameCategory.Count).ToListAsync();
            sameCategory.AddRange(filler);
        }
        return Ok(sameCategory);
    }

    // Personalised "Recommended for you": based on recently viewed ids (categories they like),
    // topped up with best-sellers.
    [HttpGet("recommended")]
    public async Task<ActionResult<List<ProductDto>>> GetRecommended([FromQuery] string? ids, [FromQuery] int count = 8)
    {
        count = Math.Clamp(count, 1, 20);
        var seen = (ids ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var n) ? n : 0).Where(n => n > 0).Distinct().Take(20).ToList();

        var result = new List<ProductDto>();
        if (seen.Count > 0)
        {
            var categoryIds = await db.Products.AsNoTracking()
                .Where(p => seen.Contains(p.Id)).Select(p => p.CategoryId).Distinct().ToListAsync();
            result = await db.Products.AsNoTracking()
                .Where(p => !seen.Contains(p.Id) && p.Stock > 0 && categoryIds.Contains(p.CategoryId))
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.SalePrice, p.Stock, p.ImageUrl, p.CategoryId, p.Category!.Name))
                .ToListAsync();
        }

        if (result.Count < count)
        {
            var taken = seen.Concat(result.Select(p => p.Id)).ToList();
            result.AddRange(await PopularQuery(taken).Take(count - result.Count).ToListAsync());
        }
        return Ok(result);
    }

    // Best-sellers by units ordered (cancelled orders ignored); products never ordered fall back to newest.
    private IQueryable<ProductDto> PopularQuery(List<int> excludeIds) =>
        db.Products.AsNoTracking()
            .Where(p => !excludeIds.Contains(p.Id) && p.Stock > 0)
            .OrderByDescending(p => db.OrderItems
                .Where(i => i.ProductId == p.Id && i.Order!.Status != OrderStatus.Cancelled)
                .Sum(i => (int?)i.Quantity) ?? 0)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.SalePrice, p.Stock, p.ImageUrl, p.CategoryId, p.Category!.Name));

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(ProductRequest req)
    {
        var category = await db.Categories.FindAsync(req.CategoryId);
        if (category is null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Category does not exist.");

        if (req.SalePrice.HasValue && req.SalePrice.Value >= req.Price)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Sale price must be lower than the regular price.");

        var product = new Product
        {
            Name = req.Name.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            Price = req.Price,
            SalePrice = req.SalePrice,
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
        if (req.SalePrice.HasValue && req.SalePrice.Value >= req.Price)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Sale price must be lower than the regular price.");

        product.Price = req.Price;
        product.SalePrice = req.SalePrice;
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
        new(p.Id, p.Name, p.Description, p.Price, p.SalePrice, p.Stock, p.ImageUrl, p.CategoryId, categoryName);
}
