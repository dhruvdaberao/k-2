
"use client";
import * as React from "react";

type Item = { slug: string; title: string; price: number; image?: string };

export default function ClientCardActions({ item }: { item: Item }) {
  const [wished, setWished] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [collections, setCollections] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const wl: Item[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWished(wl.some(x => x.slug === item.slug));
      const raw = JSON.parse(localStorage.getItem("collections") || "{}");
      setCollections(Object.keys(raw));
    } catch {}
  }, [item.slug]);

  function toggleWishlist() {
    const key = "wishlist";
    const arr: Item[] = JSON.parse(localStorage.getItem(key) || "[]");
    const i = arr.findIndex(x => x.slug === item.slug);
    if (i > -1) { arr.splice(i, 1); setWished(false); }
    else { arr.push(item); setWished(true); }
    localStorage.setItem(key, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
  }

  function addToCart() {
    const key = "cart";
    const cart: any[] = JSON.parse(localStorage.getItem(key) || "[]");
    const i = cart.findIndex(x => x.slug === item.slug);
    if (i > -1) cart[i].qty = (cart[i].qty || 1) + 1;
    else cart.push({ ...item, qty: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart-updated"));
    alert("Added to cart");
  }

  function addToCollection(name: string) {
    if (!name) return;
    const key = "collections";
    const map: Record<string, Item[]> = JSON.parse(localStorage.getItem(key) || "{}");
    const list = map[name] || [];
    if (!list.some(x => x.slug === item.slug)) list.push(item);
    map[name] = list;
    localStorage.setItem(key, JSON.stringify(map));
    alert(`Added to "${name}"`);
    setOpen(false);
  }

  function createCollection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    if (!name) return;
    addToCollection(name);
    setCollections(prev => prev.includes(name) ? prev : [...prev, name]);
    e.currentTarget.reset();
  }

  return (
    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8, position:"relative"}}>
      <button className="btn" onClick={toggleWishlist} aria-pressed={wished}>
        {wished ? "♥ In Wishlist" : "♡ Wishlist"}
      </button>

      <button className="btn primary" onClick={addToCart}>
        Add to Cart
      </button>

      <button className="btn" onClick={() => setOpen(v => !v)}>
        + Collection
      </button>

      {open && (
        <div
          style={{
            position:"absolute", zIndex:100, top:"110%", left:0, background:"#fff",
            border:"1px solid #e9e9e9", borderRadius:10, padding:10, minWidth:240,
            boxShadow:"0 6px 18px rgba(0,0,0,.08)"
          }}
        >
          <div className="meta" style={{marginBottom:6}}>Add to…</div>

          {collections.length ? (
            <div style={{display:"grid",gap:6, marginBottom:8}}>
              {collections.map(name => (
                <button key={name} className="btn" onClick={() => addToCollection(name)}>{name}</button>
              ))}
            </div>
          ) : (
            <div className="meta" style={{marginBottom:8}}>No collections yet.</div>
          )}

          <form onSubmit={createCollection} style={{display:"flex",gap:6}}>
            <input
              name="name"
              placeholder="New collection name"
              style={{flex:1,padding:8,border:"1px solid #e9e9e9",borderRadius:8}}
            />
            <button className="btn primary" type="submit">Create</button>
          </form>
        </div>
      )}
    </div>
  );
}
