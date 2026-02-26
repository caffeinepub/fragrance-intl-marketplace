import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Time "mo:core/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Migration "migration";

// Use explicit migration logic (see migration.mo)
(with migration = Migration.run)
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
    storeId : Text;
    vendorPrincipal : Principal;
    name : Text;
    description : Text;
    contactEmail : Text;
    logoUrl : Text;
    isActive : Bool;
    createdAt : Int;
  };

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
  };

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
    storeId : Text;
    name : Text;
    description : Text;
    contactEmail : Text;
    logoUrl : Text;
    isActive : Bool;
    createdAt : Int;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let vendorProfiles = Map.empty<Text, VendorProfile>();
  let products = Map.empty<Text, Product>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Text, Order>();
  let payouts = Map.empty<Text, Payout>();

  let stores = Map.empty<Text, Store>();
  let vendorStores = Map.empty<Principal, List.List<Text>>();

  var commissionRate : Nat = 5;
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
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

  // getMyStores: requires authenticated user
  public query ({ caller }) func getMyStores() : async [StoreResponse] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their stores");
    };
    let storeIds = switch (vendorStores.get(caller)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };
    let storesArray = storeIds.toArray();
    let storeResponses = storesArray.map(
      func(storeId) {
        switch (stores.get(storeId)) {
          case (null) {
            {
              storeId = storeId;
              name = "Unknown";
              description = "";
              contactEmail = "";
              logoUrl = "";
              isActive = false;
              createdAt = 0;
            };
          };
          case (?store) {
            {
              storeId = store.storeId;
              name = store.name;
              description = store.description;
              contactEmail = store.contactEmail;
              logoUrl = store.logoUrl;
              isActive = store.isActive;
              createdAt = store.createdAt;
            };
          };
        };
      }
    );
    storeResponses;
  };

  // getStoresByVendor: public query, anyone can view stores belonging to a vendor
  public query func getStoresByVendor(vendor : Principal) : async [StoreResponse] {
    let storeIds = switch (vendorStores.get(vendor)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };
    let storesArray = storeIds.toArray();
    let storeResponses = storesArray.map(
      func(storeId) {
        switch (stores.get(storeId)) {
          case (null) {
            {
              storeId = storeId;
              name = "Unknown";
              description = "";
              contactEmail = "";
              logoUrl = "";
              isActive = false;
              createdAt = 0;
            };
          };
          case (?store) {
            {
              storeId = store.storeId;
              name = store.name;
              description = store.description;
              contactEmail = store.contactEmail;
              logoUrl = store.logoUrl;
              isActive = store.isActive;
              createdAt = store.createdAt;
            };
          };
        };
      }
    );
    storeResponses;
  };

  // getStoreById: public, anyone can view a store
  public query func getStoreById(storeId : Text) : async ?StoreResponse {
    switch (stores.get(storeId)) {
      case (null) { null };
      case (?store) {
        ?{
          storeId = store.storeId;
          name = store.name;
          description = store.description;
          contactEmail = store.contactEmail;
          logoUrl = store.logoUrl;
          isActive = store.isActive;
          createdAt = store.createdAt;
        };
      };
    };
  };

  // createStore: approved vendors only (admin counts as approved), max 5 stores per vendor
  public shared ({ caller }) func createStore(name : Text, description : Text, contactEmail : Text, logoUrl : Text) : async StoreResponse {
    // Must be an authenticated user
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create stores");
    };
    // Must be an approved vendor (or admin)
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved vendors can create stores");
    };

    // Check max 5 stores per vendor
    switch (vendorStores.get(caller)) {
      case (null) {};
      case (?existingStores) {
        if (existingStores.size() >= 5) {
          Runtime.trap("Vendor cannot have more than 5 stores");
        };
      };
    };

    let storeId = "store_" # Time.now().toText();
    let newStore = {
      storeId;
      vendorPrincipal = caller;
      name;
      description;
      contactEmail;
      logoUrl;
      isActive = true;
      createdAt = Time.now();
    };

    stores.add(storeId, newStore);
    switch (vendorStores.get(caller)) {
      case (null) {
        let newStoreList = List.empty<Text>();
        newStoreList.add(storeId);
        vendorStores.add(caller, newStoreList);
      };
      case (?existingStoreList) { existingStoreList.add(storeId) };
    };

    {
      storeId = newStore.storeId;
      name = newStore.name;
      description = newStore.description;
      contactEmail = newStore.contactEmail;
      logoUrl = newStore.logoUrl;
      isActive = newStore.isActive;
      createdAt = newStore.createdAt;
    };
  };

  // updateStore: authenticated user + store owner only
  public shared ({ caller }) func updateStore(storeId : Text, name : Text, description : Text, contactEmail : Text, logoUrl : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update stores");
    };
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        if (store.vendorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the store owner can update this store");
        };
        let updatedStore = {
          storeId = store.storeId;
          vendorPrincipal = store.vendorPrincipal;
          name;
          description;
          contactEmail;
          logoUrl;
          isActive = store.isActive;
          createdAt = store.createdAt;
        };
        stores.add(storeId, updatedStore);
        {
          storeId = updatedStore.storeId;
          name = updatedStore.name;
          description = updatedStore.description;
          contactEmail = updatedStore.contactEmail;
          logoUrl = updatedStore.logoUrl;
          isActive = updatedStore.isActive;
          createdAt = updatedStore.createdAt;
        };
      };
    };
  };

  // toggleStoreActive: authenticated user + store owner only (or admin)
  public shared ({ caller }) func toggleStoreActive(storeId : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can toggle store status");
    };
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        if (store.vendorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the store owner can toggle this store's status");
        };
        let updatedStore = {
          storeId = store.storeId;
          vendorPrincipal = store.vendorPrincipal;
          name = store.name;
          description = store.description;
          contactEmail = store.contactEmail;
          logoUrl = store.logoUrl;
          isActive = not store.isActive;
          createdAt = store.createdAt;
        };
        stores.add(storeId, updatedStore);
        {
          storeId = updatedStore.storeId;
          name = updatedStore.name;
          description = updatedStore.description;
          contactEmail = updatedStore.contactEmail;
          logoUrl = updatedStore.logoUrl;
          isActive = updatedStore.isActive;
          createdAt = updatedStore.createdAt;
        };
      };
    };
  };

  // deactivateStore: authenticated user + store owner only (or admin)
  public shared ({ caller }) func deactivateStore(storeId : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can deactivate stores");
    };
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        if (store.vendorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the store owner can deactivate this store");
        };
        let updatedStore = {
          storeId = store.storeId;
          vendorPrincipal = store.vendorPrincipal;
          name = store.name;
          description = store.description;
          contactEmail = store.contactEmail;
          logoUrl = store.logoUrl;
          isActive = false;
          createdAt = store.createdAt;
        };
        stores.add(storeId, updatedStore);
        {
          storeId = updatedStore.storeId;
          name = updatedStore.name;
          description = updatedStore.description;
          contactEmail = updatedStore.contactEmail;
          logoUrl = updatedStore.logoUrl;
          isActive = updatedStore.isActive;
          createdAt = updatedStore.createdAt;
        };
      };
    };
  };

  // activateStore: authenticated user + store owner only (or admin)
  public shared ({ caller }) func activateStore(storeId : Text) : async StoreResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can activate stores");
    };
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        if (store.vendorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the store owner can activate this store");
        };
        let updatedStore = {
          storeId = store.storeId;
          vendorPrincipal = store.vendorPrincipal;
          name = store.name;
          description = store.description;
          contactEmail = store.contactEmail;
          logoUrl = store.logoUrl;
          isActive = true;
          createdAt = store.createdAt;
        };
        stores.add(storeId, updatedStore);
        {
          storeId = updatedStore.storeId;
          name = updatedStore.name;
          description = updatedStore.description;
          contactEmail = updatedStore.contactEmail;
          logoUrl = updatedStore.logoUrl;
          isActive = updatedStore.isActive;
          createdAt = updatedStore.createdAt;
        };
      };
    };
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
};
