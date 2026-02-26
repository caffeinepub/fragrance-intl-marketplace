# Specification

## Summary
**Goal:** Add access control so only store owners and admins can manage products in their stores, with graceful error handling on the frontend.

**Planned changes:**
- Add backend authorization checks on product create, update, and delete operations, allowing only the store owner or an admin to perform these actions; return an authorization error for all other principals
- Keep product listing/query operations unrestricted
- On the frontend, catch authorization errors from product mutation operations and display a user-friendly toast notification instead of crashing or showing a raw error
- Ensure the StoreProductManager component remains functional after an authorization error

**User-visible outcome:** Unauthorized users who attempt to create, update, or delete products in a store they don't own will see a clear permission-denied toast message instead of an error crash, while store owners and admins can manage products as before.
