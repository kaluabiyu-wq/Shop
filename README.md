# Shop: Full-Stack Online Store

A full-stack e-commerce application built with React and ASP.NET Core. Customers can browse products, search and filter the catalog, manage their shopping carts, check out securely, and track orders. Administrators can manage products, configure sale prices, and process customer orders.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, CSS, React Router |
| Backend | ASP.NET Core 8 Web API, Entity Framework Core 8, JWT authentication, Swagger |
| Database | PostgreSQL 16 |
| Client-side storage | localStorage for cart and saved-for-later items |

## Features

### Authentication and Authorization
- Customer registration and login.
- BCrypt-hashed passwords and JWT bearer authentication.
- Role-based authorization for `Customer` and `Admin` users.
- Protected customer and administration routes.

### Product Catalog
- Browse products with server-side pagination.
- Search products, filter by category, and sort results.
- Product details, pricing, and availability information.
- Sale prices and discount displays for eligible products.

### Smart Shopping Cart
- Persistent cart stored in `localStorage`.
- Refreshes product prices and stock availability when validating cart items.
- Warns customers when products are unavailable, prices change, or requested quantities exceed available stock.
- Supports quantity updates and removing items.
- Displays regular prices, sale prices, and applicable discounts.
- Shows progress toward the free-shipping threshold.
- Prevents checkout when cart validation identifies unresolved issues.

### Save for Later
- Move cart items to a separate saved-for-later list.
- Restore saved products to the shopping cart.
- Remove items from the saved list.
- Persist saved items locally between browser sessions.

### Checkout and Orders
- Checkout with a shipping address or pickup option.
- Server-side validation of product prices and stock before order creation.
- Stock validation and inventory updates within a database transaction.
- Order-item prices are locked at purchase time.
- Free shipping on qualifying orders with merchandise subtotals of **ETB 3,000 or more**.
- Pickup orders have no delivery charge.
- Customers can view order history and cancel eligible pending orders.
- Stock is restored when a pending order is successfully cancelled.

### Delivery Information
- Product pages display estimated delivery times:
  - Addis Ababa: 1–3 business days.
  - Other regions: 3–7 business days.
- Product pages include return-request information.

> **Before production:** Confirm the free-shipping threshold, delivery estimates, and return policy against your actual business policies.

### Administration
- Create, edit, and delete products.
- Configure regular prices and optional sale prices.
- Manage product stock and other product details.
- View customer orders and update order statuses.

### Backend Reliability and Validation
- DataAnnotations request validation.
- ProblemDetails error responses.
- Role-protected API endpoints.
- PostgreSQL `xmin` optimistic concurrency for product updates.
- Server-side checkout validation to prevent stale client-side prices and overselling.

## Project Layout

```text
shop/
├── docker-compose.yml
├── backend/
│   └── Shop.Api/
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── CategoriesController.cs
│       │   ├── ProductsController.cs
│       │   └── OrdersController.cs
│       ├── Models/
│       │   └── Entities.cs
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   └── DbSeeder.cs
│       ├── Dtos/
│       │   └── Dtos.cs
│       ├── Services/
│       │   └── TokenService.cs
│       ├── Program.cs
│       └── appsettings.json
└── frontend/
    └── src/
        ├── api.js
        ├── context/
        │   ├── AuthContext.jsx
        │   └── CartContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProductCard.jsx
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Products.jsx
        │   ├── ProductDetail.jsx
        │   ├── Cart.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Orders.jsx
        │   └── Admin.jsx
        └── styles.css
```

