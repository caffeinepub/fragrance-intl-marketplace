import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";

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

  type Store = {
    id : Text;
    vendorId : Principal;
    name : Text;
    description : Text;
    contactInfo : Text;
    isActive : Bool;
    createdAt : Time.Time;
  };

  type CartItem = {
    productId : Text;
    quantity : Nat;
  };

  type ApprovalStatus = { #approved; #rejected; #pending };

  type UserApprovalInfo = {
    principal : Principal;
    status : ApprovalStatus;
  };

  // New ProductVariant type for migration context
  type ProductVariant = {
    name : Text;
    value : Text;
    priceAdjustment : Nat;
    stockAdjustment : Nat;
  };

  type OldProduct = {
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

  type NewProduct = {
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

  // New actor state - migrate products and storeProducts
  type OldActor = {
    products : Map.Map<Text, OldProduct>;
    storeProducts : Map.Map<Text, Map.Map<Text, OldProduct>>;
  };

  type NewActor = {
    products : Map.Map<Text, NewProduct>;
    storeProducts : Map.Map<Text, Map.Map<Text, NewProduct>>;
  };

  // Actual migration function
  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Text, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        { oldProduct with variants = [] };
      }
    );

    let newStoreProducts = old.storeProducts.map<Text, Map.Map<Text, OldProduct>, Map.Map<Text, NewProduct>>(
      func(_storeId, oldProductMap) {
        let newProductMap = oldProductMap.map<Text, OldProduct, NewProduct>(
          func(_id, oldProduct) {
            { oldProduct with variants = [] };
          }
        );
        newProductMap;
      }
    );

    { products = newProducts; storeProducts = newStoreProducts };
  };
};
