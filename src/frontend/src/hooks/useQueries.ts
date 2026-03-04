import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Product as BackendProduct,
  type ProductVariant as BackendProductVariant,
  ProductStatus,
  type ProductType,
  type ShoppingItem,
  type StoreResponse,
  type UserProfile,
  type UserRole,
  type WholesaleAccount,
  type WholesaleTier,
} from "../backend";
import type { SearchFilter } from "../types/index";
import { useActor } from "./useActor";

// ApprovalStatus is not exported from backend.d.ts — define locally to avoid build errors
export type ApprovalStatus = "pending" | "approved" | "rejected";

// ─── Type helpers ────────────────────────────────────────────────────────────

export type LocalProduct = {
  id: string;
  storeId: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  productType: ProductType;
  status: ProductStatus;
  image?: any;
  variants: Array<{
    name: string;
    value: string;
    priceAdjustment: number;
    stockAdjustment: number;
  }>;
};

export type LocalOrder = {
  id: string;
  customer: string;
  items: Array<{
    productId: string;
    quantity: number;
    variantIndex?: number;
    variantLabel?: string;
  }>;
  total: number;
  status: string;
  shippingAddress: string;
  timestamp: number;
  paymentUrl?: string;
  paymentStatus: string;
  paymentSessionId?: string;
  createdAt: number;
  updatedAt: number;
  statusHistory: string[];
  paymentHistory: string[];
};

export type LocalAuction = {
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
  status: string;
  bids: Array<{ bidder: any; amount: number; timestamp: number }>;
  winnerId?: any;
  createdAt: number;
};

export type LocalTradeOffer = {
  id: string;
  offererId: any;
  recipientId: any;
  offeredItems: Array<{ productId: string; quantity: number }>;
  requestedItems: Array<{ productId: string; quantity: number }>;
  cashAdjustment: number;
  status: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  counterOffer?: any;
};

export type LocalPayout = {
  payoutId: string;
  vendorId: string;
  orderId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  createdAt: number;
  updatedAt: number;
};

export type VendorTransaction = {
  orderId: string;
  buyer: any;
  vendor: any;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
  commissionFee: number;
  netPayout: number;
  timestamp: number;
};

function normalizeVariant<T>(
  val: T | { [key: string]: null } | string,
): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object")
    return Object.keys(val as object)[0] ?? String(val);
  return String(val);
}

function backendProductToLocal(
  p: BackendProduct,
  storeId: string,
): LocalProduct {
  return {
    id: p.id,
    storeId,
    vendorId: p.vendorId,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    stock: Number(p.stock),
    category: p.category,
    productType: normalizeVariant(p.productType) as ProductType,
    status: normalizeVariant(p.status) as ProductStatus,
    image: p.image,
    variants: (p.variants || []).map((v) => ({
      name: v.name,
      value: v.value,
      priceAdjustment: Number(v.priceAdjustment),
      stockAdjustment: Number(v.stockAdjustment),
    })),
  };
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Approval ─────────────────────────────────────────────────────────────────

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["listApprovals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: { user: any; status: ApprovalStatus }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listApprovals"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: any; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listApprovals"] });
    },
  });
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export function useGetStoresByVendor(vendorId?: any) {
  const { actor, isFetching } = useActor();

  return useQuery<StoreResponse[]>({
    queryKey: ["storesByVendor", vendorId?.toString()],
    queryFn: async () => {
      if (!actor || !vendorId) return [];
      return actor.getStoresByVendor(vendorId);
    },
    enabled: !!actor && !isFetching && !!vendorId,
  });
}

/** Alias for useGetStoresByVendor used by vendor components */
export function useMyStores(vendorId?: any) {
  return useGetStoresByVendor(vendorId);
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
      if (!actor) throw new Error("Actor not available");
      return actor.createStore(name, description, contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storesByVendor"] });
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
      if (!actor) throw new Error("Actor not available");
      return actor.updateStore(storeId, name, description, contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storesByVendor"] });
    },
  });
}

