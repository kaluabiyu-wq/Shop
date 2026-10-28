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
    decimal? SalePrice,
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

    [Range(0.01, 1_000_000)]
    public decimal? SalePrice { get; set; }

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
    [MaxLength(1000)]
    public string ShippingAddress { get; set; } = string.Empty;

    [Required, RegularExpression("^(Delivery|Pickup)$")]
    public string DeliveryMethod { get; set; } = "Delivery";

    [Required, Phone, MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(100)] public string? Subcity { get; set; }
    [MaxLength(100)] public string? Woreda { get; set; }
    [MaxLength(200)] public string? Landmark { get; set; }
    [MaxLength(500)] public string? Directions { get; set; }
    [MaxLength(1000)] public string? MapUrl { get; set; }
    [MaxLength(100)] public string? RegionalCity { get; set; }

    [Required, RegularExpression("^(Telebirr|CBE Birr|Bank Transfer)$")]
    public string PaymentMethod { get; set; } = "Telebirr";
    [MaxLength(100)] public string? PaymentTransactionId { get; set; }
    [MaxLength(7000000)] public string? PaymentProofDataUrl { get; set; }

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
    List<OrderItemDto> Items,
    string DeliveryMethod,
    string PhoneNumber,
    string? Subcity,
    string? Woreda,
    string? Landmark,
    string? Directions,
    string? MapUrl,
    string? RegionalCity,
    decimal DeliveryFee,
    string PaymentMethod,
    string? PaymentTransactionId,
    string? PaymentProofDataUrl,
    bool PaymentVerified);
