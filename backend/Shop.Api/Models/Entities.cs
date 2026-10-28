namespace Shop.Api.Models;

public static class Roles
{
    public const string Customer = "Customer";
    public const string Admin = "Admin";
}

public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Delivered,
    Cancelled
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Customer;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Order> Orders { get; set; } = new();
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<Product> Products { get; set; } = new();
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public int Stock { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    // Maps to PostgreSQL's xmin column; prevents two checkouts overselling the same stock.
    public uint Version { get; set; }
}

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal Total { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string DeliveryMethod { get; set; } = "Delivery";
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Subcity { get; set; }
    public string? Woreda { get; set; }
    public string? Landmark { get; set; }
    public string? Directions { get; set; }
    public string? MapUrl { get; set; }
    public string? RegionalCity { get; set; }
    public decimal DeliveryFee { get; set; }
    public string PaymentMethod { get; set; } = "Telebirr";
    public string? PaymentTransactionId { get; set; }
    public string? PaymentProofDataUrl { get; set; }
    public bool PaymentVerified { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