export function useToggleStoreActive() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.toggleStoreActive(storeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storesByVendor"] });
    },
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function useGetAllStoreIds() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["allStoreIds"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStoreIds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListStoreProducts(storeId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BackendProduct[]>({
    queryKey: ["storeProducts", storeId],
    queryFn: async () => {
      if (!actor || !storeId) return [];
      return actor.listStoreProducts(storeId);
    },
    enabled: !!actor && !isFetching && !!storeId,
  });
}

export function useGetProduct(storeId?: string, productId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BackendProduct | null>({
    queryKey: ["product", storeId, productId],
    queryFn: async () => {
      if (!actor || !storeId || !productId) return null;
      return actor.getProduct(storeId, productId);
    },
    enabled: !!actor && !isFetching && !!storeId && !!productId,
  });
}

export function useSearchProducts(filter?: SearchFilter) {
  const { actor, isFetching } = useActor();

  return useQuery<LocalProduct[]>({
    queryKey: [
      "searchProducts",
      filter?.keyword,
      filter?.category,
      filter?.productType,
      filter?.sortBy,
    ],
    queryFn: async () => {
      if (!actor) return [];

      let storeIds: string[] = [];
      try {
        storeIds = await actor.getAllStoreIds();
      } catch (e) {
        console.error("Failed to fetch store IDs:", e);
        return [];
      }

      const allProducts: LocalProduct[] = [];

      await Promise.all(
        storeIds.map(async (storeId) => {
          try {
            const products = await actor.listStoreProducts(storeId);
            for (const p of products) {
              if (p.status === ProductStatus.active) {
                allProducts.push(backendProductToLocal(p, storeId));
              }
            }
          } catch (e) {
            console.error(`Failed to fetch products for store ${storeId}:`, e);
          }
        }),
      );

      let filtered = allProducts;

      if (filter?.keyword) {
        const kw = filter.keyword.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(kw) ||
            p.description.toLowerCase().includes(kw) ||
            p.category.toLowerCase().includes(kw),
        );
      }

      if (filter?.category) {
        filtered = filtered.filter((p) => p.category === filter.category);
      }

      if (filter?.productType) {
        filtered = filtered.filter((p) => p.productType === filter.productType);
      }

      if (filter?.sortBy) {
        if (filter.sortBy === "priceAsc") {
          filtered = [...filtered].sort((a, b) => a.price - b.price);
        } else if (filter.sortBy === "priceDesc") {
          filtered = [...filtered].sort((a, b) => b.price - a.price);
        } else if (filter.sortBy === "quantityDesc") {
          filtered = [...filtered].sort((a, b) => b.stock - a.stock);
        }
      }

      return filtered;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProductToStore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      product,
    }: { storeId: string; product: BackendProduct }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addProductToStore(storeId, product);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["storeProducts", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["searchProducts"] });
    },
  });
}

export function useUpdateStoreProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      product,
    }: { storeId: string; product: BackendProduct }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateStoreProduct(storeId, product);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["storeProducts", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["searchProducts"] });
    },
  });
}

export function useDeleteStoreProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
    }: { storeId: string; productId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteStoreProduct(storeId, productId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["storeProducts", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["searchProducts"] });
    },
  });
}

export function useAddVariant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
      variant,
    }: {
      storeId: string;
      productId: string;
      variant: BackendProductVariant;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addVariant(storeId, productId, variant);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["storeProducts", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["searchProducts"] });
    },
  });
}

export function useUpdateVariant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
      variantIndex,
      updatedVariant,
    }: {
      storeId: string;
      productId: string;
      variantIndex: bigint;
      updatedVariant: BackendProductVariant;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateVariant(
        storeId,
        productId,
        variantIndex,
        updatedVariant,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["storeProducts", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["searchProducts"] });
    },
  });
}

