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
            // Prices are in Ethiopian Birr (ETB).
            var womenTraditional = new Category { Name = "Women's Traditional (Habesha Kemis)" };
            var menTraditional = new Category { Name = "Men's Traditional" };
            var shawls = new Category { Name = "Netela, Gabi & Scarves" };
            var kids = new Category { Name = "Kids' Clothing" };
            var modern = new Category { Name = "Modern & Casual Wear" };
            var accessories = new Category { Name = "Shoes & Accessories" };
            db.Categories.AddRange(womenTraditional, menTraditional, shawls, kids, modern, accessories);

            db.Products.AddRange(
                // Women's traditional
                P("Habesha Kemis - Classic White", "Hand-woven cotton dress with traditional tilet embroidery along the hem and sleeves. Worn for holidays and church.", 6500m, 15, "habesha-kemis-classic-white", womenTraditional),
                P("Habesha Kemis - Menen Cotton", "Lightweight Menen cotton dress with colorful woven border, made for Meskel, Timkat and weddings.", 8200m, 10, "habesha-kemis-menen-cotton", womenTraditional),
                P("Habesha Kemis - Wedding Premium", "Heavily embroidered dress with gold thread detailing, tailored for brides and special occasions.", 15500m, 5, "habesha-kemis-wedding-premium", womenTraditional),
                P("Shamma Dress with Tibeb Border", "Modern cut dress in handspun cotton finished with a traditional tibeb woven border.", 4800m, 20, "shamma-dress-with-tibeb-border", womenTraditional),

                // Men's traditional
                P("Men's Habesha Suit (Shirt & Trousers)", "Two-piece white cotton set with embroidered collar and chest, ideal for holidays and weddings.", 5200m, 18, "mens-habesha-suit-shirt-trousers", menTraditional),
                P("Men's Embroidered Habesha Shirt", "Long-sleeve cotton shirt with tilet embroidery on the placket and cuffs.", 2400m, 30, "mens-embroidered-habesha-shirt", menTraditional),
                P("Ethiopian Bernos Cape", "Warm hand-finished wool cape traditionally worn by highland elders and groomsmen.", 9800m, 6, "ethiopian-bernos-cape", menTraditional),
                P("Kuta Shirt", "Short-sleeve cotton Kuta shirt in natural white with a traditional woven trim.", 1900m, 35, "kuta-shirt", menTraditional),

                // Netela, Gabi & scarves
                P("Netela - Handwoven Cotton Shawl", "Soft, light white cotton shawl with a colorful tibeb border. Everyday and church wear.", 1200m, 50, "netela-handwoven-cotton-shawl", shawls),
                P("Gabi - Double Layer Cotton", "Thick multi-layer cotton blanket-shawl, traditionally worn in the cool highland evenings.", 3600m, 22, "gabi-double-layer-cotton", shawls),
                P("Kemis Scarf with Tilet Weave", "Fine woven scarf with traditional tilet pattern, available in gold and green.", 650m, 60, "kemis-scarf-with-tilet-weave", shawls),
                P("Ethiopian Cotton Throw Scarf", "Soft cotton scarf made from locally spun yarn, with red, yellow and green accent stripes.", 480m, 80, "ethiopian-cotton-throw-scarf", shawls),

                // Kids
                P("Girls' Habesha Kemis", "Child-size embroidered cotton dress for holidays and church. Sizes 2 to 10 years.", 1900m, 25, "girls-habesha-kemis", kids),
                P("Boys' Habesha Shirt & Trousers Set", "Matching embroidered set in white cotton for boys, sizes 2 to 10 years.", 1700m, 25, "boys-habesha-shirt-trousers-set", kids),
                P("Kids' Netela", "Small handwoven netela with colorful border, perfect for Timkat and Meskel celebrations.", 550m, 40, "kids-netela", kids),

                // Modern & casual
                P("Ethiopian Cotton Polo Shirt", "Breathable polo made from Ethiopian-grown cotton, in navy, white or green.", 850m, 70, "ethiopian-cotton-polo-shirt", modern),
                P("Habesha-Print Casual Shirt", "Everyday button-up shirt with subtle tilet-inspired print on the collar and cuffs.", 1300m, 45, "habesha-print-casual-shirt", modern),
                P("Modern Women's Blouse with Tibeb Trim", "Contemporary blouse with a traditional woven trim, suited for office and daily wear.", 1450m, 40, "modern-womens-blouse-with-tibeb-trim", modern),
                P("Ethiopian Leather Jacket", "Genuine Ethiopian goat-leather jacket with a soft finish and zip front.", 7800m, 12, "ethiopian-leather-jacket", modern),

                // Shoes & accessories
                P("Handmade Leather Sandals", "Durable sandals crafted by Ethiopian leather artisans, sizes 36 to 46.", 1100m, 40, "handmade-leather-sandals", accessories),
                P("Leather Loafers", "Hand-stitched Ethiopian leather loafers, a comfortable pair for work and formal events.", 3200m, 25, "leather-loafers", accessories),
                P("Traditional Silver Cross Necklace", "Lalibela-style silver cross pendant on a cord, handcrafted by silversmiths.", 1800m, 30, "traditional-silver-cross-necklace", accessories),
                P("Beaded Cultural Belt", "Handcrafted beaded belt, worn with traditional dresses for weddings and cultural events.", 750m, 0, "beaded-cultural-belt", accessories));
        }

        await db.SaveChangesAsync();
    }

    private static Product P(string name, string description, decimal price, int stock, string image, Category category) => new()
    {
        Name = name,
        Description = description,
        Price = price,
        Stock = stock,
        ImageUrl = $"/images/products/{image}.jpg",
        Category = category
    };
}
