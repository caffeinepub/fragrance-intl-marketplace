import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    status: ProductStatus;
    title: string;
    description: string;
    productType: ProductType;
    stock: bigint;
    vendorId: string;
    category: string;
    image?: Principal;
    price: bigint;
}
export interface CartItem {
    productId: string;
    quantity: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SearchFilter {
    sortBy?: Variant_quantityDesc_priceDesc_priceAsc;
    productType?: ProductType;
    category?: string;
    keyword?: string;
}
export interface Order {
    id: string;
    status: OrderStatus;
    total: bigint;
    paymentStatus: PaymentStatus;
    paymentSessionId?: string;
    paymentHistory: Array<PaymentStatus>;
    customer: Principal;
    createdAt: bigint;
    statusHistory: Array<OrderStatus>;
    updatedAt: bigint;
    timestamp: bigint;
    shippingAddress: string;
    items: Array<CartItem>;
    paymentUrl?: string;
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
export interface VendorProfile {
    id: string;
    contact: string;
    logo?: Principal;
    name: string;
    createdBy: Principal;
    description: string;
    approved: boolean;
}
export interface UserProfile {
    name: string;
    role: string;
    email?: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum OrderStatus {
    shipped = "shipped",
    canceled = "canceled",
    pending = "pending",
    delivered = "delivered",
    processing = "processing"
}
export enum PaymentStatus {
    pending = "pending",
    initiated = "initiated",
    completed = "completed",
    awaiting_payment = "awaiting_payment",
    failed = "failed"
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
export enum Variant_quantityDesc_priceDesc_priceAsc {
    quantityDesc = "quantityDesc",
    priceDesc = "priceDesc",
    priceAsc = "priceAsc"
}
export interface backendInterface {
    addToCart(productId: string, quantity: bigint): Promise<void>;
    approveVendorProfile(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createProduct(id: string, vendorId: string, title: string, description: string, price: bigint, category: string, productType: ProductType, stock: bigint, image: ExternalBlob | null): Promise<void>;
    createVendorProfile(id: string, name: string, description: string, logo: ExternalBlob | null, contact: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getMyOrders(): Promise<Array<Order>>;
    getOrder(orderId: string): Promise<Order>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVendorProfile(id: string): Promise<VendorProfile>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    placeOrder(shippingAddress: string): Promise<string>;
    removeFromCart(productId: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchProducts(filter: SearchFilter): Promise<Array<Product>>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void>;
    updateProduct(id: string, title: string, description: string, price: bigint, category: string, productType: ProductType, stock: bigint, image: ExternalBlob | null): Promise<void>;
    updateVendorProfile(id: string, name: string, description: string, logo: ExternalBlob | null, contact: string): Promise<void>;
}
