# Specification

## Summary
**Goal:** Add a full Auction system with bidding logic and countdown timers, and a Barter/Trade Offer system between users, to the Fragrance.Intl Marketplace.

**Planned changes:**
- Extend the backend actor with an Auction data model and functions: `createAuction`, `placeBid`, `cancelAuction`, `getAuction`, `listActiveAuctions`, `listAuctionsByVendor`, and `finalizeAuction`
- Extend the backend actor with a Trade Offer data model and functions: `createTradeOffer`, `acceptTradeOffer`, `rejectTradeOffer`, `cancelTradeOffer`, `counterTradeOffer`, `getTradeOffer`, `listTradeOffersForUser`, and `listAllTradeOffers`
- Add `/auctions` page displaying active auction cards with product image, current bid, bid count, and live client-side countdown timers
- Add `/auctions/$auctionId` detail page with full auction info, bid history, live countdown, and a bid submission form for authenticated users
- Add an "Auctions" section to the Vendor Dashboard for creating and managing their auctions
- Add an "Auction Management" panel to the Admin Dashboard for viewing, cancelling, and finalizing auctions
- Add `/trade-offers` page (authenticated only) with Incoming and Outgoing tabs, status badges, and contextual action buttons (Accept, Reject, Cancel, Counter)
- Add a "New Trade Offer" form flow allowing users to select offered products, specify requested items, optional cash adjustment, and a receiver
- Add a "Trade Offer Management" panel to the Admin Dashboard visible to admins and moderators
- Add "Auctions" link to the site header navigation and "Trade Offers" link to the user profile dropdown/header
- Add React Query hooks in `useQueries.ts` for all new auction and trade offer backend functions

**User-visible outcome:** Users can browse and participate in live timed auctions with real-time countdowns and bid history. Users can initiate, respond to, and manage barter/trade offers with other users. Vendors can create and manage their own auctions. Admins and moderators can oversee and manage all auctions and trade offers from the Admin Dashboard.