export function useDeleteVariant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
      variantIndex,
    }: {
      storeId: string;
      productId: string;
      variantIndex: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteVariant(storeId, productId, variantIndex);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["storeProducts", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["searchProducts"] });
    },
  });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export function useGetCart() {
  const { actor, isFetching } = useActor();

  return useQuery<
    Array<{
      productId: string;
      quantity: number;
      variantIndex?: number;
      variantLabel?: string;
    }>
  >({
    queryKey: ["cart"],
    queryFn: async () => {
      const stored = localStorage.getItem("cart");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      variantIndex,
      variantLabel,
    }: {
      productId: string;
      quantity: number;
      variantIndex?: number;
      variantLabel?: string;
    }) => {
      const stored = localStorage.getItem("cart");
      const cart: Array<{
        productId: string;
        quantity: number;
        variantIndex?: number;
        variantLabel?: string;
      }> = stored ? JSON.parse(stored) : [];

      const existingIndex = cart.findIndex(
        (item) =>
          item.productId === productId && item.variantIndex === variantIndex,
      );

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({ productId, quantity, variantIndex, variantLabel });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      return cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      variantIndex,
    }: {
      productId: string;
      variantIndex?: number;
    }) => {
      const stored = localStorage.getItem("cart");
      const cart: Array<{
        productId: string;
        quantity: number;
        variantIndex?: number;
      }> = stored ? JSON.parse(stored) : [];

      const updated = cart.filter(
        (item) =>
          !(item.productId === productId && item.variantIndex === variantIndex),
      );

      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem("cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useGetOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalOrder[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const stored = localStorage.getItem("orders");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias for useGetOrders */
export function useGetMyOrders() {
  return useGetOrders();
}

/** Alias for admin use */
export function useGetAllOrders() {
  return useGetOrders();
}

export function useGetOrder(orderId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<LocalOrder | null>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const stored = localStorage.getItem("orders");
      if (!stored) return null;
      const orders: LocalOrder[] = JSON.parse(stored);
      return orders.find((o) => o.id === orderId) || null;
    },
    enabled: !!actor && !isFetching && !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: LocalOrder) => {
      const stored = localStorage.getItem("orders");
      const orders: LocalOrder[] = stored ? JSON.parse(stored) : [];
      orders.push(order);
      localStorage.setItem("orders", JSON.stringify(orders));
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: string; status: string }) => {
      const stored = localStorage.getItem("orders");
      const orders: LocalOrder[] = stored ? JSON.parse(stored) : [];
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx >= 0) {
        orders[idx].status = status;
        orders[idx].updatedAt = Date.now();
      }
      localStorage.setItem("orders", JSON.stringify(orders));
      return orders[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export function useGetVendorPayouts() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalPayout[]>({
    queryKey: ["vendorPayouts"],
    queryFn: async () => {
      const stored = localStorage.getItem("payouts");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPayouts() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalPayout[]>({
    queryKey: ["allPayouts"],
    queryFn: async () => {
      const stored = localStorage.getItem("payouts");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payoutId,
      status,
    }: { payoutId: string; status: string }) => {
      const stored = localStorage.getItem("payouts");
      const payouts: LocalPayout[] = stored ? JSON.parse(stored) : [];
      const idx = payouts.findIndex((p) => p.payoutId === payoutId);
      if (idx >= 0) {
        payouts[idx].status = status;
        payouts[idx].updatedAt = Date.now();
      }
      localStorage.setItem("payouts", JSON.stringify(payouts));
      return payouts[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPayouts"] });
      queryClient.invalidateQueries({ queryKey: ["vendorPayouts"] });
    },
  });
}

export function useGetCommissionRate() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ["commissionRate"],
    queryFn: async () => {
      const stored = localStorage.getItem("commissionRate");
      return stored ? Number(stored) : 5;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCommissionRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: number) => {
      localStorage.setItem("commissionRate", String(rate));
      return rate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionRate"] });
    },
  });
}

/** Alias kept for backward compat */
export function useUpdateCommissionRate() {
  return useSetCommissionRate();
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      secretKey: string;
      allowedCountries: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result);
      if (!session?.url) throw new Error("Stripe session missing url");
      return session;
    },
  });
}

export function useGetStripeSessionStatus(sessionId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["stripeSessionStatus", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
  });
}

// ─── Auctions ─────────────────────────────────────────────────────────────────

export function useGetAuctions() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalAuction[]>({
    queryKey: ["auctions"],
    queryFn: async () => {
      const stored = localStorage.getItem("auctions");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias for admin panel */
export function useGetAllAuctions() {
  return useGetAuctions();
}

/** Alias for listing active auctions */
export function useListActiveAuctions() {
  return useGetAuctions();
}

export function useGetVendorAuctions() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalAuction[]>({
    queryKey: ["vendorAuctions"],
    queryFn: async () => {
      const stored = localStorage.getItem("auctions");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAuction(auctionId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<LocalAuction | null>({
    queryKey: ["auction", auctionId],
    queryFn: async () => {
      if (!auctionId) return null;
      const stored = localStorage.getItem("auctions");
      if (!stored) return null;
      const auctions: LocalAuction[] = JSON.parse(stored);
      return auctions.find((a) => a.id === auctionId) || null;
    },
    enabled: !!actor && !isFetching && !!auctionId,
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      auction: Omit<LocalAuction, "id" | "bids" | "createdAt">,
    ) => {
      const stored = localStorage.getItem("auctions");
      const auctions: LocalAuction[] = stored ? JSON.parse(stored) : [];
      const newAuction: LocalAuction = {
        ...auction,
        id: `auction-${Date.now()}`,
        bids: [],
        createdAt: Date.now(),
      };
      auctions.push(newAuction);
      localStorage.setItem("auctions", JSON.stringify(auctions));
      return newAuction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["vendorAuctions"] });
    },
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auctionId,
      amount,
    }: { auctionId: string; amount: number }) => {
      const stored = localStorage.getItem("auctions");
      const auctions: LocalAuction[] = stored ? JSON.parse(stored) : [];
      const idx = auctions.findIndex((a) => a.id === auctionId);
      if (idx >= 0) {
        auctions[idx].bids.push({
          bidder: "current-user",
          amount,
          timestamp: Date.now(),
        });
        auctions[idx].currentPrice = amount;
        auctions[idx].currentBid = amount;
      }
      localStorage.setItem("auctions", JSON.stringify(auctions));
      return auctions[idx];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["auction", variables.auctionId],
      });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auctionId: string) => {
      const stored = localStorage.getItem("auctions");
      const auctions: LocalAuction[] = stored ? JSON.parse(stored) : [];
      const idx = auctions.findIndex((a) => a.id === auctionId);
      if (idx >= 0) {
        auctions[idx].status = "canceled";
      }
      localStorage.setItem("auctions", JSON.stringify(auctions));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["vendorAuctions"] });
    },
  });
}

