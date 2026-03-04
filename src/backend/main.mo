import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
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

  let storeProducts = Map.empty<Text, Map.Map<Text, Product>>();
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

  // Reviews & Ratings

  type Review = {
    id : Text;
    productId : Text;
    storeId : Text;
    reviewer : Principal;
    rating : Nat;
    title : Text;
    body : Text;
    createdAt : Int;
  };

  let reviews = Map.empty<Text, List.List<Review>>();

  public shared ({ caller }) func submitReview(productId : Text, storeId : Text, rating : Nat, title : Text, body : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit reviews");
    };

    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    let store = switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?s) { s };
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (null) { Runtime.trap("Store has no products") };
      case (?p) { p };
    };

    let product = switch (storeProductsMap.get(productId)) {
      case (null) { Runtime.trap("Product not found in this store") };
      case (?p) { p };
    };

    let existingReviews = switch (reviews.get(productId)) {
      case (null) { [] };
      case (?reviewList) { reviewList.toArray() };
    };
    for (existingReview in existingReviews.values()) {
      if (existingReview.reviewer == caller) {
        Runtime.trap("You have already reviewed this product");
      };
    };

    let reviewId = "review-" # Time.now().toText();
    let review : Review = {
      id = reviewId;
      productId;
      storeId;
      reviewer = caller;
      rating;
      title;
      body;
      createdAt = Time.now();
    };

    let productReviews = switch (reviews.get(productId)) {
      case (null) { List.empty<Review>() };
      case (?reviewList) { reviewList };
    };

    productReviews.add(review);
    reviews.add(productId, productReviews);
  };

  public query func getProductReviews(productId : Text) : async [Review] {
    switch (reviews.get(productId)) {
      case (null) { [] };
      case (?reviewList) { reviewList.values().toArray() };
    };
  };

  public query func getProductRatingSummary(productId : Text) : async {
    averageRating : Float;
    totalReviews : Nat;
    distribution : [Nat];
  } {
    let productReviews = switch (reviews.get(productId)) {
      case (null) { List.empty<Review>() };
      case (?reviewList) { reviewList };
    };

    let reviewsArray = productReviews.toArray();
    let reviewCount = reviewsArray.size();

    if (reviewCount == 0) {
      return {
        averageRating = 0.0;
        totalReviews = 0;
        distribution = [0, 0, 0, 0, 0];
      };
    };

    var totalRating = 0;
    let distributionArray = [0, 0, 0, 0, 0].toVarArray<Nat>();

    for (review in reviewsArray.values()) {
      totalRating += review.rating;
      switch (review.rating) {
        case (1) { distributionArray[0] += 1 };
        case (2) { distributionArray[1] += 1 };
        case (3) { distributionArray[2] += 1 };
        case (4) { distributionArray[3] += 1 };
        case (5) { distributionArray[4] += 1 };
        case (_) {};
      };
    };

    {
      averageRating = totalRating.toFloat() / reviewCount.toInt().toFloat();
      totalReviews = reviewCount;
      distribution = distributionArray.toArray();
    };
  };

  public shared ({ caller }) func deleteReview(productId : Text, reviewId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete reviews");
    };

    let productReviews = switch (reviews.get(productId)) {
      case (null) { Runtime.trap("No reviews found for product") };
      case (?reviewList) { reviewList };
    };

    let filteredReviews = List.empty<Review>();
    for (r in productReviews.values()) {
      if (r.id != reviewId) {
        filteredReviews.add(r);
      };
    };

    reviews.add(productId, filteredReviews);
  };

  //// WHOLESALE FEATURES

  public type WholesaleTier = {
    minQty : Nat;
    pricePerUnit : Nat;
    tierLabel : Text;
  };

  public type WholesaleAccountStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type WholesaleAccount = {
    id : Text;
    applicant : Principal;
    businessName : Text;
    taxId : Text;
    status : WholesaleAccountStatus;
    createdAt : Int;
    reviewedBy : ?Principal;
    reviewedAt : ?Int;
  };

  let wholesaleTiers = Map.empty<Text, List.List<WholesaleTier>>();
  let wholesaleAccounts = Map.empty<Principal, WholesaleAccount>();

  public shared ({ caller }) func setWholesaleTiers(storeId : Text, productId : Text, tiers : [WholesaleTier]) : async () {
    let store = switch (stores.get(storeId)) {
      case (?s) { s };
      case (null) { Runtime.trap("Store not found") };
    };

    if (not (AccessControl.isAdmin(accessControlState, caller)) and (store.vendorId != caller)) {
      Runtime.trap("Unauthorized: Only the store owner or an admin can set wholesale tiers");
    };

    let storeProductsMap = switch (storeProducts.get(storeId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Product not found") };
    };

    let _ = switch (storeProductsMap.get(productId)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };

    let tierList = List.empty<WholesaleTier>();
    for (tier in tiers.values()) {
      tierList.add(tier);
    };

    wholesaleTiers.add(productId, tierList);
  };

  public query func getWholesaleTiers(productId : Text) : async [WholesaleTier] {
    switch (wholesaleTiers.get(productId)) {
      case (?tiers) { tiers.values().toArray() };
      case (null) { [] };
    };
  };

  public query func getWholesalePrice(productId : Text, quantity : Nat) : async ?Nat {
    let bestTier = findBestTier(productId, quantity);
    switch (bestTier) {
      case (null) { null };
      case (?tier) { ?tier.pricePerUnit };
    };
  };

  func findBestTier(productId : Text, quantity : Nat) : ?WholesaleTier {
    let tiers = switch (wholesaleTiers.get(productId)) {
      case (?tiers) { tiers.values().toArray() };
      case (null) { return null };
    };

    var bestTier : ?WholesaleTier = null;
    for (tier in tiers.values()) {
      let tryUpdate = switch (bestTier) {
        case (null) { true };
        case (?currentTier) {
          quantity >= tier.minQty and tier.minQty > currentTier.minQty
        };
      };
      if (quantity >= tier.minQty and tryUpdate) {
        bestTier := ?tier;
      };
    };

    bestTier;
  };

  // Helper function to find a product by productId across all stores
  func findProduct(productId : Text) : (Text, Product) {
    for ((storeId, productsMap) in storeProducts.entries()) {
      switch (productsMap.get(productId)) {
        case (?product) {
          return (storeId, product);
        };
        case (null) {};
      };
    };
    Runtime.trap("Product not found");
  };

  public shared ({ caller }) func registerWholesaleAccount(businessName : Text, taxId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register for a wholesale account");
    };

    switch (wholesaleAccounts.get(caller)) {
      case (null) {};
      case (?existingAccount) {
        switch (existingAccount.status) {
          case (#pending) { Runtime.trap("You already have a pending application") };
          case (#approved) { Runtime.trap("You already have an approved wholesale account") };
          case (#rejected) {};
        };
      };
    };

    let account : WholesaleAccount = {
      id = "wholesale-" # Time.now().toText();
      applicant = caller;
      businessName;
      taxId;
      status = #pending;
      createdAt = Time.now();
      reviewedBy = null;
      reviewedAt = null;
    };

    wholesaleAccounts.add(caller, account);
  };

  public query ({ caller }) func getMyWholesaleAccount() : async ?WholesaleAccount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their wholesale account");
    };

    switch (wholesaleAccounts.get(caller)) {
      case (?account) { ?account };
      case (null) { null };
    };
  };

  public query ({ caller }) func listWholesaleApplications() : async [WholesaleAccount] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list wholesale applications");
    };

    wholesaleAccounts.values().toArray();
  };

  public shared ({ caller }) func approveWholesaleAccount(applicant : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve wholesale accounts");
    };

    let account = switch (wholesaleAccounts.get(applicant)) {
      case (?account) { account };
      case (null) { Runtime.trap("Application not found") };
    };

    if (account.status != #pending) {
      Runtime.trap("Application is not pending");
    };

    let updatedAccount : WholesaleAccount = {
      id = account.id;
      applicant = account.applicant;
      businessName = account.businessName;
      taxId = account.taxId;
      status = #approved;
      createdAt = account.createdAt;
      reviewedBy = ?caller;
      reviewedAt = ?Time.now();
    };

    wholesaleAccounts.add(applicant, updatedAccount);
  };

  public shared ({ caller }) func rejectWholesaleAccount(applicant : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject wholesale accounts");
    };

    let account = switch (wholesaleAccounts.get(applicant)) {
      case (?account) { account };
      case (null) { Runtime.trap("Application not found") };
    };

    if (account.status != #pending) {
      Runtime.trap("Application is not pending");
    };

    let updatedAccount : WholesaleAccount = {
      id = account.id;
      applicant = account.applicant;
      businessName = account.businessName;
      taxId = account.taxId;
      status = #rejected;
      createdAt = account.createdAt;
      reviewedBy = ?caller;
      reviewedAt = ?Time.now();
    };

    wholesaleAccounts.add(applicant, updatedAccount);
  };
};
