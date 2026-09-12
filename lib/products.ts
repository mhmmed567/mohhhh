export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  note: string;
  desc: string;
  stock: string;
  visible?: boolean;
};

export const defaultProducts: Product[] = [];

export const products = defaultProducts;