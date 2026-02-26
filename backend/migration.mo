import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import UserApproval "user-approval/approval";
import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";

module {
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

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    vendorProfiles : Map.Map<Text, VendorProfile>;
    products : Map.Map<Text, Product>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Text, Order>;
    transactions : Map.Map<Text, TransactionEntry>;
    payouts : Map.Map<Text, Payout>;
    stores : Map.Map<Text, Store>;
    vendorStores : Map.Map<Principal, List.List<Text>>;
    approvalState : UserApproval.UserApprovalState;
    accessControlState : AccessControl.AccessControlState;
    commissionRate : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    vendorProfiles : Map.Map<Text, VendorProfile>;
    products : Map.Map<Text, Product>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Text, Order>;
    transactions : Map.Map<Text, TransactionEntry>;
    payouts : Map.Map<Text, Payout>;
    stores : Map.Map<Text, Store>;
    vendorStores : Map.Map<Principal, List.List<Text>>;
    approvalState : UserApproval.UserApprovalState;
    accessControlState : AccessControl.AccessControlState;
    commissionRate : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
  };

  // Map old persistent store data to new actor state during upgrade
  public func run(old : OldActor) : NewActor { old };
};
