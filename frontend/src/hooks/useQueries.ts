import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  type UserProfile,
  type StoreResponse,
  ApprovalStatus,
  UserRole,
  type Product as BackendProduct,
} from '../backend';
import type { UserApprovalInfo } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { parseCheckoutSession, type CheckoutSession } from '../utils/stripe';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';
import type {
  VendorProfile,
  Product,
  CartItem,
  Order,
  Payout,
  TransactionEntry,
  SearchFilter,
  ProductType,
  OrderStatus,
  PayoutStatus,
  Auction,
  TradeOffer,
} from '../types';
import { ExternalBlob } from '../backend';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAuthorizationError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('unauthorized') || msg.includes('authorization');
  }
  return false;
}

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
    // Always fetch fresh data so approval status is reflected immediately
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
    staleTime: 0,
    refetchOnWindowFocus: true,
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

// ── Vendor Profile (local state only — backend methods removed) ───────────────

export function useGetVendorProfile(_id: string | null): {
  data: VendorProfile | undefined;
  isLoading: boolean;
} {
  return { data: undefined, isLoading: false };
}

export function useCreateVendorProfile() {
  return useMutation({
    mutationFn: async (_params: {
      id: string;
      name: string;
      description: string;
      logo: ExternalBlob | null;
      contact: string;
    }) => {
      throw new Error('Vendor profile creation not available in current backend version');
    },
  });
}

export function useUpdateVendorProfile() {
  return useMutation({
    mutationFn: async (_params: {
      id: string;
      name: string;
      description: string;
      logo: ExternalBlob | null;
      contact: string;
    }) => {
      throw new Error('Vendor profile update not available in current backend version');
    },
  });
}

export function useApproveVendorProfile() {
  return useMutation({
    mutationFn: async (_id: string) => {
      throw new Error('Vendor profile approval not available in current backend version');
    },
  });
}

// ── Products (stubbed — backend methods removed) ──────────────────────────────

export function useSearchProducts(_filter: SearchFilter) {
  return useQuery<Product[]>({
    queryKey: ['products', _filter],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (_params: {
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
      throw new Error('Product creation not available in current backend version');
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async (_params: {
      id: string;
      title: string;
      description: string;
      price: bigint;
      category: string;
      productType: ProductType;
      stock: bigint;
      image: ExternalBlob | null;
    }) => {
      throw new Error('Product update not available in current backend version');
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (_id: string) => {
      throw new Error('Product deletion not available in current backend version');
    },
  });
}

// ── Store Products ────────────────────────────────────────────────────────────

/** Convert a backend Product (bigint fields) to a local Product (number fields) */
function backendProductToLocal(p: BackendProduct): Product {
  return {
    id: p.id,
    vendorId: p.vendorId,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    productType: p.productType as ProductType,
    stock: Number(p.stock),
    image: p.image ? p.image.toString() : null,
    status: p.status as 'active' | 'inactive',
  };
}

/** Convert a local Product (number fields) to a backend Product (bigint fields) */
function localProductToBackend(p: Product): BackendProduct {
  return {
    id: p.id,
    vendorId: p.vendorId,
    title: p.title,
    description: p.description,
    price: BigInt(Math.round(p.price)),
    category: p.category,
    productType: p.productType as BackendProduct['productType'],
    stock: BigInt(Math.round(p.stock)),
    image: undefined,
    status: p.status as BackendProduct['status'],
  };
}

export function useListStoreProducts(storeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['storeProducts', storeId],
    queryFn: async () => {
      if (!actor || !storeId) return [];
      const results = await actor.listStoreProducts(storeId);
      return results.map(backendProductToLocal);
    },
    enabled: !!actor && !isFetching && !!storeId,
  });
}

export function useAddProductToStore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, product }: { storeId: string; product: Product }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.addProductToStore(storeId, localProductToBackend(product));
      } catch (err: unknown) {
        if (isAuthorizationError(err)) {
          throw new Error('UNAUTHORIZED');
        }
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storeProducts', variables.storeId] });
    },
    onError: (err: Error) => {
      if (err.message === 'UNAUTHORIZED') {
        toast.error('You do not have permission to manage products for this store.');
      }
    },
  });
}