*The layout above is representative; actual filenames may vary slightly depending on your project version.*

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18 or later](https://nodejs.org/)
- Docker Desktop with Docker Compose, or a local PostgreSQL 16 installation
- Git (optional)

## Run the Application

### 1. Start PostgreSQL

From the project root, run:

```bash
docker compose up -d
```

If you use your own PostgreSQL instance, create a database and user matching the `ConnectionStrings:Default` configuration in `backend/Shop.Api/appsettings.json`.

Example SQL:

```sql
CREATE USER shop WITH PASSWORD 'shop_pw';
CREATE DATABASE shop OWNER shop;
```

**Windows troubleshooting:** If PowerShell reports that `docker` is not recognized, install Docker Desktop, start it, and reopen your terminal. Verify the installation with:

```powershell
docker --version
docker compose version
```

### 2. Start the API

Open a terminal at the project root:

```bash
cd backend/Shop.Api
dotnet restore
dotnet run
```

The API is expected to listen on `http://localhost:5000`, with Swagger UI at:

[http://localhost:5000/swagger](http://localhost:5000/swagger)

Check the configured URLs in `Properties/launchSettings.json` or the application settings if your API starts on a different port.

### 3. Update the Database Schema

The latest features introduce a nullable `SalePrice` property on products. The database schema must include this column before using the updated API.

If you are using the provided SQL migration script, run it against the correct PostgreSQL database **once**:

```text
backend/Shop.Api/Data/CartSalesAndShipping.sql
```

For example, using `psql`:

```bash
psql -U shop -d shop -f backend/Shop.Api/Data/CartSalesAndShipping.sql
```

Adjust the path and database connection options for your environment.

**Important:** If you use EF Core migrations instead, create and apply a migration that adds `SalePrice` and its validation constraint. Do not run both the SQL migration and an equivalent EF migration against the same database.

### 4. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally:

[http://localhost:5173](http://localhost:5173)

Ensure the frontend's API proxy points to the actual backend URL.

## Demo Accounts

If database seeding is enabled, the application may provide these demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shop.local` | `Admin123!` |
| Customer | `customer@shop.local` | `Customer123!` |

If these accounts are not available, check the database seeder and create the accounts using your application's registration or seeding process.

**Security:** These are development credentials only. Never use them in production.

## Configuration

Review the following before running the application:

- `backend/Shop.Api/appsettings.json` — database connection and JWT configuration.
- Frontend API configuration — the backend URL and Vite proxy.
- `DeliveryPricing.FreeShippingThreshold` in `Controllers/OrdersController.cs`.
- `FREE_SHIPPING_THRESHOLD` in `frontend/src/pages/Cart.jsx`.

The free-shipping threshold is **ETB 3,000** by default. Keep the frontend display and backend calculation synchronized. The backend must remain the source of truth for shipping costs, prices, and stock.

Do not commit production secrets or real database passwords to source control.

## API Summary

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Authenticated user |
| `GET` | `/api/categories` | Public |
| `GET` | `/api/products` | Public |
| `GET` | `/api/products/{id}` | Public |
| `POST` | `/api/products` | Admin |
| `PUT` | `/api/products/{id}` | Admin |
| `DELETE` | `/api/products/{id}` | Admin |
| `POST` | `/api/orders` | Authenticated user |
| `GET` | `/api/orders/mine` | Authenticated user |
| `GET` | `/api/orders/{id}` | Owner or admin |
| `POST` | `/api/orders/{id}/cancel` | Owner or admin, pending orders only |
| `GET` | `/api/orders/all` | Admin |
| `PATCH` | `/api/orders/{id}/status` | Admin |

The product listing endpoint supports query parameters such as `q`, `categoryId`, `sort`, `page`, and `pageSize`, subject to the implementation in your API.

## EF Core Migrations

For an existing project using `EnsureCreated`, be aware that `EnsureCreated` does **not** update an existing database schema when you add model properties.

For ongoing development, use EF Core migrations:

```bash
dotnet tool install --global dotnet-ef
cd backend/Shop.Api
dotnet ef migrations add AddProductSalePrice
dotnet ef database update
```

Make sure the migration matches your actual model and database state. If you switch an existing application from `EnsureCreated` to migrations, plan the transition carefully; do not drop a database containing data you need to keep.

## Production Checklist

- [ ] Apply and verify the database schema update.
- [ ] Build and test both frontend and backend.
- [ ] Confirm free-shipping and delivery rules.
- [ ] Confirm the published return policy.
- [ ] Replace demo credentials and development secrets.
- [ ] Configure production CORS, HTTPS, JWT keys, and database credentials.
- [ ] Test price changes, unavailable products, quantity limits, sale prices, and checkout failures.
- [ ] Verify order cancellation and inventory restoration.
- [ ] Test the application with a clean database and with existing database data.

## Author

**Kalu Abiyu**
