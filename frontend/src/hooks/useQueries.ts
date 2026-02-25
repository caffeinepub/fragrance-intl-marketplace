import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  type UserProfile,
  type VendorProfile,
  type Product,
  type CartItem,
  type Order,
  type SearchFilter,
  type UserApprovalInfo,
  ApprovalStatus,
  ProductType,
  OrderStatus,
  UserRole,
  ExternalBlob,
} from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { parseCheckoutSession, type CheckoutSession } from '../utils/stripe';

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
    },
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
      // Build shopping items from the order — backend createCheckoutSession takes items array
      // We pass a single placeholder item; the real items are on the order
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
        // Extract orderId from the response JSON
        let orderId = '';
        try {
          const parsed = JSON.parse(status.completed.response) as { metadata?: { orderId?: string } };
          orderId = parsed?.metadata?.orderId ?? '';
        } catch {
          // orderId may come from userPrincipal field or be embedded differently
        }
        if (!orderId && status.completed.userPrincipal) {
          // fallback: orderId might be stored in userPrincipal field by backend
          orderId = status.completed.userPrincipal;
        }
        return { orderId };
      } else {
        throw new Error(status.failed.error || 'Payment session failed or not completed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

// Re-export types for convenience
export type { UserProfile, VendorProfile, Product, CartItem, Order, SearchFilter, UserApprovalInfo };
export { ApprovalStatus, ProductType, OrderStatus, UserRole, ExternalBlob };
