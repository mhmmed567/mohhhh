export type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  onSale?: boolean;
  image: string;
  note: string;
  desc: string;
  stock: string;
  quantity?: number | null;
  visible?: boolean;
};

export const getProductPrice = (product: Product) => {
  const regularPrice = Number(product.price || 0);
  const salePrice = Number(product.salePrice || 0);

  if (
    product.onSale === true &&
    salePrice > 0 &&
    salePrice < regularPrice
  ) {
    return salePrice;
  }

  return regularPrice;
};

export const isProductOnSale = (product: Product) => {
  const regularPrice = Number(product.price || 0);
  const salePrice = Number(product.salePrice || 0);

  return (
    product.onSale === true &&
    salePrice > 0 &&
    salePrice < regularPrice
  );
};

export const isProductSoldOut = (
  product: Pick<Product, "stock" | "quantity">
) => {
  const quantity = getInventoryQuantity(product.quantity);
  return quantity === 0 || product.stock?.trim() === "نفد المخزون";
};

export const getInventoryQuantity = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null;
};

export const defaultProducts: Product[] = [];
export const isProductComingSoon = (product: Pick<Product, "stock">) =>
  ["متوفر قريبًا", "متوفر قريبا", "متوفر قريب", "طلب مسبق"].includes(product.stock?.trim());

export const products = defaultProducts;
