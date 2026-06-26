# Keshvi Crafts

A premium e-commerce platform designed to showcase and sell handcrafted crochet items and artisanal products. This application balances a high-end aesthetic with robust functionality for both direct purchases and custom order inquiries.

## 🚀 Features

- **Dynamic Product Catalog**: High-performance static catalog driven by structured JSON data.
- **Global Cart & Wishlist**: Persistent state management for a seamless shopping experience.
- **Secure Authentication**: Full user lifecycle management (Login, Signup, Profile) powered by Supabase.
- **Review System**: Verified purchase reviews with dynamic rating calculation.
- **Guided Checkout Flow**: Multi-step checkout process with profile validation and order tracking.
- **Admin Dashboard**: Secure interface for managing orders, reviews, and customer inquiries.

## 💻 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Library**: React 18
- **Styling**: Tailwind CSS & Vanilla CSS (Custom Design Tokens)
- **Database & Auth**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Recommended)

## 🛠️ Getting Started

### Prerequisites

- Node.js (v20.x recommended)
- npm or pnpm or yarn
- Supabase account for database and authentication

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd keshvicrafts-2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add your Supabase credentials and other necessary keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Add other required environment variables here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```text
src/
├── app/            # Next.js App Router (Pages & API)
├── components/     # Reusable UI components
├── data/           # Static data (e.g., products.json)
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── styles/         # Global styles
└── types/          # TypeScript definitions
```

## 📄 License

This project is private and proprietary.
