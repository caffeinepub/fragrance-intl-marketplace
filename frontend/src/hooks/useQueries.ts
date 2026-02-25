import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  type UserProfile,
  type VendorProfile,
  type Product,
  type CartItem,
  type Order,
  type Payout,
  type TransactionEntry,
  type SearchFilter,
  type UserApprovalInfo,
  ApprovalStatus,
  ProductType,
  OrderStatus,
  PayoutStatus,
  UserRole,
  ExternalBlob,
} from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { parseCheckoutSession, type CheckoutSession } from '../utils/stripe';
import { useInternetIdentity } from './useInternetIdentity';

// ── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Role & Admin ──────────────────────────────────────────────────────────────

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

// ── Approval ──────────────────────────────────────────────────────────────────

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

// ── Vendor Profile ────────────────────────────────────────────────────────────

export function useGetVendorProfile(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<VendorProfile>({
    queryKey: ['vendorProfile', id],
    queryFn: async () => {
      if (!actor || !id) throw new Error('Actor or ID not available');
      return actor.getVendorProfile(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateVendorProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      logo,
      contact,
    }: {
      id: string;
      name: string;
      description: string;
      logo: ExternalBlob | null;
      contact: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createVendorProfile(id, name, description, logo, contact);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile', variables.id] });
    },
  });
}

export function useUpdateVendorProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      logo,
      contact,
    }: {
      id: string;
      name: string;
      description: string;
      logo: ExternalBlob | null;
      contact: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVendorProfile(id, name, description, logo, contact);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile', variables.id] });
    },
  });
}

export function useApproveVendorProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveVendorProfile(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

export function useSearchProducts(filter: SearchFilter) {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchProducts(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      vendorId,
      title,
      description,
      price,
      category,
      productType,
      stock,
      image,
    }: {
      id: string;
      vendorId: string;
      title: string;
      description: string;
      price: bigint;
      category: string;
      productType: ProductType;
      stock: bigint;
      image: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProduct(id, vendorId, title, description, price, category, productType, stock, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      price,
      category,
      productType,
      stock,
      image,
    }: {
      id: string;
      title: string;
      description: string;
      price: bigint;
      category: string;
      productType: ProductType;
      stock: bigint;
      image: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(id, title, description, price, category, productType, stock, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export function useGetCart() {
  const { actor, isFetching } = useActor();

  return useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCart();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToCart(productId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFromCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeFromCart(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set([OrderStatus.pending, OrderStatus.processing, OrderStatus.shipped]);

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shippingAddress: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.placeOrder(shippingAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    },
  });
}

export function useGetMyOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<Order[]>({
    queryKey: ['myOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: (query) => {
      const orders = query.state.data;
      if (!orders) return false;
      const hasActive = orders.some((o) => ACTIVE_STATUSES.has(o.status));
      return hasActive ? 30000 : false;
    },
  });
}

export function useGetOrder(orderId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!actor || !orderId) throw new Error('Actor or orderId not available');
      return actor.getOrder(orderId);
    },
    enabled: !!actor && !isFetching && !!orderId,
    refetchInterval: (query) => {
      const order = query.state.data;
      if (!order) return false;
      return ACTIVE_STATUSES.has(order.status) ? 30000 : false;
    },
  });
}

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<Order[]>({
    queryKey: ['allOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['allOrders'] });
      queryClient.invalidateQueries({ queryKey: ['allPayouts'] });
    },
  });
}

// ── Payouts ───────────────────────────────────────────────────────────────────

export function useGetPayoutsForVendor(vendorId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Payout[]>({
    queryKey: ['vendorPayouts', vendorId],
    queryFn: async () => {
      if (!actor || !vendorId) throw new Error('Actor or vendorId not available');
      return actor.getPayoutsForVendor(vendorId);
    },
    enabled: !!actor && !isFetching && !!vendorId,
  });
}

export function useGetAllPayouts() {
  const { actor, isFetching } = useActor();

  return useQuery<Payout[]>({
    queryKey: ['allPayouts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayouts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInitiatePayout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.initiatePayout(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayouts'] });
    },
  });
}

