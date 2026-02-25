import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type ProductType = { #physical; #digital; #service };
  type ProductStatus = { #active; #inactive };
  type OldOrderStatus = { #pending; #paid; #shipped; #delivered; #canceled };
  type NewOrderStatus = { #pending; #processing; #shipped; #delivered; #canceled };

  type PaymentStatus = {
    #pending;
    #initiated;
    #awaiting_payment;
    #completed;
    #failed;
  };

  // User Profile
  type UserProfile = {
    name : Text;
    email : ?Text;
    role : Text;
  };

  // Vendor Profile
  type VendorProfile = {
    id : Text;
    name : Text;
    description : Text;
    logo : ?Principal;
    contact : Text;
    approved : Bool;
    createdBy : Principal;
  };

  // Product
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

  // Cart data
  type CartItem = {
    productId : Text;
    quantity : Nat;
  };

  // OLD Order (pre-migration)
  type OldOrder = {
    id : Text;
    customer : Principal;
    items : [CartItem];
    total : Nat;
    status : OldOrderStatus;
    shippingAddress : Text;
    timestamp : Int;
    paymentUrl : ?Text;
    paymentConfirmed : Bool;
  };

  // NEW Order (post-migration)
  type NewOrder = {
    id : Text;
    customer : Principal;
    items : [CartItem];
    total : Nat;
    status : NewOrderStatus;
    shippingAddress : Text;
    timestamp : Int;
    paymentUrl : ?Text;
    paymentStatus : PaymentStatus;
    paymentSessionId : ?Text;
    createdAt : Int;
    updatedAt : Int;
    statusHistory : [NewOrderStatus];
    paymentHistory : [PaymentStatus];
  };

  // Old actor state
  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    vendorProfiles : Map.Map<Text, VendorProfile>;
    products : Map.Map<Text, Product>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Text, OldOrder>;
  };

  // New actor state
  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    vendorProfiles : Map.Map<Text, VendorProfile>;
    products : Map.Map<Text, Product>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Text, NewOrder>;
  };

  public func run(old : OldActor) : NewActor {
    let newOrders = old.orders.map<Text, OldOrder, NewOrder>(
      func(_id, oldOrder) {
        {
          oldOrder with
          status = #pending;
          paymentStatus = #pending;
          paymentSessionId = null;
          createdAt = oldOrder.timestamp;
          updatedAt = oldOrder.timestamp;
          statusHistory = [#pending];
          paymentHistory = [#pending];
        };
      }
    );
    { old with orders = newOrders };
  };
};
