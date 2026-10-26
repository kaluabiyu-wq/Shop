# Shop: full-stack online store

A realistic e-commerce app: browse and search products, cart, checkout, order history,
and an admin area to manage products and orders.

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | HTML, CSS, JavaScript, React 18 (Vite), React Router    |
| Backend  | ASP.NET Core 8 Web API, EF Core 8, JWT auth, Swagger    |
| Database | PostgreSQL 16                                           |

## Features
- Register / log in (BCrypt-hashed passwords, JWT bearer tokens, `Customer` and `Admin` roles)
- Product catalog with search, category filter, sorting and paging (server-side)
- Persistent cart (localStorage), checkout with shipping address
- Orders: stock is checked and decremented in a single transaction; the unit price is
  locked in at purchase time; customers can cancel pending orders (stock is restored)
- Oversell protection: PostgreSQL `xmin` optimistic concurrency on products
- Admin: create/edit/delete products, view all orders, change order status
- Validation (DataAnnotations), ProblemDetails error responses, role-protected endpoints

## Project layout
```
shop/
├── docker-compose.yml          # PostgreSQL
├── backend/Shop.Api/
│   ├── Controllers/            # Auth, Categories, Products, Orders
│   ├── Models/Entities.cs      # User, Category, Product, Order, OrderItem
│   ├── Data/                   # AppDbContext + DbSeeder
│   ├── Dtos/Dtos.cs            # request / response shapes
│   ├── Services/TokenService.cs
│   ├── Program.cs
│   └── appsettings.json
└── frontend/
    └── src/
        ├── api.js              # fetch wrapper (adds the JWT)
        ├── context/            # AuthContext, CartContext
        ├── components/         # Navbar, ProductCard, ProtectedRoute
        └── pages/              # Products, ProductDetail, Cart, Login, Register, Orders, Admin
```

## Run it

**Prerequisites:** [.NET 8 SDK](https://dotnet.microsoft.com/download), Node.js 18+, and either Docker or a local PostgreSQL.

### 1. Database
With Docker:
```bash
docker compose up -d
```
Or with your own PostgreSQL, create a database and user matching
`ConnectionStrings:Default` in `backend/Shop.Api/appsettings.json`:
```sql
CREATE USER shop WITH PASSWORD 'shop_pw';
CREATE DATABASE shop OWNER shop;
```

### 2. API
```bash
cd backend/Shop.Api
dotnet run
```
On first start the API creates the tables and seeds demo data.
It listens on http://localhost:5000, with Swagger UI at http://localhost:5000/swagger.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Vite proxies `/api` to the API on port 5000.

### Demo accounts
| Role     | Email                | Password     |
| -------- | -------------------- | ------------ |
| Admin    | admin@shop.local     | Admin123!    |
| Customer | customer@shop.local  | Customer123! |

## EF Core migrations (recommended once you start changing the model)
On first run the app uses `EnsureCreated`. To switch to real migrations:
```bash
dotnet tool install --global dotnet-ef
cd backend/Shop.Api
dotnet ef migrations add InitialCreate
```
Drop the `shop` database once (`docker compose down -v` then `up -d`) and run the API again.
From then on the app applies migrations automatically at startup.

## API summary
| Method | Endpoint                    | Access   |
| ------ | --------------------------- | -------- |
| POST   | /api/auth/register          | public   |
| POST   | /api/auth/login             | public   |
| GET    | /api/auth/me                | user     |
| GET    | /api/categories             | public   |
| GET    | /api/products               | public (`q`, `categoryId`, `sort`, `page`, `pageSize`) |
| GET    | /api/products/{id}          | public   |
| POST / PUT / DELETE | /api/products[/{id}] | admin |
| POST   | /api/orders                 | user (checkout) |
| GET    | /api/orders/mine            | user     |
| GET    | /api/orders/{id}            | owner or admin |
| POST   | /api/orders/{id}/cancel     | owner or admin (pending only) |
| GET    | /api/orders/all             | admin    |
| PATCH  | /api/orders/{id}/status     | admin    |

## Before you deploy
- Replace `Jwt:Key` with a long random secret, supplied via environment variable
  (`Jwt__Key`) or user-secrets, never committed.
- Change the seeded admin password, or remove the seeder.
- Set `Cors:Origins` to your real frontend URL and serve over HTTPS.
- The token is stored in `localStorage` for simplicity; for higher security consider
  httpOnly cookies.
- Payments are not implemented. "Place order" creates a `Pending` order.

## Ideas to extend
Stripe payments, image uploads, product reviews, refresh tokens, unit/integration tests
(xUnit + Testcontainers), and a Dockerfile for the API.