export function useUpdateStoreProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, product }: { storeId: string; product: Product }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.updateStoreProduct(storeId, localProductToBackend(product));
      } catch (err: unknown) {
        if (isAuthorizationError(err)) {
          throw new Error('UNAUTHORIZED');
        }
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storeProducts', variables.storeId] });
    },
    onError: (err: Error) => {
      if (err.message === 'UNAUTHORIZED') {
        toast.error('You do not have permission to manage products for this store.');
      }
    },
  });
}

export function useDeleteStoreProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, productId }: { storeId: string; productId: string }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.deleteStoreProduct(storeId, productId);
      } catch (err: unknown) {
        if (isAuthorizationError(err)) {
          throw new Error('UNAUTHORIZED');
        }
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storeProducts', variables.storeId] });
    },
    onError: (err: Error) => {
      if (err.message === 'UNAUTHORIZED') {
        toast.error('You do not have permission to manage products for this store.');
      }
    },
  });
}

// ── Cart (stubbed) ────────────────────────────────────────────────────────────

export function useGetCart() {
  return useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAddToCart() {
  return useMutation({
    mutationFn: async (_params: { productId: string; quantity: bigint }) => {
      throw new Error('Cart not available in current backend version');
    },
  });
}

export function useRemoveFromCart() {
  return useMutation({
    mutationFn: async (_productId: string) => {
      throw new Error('Cart not available in current backend version');
    },
  });
}

// ── Orders (stubbed) ──────────────────────────────────────────────────────────

export function usePlaceOrder() {
  return useMutation({
    mutationFn: async (_shippingAddress: string) => {
      throw new Error('Order placement not available in current backend version');
    },
  });
}

export function useGetMyOrders() {
  return useQuery<Order[]>({
    queryKey: ['myOrders'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetOrder(_orderId: string | null) {
  return useQuery<Order>({
    queryKey: ['order', _orderId],
    queryFn: async () => {
      throw new Error('Order retrieval not available in current backend version');
    },
    enabled: false,
  });
}

export function useGetAllOrders() {
  return useQuery<Order[]>({
    queryKey: ['allOrders'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: async (_params: { orderId: string; status: OrderStatus }) => {
      throw new Error('Order status update not available in current backend version');
    },
  });
}

// ── Payouts (stubbed) ─────────────────────────────────────────────────────────

export function useGetPayoutsForVendor(_vendorId: string | null) {
  return useQuery<Payout[]>({
    queryKey: ['vendorPayouts', _vendorId],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetAllPayouts() {
  return useQuery<Payout[]>({
    queryKey: ['allPayouts'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useInitiatePayout() {
  return useMutation({
    mutationFn: async (_orderId: string): Promise<string> => {
      throw new Error('Payout initiation not available in current backend version');
    },
  });
}

export function useUpdatePayoutStatus() {
  return useMutation({
    mutationFn: async (_params: { payoutId: string; status: PayoutStatus }) => {
      throw new Error('Payout status update not available in current backend version');
    },
  });
}

export function useGetCommissionRate() {
  return useQuery<bigint>({
    queryKey: ['commissionRate'],
    queryFn: async () => BigInt(5),
    enabled: false,
  });
}

export function useSetCommissionRate() {
  return useMutation({
    mutationFn: async (_rate: bigint) => {
      throw new Error('Commission rate update not available in current backend version');
    },
  });
}

// ── Transactions (stubbed) ────────────────────────────────────────────────────

export function useCustomerTransactions() {
  return useQuery<TransactionEntry[]>({
    queryKey: ['customerTransactions'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useVendorTransactions() {
  return useQuery<TransactionEntry[]>({
    queryKey: ['vendorTransactions'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useOrderTransaction(_orderId: string | null) {
  return useQuery<TransactionEntry | null>({
    queryKey: ['orderTransaction', _orderId],
    queryFn: async () => null,
    enabled: false,
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
        cancelUrl,
      );
      return parseCheckoutSession(result);
    },
  });
}

export function useConfirmStripePayment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string; orderId?: string }) => {
      if (!actor) throw new Error('Actor not available');
      const status = await actor.getStripeSessionStatus(sessionId);
      if (status.__kind__ === 'failed') {
        throw new Error(status.failed.error);
      }
      return status;
    },
  });
}

// ── Auctions (stubbed) ────────────────────────────────────────────────────────

export function useGetAllAuctions() {
  return useQuery<Auction[]>({
    queryKey: ['allAuctions'],
    queryFn: async () => [],
    enabled: false,
  });
}

// Alias for components that use the old name
export const useListActiveAuctions = useGetAllAuctions;

export function useGetAuction(_auctionId: string | null) {
  return useQuery<Auction | null>({
    queryKey: ['auction', _auctionId],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useGetVendorAuctions(_vendorId: string | null) {
  return useQuery<Auction[]>({
    queryKey: ['vendorAuctions', _vendorId],
    queryFn: async () => [],
    enabled: false,
  });
}

// Alias for components that use the old name
export const useListAuctionsByVendor = useGetVendorAuctions;

export function useCreateAuction() {
  return useMutation({
    mutationFn: async (_params: {
      productId: string;
      startingPrice: bigint;
      endTime: bigint;
    }) => {
      throw new Error('Auction creation not available in current backend version');
    },
  });
}

export function useCancelAuction() {
  return useMutation({
    mutationFn: async (_auctionId: string) => {
      throw new Error('Auction cancellation not available in current backend version');
    },
  });
}

export function useFinalizeAuction() {
  return useMutation({
    mutationFn: async (_auctionId: string) => {
      throw new Error('Auction finalization not available in current backend version');
    },
  });
}

export function usePlaceBid() {
  return useMutation({
    mutationFn: async (_params: { auctionId: string; amount: bigint }) => {
      throw new Error('Bid placement not available in current backend version');
    },
  });
}

export function useEndAuction() {
  return useMutation({
    mutationFn: async (_auctionId: string) => {
      throw new Error('Auction ending not available in current backend version');
    },
  });
}

// ── Trade Offers (stubbed) ────────────────────────────────────────────────────

export function useGetMyTradeOffers() {
  return useQuery<TradeOffer[]>({
    queryKey: ['myTradeOffers'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetAllTradeOffers() {
  return useQuery<TradeOffer[]>({
    queryKey: ['allTradeOffers'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useCreateTradeOffer() {
  return useMutation({
    mutationFn: async (_params: {
      targetPrincipal: string;
      offeredItems: Array<{ productId: string; quantity: bigint }>;
      requestedItems: Array<{ productId: string; quantity: bigint }>;
      cashAdjustment: bigint;
      note: string;
    }) => {
      throw new Error('Trade offer creation not available in current backend version');
    },
  });
}

export function useAcceptTradeOffer() {
  return useMutation({
    mutationFn: async (_offerId: string) => {
      throw new Error('Trade offer acceptance not available in current backend version');
    },
  });
}

export function useRejectTradeOffer() {
  return useMutation({
    mutationFn: async (_offerId: string) => {
      throw new Error('Trade offer rejection not available in current backend version');
    },
  });
}

export function useCounterTradeOffer() {
  return useMutation({
    mutationFn: async (_params: {
      offerId: string;
      offeredItems: Array<{ productId: string; quantity: bigint }>;
      requestedItems: Array<{ productId: string; quantity: bigint }>;
      cashAdjustment: bigint;
      note: string;
    }) => {
      throw new Error('Trade offer counter not available in current backend version');
    },
  });
}

export function useCancelTradeOffer() {
  return useMutation({
    mutationFn: async (_offerId: string) => {
      throw new Error('Trade offer cancellation not available in current backend version');
    },
  });
}

// ── Stores ────────────────────────────────────────────────────────────────────

export function useMyStores() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<StoreResponse[]>({
    queryKey: ['myStores'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getStoresByVendor(principal);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateStore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      contactInfo,
    }: {
      name: string;
      description: string;
      contactInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStore(name, description, contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStores'] });
    },
  });
}

export function useUpdateStore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      name,
      description,
      contactInfo,
    }: {
      storeId: string;
      name: string;
      description: string;
      contactInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStore(storeId, name, description, contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStores'] });
    },
  });
}

export function useToggleStoreActive() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleStoreActive(storeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStores'] });
    },
  });
}
