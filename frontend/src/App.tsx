import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';

// Pages
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import MyOrders from './pages/MyOrders';
import OrderReceipt from './pages/OrderReceipt';
import VendorRegistration from './pages/VendorRegistration';
import VendorDashboard from './pages/VendorDashboard';
import VendorProducts from './pages/VendorProducts';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import TradeOffers from './pages/TradeOffers';
import NewTradeOffer from './pages/NewTradeOffer';

// Layout wrapper with Header/Footer and profile setup
function Layout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <ProfileSetupModal open={showProfileSetup} />
      <Toaster richColors position="top-right" />
    </div>
  );
}

// Route definitions
const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductListing,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: Cart,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: Checkout,
});

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order/$orderId',
  component: OrderConfirmation,
});

const orderReceiptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order/$orderId/receipt',
  component: OrderReceipt,
});

const myOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-orders',
  component: MyOrders,
});

const vendorRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vendor/register',
  component: VendorRegistration,
});

const vendorDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vendor/dashboard',
  component: VendorDashboard,
});

const vendorProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vendor/products',
  component: VendorProducts,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment/success',
  component: PaymentSuccess,
});

const paymentCancelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment/cancel',
  component: PaymentCancel,
});

const auctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions',
  component: Auctions,
});

const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/$auctionId',
  component: AuctionDetail,
});

const tradeOffersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade-offers',
  component: TradeOffers,
});

const newTradeOfferRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade-offers/new',
  component: NewTradeOffer,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  productsRoute,
  cartRoute,
  checkoutRoute,
  orderConfirmationRoute,
  orderReceiptRoute,
  myOrdersRoute,
  vendorRegisterRoute,
  vendorDashboardRoute,
  vendorProductsRoute,
  adminRoute,
  paymentSuccessRoute,
  paymentCancelRoute,
  auctionsRoute,
  auctionDetailRoute,
  tradeOffersRoute,
  newTradeOfferRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
