# Zinc Demo Storefront

A single-product demo storefront showcasing Zinc's core Amazon-ordering workflow. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, and Drizzle ORM.

## Features

- **Credential-based checkout**: Users supply Amazon email + password (+ optional TOTP key) for Prime account orders
- **Addax checkout**: Anonymous purchases using Zinc Managed Account balance
- **Order tracking**: Real-time status updates via webhooks and background polling
- **Return management**: Generate return labels and track return status
- **2FA support**: Handle Amazon account verification requirements
- **Error handling**: Comprehensive error handling with retry mechanisms

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Neon Postgres with Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel with serverless functions and cron jobs

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `ZINC_CLIENT_TOKEN`: Your Zinc API client token
   - `POSTGRES_URL`: Your Neon database connection string
   - `ZINC_WEBHOOK_SECRET`: Secret for webhook authentication
   - `ADDAX_ENABLED`: Set to "true" if Addax is enabled for your account
   - `CRON_SECRET`: Secret for securing cron endpoints

3. **Database setup:**
   ```bash
   npm run db:push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

## Product

The demo showcases ordering of a single SKU:
- **Product**: Pentel R.S.V.P. Ballpoint Pen (2-Pack)
- **SKU**: `B002YM4WME`
- **Price**: $4.99

## API Endpoints

### Checkout
- `POST /api/checkout` - Place new order

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders/[id]/retry` - Retry order with verification code

### Returns
- `POST /api/return` - Request return for order

### Webhooks
- `POST /api/webhooks/[slug]` - Receive Zinc webhook notifications

### Cron Jobs
- `GET /api/cron/poll` - Background polling for order/return updates

## Pages

- `/` - Product page with checkout form
- `/orders` - Orders dashboard
- `/orders/[id]` - Order detail view

## Database Schema

The app uses three main tables:

- **orders**: Store order information and Zinc responses
- **returns**: Track return requests and labels
- **webhook_events**: Log all webhook events for debugging

## Deployment

1. **Deploy to Vercel:**
   ```bash
   vercel deploy
   ```

2. **Set environment variables** in Vercel dashboard

3. **The cron job will automatically run every 5 minutes** to poll for order updates

## Error Handling

The app handles common Zinc error scenarios:

- `product_unavailable`: Shows out of stock message
- `max_price_exceeded`: Prompts for price confirmation
- `account_locked_verification_required`: Shows 2FA modal
- `manual_review_required`: Displays review status

## Testing

Test both checkout modes:

1. **Credentials mode**: Use valid Prime account credentials
2. **Addax mode**: Ensure sufficient Addax balance

The app includes idempotency protection and proper error handling for production use.