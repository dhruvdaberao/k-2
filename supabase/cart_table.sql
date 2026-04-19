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
