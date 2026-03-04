# Fragrance.Intl Marketplace — Phase 5, Part 5.1: Shipping Integration

## Current State
The marketplace has a full multi-vendor storefront with products, variants, orders, Stripe payments, auctions, barter, multi-store support, wholesale tiers, reviews, and a multi-currency wallet. There is no shipping integration — orders have a `shippingAddress` text field but no rate calculation, label generation, or tracking.

## Requested Changes (Diff)

### Add
- **Backend**: `Shipment` type with fields: id, orderId, carrier (always "UPS_India"), trackingNumber, status, labelUrl, estimatedDelivery, createdAt
- **Backend**: `ShippingRate` type with fields: serviceCode, serviceName, estimatedDays, priceInCents
- **Backend**: `getShippingRates(originPin: Text, destPin: Text, weightGrams: Nat)` — HTTP outcall to UPS India API returning array of ShippingRate; fallback to mock rates if API unreachable
- **Backend**: `createShipment(orderId: Text, serviceCode: Text, originPin: Text, destPin: Text, weightGrams: Nat)` — creates a shipment record, stores tracking info, returns Shipment
- **Backend**: `getShipment(orderId: Text)` — returns optional Shipment for given order
- **Backend**: `trackShipment(trackingNumber: Text)` — HTTP outcall to UPS India tracking API returning status string; fallback to stored status
- **Backend**: `listVendorShipments(storeId: Text)` — returns all shipments for orders containing products from a given store (admin or store owner only)
- **Frontend**: Shipping rate selector component shown at checkout after entering address — fetches rates, lets user pick service level
- **Frontend**: Order tracking page at `/tracking/$trackingNumber` showing shipment status timeline
- **Frontend**: Vendor shipment dashboard tab in VendorDashboard — list of shipments with "Create Label" action for orders that are processing
- **Frontend**: "Track Order" button on order detail cards in MyOrders linking to tracking page

### Modify
- **Backend**: `Order` type — add `shipmentId: ?Text` field (nullable, backward compatible)
- **Frontend**: Checkout page — add shipping rate selector between address and payment steps
- **Frontend**: MyOrders page — add "Track" button for shipped/delivered orders
- **Frontend**: VendorDashboard — add "Shipments" tab alongside existing tabs

### Remove
- Nothing removed

## Implementation Plan
1. Extend `Order` type in `main.mo` with `shipmentId: ?Text`
2. Add `Shipment` and `ShippingRate` types to `main.mo`
3. Implement `getShippingRates`, `createShipment`, `getShipment`, `trackShipment`, `listVendorShipments` in backend
4. Regenerate `backend.d.ts` via generate_motoko_code
5. Build frontend shipping rate selector for checkout
6. Build order tracking page at `/tracking/$trackingNumber`
7. Add Shipments tab to VendorDashboard with label creation flow
8. Add Track button to MyOrders page