export function useUpdatePayoutStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId, status }: { payoutId: string; status: PayoutStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePayoutStatus(payoutId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayouts'] });
      queryClient.invalidateQueries({ queryKey: ['vendorPayouts'] });
    },
  });
}

export function useGetCommissionRate() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['commissionRate'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCommissionRate();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCommissionRate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCommissionRate(rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissionRate'] });
    },
  });
}

// ── Transactions ──────────────────────────────────────────────────────────────

export function useCustomerTransactions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransactionEntry[]>({
    queryKey: ['customerTransactions', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getTransactionsByBuyer(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useVendorTransactions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransactionEntry[]>({
    queryKey: ['vendorTransactions', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getTransactionsByVendor(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useOrderTransaction(orderId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TransactionEntry | null>({
    queryKey: ['orderTransaction', orderId],
    queryFn: async () => {
      if (!actor || !orderId) throw new Error('Actor or orderId not available');
      return actor.getTransaction(orderId);
    },
    enabled: !!actor && !isFetching && !!orderId,
  });
}

// ── Stripe ────────────────────────────────────────────────────────────────────

export function useCreateStripeCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      orderId,
      successUrl,
      cancelUrl,
    }: {
      orderId: string;
      successUrl: string;
      cancelUrl: string;
    }): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(
        [
          {
            productName: `Order ${orderId}`,
            currency: 'usd',
            quantity: BigInt(1),
            priceInCents: BigInt(0),
            productDescription: `Payment for order ${orderId}`,
          },
        ],
        successUrl,
        cancelUrl
      );
      return parseCheckoutSession(result);
    },
  });
}

export function useConfirmStripePayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }): Promise<{ orderId: string }> => {
      if (!actor) throw new Error('Actor not available');
      const status = await actor.getStripeSessionStatus(sessionId);
      if (status.__kind__ === 'completed') {
        let orderId = '';
        try {
          const parsed = JSON.parse(status.completed.response) as { metadata?: { orderId?: string } };
          orderId = parsed?.metadata?.orderId ?? '';
        } catch {
          // ignore parse errors
        }
        if (!orderId && status.completed.userPrincipal) {
          orderId = status.completed.userPrincipal;
        }
        return { orderId };
      } else {
        throw new Error(status.__kind__ === 'failed' ? status.failed.error : 'Payment failed');
      }
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      if (_data.orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', _data.orderId] });
      }
    },
  });
}

// ── Auction Types (local until backend is ready) ──────────────────────────────

export type AuctionStatus = 'active' | 'ended' | 'cancelled';

export interface BidEntry {
  bidder: string;
  amount: number;
  timestamp: number;
}

export interface Auction {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  productImage?: string;
  startingPrice: number;
  currentBid: number;
  highestBidderId?: string;
  bidHistory: BidEntry[];
  endTime: number; // Unix ms timestamp
  status: AuctionStatus;
  createdAt: number;
}

// Local storage helpers for auctions
function getAuctionsFromStorage(): Auction[] {
  try {
    const raw = localStorage.getItem('auctions_data');
    return raw ? (JSON.parse(raw) as Auction[]) : [];
  } catch {
    return [];
  }
}

function saveAuctionsToStorage(auctions: Auction[]): void {
  localStorage.setItem('auctions_data', JSON.stringify(auctions));
}

export function useListActiveAuctions() {
  return useQuery<Auction[]>({
    queryKey: ['activeAuctions'],
    queryFn: async () => {
      const all = getAuctionsFromStorage();
      const now = Date.now();
      // Auto-end auctions whose time has passed
      const updated = all.map((a) => {
        if (a.status === 'active' && a.endTime <= now) {
          return { ...a, status: 'ended' as AuctionStatus };
        }
        return a;
      });
      saveAuctionsToStorage(updated);
      return updated.filter((a) => a.status === 'active');
    },
    refetchInterval: 30000,
  });
}

export function useGetAuction(auctionId: string | null) {
  return useQuery<Auction | null>({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      if (!auctionId) return null;
      const all = getAuctionsFromStorage();
      return all.find((a) => a.id === auctionId) ?? null;
    },
    enabled: !!auctionId,
    refetchInterval: 10000,
  });
}

