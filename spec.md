# Specification

## Summary
**Goal:** Dynamically update the displayed price and stock availability on the ProductDetail page and ProductCard component when a variant is selected, using already-loaded data without additional backend calls.

**Planned changes:**
- On the ProductDetail page, update the displayed price and stock status immediately when the user selects a variant, using data already present in the product query.
- Disable the Add to Cart button and show an out-of-stock message when the selected variant has zero stock.
- Ensure the initial render shows the price and stock of the first/default variant.
- On the ProductCard component, update the displayed price and stock badge when a variant is selected, with changes local to that card only.

**User-visible outcome:** Users see the correct price and stock status update instantly when switching between variants on both the product detail page and product cards, with no page reload required.
