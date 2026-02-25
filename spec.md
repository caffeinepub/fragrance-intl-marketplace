# Specification

## Summary
**Goal:** Implement end-to-end transaction processing and full order lifecycle management for the Fragrance.Intl Marketplace.

**Planned changes:**
- Extend the backend order data model to support full status lifecycle: pending → processing → shipped → delivered → cancelled, with status changes persisted in stable storage
- Add a backend endpoint to update order status, restricted by role (admins can update any order; users can only cancel their own)
- Implement payment confirmation logic: when a Stripe session is confirmed, atomically transition the linked order from pending to processing, store the payment session ID, and prevent double-confirmation
- Add a migration module (migration.mo) to upgrade existing order records to the new schema, defaulting previously confirmed orders to processing and unconfirmed ones to pending
- Add a `useUpdateOrderStatus` mutation hook and wire it into the Admin Dashboard with an order management section showing all orders and controls to advance or cancel each order's status
- Update the PaymentSuccess page to call the payment confirmation endpoint on mount, show a loading state, display a confirmation summary on success, and handle errors gracefully before redirecting to the OrderConfirmation page
- Enhance the MyOrders page to show a status badge per order and visually distinguish cancelled orders
- Enhance the OrderConfirmation page to render a visual status timeline (pending → processing → shipped → delivered) highlighting the current stage
- Add polling via React Query's `refetchInterval` (every 30 seconds) for orders in active states

**User-visible outcome:** Customers see live order status updates with a visual timeline after checkout, admins can manually manage order statuses from the dashboard, and payment confirmation is handled automatically when Stripe redirects back to the app.
