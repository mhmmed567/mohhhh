export type CartItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  preOrder?: boolean;
  maxQuantity?: number | null;
};

const CART_KEY = "hammar-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CART_KEY, JSON.stringify(items));

  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product: CartItem) {
  const items = getCart();

  const existing = items.find(
    (item) => item.id === product.id
  );

  if (existing) {
    if (
      typeof product.maxQuantity === "number" &&
      existing.quantity >= product.maxQuantity
    ) return false;

    const requestedQuantity = existing.quantity + 1;
    existing.quantity =
      typeof product.maxQuantity === "number"
        ? Math.min(requestedQuantity, product.maxQuantity)
        : requestedQuantity;
    existing.preOrder = product.preOrder === true;
    existing.maxQuantity = product.maxQuantity;
  } else {
    items.push({
      ...product,
      quantity: 1,
    });
  }

  saveCart(items);
  return true;
}

export function removeFromCart(id: string) {
  const items = getCart().filter(
    (item) => item.id !== id
  );

  saveCart(items);
}

export function updateCartQuantity(
  id: string,
  quantity: number
) {
  const items = getCart()
    .map((item) =>
      item.id === id
        ? {
            ...item,
            quantity:
              typeof item.maxQuantity === "number"
                ? Math.min(quantity, item.maxQuantity)
                : quantity,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCart(items);
}

export function clearCart() {
  saveCart([]);
}
