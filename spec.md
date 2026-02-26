# Specification

## Summary
**Goal:** Add product variants support to Fragrance.Intl, allowing vendors to define size, concentration, or bottle-type variants for their products, and customers to select variants when viewing or adding products to cart.

**Planned changes:**
- Extend the backend `Product` data type to store an optional list of variants, each with a name, value, optional price adjustment, and optional stock quantity
- Add backend functions `addProductVariant`, `updateProductVariant`, and `removeProductVariant`, restricted to the product owner or an admin
- Add a `ProductVariant` TypeScript type and extend the `Product` type to include an optional `variants` array
- Update the `ProductForm` in the vendor dashboard to allow adding, editing, and removing variant rows inline
- Update `ProductCard` and product detail UI to show a variant selector (dropdown or button group) that reflects adjusted price and stock when a variant is selected; add-to-cart passes the selected variant
- Add React Query mutation hooks (`useAddProductVariant`, `useUpdateProductVariant`, `useRemoveProductVariant`) with cache invalidation on success

**User-visible outcome:** Vendors can define multiple variants (e.g., 50ml, 100ml) for a product with individual price adjustments and stock levels. Shoppers can select a variant on the product card or detail page and see the correct price and availability before adding to cart.
