# Developer Guide - Keshvi Crafts

Welcome to the developer documentation for Keshvi Crafts, a premium e-commerce platform for handmade crochet and artisanal products. This guide provides the technical foundation needed to maintain and extend the application.

---

## 1. Project Overview

**Keshvi Crafts** is a specialized e-commerce application designed to showcase and sell handcrafted crochet items. It balances a high-end aesthetic with robust functionality for both direct purchases and custom order inquiries.

### Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, and Vanilla CSS for custom design tokens.
- **Backend**: Supabase (PostgreSQL Database, Auth, and Storage).
- **Payments**: Manual verification flow via Instagram/WhatsApp with order tracking.
- **Analytics**: Custom event tracking for user interactions.

### Key Features
- **Dynamic Product Catalog**: Powered by a JSON-based data system.
- **Global Cart & Wishlist**: Persistent state management for user selections.
- **Auth System**: Full user lifecycle management (Login, Signup, Profile).
- **Review System**: Verified purchase reviews with dynamic rating calculation.
- **Checkout Flow**: Multi-step guided checkout with profile validation.
- **Admin Dashboard**: Secure interface for managing orders and reviews.

---

## 2. Project Structure

The project follows a standard Next.js App Router structure with logical separation of concerns:

```text
src/
├── app/            # Routes, pages, and API handlers
├── components/     # Reusable UI components (ui/, Layout, etc.)
├── data/           # Static data files (products.json)
├── hooks/          # Custom React hooks (useAuth, useToast, etc.)
├── lib/            # Utility functions and shared logic
├── styles/         # Global styles and CSS modules
└── types/          # TypeScript interface definitions
```

### Key Modules
- **Product Components**: Located in `src/components/`, including `ProductCard`, `ProductGrid`, and `ProductPageClient`.
- **Review System**: Logic handled in `src/app/api/reviews/` and displayed in `src/components/ReviewList`.
- **Supabase Provider**: Context provider in `src/hooks/useAuth.tsx` for global auth state.
- **Toast System**: Global notification system in `src/components/Toast.tsx` and `src/hooks/useToast.tsx`.

---

## 3. Product System

Products are managed through a centralized JSON file to ensure high performance and easy updates without database overhead for static content.

**File Path**: `src/data/products.json`

### Required Fields
When adding a new product, ensure the following fields are present:
- `id`: A unique string identifier (e.g., `keyring-tulip`). **CRITICAL: NEVER CHANGE THIS ONCE CREATED.**
- `slug`: URL-friendly version of the name (usually same as ID).
- `title`: The display name of the product.
- `price`: Numeric value (INR).
- `images`: Array of image paths (at least one).
- `description`: Detailed text about the product.
- `category`: Used for filtering (e.g., `Keyrings`, `Flowers`, `Bags`).
- `type`: `direct-purchase` (Add to Cart) or `custom-order` (Enquire on Instagram).

### The ID Rule
The product `id` is the primary key used to link data across:
- **Supabase `reviews` table**: `product_id` must match the JSON `id`.
- **Local Storage**: Cart and Wishlist items are stored by `id`.
- **Order Items**: Order history in the database references the product `id`.

---

## 4. Product Template

Copy and paste this template into `src/data/products.json` to add a new item:

```json
{
  "id": "unique-product-id",
  "slug": "unique-product-id",
  "title": "Beautiful Crochet Item",
  "description": "Handmade with premium yarn and attention to detail.",
  "price": 499,
  "images": [
    "/uploads/products/category/image1.png"
  ],
  "category": "Accessories",
  "stock": 999,
  "badge": "New Arrival",
  "type": "direct-purchase",
  "shippingCharge": 40,
  "cta": {
    "type": "add-to-cart",
    "label": "Add to Cart"
  }
}
```

---

## 5. Database (Supabase)

The application uses Supabase for dynamic data that requires persistence and security.

### Core Tables
- **`profiles`**: Extends Auth user data (name, phone, address).
- **`orders`**: Stores root order data (total, status, payment method).
- **`order_items`**: Junction table linking orders to product IDs.
- **`reviews`**: Stores user feedback and ratings.

### Review Table Schema
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `product_id` | Text | Matches `id` in `products.json` |
| `user_id` | UUID | References `auth.users` |
| `rating` | Int | 1 to 5 |
| `review` | Text | User's comment |
| `order_id` | UUID | Ensures the user actually bought the item |
| `created_at` | Timestamp | Auto-generated |

---

## 6. Review System Logic

The review system is designed to maintain high trust and data integrity.

- **Permissions**: Only logged-in users with a verified purchase (`order_id`) can submit a review.
- **Constraints**: One review per user, per product.
- **Dynamic Calculation**: Average ratings are calculated on the fly by filtering the `reviews` table by `product_id`.
- **Validation**: Submissions are validated server-side to ensure the `rating` is between 1-5 and the `review` text is clean.

---

## 7. Auth System

Authentication is handled by Supabase Auth with a custom React Context wrapper.

- **Initialization**: `useAuth` hook provides `user`, `profile`, and `isAdmin` status.
- **Session Management**: Handled automatically via cookies and local storage by the Supabase client.
- **Persistence**: User profiles are synced from the `profiles` table to ensure consistent delivery details during checkout.

---

## 8. Payment Flow

Currently, the project uses a manual verification flow for payments to accommodate the artisanal nature of the business.

1. **Order Creation**: Order is saved in Supabase with status `pending`.
2. **Payment Handoff**: For online payments, users are redirected to a direct Instagram DM or shown a QR code.
3. **Verification**: The admin verifies the payment manually via the dashboard or Instagram.
4. **Processing**: Once verified, the order status is updated to `processing` or `shipped`.

---

## 9. Email & Notifications

Order confirmations and status updates are sent via the `/api/send-email` endpoint.
- **Service**: Currently configured to use Resend / SMTP.
- **Templates**: Professional HTML templates are used for "Order Placed" and "Shipping Updates".
- **Logic**: Emails are triggered automatically after successful database insertion of an order.

---

## 10. Common Rules & Best Practices

- **ID Integrity**: Never change a product `id` in `products.json` after it has been live. This will break existing reviews and order history.
- **Profile Validation**: Always call `validateProfile()` in the checkout flow before allowing a user to proceed to payment.
- **Theme Consistency**: Use the brand color tokens:
  - Primary Brown: `#5a3e2b`
  - Secondary Accent: `#C2410C`
  - Background Cream: `#fdfbf7`
- **Component Focused**: Keep logic inside `lib/` and keep components purely visual where possible.

---

## 11. Debugging Tips

- **Reviews not showing?**: Check if the `product_id` in the Supabase `reviews` table exactly matches the `id` in `products.json`.
- **Checkout stuck?**: Open the console and check for profile validation errors. The system blocks "Proceed to Payment" if address fields are missing.
- **Auth issues?**: Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correctly set in your environment variables.
- **Styling issues?**: Check if Vanilla CSS overrides in `index.css` are conflicting with Tailwind utility classes.

---

## 12. Future Improvements

- **Razorpay Integration**: Transition from manual verification to automated payment gateway.
- **Image Reviews**: Allow users to upload photos of their received products.
- **Inventory Sync**: Move from static JSON to a fully dynamic Supabase product management system.
- **Admin Analytics**: Real-time sales tracking and product performance metrics on the dashboard.
