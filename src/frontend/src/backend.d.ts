import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Review {
    id: string;
    title: string;
    body: string;
    storeId: string;
    createdAt: bigint;
    productId: string;
    rating: bigint;
    reviewer: Principal;
}
export interface Product {
    id: string;
    status: ProductStatus;
    title: string;
    description: string;
    variants: Array<ProductVariant>;
    productType: ProductType;
    stock: bigint;
    vendorId: string;
    category: string;
    image?: Principal;
    price: bigint;
}
export interface WholesaleAccount {
    id: string;
    status: WholesaleAccountStatus;
    applicant: Principal;
    taxId: string;
    createdAt: bigint;
    businessName: string;
    reviewedAt?: bigint;
    reviewedBy?: Principal;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface WholesaleTier {
    tierLabel: string;
    minQty: bigint;
    pricePerUnit: bigint;
}
export interface ProductVariant {
    value: string;
    name: string;
    stockAdjustment: bigint;
    priceAdjustment: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface StoreResponse {
    id: string;
    contactInfo: string;
    name: string;
    createdAt: Time;
    description: string;
    isActive: boolean;
    vendorId: Principal;
}
export interface UserProfile {
    name: string;
    role: string;
    email?: string;
}
export enum ProductStatus {
    active = "active",
    inactive = "inactive"
}
export enum ProductType {
    service = "service",
    physical = "physical",
    digital = "digital"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WholesaleAccountStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addProductToStore(storeId: string, product: Product): Promise<void>;
    addVariant(storeId: string, productId: string, variant: ProductVariant): Promise<void>;
    approveWholesaleAccount(applicant: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createStore(name: string, description: string, contactInfo: string): Promise<StoreResponse>;
    deleteReview(productId: string, reviewId: string): Promise<void>;
    deleteStoreProduct(storeId: string, productId: string): Promise<void>;
    deleteVariant(storeId: string, productId: string, variantIndex: bigint): Promise<void>;
    getAllStoreIds(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyWholesaleAccount(): Promise<WholesaleAccount | null>;
    getProduct(storeId: string, productId: string): Promise<Product | null>;
    getProductRatingSummary(productId: string): Promise<{
        averageRating: number;
        totalReviews: bigint;
        distribution: Array<bigint>;
    }>;
    getProductReviews(productId: string): Promise<Array<Review>>;
    getStoresByVendor(vendorId: Principal): Promise<Array<StoreResponse>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWholesalePrice(productId: string, quantity: bigint): Promise<bigint | null>;
    getWholesaleTiers(productId: string): Promise<Array<WholesaleTier>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listStoreProducts(storeId: string): Promise<Array<Product>>;
    listWholesaleApplications(): Promise<Array<WholesaleAccount>>;
    registerWholesaleAccount(businessName: string, taxId: string): Promise<void>;
    rejectWholesaleAccount(applicant: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setWholesaleTiers(storeId: string, productId: string, tiers: Array<WholesaleTier>): Promise<void>;
    submitReview(productId: string, storeId: string, rating: bigint, title: string, body: string): Promise<void>;
    toggleStoreActive(storeId: string): Promise<StoreResponse>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateStore(storeId: string, name: string, description: string, updatedContactInfo: string): Promise<StoreResponse>;
    updateStoreProduct(storeId: string, product: Product): Promise<void>;
    updateVariant(storeId: string, productId: string, variantIndex: bigint, updatedVariant: ProductVariant): Promise<void>;
}
