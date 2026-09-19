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
  product: Pick<Product, "stock">
) => product.stock?.trim() === "نفد المخزون";

export const defaultProducts: Product[] = [];
export const isProductComingSoon = (product: Pick<Product, "stock">) =>
  ["متوفر قريبًا", "متوفر قريبا", "متوفر قريب", "طلب مسبق"].includes(product.stock?.trim());

export const products = defaultProducts;