export function useFinalizeAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auctionId: string) => {
      const stored = localStorage.getItem("auctions");
      const auctions: LocalAuction[] = stored ? JSON.parse(stored) : [];
      const idx = auctions.findIndex((a) => a.id === auctionId);
      if (idx >= 0) {
        auctions[idx].status = "ended";
      }
      localStorage.setItem("auctions", JSON.stringify(auctions));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["vendorAuctions"] });
    },
  });
}

// ─── Trade Offers ─────────────────────────────────────────────────────────────

export function useGetTradeOffers() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalTradeOffer[]>({
    queryKey: ["tradeOffers"],
    queryFn: async () => {
      const stored = localStorage.getItem("tradeOffers");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias for pages that use useGetMyTradeOffers */
export function useGetMyTradeOffers() {
  return useGetTradeOffers();
}

export function useCreateTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: {
      recipientId: any;
      offeredItems: Array<{ productId: string; quantity: bigint }>;
      requestedItems: Array<{ productId: string; quantity: bigint }>;
      cashAdjustment: number;
    }) => {
      const stored = localStorage.getItem("tradeOffers");
      const offers: LocalTradeOffer[] = stored ? JSON.parse(stored) : [];
      const newOffer: LocalTradeOffer = {
        id: `trade-${Date.now()}`,
        offererId: "current-user",
        recipientId: offer.recipientId,
        offeredItems: offer.offeredItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        })),
        requestedItems: offer.requestedItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        })),
        cashAdjustment: offer.cashAdjustment,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      offers.push(newOffer);
      localStorage.setItem("tradeOffers", JSON.stringify(offers));
      return newOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradeOffers"] });
    },
  });
}

export function useAcceptTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const stored = localStorage.getItem("tradeOffers");
      const offers: LocalTradeOffer[] = stored ? JSON.parse(stored) : [];
      const idx = offers.findIndex((o) => o.id === offerId);
      if (idx >= 0) offers[idx].status = "accepted";
      localStorage.setItem("tradeOffers", JSON.stringify(offers));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradeOffers"] });
    },
  });
}

export function useRejectTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const stored = localStorage.getItem("tradeOffers");
      const offers: LocalTradeOffer[] = stored ? JSON.parse(stored) : [];
      const idx = offers.findIndex((o) => o.id === offerId);
      if (idx >= 0) offers[idx].status = "rejected";
      localStorage.setItem("tradeOffers", JSON.stringify(offers));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradeOffers"] });
    },
  });
}

export function useCancelTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const stored = localStorage.getItem("tradeOffers");
      const offers: LocalTradeOffer[] = stored ? JSON.parse(stored) : [];
      const idx = offers.findIndex((o) => o.id === offerId);
      if (idx >= 0) offers[idx].status = "canceled";
      localStorage.setItem("tradeOffers", JSON.stringify(offers));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradeOffers"] });
    },
  });
}

export function useCounterTradeOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      counterOffer,
    }: {
      offerId: string;
      counterOffer: {
        offeredItems: Array<{ productId: string; quantity: bigint }>;
        requestedItems: Array<{ productId: string; quantity: bigint }>;
        cashAdjustment: number;
      };
    }) => {
      const stored = localStorage.getItem("tradeOffers");
      const offers: LocalTradeOffer[] = stored ? JSON.parse(stored) : [];
      const idx = offers.findIndex((o) => o.id === offerId);
      if (idx >= 0) {
        offers[idx].status = "countered";
        offers[idx].counterOffer = counterOffer;
        offers[idx].updatedAt = Date.now();
      }
      localStorage.setItem("tradeOffers", JSON.stringify(offers));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradeOffers"] });
    },
  });
}

