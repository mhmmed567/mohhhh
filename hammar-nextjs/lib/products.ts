export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  note: string;
  desc: string;
  stock: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: "عطر همار",
    price: 18,
    image: "/products/hamar.jpg",
    note: "شرقي فاخر",
    desc: "عطر مميز بتركيبة فاخرة وثابتة.",
    stock: "متوفر",
  },
  {
    id: "2",
    name: "عطر المسك",
    price: 15,
    image: "/products/musk.jpg",
    note: "مسك ناعم",
    desc: "رائحة هادئة وأنيقة للاستخدام اليومي.",
    stock: "متوفر",
  },
];