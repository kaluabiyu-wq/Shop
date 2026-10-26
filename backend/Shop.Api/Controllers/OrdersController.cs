using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shop.Api.Data;
using Shop.Api.Dtos;
using Shop.Api.Models;

namespace Shop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class OrdersController(AppDbContext db) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private IQueryable<Order> OrdersWithDetails() =>
        db.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product);

    // POST /api/orders  -> checkout
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Checkout(CheckoutRequest req)
    {
        // Merge duplicate lines for the same product.
        var lines = req.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();

        var ids = lines.Select(l => l.ProductId).ToList();
        var products = await db.Products.Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        if (products.Count != ids.Count)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "One or more products no longer exist.");

        foreach (var line in lines)
        {
            var product = products[line.ProductId];
            if (product.Stock < line.Quantity)
                return Problem(statusCode: StatusCodes.Status409Conflict,
                    detail: $"Only {product.Stock} of '{product.Name}' left in stock.");
        }

        var order = new Order
        {
            UserId = CurrentUserId,
            ShippingAddress = req.ShippingAddress.Trim(),
            Status = OrderStatus.Pending
        };

        foreach (var line in lines)
        {
            var product = products[line.ProductId];
            product.Stock -= line.Quantity;
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = line.Quantity,
                UnitPrice = product.Price // price is locked in at purchase time
            });
        }

        order.Total = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        db.Orders.Add(order);

        try
        {
            // One SaveChanges = one transaction: order + stock changes succeed or fail together.
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict,
                detail: "Stock changed while you were checking out. Please review your cart and try again.");
        }

        var created = await OrdersWithDetails().AsNoTracking().FirstAsync(o => o.Id == order.Id);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(created));
    }

    // GET /api/orders/mine
    [HttpGet("mine")]
    public async Task<ActionResult<List<OrderDto>>> Mine()
    {
        var userId = CurrentUserId;
        var orders = await OrdersWithDetails()
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(ToDto).ToList());
    }

    // GET /api/orders/all  (admin)
    [Authorize(Roles = Roles.Admin)]
    [HttpGet("all")]
    public async Task<ActionResult<List<OrderDto>>> All([FromQuery] string? status)
    {
        var query = OrdersWithDetails().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var parsed))
            query = query.Where(o => o.Status == parsed);

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders.Select(ToDto).ToList());
    }

    // GET /api/orders/5  (owner or admin)
    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var userId = CurrentUserId;
        var isAdmin = User.IsInRole(Roles.Admin);

        var order = await OrdersWithDetails()
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && (isAdmin || o.UserId == userId));

        return order is null ? NotFound() : Ok(ToDto(order));
    }

    // POST /api/orders/5/cancel  (owner or admin, pending only; restores stock)
    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<OrderDto>> Cancel(int id)
    {
        var userId = CurrentUserId;
        var isAdmin = User.IsInRole(Roles.Admin);

        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && (isAdmin || o.UserId == userId));

        if (order is null) return NotFound();

        if (order.Status != OrderStatus.Pending)
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Only pending orders can be cancelled.");

        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        foreach (var item in order.Items)
            products[item.ProductId].Stock += item.Quantity;

        order.Status = OrderStatus.Cancelled;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Could not cancel the order right now. Please try again.");
        }

        var updated = await OrdersWithDetails().AsNoTracking().FirstAsync(o => o.Id == id);
        return Ok(ToDto(updated));
    }

    // PATCH /api/orders/5/status  (admin)
    [Authorize(Roles = Roles.Admin)]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, UpdateOrderStatusRequest req)
    {
        if (!Enum.TryParse<OrderStatus>(req.Status, true, out var status))
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Unknown status.");

        if (status == OrderStatus.Cancelled)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Use the cancel endpoint to cancel an order.");

        var order = await db.Orders.FindAsync(id);
        if (order is null) return NotFound();

        if (order.Status == OrderStatus.Cancelled)
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Cancelled orders cannot be changed.");

        order.Status = status;
        await db.SaveChangesAsync();

        var updated = await OrdersWithDetails().AsNoTracking().FirstAsync(o => o.Id == id);
        return Ok(ToDto(updated));
    }

    private static OrderDto ToDto(Order o) => new(
        o.Id,
        o.Status.ToString(),
        o.Total,
        o.ShippingAddress,
        o.CreatedAt,
        o.User?.Email,
        o.Items
            .Select(i => new OrderItemDto(i.ProductId, i.Product?.Name ?? "Unknown product", i.Quantity, i.UnitPrice))
            .ToList());
}