export function useGetAllTradeOffers() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalTradeOffer[]>({
    queryKey: ["allTradeOffers"],
    queryFn: async () => {
      const stored = localStorage.getItem("tradeOffers");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVendorTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<VendorTransaction[]>({
    queryKey: ["vendorTransactions"],
    queryFn: async () => {
      const stored = localStorage.getItem("transactions");
      if (!stored) return [];
      return JSON.parse(stored);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias used by VendorOrderHistory */
export function useVendorTransactions() {
  return useGetVendorTransactions();
}

// ─── Reviews & Ratings ────────────────────────────────────────────────────────

export type LocalReview = {
  id: string;
  productId: string;
  storeId: string;
  reviewer: string;
  rating: number;
  title: string;
  body: string;
  createdAt: number;
};

export type RatingSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: number[]; // index 0 = 1-star count, index 4 = 5-star count
};

export function useGetProductReviews(productId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<LocalReview[]>({
    queryKey: ["productReviews", productId],
    queryFn: async () => {
      if (!actor) return [];
      const reviews = await actor.getProductReviews(productId);
      return reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        storeId: r.storeId,
        reviewer: r.reviewer.toString(),
        rating: Number(r.rating),
        title: r.title,
        body: r.body,
        createdAt: Number(r.createdAt),
      }));
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useGetProductRatingSummary(productId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<RatingSummary>({
    queryKey: ["productRatingSummary", productId],
    queryFn: async () => {
      if (!actor)
        return {
          averageRating: 0,
          totalReviews: 0,
          distribution: [0, 0, 0, 0, 0],
        };
      const summary = await actor.getProductRatingSummary(productId);
      return {
        averageRating: summary.averageRating,
        totalReviews: Number(summary.totalReviews),
        distribution: summary.distribution.map((d) => Number(d)),
      };
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      storeId,
      rating,
      title,
      body,
    }: {
      productId: string;
      storeId: string;
      rating: number;
      title: string;
      body: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.submitReview(productId, storeId, BigInt(rating), title, body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["productReviews", variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["productRatingSummary", variables.productId],
      });
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      reviewId,
    }: {
      productId: string;
      reviewId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteReview(productId, reviewId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["productReviews", variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["productRatingSummary", variables.productId],
      });
    },
  });
}

// ─── Wholesale ────────────────────────────────────────────────────────────────

/** Fetch the current user's wholesale account status */
export function useGetMyWholesaleAccount() {
  const { actor, isFetching } = useActor();

  return useQuery<WholesaleAccount | null>({
    queryKey: ["myWholesaleAccount"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyWholesaleAccount();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Register current user for a wholesale account */
export function useRegisterWholesaleAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessName,
      taxId,
    }: {
      businessName: string;
      taxId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.registerWholesaleAccount(businessName, taxId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myWholesaleAccount"] });
    },
  });
}

/** List all wholesale applications (admin only) */
export function useListWholesaleApplications() {
  const { actor, isFetching } = useActor();

  return useQuery<WholesaleAccount[]>({
    queryKey: ["wholesaleApplications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listWholesaleApplications();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Approve a wholesale account (admin only) */
export function useApproveWholesaleAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicant: any) => {
      if (!actor) throw new Error("Actor not available");
      await actor.approveWholesaleAccount(applicant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesaleApplications"] });
    },
  });
}

/** Reject a wholesale account (admin only) */
export function useRejectWholesaleAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicant: any) => {
      if (!actor) throw new Error("Actor not available");
      await actor.rejectWholesaleAccount(applicant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesaleApplications"] });
    },
  });
}

/** Get wholesale tiers for a product */
export function useGetWholesaleTiers(productId?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<WholesaleTier[]>({
    queryKey: ["wholesaleTiers", productId],
    queryFn: async () => {
      if (!actor || !productId) return [];
      return actor.getWholesaleTiers(productId);
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

/** Set wholesale tiers for a product (vendor action) */
export function useSetWholesaleTiers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
      tiers,
    }: {
      storeId: string;
      productId: string;
      tiers: WholesaleTier[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setWholesaleTiers(storeId, productId, tiers);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wholesaleTiers", variables.productId],
      });
    },
  });
}

/** Get wholesale price for a product at a given quantity */
export function useGetWholesalePrice(productId?: string, quantity?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ["wholesalePrice", productId, quantity?.toString()],
    queryFn: async () => {
      if (!actor || !productId || quantity === undefined) return null;
      return actor.getWholesalePrice(productId, quantity);
    },
    enabled: !!actor && !isFetching && !!productId && quantity !== undefined,
  });
}
