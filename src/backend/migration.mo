import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type ProductType = { #physical; #digital; #service };
  type ProductStatus = { #active; #inactive };

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

  type Store = {
    id : Text;
    vendorId : Principal;
    name : Text;
    description : Text;
    contactInfo : Text;
    isActive : Bool;
    createdAt : Int;
  };

  type OldActor = {
    stores : Map.Map<Text, Store>;
    storeProducts : Map.Map<Text, Map.Map<Text, Product>>;
  };

  type WholesaleTier = {
    minQty : Nat;
    pricePerUnit : Nat;
    tierLabel : Text;
  };

  type WholesaleAccountStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type WholesaleAccount = {
    id : Text;
    applicant : Principal;
    businessName : Text;
    taxId : Text;
    status : WholesaleAccountStatus;
    createdAt : Int;
    reviewedBy : ?Principal;
    reviewedAt : ?Int;
  };

  type NewActor = {
    stores : Map.Map<Text, Store>;
    storeProducts : Map.Map<Text, Map.Map<Text, Product>>;
    wholesaleTiers : Map.Map<Text, List.List<WholesaleTier>>;
    wholesaleAccounts : Map.Map<Principal, WholesaleAccount>;
  };

  public func run(old : OldActor) : NewActor {
    { old with
      wholesaleTiers = Map.empty<Text, List.List<WholesaleTier>>();
      wholesaleAccounts = Map.empty<Principal, WholesaleAccount>();
    };
  };
};
