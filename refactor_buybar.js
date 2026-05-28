const fs = require('fs');
let file = 'src/components/BuyBar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace lib/bags imports with useCart
content = content.replace(/import \{ handleAddToCart, loadCart, updateQty, removeFromCart \} from "@\/lib\/bags";/, 'import { useCart } from "@/hooks/useCart";');

// Inside BuyBar component, add useCart hook and remove local state/sync logic
content = content.replace(/const \[cartQuantity, setCartQuantity\] = useState\(0\);\s*const \[showConfirmModal, setShowConfirmModal\] = useState\(false\);\s*const \[showQtyModal, setShowQtyModal\] = useState\(false\);\s*const \[buyQty, setBuyQty\] = useState\(1\);\s*const \[showOutOfStockModal, setShowOutOfStockModal\] = useState\(false\);\s*\/\/ Sync cart qty on mount and on bag:changed events\s*const syncQty = async \(\) => \{\s*const list = await loadCart\(\);\s*const item = list\.find\(\(x: any\) => x\.id === slug\);\s*setCartQuantity\(item\?\.quantity \?\? 0\);\s*\};\s*useEffect\(\(\) => \{\s*syncQty\(\);\s*window\.addEventListener\("bag:changed", syncQty\);\s*return \(\) => window\.removeEventListener\("bag:changed", syncQty\);\s*\}, \[slug\]\);/, `const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cartItems.find((x) => x.id === slug);
  const cartQuantity = cartItem?.quantity || 0;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);`);

// Update onAddToCart logic to use the useCart hook
content = content.replace(/async function onAddToCart\(\) \{\s*if \(disabled\) \{\s*setShowOutOfStockModal\(true\);\s*return;\s*\}\s*await handleAddToCart\(\{ id: slug, slug, title, price, image: image \|\| "\/placeholder\.png" \}\);\s*trackEvent\(\{ action: "add_to_cart", category: "Ecommerce", label: title, value: price \}\);\s*\}/, `async function onAddToCart() {
    if (disabled) {
      setShowOutOfStockModal(true);
      return;
    }
    await addToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "add_to_cart", category: "Ecommerce", label: title, value: price });
  }`);

// Update handleIncrease / Decrease
content = content.replace(/async function handleIncrease\(\) \{\s*await updateQty\(slug, cartQuantity \+ 1\);\s*\}/, `async function handleIncrease() {
    await updateQuantity(slug, cartQuantity + 1);
  }`);

content = content.replace(/async function handleDecrease\(\) \{\s*if \(cartQuantity <= 1\) await removeFromCart\(slug\);\s*else await updateQty\(slug, cartQuantity - 1\);\s*\}/, `async function handleDecrease() {
    if (cartQuantity <= 1) await removeFromCart(slug);
    else await updateQuantity(slug, cartQuantity - 1);
  }`);

// Fix handleBuyViaCart
content = content.replace(/async function handleBuyViaCart\(\) \{\s*setShowConfirmModal\(false\);\s*await handleAddToCart\(\{ id: slug, slug, title, price, image: image \|\| "\/placeholder\.png" \}\);\s*trackEvent\(\{ action: "begin_checkout", category: "Ecommerce", label: title, value: price \}\);\s*setTimeout\(\(\) => router\.push\("\/cart"\), 100\);\s*\}/, `async function handleBuyViaCart() {
    setShowConfirmModal(false);
    await addToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "begin_checkout", category: "Ecommerce", label: title, value: price });
    setTimeout(() => router.push("/cart"), 100);
  }`);

// Fix pill radii to 12px instead of 30px
content = content.replace(/borderRadius:\s*"30px"/g, 'borderRadius: "12px"');
content = content.replace(/borderRadius:\s*"20px"/g, 'borderRadius: "12px"');

fs.writeFileSync(file, content, 'utf8');
console.log("Refactored BuyBar!");