export function useListAuctionsByVendor(vendorId: string | null) {
  return useQuery<Auction[]>({
    queryKey: ['vendorAuctions', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const all = getAuctionsFromStorage();
      return all.filter((a) => a.vendorId === vendorId);
    },
    enabled: !!vendorId,
  });
}

export function useListAllAuctions() {
  return useQuery<Auction[]>({
    queryKey: ['allAuctions'],
    queryFn: async () => getAuctionsFromStorage(),
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      productId,
      productName,
      productImage,
      startingPrice,
      durationHours,
    }: {
      vendorId: string;
      productId: string;
      productName: string;
      productImage?: string;
      startingPrice: number;
      durationHours: number;
    }): Promise<string> => {
      const all = getAuctionsFromStorage();
      const now = Date.now();
      const id = `auction_${now}_${Math.random().toString(36).slice(2, 8)}`;
      const newAuction: Auction = {
        id,
        vendorId,
        productId,
        productName,
        productImage,
        startingPrice,
        currentBid: startingPrice,
        bidHistory: [],
        endTime: now + durationHours * 3600 * 1000,
        status: 'active',
        createdAt: now,
      };
      saveAuctionsToStorage([...all, newAuction]);
      return id;
    },
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activeAuctions'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAuctions', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['allAuctions'] });
    },
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auctionId,
      bidAmount,
      bidderPrincipal,
    }: {
      auctionId: string;
      bidAmount: number;
      bidderPrincipal: string;
    }): Promise<void> => {
      const all = getAuctionsFromStorage();
      const idx = all.findIndex((a) => a.id === auctionId);
      if (idx === -1) throw new Error('Auction not found');
      const auction = all[idx];
      if (auction.status !== 'active') throw new Error('Auction is not active');
      if (Date.now() >= auction.endTime) throw new Error('Auction has ended');
      if (bidAmount <= auction.currentBid) {
        throw new Error(`Bid must be higher than current bid of $${auction.currentBid.toFixed(2)}`);
      }
      const updated: Auction = {
        ...auction,
        currentBid: bidAmount,
        highestBidderId: bidderPrincipal,
        bidHistory: [
          ...auction.bidHistory,
          { bidder: bidderPrincipal, amount: bidAmount, timestamp: Date.now() },
        ],
      };
      all[idx] = updated;
      saveAuctionsToStorage(all);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['activeAuctions'] });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auctionId: string): Promise<void> => {
      const all = getAuctionsFromStorage();
      const idx = all.findIndex((a) => a.id === auctionId);
      if (idx === -1) throw new Error('Auction not found');
      all[idx] = { ...all[idx], status: 'cancelled' };
      saveAuctionsToStorage(all);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAuctions'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAuctions'] });
      queryClient.invalidateQueries({ queryKey: ['allAuctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction'] });
    },
  });
}

export function useFinalizeAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auctionId: string): Promise<void> => {
      const all = getAuctionsFromStorage();
      const idx = all.findIndex((a) => a.id === auctionId);
      if (idx === -1) throw new Error('Auction not found');
      all[idx] = { ...all[idx], status: 'ended' };
      saveAuctionsToStorage(all);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAuctions'] });
      queryClient.invalidateQueries({ queryKey: ['activeAuctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction'] });
    },
  });
}

// ── Trade Offer Types (local until backend is ready) ──────────────────────────

export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface TradeItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface TradeOffer {
  id: string;
  initiatorId: string;
  receiverId: string;
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  cashAdjustment: number; // positive = initiator pays extra, negative = receiver pays extra
  status: TradeOfferStatus;
  createdAt: number;
  updatedAt: number;
  parentOfferId?: string; // for counter offers
  note?: string;
}

// Local storage helpers for trade offers
function getTradeOffersFromStorage(): TradeOffer[] {
  try {
    const raw = localStorage.getItem('trade_offers_data');
    return raw ? (JSON.parse(raw) as TradeOffer[]) : [];
  } catch {
    return [];
  }
}

function saveTradeOffersToStorage(offers: TradeOffer[]): void {
  localStorage.setItem('trade_offers_data', JSON.stringify(offers));
}

