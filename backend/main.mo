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

  type VendorProfile = {
    id : Text;
    name : Text;
    description : Text;
    logo : ?Principal;
    contact : Text;
    approved : Bool;
    createdBy : Principal;
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

  let userProfiles = Map.empty<Principal, UserProfile>();
  let vendorProfiles = Map.empty<Text, VendorProfile>();
  let products = Map.empty<Text, Product>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Text, Order>();
  let payouts = Map.empty<Text, Payout>();
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

  public shared ({ caller }) func createVendorProfile(
    id : Text, name : Text, description : Text, logo : ?Storage.ExternalBlob, contact : Text
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register as a vendor");
    };
    if (vendorProfiles.containsKey(id)) {
      Runtime.trap("Store ID already exists");
    };
    let vendorProfile : VendorProfile = {
      id; name; description; logo = null; contact; approved = false; createdBy = caller
    };
    vendorProfiles.add(id, vendorProfile);
  };

  public shared ({ caller }) func approveVendorProfile(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve vendor profiles");
    };
    switch (vendorProfiles.get(id)) {
      case (null) { Runtime.trap("Vendor profile not found") };
      case (?vendorProfile) {
        let updatedProfile : VendorProfile = {
          id = vendorProfile.id;
          name = vendorProfile.name;
          description = vendorProfile.description;
          logo = vendorProfile.logo;
          contact = vendorProfile.contact;
          approved = true;
          createdBy = vendorProfile.createdBy;
        };
        vendorProfiles.add(id, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func updateVendorProfile(
    id : Text, name : Text, description : Text, logo : ?Storage.ExternalBlob, contact : Text
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update vendor profiles");
    };
    switch (vendorProfiles.get(id)) {
      case (null) { Runtime.trap("Vendor profile not found") };
      case (?vendorProfile) {
        if (vendorProfile.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the vendor owner or an admin can update this profile");
        };
        if (not vendorProfile.approved and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
          Runtime.trap("Unauthorized: Vendor profile is not yet approved");
        };
        let updatedProfile : VendorProfile = {
          id = vendorProfile.id;
          name;
          description;
          logo = vendorProfile.logo;
          contact;
          approved = vendorProfile.approved;
          createdBy = vendorProfile.createdBy;
        };
        vendorProfiles.add(id, updatedProfile);
      };
    };
  };

  public query func getVendorProfile(id : Text) : async VendorProfile {
    switch (vendorProfiles.get(id)) {
      case (null) { Runtime.trap("Vendor profile not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func createProduct(
    id : Text, vendorId : Text, title : Text, description : Text, price : Nat, category : Text, productType : ProductType, stock : Nat, image : ?Storage.ExternalBlob
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create products");
    };
    switch (vendorProfiles.get(vendorId)) {
      case (null) { Runtime.trap("Vendor profile not found") };
      case (?vendorProfile) {
        if (vendorProfile.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the vendor owner can create products for this store");
        };
        if (not vendorProfile.approved and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
          Runtime.trap("Unauthorized: Vendor profile is not yet approved");
        };
      };
    };
    if (products.containsKey(id)) {
      Runtime.trap("Product ID already exists");
    };
    let product : Product = {
      id; vendorId; title; description; price; category; productType; stock; image = null; status = #active
    };
    products.add(id, product);
  };

  public shared ({ caller }) func updateProduct(
    id : Text, title : Text, description : Text, price : Nat, category : Text, productType : ProductType, stock : Nat, image : ?Storage.ExternalBlob
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update products");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        switch (vendorProfiles.get(product.vendorId)) {
          case (null) { Runtime.trap("Vendor profile not found") };
          case (?vendorProfile) {
            if (vendorProfile.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only the vendor owner can update this product");
            };
          };
        };
        let updatedProduct : Product = {
          id = product.id;
          vendorId = product.vendorId;
          title;
          description;
          price;
          category;
          productType;
          stock;
          image = product.image;
          status = product.status;
        };
        products.add(id, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete products");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        switch (vendorProfiles.get(product.vendorId)) {
          case (null) { Runtime.trap("Vendor profile not found") };
          case (?vendorProfile) {
            if (vendorProfile.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only the vendor owner can delete this product");
            };
          };
        };
        products.remove(id);
      };
    };
  };

  public query func searchProducts(filter : SearchFilter) : async [Product] {
    var result : [Product] = products.values().toArray();
    result := result.filter(
      func(product : Product) : Bool {
        let matchesKeyword = switch (filter.keyword) {
          case (null) { true };
          case (?keyword) {
            product.title.contains(#text keyword) or product.description.contains(#text keyword)
          };
        };
        let matchesCategory = switch (filter.category) {
          case (null) { true };
          case (?category) { product.category == category };
        };
        let matchesType = switch (filter.productType) {
          case (null) { true };
          case (?productType) { product.productType == productType };
        };
        matchesKeyword and matchesCategory and matchesType and product.status == #active;
      },
    );
    switch (filter.sortBy) {
      case (null) { result };
      case (?sortBy) {
        let compareFunc = switch (sortBy) {
          case (#priceAsc) { Product.compareByPrice };
          case (#priceDesc) {
            func(a : Product, b : Product) : Order.Order {
              switch (Product.compareByPrice(a, b)) {
                case (#less) { #greater };
                case (#greater) { #less };
                case (#equal) { #equal };
              };
            };
          };
          case (#quantityDesc) {
            func(a : Product, b : Product) : Order.Order {
              switch (Product.compareByPrice(a, b)) {
                case (#less) { #greater };
                case (#greater) { #less };
                case (#equal) { #equal };
              };
            };
          };
        };
        result.sort(compareFunc);
      };
    };
  };

  public shared ({ caller }) func addToCart(productId : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add items to cart");
    };
    let cart = switch (carts.get(caller)) {
      case (null) { List.empty<CartItem>() };
      case (?existingCart) { existingCart };
    };
    cart.add({ productId; quantity });
    carts.add(caller, cart);
  };

  public shared ({ caller }) func removeFromCart(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove items from cart");
    };
    switch (carts.get(caller)) {
      case (null) { };
      case (?existingCart) {
        let updatedCart = existingCart.filter(func(item : CartItem) : Bool { item.productId != productId });
        carts.add(caller, updatedCart);
      };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their cart");
    };
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?existingCart) { existingCart.toArray() };
    };
  };

  public shared ({ caller }) func placeOrder(shippingAddress : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can place orders");
    };
    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?existingCart) { existingCart };
    };
    let cartItemsArray = cart.toArray();
    if (cartItemsArray.size() == 0) {
      Runtime.trap("Cart is empty");
    };

    var total : Nat = 0;
    for (item in cartItemsArray.vals()) {
      switch (products.get(item.productId)) {
        case (null) { };
        case (?product) { total += (product.price * item.quantity) };
      };
    };

    let orderId = "order_" # Time.now().toText();
    let timestamp = Time.now();
    let newOrder : Order = {
      id = orderId;
      customer = caller;
      items = cartItemsArray;
      total;
      status = #pending;
      shippingAddress;
      timestamp;
      paymentUrl = null;
      paymentStatus = #pending;
      paymentSessionId = null;
      createdAt = timestamp;
      updatedAt = timestamp;
      statusHistory = [#pending];
      paymentHistory = [#pending];
    };
    orders.add(orderId, newOrder);
    carts.remove(caller);

    createTransactionEntry(orderId, caller, cartItemsArray, total, timestamp);

    orderId;
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

  public query ({ caller }) func getOrder(orderId : Text) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.customer != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only view your own orders");
        };
        order;
      };
    };
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };
    orders.values().toArray().filter(func(order : Order) : Bool { order.customer == caller });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  func initiatePayoutInternal(orderId : Text) : () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.items.size() == 0) {
          Runtime.trap("Order has no items");
        };
        let firstItem = order.items[0];
        let productId = firstItem.productId;
        switch (products.get(productId)) {
          case (null) { Runtime.trap("Product not found in order") };
          case (?product) {
            let vendorId = product.vendorId;
            let timestamp = Time.now();
            let commission = (order.total * commissionRate) / 100;
            let netAmount = order.total - commission;
            let payout : Payout = {
              payoutId = "payout_" # timestamp.toText();
              vendorId;
              orderId;
              grossAmount = order.total;
              commissionAmount = commission;
              netAmount;
              status = #pending;
              createdAt = timestamp;
              updatedAt = timestamp;
            };
            payouts.add(payout.payoutId, payout);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let timeNow = Time.now();
        let updatedOrder : Order = {
          id = order.id;
          customer = order.customer;
          items = order.items;
          total = order.total;
          status = newStatus;
          shippingAddress = order.shippingAddress;
          timestamp = order.timestamp;
          paymentUrl = order.paymentUrl;
          paymentStatus = order.paymentStatus;
          paymentSessionId = order.paymentSessionId;
          createdAt = order.createdAt;
          updatedAt = timeNow;
          statusHistory = order.statusHistory.concat([newStatus]);
          paymentHistory = order.paymentHistory;
        };
        orders.add(orderId, updatedOrder);
        switch (newStatus) {
          case (#delivered) { initiatePayoutInternal(orderId) };
          case (_) {};
        };
      };
    };
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
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

  public shared ({ caller }) func setCommissionRate(rate : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (rate > 100) {
      Runtime.trap("Commission rate must be between 0 and 100");
    };
    commissionRate := rate;
  };

  public query ({ caller }) func getCommissionRate() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view the commission rate");
    };
    commissionRate;
  };

  public shared ({ caller }) func initiatePayout(orderId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.items.size() == 0) {
          Runtime.trap("Order has no items");
        };
        let firstItem = order.items[0];
        let productId = firstItem.productId;
        switch (products.get(productId)) {
          case (null) { Runtime.trap("Product not found in order") };
          case (?product) {
            let vendorId = product.vendorId;
            let timestamp = Time.now();
            let commission = (order.total * commissionRate) / 100;
            let netAmount = order.total - commission;
            let payout : Payout = {
              payoutId = "payout_" # timestamp.toText();
              vendorId;
              orderId;
              grossAmount = order.total;
              commissionAmount = commission;
              netAmount;
              status = #pending;
              createdAt = timestamp;
              updatedAt = timestamp;
            };
            payouts.add(payout.payoutId, payout);
            return payout.payoutId;
          };
        };
      };
    };
  };

  public shared ({ caller }) func updatePayoutStatus(payoutId : Text, status : PayoutStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (payouts.get(payoutId)) {
      case (null) { Runtime.trap("Payout not found") };
      case (?payout) {
        let updatedPayout : Payout = {
          payoutId = payout.payoutId;
          vendorId = payout.vendorId;
          orderId = payout.orderId;
          grossAmount = payout.grossAmount;
          commissionAmount = payout.commissionAmount;
          netAmount = payout.netAmount;
          status;
          createdAt = payout.createdAt;
          updatedAt = Time.now();
        };
        payouts.add(payoutId, updatedPayout);
      };
    };
  };

  public query ({ caller }) func getPayout(payoutId : Text) : async ?Payout {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access this function");
    };
    payouts.get(payoutId);
  };

  public query ({ caller }) func getPayoutsForVendor(vendorId : Text) : async [Payout] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Only authenticated users can view vendor payouts");
      };
      switch (vendorProfiles.get(vendorId)) {
        case (null) { Runtime.trap("Vendor profile not found") };
        case (?vendorProfile) {
          if (vendorProfile.createdBy != caller) {
            Runtime.trap("Unauthorized: You can only view payouts for your own vendor profile");
          };
        };
      };
    };
    payouts.values().toArray().filter(func(payout : Payout) : Bool { payout.vendorId == vendorId });
  };

  public query ({ caller }) func getAllPayouts() : async [Payout] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    payouts.values().toArray();
  };

  public query ({ caller }) func getTransaction(orderId : Text) : async ?TransactionEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view transactions");
    };
    switch (transactions.get(orderId)) {
      case (null) { null };
      case (?entry) {
        if (entry.buyer != caller and entry.vendor != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only view your own transactions");
        };
        ?entry;
      };
    };
  };

  public query ({ caller }) func getTransactionsByBuyer(buyer : Principal) : async [TransactionEntry] {
    if (caller != buyer and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own transactions");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user)) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view transactions");
    };
    transactions.values().toArray().filter(
      func(transaction : TransactionEntry) : Bool {
        transaction.buyer == buyer;
      }
    );
  };

  public query ({ caller }) func getTransactionsByVendor(vendor : Principal) : async [TransactionEntry] {
    if (caller != vendor and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own transactions");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user)) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view transactions");
    };
    transactions.values().toArray().filter(
      func(transaction : TransactionEntry) : Bool {
        transaction.vendor == vendor;
      }
    );
  };
};
