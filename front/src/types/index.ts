export interface Product {
  id: number;
  code: string;
  title: string;
  description: string;
  about: string[];
  isActive: boolean;
  price: number;
  currency: string;
}

export interface Inventory {
  id: number;
  quantity: number;
  product: Product;
}

export interface Order {
  id: number;
  buyerEmail: string;
  productId: number;
  quantity: number;
  status: string;
  createdAt: string;
}

export interface ErrorMessages {
  message: string;
  statusCode: number;
}
