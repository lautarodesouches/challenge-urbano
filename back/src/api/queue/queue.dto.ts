export interface ProductActivatedPayload {
  productId: number;
  isActive: boolean;
  timestamp: Date;
}

export interface ProductCreatedPayload {
  productId: number;
  categoryId: number;
  merchantId: number;
}

export interface LowStockPayload {
  productId: number;
  productTitle: string;
  remainingQuantity: number;
  timestamp: Date;
}

export interface PriceChangedPayload {
  productId: number;
  productTitle: string;
  oldPrice: number;
  newPrice: number;
  timestamp: Date;
}
