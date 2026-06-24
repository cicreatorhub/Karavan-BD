# MarketHub Backend API

Node.js + Express + MongoDB backend for the MarketHub ecommerce platform, with JWT auth and Paystack payments.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```
   cp .env.example .env
   ```
   - `MONGO_URI` — get a free cluster at https://mongodb.com/atlas
   - `JWT_SECRET` — any long random string
   - `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — from https://dashboard.paystack.com/#/settings/developer (use test keys first)
   - `CLIENT_URL` — your frontend URL (for CORS + Paystack redirect)

3. **Seed sample data** (creates admin user + sample products)
   ```
   node seed.js
   ```
   Admin login: `admin@markethub.com` / `admin123`

4. **Run the server**
   ```
   npm run dev    # development (auto-restart)
   npm start      # production
   ```

## API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/profile` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |

### Products
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List products (search, category, sort, page) |
| GET | `/api/products/categories` | Public | List all categories |
| GET | `/api/products/:id` | Public | Get single product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/reviews` | Private | Add review |

### Orders
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Private | Create order + init Paystack payment |
| GET | `/api/orders/verify/:reference` | Private | Verify payment after redirect |
| POST | `/api/orders/webhook` | Public (Paystack) | Webhook for payment confirmation |
| GET | `/api/orders/myorders` | Private | Get logged-in user's orders |
| GET | `/api/orders/:id` | Private | Get single order |
| GET | `/api/orders` | Admin | Get all orders |
| PUT | `/api/orders/:id/status` | Admin | Update order status |

## Paystack Payment Flow

1. Frontend calls `POST /api/orders` with cart items + shipping address.
2. Backend creates the order in MongoDB, then calls Paystack's `/transaction/initialize`.
3. Backend returns `authorization_url` — redirect the user there to pay.
4. After payment, Paystack redirects to `CLIENT_URL/order-success?reference=xxx`.
5. Frontend calls `GET /api/orders/verify/:reference` to confirm payment and update the order.
6. (Recommended) Set up the webhook URL `https://yourapi.com/api/orders/webhook` in your Paystack dashboard as a backup in case the redirect verification is missed.

## Deployment Notes (Render/Koyeb/Railway)

- Set all `.env` variables in your platform's environment settings.
- Set `NODE_ENV=production`.
- Use MongoDB Atlas (not a local DB) since these platforms don't persist local storage.
- Update `CLIENT_URL` to your deployed frontend URL (e.g. Vercel) for CORS to work.
- Switch Paystack keys from `sk_test_`/`pk_test_` to live keys (`sk_live_`/`pk_live_`) when ready to accept real payments.

## Folder Structure

```
backend/
├── config/db.js          MongoDB connection
├── models/                Mongoose schemas (User, Product, Order)
├── routes/                 Express route handlers
├── middleware/            Auth + error handling
├── seed.js                  Sample data seeder
├── server.js              App entry point
└── .env.example
```
