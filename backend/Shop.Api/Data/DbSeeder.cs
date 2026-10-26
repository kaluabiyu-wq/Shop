using Microsoft.EntityFrameworkCore;
using Shop.Api.Models;

namespace Shop.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (!await db.Users.AnyAsync())
        {
            db.Users.AddRange(
                new User
                {
                    Email = "admin@shop.local",
                    FullName = "Store Admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = Roles.Admin
                },
                new User
                {
                    Email = "customer@shop.local",
                    FullName = "Demo Customer",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
                    Role = Roles.Customer
                });
        }

        if (!await db.Categories.AnyAsync())
        {
            var electronics = new Category { Name = "Electronics" };
            var books = new Category { Name = "Books" };
            var home = new Category { Name = "Home & Kitchen" };
            db.Categories.AddRange(electronics, books, home);

            db.Products.AddRange(
                P("Wireless Headphones", "Over-ear Bluetooth headphones with 30-hour battery life.", 89.99m, 25, "headphones", electronics),
                P("Mechanical Keyboard", "Compact 75% layout with hot-swappable switches.", 74.50m, 40, "keyboard", electronics),
                P("USB-C Hub", "7-in-1 hub: HDMI, SD card, USB 3.0 and 100W pass-through charging.", 39.00m, 60, "usbhub", electronics),
                P("Portable Speaker", "Waterproof speaker with 12 hours of playtime.", 49.99m, 35, "speaker", electronics),
                P("Clean Code", "A handbook of agile software craftsmanship.", 34.95m, 50, "cleancode", books),
                P("The Pragmatic Programmer", "Your journey to mastery, 20th anniversary edition.", 42.00m, 45, "pragmatic", books),
                P("Designing Data-Intensive Applications", "The big ideas behind reliable, scalable systems.", 54.99m, 30, "ddia", books),
                P("Atomic Habits", "An easy and proven way to build good habits.", 18.00m, 80, "habits", books),
                P("Ceramic Coffee Mug Set", "Set of four 350ml stoneware mugs.", 24.00m, 70, "mugs", home),
                P("Cast Iron Skillet", "Pre-seasoned 26cm skillet, oven safe.", 31.50m, 20, "skillet", home),
                P("Bamboo Cutting Board", "Large board with juice groove.", 22.00m, 55, "board", home),
                P("Electric Kettle", "1.7L stainless steel kettle with auto shut-off.", 36.99m, 0, "kettle", home));
        }

        await db.SaveChangesAsync();
    }

    private static Product P(string name, string description, decimal price, int stock, string seed, Category category) => new()
    {
        Name = name,
        Description = description,
        Price = price,
        Stock = stock,
        ImageUrl = $"https://picsum.photos/seed/{seed}/600/400",
        Category = category
    };
}