export function useListTradeOffersForUser(userId: string | null) {
  return useQuery<TradeOffer[]>({
    queryKey: ['tradeOffers', userId],
    queryFn: async () => {
      if (!userId) return [];
      const all = getTradeOffersFromStorage();
      return all.filter((o) => o.initiatorId === userId || o.receiverId === userId);
    },
    enabled: !!userId,
  });
}

export function useListAllTradeOffers() {
  return useQuery<TradeOffer[]>({
    queryKey: ['allTradeOffers'],
    queryFn: async () => getTradeOffersFromStorage(),
  });
}

export function useCreateTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      initiatorId,
      receiverId,
      offeredItems,
      requestedItems,
      cashAdjustment,
      note,
    }: {
      initiatorId: string;
      receiverId: string;
      offeredItems: TradeItem[];
      requestedItems: TradeItem[];
      cashAdjustment: number;
      note?: string;
    }): Promise<string> => {
      const all = getTradeOffersFromStorage();
      const now = Date.now();
      const id = `trade_${now}_${Math.random().toString(36).slice(2, 8)}`;
      const newOffer: TradeOffer = {
        id,
        initiatorId,
        receiverId,
        offeredItems,
        requestedItems,
        cashAdjustment,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        note,
      };
      saveTradeOffersToStorage([...all, newOffer]);
      return id;
    },
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tradeOffers', variables.initiatorId] });
      queryClient.invalidateQueries({ queryKey: ['tradeOffers', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['allTradeOffers'] });
    },
  });
}

export function useAcceptTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string): Promise<void> => {
      const all = getTradeOffersFromStorage();
      const idx = all.findIndex((o) => o.id === offerId);
      if (idx === -1) throw new Error('Trade offer not found');
      all[idx] = { ...all[idx], status: 'accepted', updatedAt: Date.now() };
      saveTradeOffersToStorage(all);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeOffers'] });
      queryClient.invalidateQueries({ queryKey: ['allTradeOffers'] });
    },
  });
}

export function useRejectTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string): Promise<void> => {
      const all = getTradeOffersFromStorage();
      const idx = all.findIndex((o) => o.id === offerId);
      if (idx === -1) throw new Error('Trade offer not found');
      all[idx] = { ...all[idx], status: 'rejected', updatedAt: Date.now() };
      saveTradeOffersToStorage(all);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeOffers'] });
      queryClient.invalidateQueries({ queryKey: ['allTradeOffers'] });
    },
  });
}

export function useCancelTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string): Promise<void> => {
      const all = getTradeOffersFromStorage();
      const idx = all.findIndex((o) => o.id === offerId);
      if (idx === -1) throw new Error('Trade offer not found');
      all[idx] = { ...all[idx], status: 'cancelled', updatedAt: Date.now() };
      saveTradeOffersToStorage(all);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeOffers'] });
      queryClient.invalidateQueries({ queryKey: ['allTradeOffers'] });
    },
  });
}

export function useCounterTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalOfferId,
      initiatorId,
      receiverId,
      offeredItems,
      requestedItems,
      cashAdjustment,
      note,
    }: {
      originalOfferId: string;
      initiatorId: string;
      receiverId: string;
      offeredItems: TradeItem[];
      requestedItems: TradeItem[];
      cashAdjustment: number;
      note?: string;
    }): Promise<string> => {
      const all = getTradeOffersFromStorage();
      const origIdx = all.findIndex((o) => o.id === originalOfferId);
      if (origIdx !== -1) {
        all[origIdx] = { ...all[origIdx], status: 'rejected', updatedAt: Date.now() };
      }
      const now = Date.now();
      const id = `trade_${now}_${Math.random().toString(36).slice(2, 8)}`;
      const counterOffer: TradeOffer = {
        id,
        initiatorId,
        receiverId,
        offeredItems,
        requestedItems,
        cashAdjustment,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        parentOfferId: originalOfferId,
        note,
      };
      saveTradeOffersToStorage([...all, counterOffer]);
      return id;
    },
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tradeOffers', variables.initiatorId] });
      queryClient.invalidateQueries({ queryKey: ['tradeOffers', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['allTradeOffers'] });
    },
  });
}
