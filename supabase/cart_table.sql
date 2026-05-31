create extension if not exists "uuid-ossp";

create table if not exists public.cart (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  product_id text not null,
  name text not null,
  price int not null,
  image text not null,
  quantity int not null default 1
);

create index if not exists cart_user_id_idx on public.cart (user_id);
create unique index if not exists cart_user_product_idx on public.cart (user_id, product_id);

-- Enable RLS
alter table public.cart enable row level security;

-- Allow users to view their own cart
create policy "Users can view their own cart"
on public.cart for select
using (auth.uid() = user_id);

-- Allow users to insert into their own cart
create policy "Users can insert into their own cart"
on public.cart for insert
with check (auth.uid() = user_id);

-- Allow users to update their own cart
create policy "Users can update their own cart"
on public.cart for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Allow users to delete their own cart
create policy "Users can delete their own cart"
on public.cart for delete
using (auth.uid() = user_id);
