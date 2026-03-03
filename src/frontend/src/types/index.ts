import { ProductStatus, ProductType } from "../backend";

export { ProductType, ProductStatus };

export interface ProductVariant {
  name: string;
  value: string;
  priceAdjustment: number;
  stockAdjustment: number;
}

export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  productType: ProductType;
  status: ProductStatus;
  image?: any;
  variants: ProductVariant[];
}

export interface SearchFilter {
  keyword?: string;
  category?: string;
  productType?: ProductType;
  sortBy?: "priceAsc" | "priceDesc" | "quantityDesc";
}

export interface CartItem {
  productId: string;
  quantity: number;
  variantIndex?: number;
  variantLabel?: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled";

export type PaymentStatus =
  | "pending"
  | "initiated"
  | "awaiting_payment"
  | "completed"
  | "failed";

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export type AuctionStatus = "active" | "ended" | "canceled" | "pending";

export type TradeOfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled"
  | "countered";

export interface BidEntry {
  bidder: any;
  amount: number;
  timestamp: number;
}

export interface TradeItem {
  productId: string;
  quantity: number;
}

/** Sort variant type used by SearchFilters */
export type Variant_quantityDesc_priceDesc_priceAsc =
  | "quantityDesc"
  | "priceDesc"
  | "priceAsc";

export interface Order {
  id: string;
  customer: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  timestamp: number;
  paymentUrl?: string;
  paymentStatus: PaymentStatus;
  paymentSessionId?: string;
  createdAt: number;
  updatedAt: number;
  statusHistory: OrderStatus[];
  paymentHistory: PaymentStatus[];
}

export interface Payout {
  payoutId: string;
  vendorId: string;
  orderId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: PayoutStatus;
  createdAt: number;
  updatedAt: number;
}

export interface VendorProfile {
  id: string;
  name: string;
  description: string;
  contact: string;
  approved: boolean;
  createdBy: string;
  principal: string;
}

export interface Auction {
  id: string;
  productId: string;
  storeId: string;
  vendorId: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  currentBid?: number;
  reservePrice?: number;
  currentBidder?: string;
  minBidIncrement: number;
  endTime: number;
  status: AuctionStatus | string;
  bids: BidEntry[];
  winnerId?: any;
  createdAt: number;
}

export interface TradeOffer {
  id: string;
  offererId: any;
  recipientId: any;
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  cashAdjustment: number;
  status: TradeOfferStatus | string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  counterOffer?: any;
}

export type UserRole = "admin" | "user" | "guest";

export type ApprovalStatus = "pending" | "approved" | "rejected";
