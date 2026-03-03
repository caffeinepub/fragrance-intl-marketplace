import Iter "mo:core/Iter";
import Array "mo:core/Array";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

import UserApproval "user-approval/approval";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";


actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  let approvalState = UserApproval.initState(accessControlState);

  type ProductType = { #physical; #digital; #service };
  type ProductStatus = { #active; #inactive };
  type OrderStatus = { #pending; #processing; #shipped; #delivered; #canceled };
  type PaymentStatus = {
    #pending;
    #initiated;
    #awaiting_payment;
    #completed;
    #failed;
  };

  type UserProfile = {
    name : Text;
    email : ?Text;
    role : Text;
  };

  type Store = {
    id : Text;
    vendorId : Principal;
    name : Text;
    description : Text;
    contactInfo : Text;
    isActive : Bool;
    createdAt : Time.Time;
  };

  let vendorStoreMap = Map.empty<Principal, List.List<Text>>();
  let stores = Map.empty<Text, Store>();

  type VendorProfile = {
    id : Text;
    name : Text;
    description : Text;
    logo : ?Principal;
    contact : Text;
    approved : Bool;
    createdBy : Principal;
    principal : Text;
  };

  // New ProductVariant type
  type ProductVariant = {
    name : Text;
    value : Text;
    priceAdjustment : Nat;
    stockAdjustment : Nat;
  };

  type Product = {
    id : Text;
    vendorId : Text;
    title : Text;
    description : Text;
    price : Nat;
    category : Text;
    productType : ProductType;
    stock : Nat;
    image : ?Principal;
    status : ProductStatus;
    variants : [ProductVariant];
  };

  // Store-level product map (stable variable): storeId -> (productId -> Product)
  let storeProducts = Map.empty<Text, Map.Map<Text, Product>>();
  // Stable products map by productId
  let products = Map.empty<Text, Product>();

  module Product {
    public func compareByPrice(a : Product, b : Product) : Order.Order {
      Nat.compare(a.price, b.price);
    };
  };

  type CartItem = {
    productId : Text;
    quantity : Nat;
  };

  type Order = {
    id : Text;
    customer : Principal;
    items : [CartItem];
    total : Nat;
    status : OrderStatus;
    shippingAddress : Text;
    timestamp : Int;
    paymentUrl : ?Text;
    paymentStatus : PaymentStatus;
    paymentSessionId : ?Text;
    createdAt : Int;
    updatedAt : Int;
    statusHistory : [OrderStatus];
    paymentHistory : [PaymentStatus];
  };

  type TransactionEntry = {
    orderId : Text;
    buyer : Principal;
    vendor : Principal;
    items : [CartItem];
    totalAmount : Int;
    commissionFee : Int;
    netPayout : Int;
    timestamp : Int;
  };

  let transactions = Map.empty<Text, TransactionEntry>();

  type SearchFilter = {
    keyword : ?Text;
    category : ?Text;
    productType : ?ProductType;
    sortBy : ?{ #priceAsc; #priceDesc; #quantityDesc };
  };

  type PayoutStatus = {
    #pending;
    #processing;
    #completed;
    #failed;
  };

  type Payout = {
    payoutId : Text;
    vendorId : Text;
    orderId : Text;
    grossAmount : Nat;
    commissionAmount : Nat;
    netAmount : Nat;
    status : PayoutStatus;
    createdAt : Int;
    updatedAt : Int;
  };

  public type StoreResponse = {
    id : Text;
    vendorId : Principal;
    name : Text;
    description : Text;
    contactInfo : Text;
    isActive : Bool;
    createdAt : Time.Time;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let vendorProfiles = Map.empty<Text, VendorProfile>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Text, Order>();
  let payouts = Map.empty<Text, Payout>();

  var commissionRate : Nat = 5;
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe configuration is missing") };
      case (?config) { config };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Store management functions

  public shared ({ caller }) func createStore(name : Text, description : Text, contactInfo : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can create stores");
    };

    let existingStores = switch (vendorStoreMap.get(caller)) {
      case (?storeList) { storeList };
      case (null) {
        let newList = List.empty<Text>();
        newList;
      };
    };

    if (existingStores.size() >= 5) {
      Runtime.trap("You cannot have more than 5 stores");
    };

    let storeId = "store-" # Time.now().toText();
    let newStore : Store = {
      id = storeId;
      vendorId = caller;
      name;
      description;
      contactInfo;
      isActive = true;
      createdAt = Time.now();
    };

    stores.add(storeId, newStore);
    existingStores.add(storeId);
    vendorStoreMap.add(caller, existingStores);

    {
      id = newStore.id;
      vendorId = newStore.vendorId;
      name = newStore.name;
      description = newStore.description;
      contactInfo = newStore.contactInfo;
      isActive = newStore.isActive;
      createdAt = newStore.createdAt;
    };
  };

  public shared ({ caller }) func updateStore(storeId : Text, name : Text, description : Text, updatedContactInfo : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can edit stores");
    };

    let store = switch (stores.get(storeId)) {
      case (?store) { store };
      case (null) { Runtime.trap("Store not found") };
    };

    if (store.vendorId != caller) {
      Runtime.trap("Only the store owner can update this store");
    };

    let updatedStore : Store = {
      id = store.id;
      vendorId = store.vendorId;
      name;
      description;
      contactInfo = updatedContactInfo;
      isActive = store.isActive;
      createdAt = store.createdAt;
    };

    stores.add(storeId, updatedStore);

    {
      id = updatedStore.id;
      vendorId = updatedStore.vendorId;
      name = updatedStore.name;
      description = updatedStore.description;
      contactInfo = updatedStore.contactInfo;
      isActive = updatedStore.isActive;
      createdAt = updatedStore.createdAt;
    };
  };

  public query ({ caller }) func getStoresByVendor(vendorId : Principal) : async [StoreResponse] {
    switch (vendorStoreMap.get(vendorId)) {
      case (null) { [] };
      case (?storeIds) {
        let storesArray = storeIds.toArray();
        storesArray.map(
          func(storeId) {
            switch (stores.get(storeId)) {
              case (null) {
                {
                  id = storeId;
                  vendorId = vendorId;
                  name = "Unknown";
                  description = "";
                  contactInfo = "";
                  isActive = false;
                  createdAt = 0;
                };
              };
              case (?store) {
                {
                  id = store.id;
                  vendorId = store.vendorId;
                  name = store.name;
                  description = store.description;
                  contactInfo = store.contactInfo;
                  isActive = store.isActive;
                  createdAt = store.createdAt;
                };
              };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func toggleStoreActive(storeId : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can toggle store status");
    };

    let store = switch (stores.get(storeId)) {
      case (?store) { store };
      case (null) { Runtime.trap("Store not found") };
    };

    if (store.vendorId != caller) {
      Runtime.trap("Only the store owner can toggle this store's status");
    };

    let updatedStore : Store = {
      id = store.id;
      vendorId = store.vendorId;
      name = store.name;
      description = store.description;
      contactInfo = store.contactInfo;
      isActive = not store.isActive;
      createdAt = store.createdAt;
    };

    stores.add(storeId, updatedStore);
    {
      id = updatedStore.id;
      vendorId = updatedStore.vendorId;
      name = updatedStore.name;
      description = updatedStore.description;
      contactInfo = updatedStore.contactInfo;
      isActive = updatedStore.isActive;
      createdAt = updatedStore.createdAt;
    };
  };

  public query func getAllStoreIds() : async [Text] {
    stores.keys().toArray();
  };

  func createTransactionEntry(orderId : Text, buyer : Principal, items : [CartItem], totalNat : Nat, timestamp : Int) {
    let commissionFee = commissionRate.toInt() * totalNat.toInt() / 100;
    let entry : TransactionEntry = {
      orderId;
      buyer;
      vendor = buyer;
      items;
      totalAmount = totalNat.toInt();
      commissionFee = commissionFee;
      netPayout = totalNat.toInt() - commissionFee;
      timestamp;
    };
    transactions.add(orderId, entry);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin)
    or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // Product Management per Store

  public shared ({ caller }) func addProductToStore(storeId : Text, product : Product) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (not (AccessControl.isAdmin(accessControlState, caller)) and (store.vendorId != caller)) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can add products");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) {
        let newStoreMap = Map.empty<Text, Product>();
        storeProducts.add(storeId, newStoreMap);
        newStoreMap;
      };
    };

    storeProductsMap.add(product.id, product);
  };

  public shared ({ caller }) func updateStoreProduct(storeId : Text, product : Product) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (not (AccessControl.isAdmin(accessControlState, caller)) and (store.vendorId != caller)) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can update products");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) {
        let newStoreMap = Map.empty<Text, Product>();
        storeProducts.add(storeId, newStoreMap);
        newStoreMap;
      };
    };

    storeProductsMap.add(product.id, product);
  };

  public shared ({ caller }) func deleteStoreProduct(storeId : Text, productId : Text) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (not (AccessControl.isAdmin(accessControlState, caller)) and (store.vendorId != caller)) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can delete products");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Store has no products") };
    };

    storeProductsMap.remove(productId);
  };

  public query func listStoreProducts(storeId : Text) : async [Product] {
    switch (storeProducts.get(storeId)) {
      case (?productsMap) {
        productsMap.values().toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getProduct(storeId : Text, productId : Text) : async ?Product {
    switch (storeProducts.get(storeId)) {
      case (null) { null };
      case (?productsMap) { productsMap.get(productId) };
    };
  };

  // Backend Variant Management Functions

  public shared ({ caller }) func addVariant(storeId : Text, productId : Text, variant : ProductVariant) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (
      not (AccessControl.isAdmin(accessControlState, caller)) and
      (store.vendorId != caller)
    ) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can add variants");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Store has no products") };
    };

    let product = switch (storeProductsMap.get(productId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Product not found") };
    };

    let updatedVariants = product.variants.concat([variant]);
    let updatedProduct = { product with variants = updatedVariants };
    storeProductsMap.add(productId, updatedProduct);
  };

  public shared ({ caller }) func updateVariant(storeId : Text, productId : Text, variantIndex : Nat, updatedVariant : ProductVariant) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (
      not (AccessControl.isAdmin(accessControlState, caller)) and
      (store.vendorId != caller)
    ) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can update variants");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Store has no products") };
    };

    let product = switch (storeProductsMap.get(productId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Product not found") };
    };

    if (variantIndex >= product.variants.size()) {
      Runtime.trap("Invalid variant index");
    };

    let updatedVariants = product.variants.toVarArray<ProductVariant>();
    updatedVariants[variantIndex] := updatedVariant;
    let updatedProduct = { product with variants = updatedVariants.toArray() };
    storeProductsMap.add(productId, updatedProduct);
  };

  public shared ({ caller }) func deleteVariant(storeId : Text, productId : Text, variantIndex : Nat) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (
      not (AccessControl.isAdmin(accessControlState, caller)) and
      (store.vendorId != caller)
    ) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can delete variants");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Store has no products") };
    };

    let product = switch (storeProductsMap.get(productId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Product not found") };
    };

    if (variantIndex >= product.variants.size()) {
      Runtime.trap("Invalid variant index");
    };

    let newVariantsList = List.empty<ProductVariant>();
    for ((i, variant) in product.variants.values().enumerate()) {
      if (i != variantIndex) {
        newVariantsList.add(variant);
      };
    };

    let updatedProduct = { product with variants = newVariantsList.toArray() };
    storeProductsMap.add(productId, updatedProduct);
  };
};

