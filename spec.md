# Fragrance.Intl Marketplace Platform

## Current State
The backend (main.mo) has 766 lines covering: user profiles, store management, product/variant CRUD, Stripe checkout, order management, payouts, reviews/ratings, and access control. Wholesale features exist only as frontend mock data — no backend types, storage, or functions exist yet for wholesale accounts, tiers, or approvals.

## Requested Changes (Diff)

### Add
- `WholesaleTier` type: `{ minQty: Nat; pricePerUnit: Nat; label: Text }`
- `WholesaleAccount` type: `{ id: Text; applicant: Principal; businessName: Text; taxId: Text; status: { #pending; #approved; #rejected }; createdAt: Int; reviewedBy: ?Principal; reviewedAt: ?Int }`
- `wholesaleTiers` stable map: `productId -> [WholesaleTier]`
- `wholesaleAccounts` stable map: `Principal -> WholesaleAccount`
- `setWholesaleTiers(storeId, productId, tiers)` — store owner or admin sets tiered pricing for a product
- `getWholesaleTiers(productId)` — public query returning tiers array
- `registerWholesaleAccount(businessName, taxId)` — authenticated user applies for wholesale access
- `getMyWholesaleAccount()` — caller views their own account
- `listWholesaleApplications()` — admin/moderator lists all applications
- `approveWholesaleAccount(applicant)` — admin approves an account
- `rejectWholesaleAccount(applicant)` — admin rejects an account
- `getWholesalePrice(productId, quantity)` — query returning the best applicable tier price for a given quantity (or base price if no tier matches)

### Modify
- None to existing types or functions

### Remove
- Nothing removed

## Implementation Plan
1. Add `WholesaleTier` and `WholesaleAccount` type definitions to main.mo
2. Add `wholesaleTiers` and `wholesaleAccounts` Map declarations
3. Implement `setWholesaleTiers` and `getWholesaleTiers`
4. Implement `registerWholesaleAccount`, `getMyWholesaleAccount`, and `getWholesalePrice`
5. Implement `listWholesaleApplications`, `approveWholesaleAccount`, `rejectWholesaleAccount`
