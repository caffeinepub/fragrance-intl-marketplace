// Local type definitions for types no longer exported from backend.d.ts
// These mirror the Motoko backend types

export type ProductType = 'physical' | 'digital' | 'service';
export const ProductType = {
  physical: 'physical' as const,
  digital: 'digital' as const,
  service: 'service' as const,
};

export type ProductStatus = 'active' | 'inactive';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
export const OrderStatus = {
  pending: 'pending' as const,
  processing: 'processing' as const,
  shipped: 'shipped' as const,
  delivered: 'delivered' as const,
  canceled: 'canceled' as const,
};

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export const PayoutStatus = {
  pending: 'pending' as const,
  processing: 'processing' as const,
  completed: 'completed' as const,
  failed: 'failed' as const,
};

export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'awaiting_payment'
  | 'completed'
  | 'failed';

export interface VendorProfile {
  id: string;
  name: string;
  description: string;
  logo?: string | null;
  contact: string;
  approved: boolean;
  createdBy: string;
  principal: string;
}

export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  productType: ProductType;
  stock: number;
  image?: string | null;
  status: ProductStatus;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customer: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  timestamp: number;
  paymentUrl?: string | null;
  paymentStatus: PaymentStatus;
  paymentSessionId?: string | null;
  createdAt: number;
  updatedAt: number;
  statusHistory: OrderStatus[];
  paymentHistory: PaymentStatus[];
}

export interface TransactionEntry {
  orderId: string;
  buyer: string;
  vendor: string;
  items: CartItem[];
  totalAmount: number;
  commissionFee: number;
  netPayout: number;
  timestamp: number;
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

export interface SearchFilter {
  keyword?: string | null;
  category?: string | null;
  productType?: ProductType | null;
  sortBy?: 'priceAsc' | 'priceDesc' | 'quantityDesc' | null;
}

// Variant enum for sort (used in search filters)
export const Variant_quantityDesc_priceDesc_priceAsc = {
  priceAsc: 'priceAsc' as const,
  priceDesc: 'priceDesc' as const,
  quantityDesc: 'quantityDesc' as const,
};

// Auction types
export type AuctionStatus = 'active' | 'ended' | 'canceled';
export const AuctionStatus = {
  active: 'active' as const,
  ended: 'ended' as const,
  canceled: 'canceled' as const,
};

export interface BidEntry {
  bidder: string;
  amount: number;
  timestamp: number;
}

export interface Auction {
  auctionId: string;
  vendorId: string;
  productId: string;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice?: number | null;
  currentBid?: number | null;
  currentBidder?: string | null;
  endTime: number;
  status: AuctionStatus;
  bids: BidEntry[];
  createdAt: number;
}

// Trade offer types
export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected' | 'canceled' | 'countered';
export const TradeOfferStatus = {
  pending: 'pending' as const,
  accepted: 'accepted' as const,
  rejected: 'rejected' as const,
  canceled: 'canceled' as const,
  countered: 'countered' as const,
};

export interface TradeItem {
  productId: string;
  quantity: number;
}

export interface TradeOffer {
  offerId: string;
  offeredBy: string;
  targetPrincipal: string;
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  cashAdjustment: number;
  note: string;
  status: TradeOfferStatus;
  createdAt: number;
  updatedAt: number;
}
