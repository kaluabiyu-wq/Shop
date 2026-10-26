using System.ComponentModel.DataAnnotations;

namespace Shop.Api.Dtos;

// ---------- Auth ----------
public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public record UserDto(int Id, string Email, string FullName, string Role);

public record AuthResponse(string Token, UserDto User);

// ---------- Catalog ----------
public record CategoryDto(int Id, string Name);

public record ProductDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string? ImageUrl,
    int CategoryId,
    string CategoryName);

public class ProductRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0.01, 1_000_000)]
    public decimal Price { get; set; }

    [Range(0, 1_000_000)]
    public int Stock { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }
}

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

// ---------- Orders ----------
public class CheckoutItem
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; }
}

public class CheckoutRequest
{
    [Required, MinLength(5), MaxLength(300)]
    public string ShippingAddress { get; set; } = string.Empty;

    [Required, MinLength(1)]
    public List<CheckoutItem> Items { get; set; } = new();
}

public class UpdateOrderStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

public record OrderItemDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice);

public record OrderDto(
    int Id,
    string Status,
    decimal Total,
    string ShippingAddress,
    DateTime CreatedAt,
    string? CustomerEmail,
    List<OrderItemDto> Items);
