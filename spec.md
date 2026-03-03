# Fragrance.Intl Marketplace

## Current State
The marketplace has a working backend with stores, products, variants, orders, Stripe payments, vendor payouts, and access control. Products are displayed with variant selection and dynamic pricing. The frontend shows product pages correctly.

## Requested Changes (Diff)

### Add
- `Review` type: `id`, `productId`, `storeId`, `reviewer` (Principal), `rating` (1–5), `title`, `body`, `createdAt`
- `reviews` stable map: `productId -> List<Review>`
- `submitReview(productId, storeId, rating, title, body)` — authenticated users only, one review per user per product
- `getProductReviews(productId)` — public query returning `[Review]`
- `getProductRatingSummary(productId)` — public query returning `{ averageRating: Float; totalReviews: Nat; distribution: [Nat] }` (distribution = count per star 1–5)
- `deleteReview(productId, reviewId)` — admin/moderator only

### Modify
- Nothing structural changed in existing types

### Remove
- Nothing removed

## Implementation Plan
1. Add `Review` type definition to main.mo
2. Add `reviews` map (`productId -> List<Review>`)
3. Implement `submitReview` with one-review-per-user guard
4. Implement `getProductReviews` public query
5. Implement `getProductRatingSummary` public query
6. Implement `deleteReview` for admin/moderator
