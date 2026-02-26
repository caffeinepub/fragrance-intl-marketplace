# Specification

## Summary
**Goal:** Break the second pass of vendor store management into smaller incremental steps, implementing backend store CRUD support, frontend React Query hooks, and wiring up store management UI components in the VendorDashboard.

**Planned changes:**
- Add `createStore`, `updateStore`, `getStoresByVendor`, and `toggleStoreActive` methods to the Motoko backend actor, persisting store records in stable state with a 5-store limit per vendor
- Add `useCreateStore`, `useUpdateStore`, `useGetStoresByVendor`, and `useToggleStoreActive` React Query hooks in `useQueries.ts` wired to the backend methods
- Connect `StoreFormModal` to `useCreateStore` and `useUpdateStore` hooks for creating and editing stores, with success/error toasts
- Integrate `StoreListManager` into `VendorDashboard` with create, edit, and toggle-active controls using the store hooks
- Integrate `StoreSelector` into `VendorDashboard` to allow vendors to select an active store context, persisting the selected store ID in component state for use by other vendor panels

**User-visible outcome:** Vendors can create up to 5 stores, edit store details, toggle stores active/inactive, and select an active store context from their dashboard.
