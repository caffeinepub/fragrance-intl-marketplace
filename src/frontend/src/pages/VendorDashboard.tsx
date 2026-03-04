import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Download,
  Layers,
  Package,
  Radio,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Wallet as WalletIcon,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import AccessDenied from "../components/common/AccessDenied";
import StoreListManager from "../components/vendor/StoreListManager";
import StoreProductManager from "../components/vendor/StoreProductManager";
import StoreSelector from "../components/vendor/StoreSelector";
import VendorAuctionsPanel from "../components/vendor/VendorAuctionsPanel";
import VendorDigitalManager from "../components/vendor/VendorDigitalManager";
import VendorOrderHistory from "../components/vendor/VendorOrderHistory";
import VendorPayoutsPanel from "../components/vendor/VendorPayoutsPanel";
import VendorStreamManager from "../components/vendor/VendorStreamManager";
import { useWallet } from "../context/WalletContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetStoresByVendor,
  useIsCallerApproved,
} from "../hooks/useQueries";
import {
  type Shipment,
  type ShipmentStatus,
  advanceShipmentStatus,
  getAllShipments,
} from "../utils/shipping";

// ─── Vendor Wallet Tab ────────────────────────────────────────────────────────

function formatAmount(cents: number, currency: string): string {
  if (currency === "ICP") {
    const val = cents / 100;
    return `${val % 1 === 0 ? val.toFixed(2) : val.toFixed(4)} ICP`;
  }
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    INR: "₹",
    SGD: "S$",
    AUD: "A$",
    CAD: "C$",
  };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function VendorWalletTab() {
  const { balance, currency, currencySymbol, transactions } = useWallet();
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  const payoutTransactions = transactions.filter(
    (tx) => tx.txType === "payout",
  );

  const handleConfirmPayout = () => {
    setPayoutDialogOpen(false);
    toast.success(
      "Payout request submitted — processing within 3 business days",
    );
  };

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <CardDescription className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
            Available Balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <span className="font-serif text-4xl font-bold text-gold leading-none tabular-nums">
              {currencySymbol}
              {(balance / 100).toFixed(2)}
            </span>
            <span className="font-sans text-sm text-muted-foreground pb-1">
              {currency}
            </span>
          </div>
          <Button
            onClick={() => setPayoutDialogOpen(true)}
            className="font-sans"
            data-ocid="vendor_dashboard.request_payout_button"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
        </CardContent>
      </Card>

      {/* Payout history */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Payout History
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            All completed payouts to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutTransactions.length === 0 ? (
            <div
              className="py-10 text-center border border-dashed border-border rounded-lg"
              data-ocid="vendor_dashboard.payout_history_table"
            >
              <WalletIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-sans text-sm text-muted-foreground">
                No payouts yet. Request a payout when your balance is ready.
              </p>
            </div>
          ) : (
            <div
              className="rounded-md border border-border/60 overflow-hidden"
              data-ocid="vendor_dashboard.payout_history_table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Description
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground text-right">
                      Amount
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutTransactions.map((tx, i) => (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/20"
                      data-ocid={`vendor_dashboard.payout_history_table.row.${i + 1}`}
                    >
                      <TableCell className="font-sans text-sm text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-foreground">
                        {tx.description}
                      </TableCell>
                      <TableCell className="font-sans text-sm font-semibold text-blue-600 dark:text-blue-400 text-right tabular-nums">
                        +{formatAmount(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs text-green-600 border-green-500/30 bg-green-500/10"
                        >
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout request dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="vendor_dashboard.payout_confirm_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-serif">Request Payout</DialogTitle>
            <DialogDescription className="font-sans text-sm">
              Payout requests will be processed within 3 business days. Funds
              will be transferred to your registered bank account.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-4 text-center space-y-1">
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-widest">
              Available to withdraw
            </p>
            <p className="font-serif text-3xl text-gold font-bold">
              {currencySymbol}
              {(balance / 100).toFixed(2)} {currency}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
              className="font-sans"
              data-ocid="vendor_dashboard.payout_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayout}
              className="font-sans bg-primary hover:bg-primary/90"
              data-ocid="vendor_dashboard.payout_confirm_button"
            >
              Confirm Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Vendor Shipments Tab ─────────────────────────────────────────────────────

const SHIPMENT_STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; className: string }
> = {
  created: {
    label: "Created",
    className: "text-muted-foreground border-border",
  },
  in_transit: {
    label: "In Transit",
    className:
      "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className:
      "text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10",
  },
  delivered: {
    label: "Delivered",
    className:
      "text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10",
  },
  exception: {
    label: "Exception",
    className: "text-destructive border-destructive/30 bg-destructive/10",
  },
};

function VendorShipmentsTab() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    setShipments(getAllShipments());
  }, []);

  const handleAdvanceStatus = (shipmentId: string) => {
    const updated = advanceShipmentStatus(shipmentId);
    if (updated) {
      setShipments((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      toast.success(`Status updated to "${updated.status.replace(/_/g, " ")}"`);
    }
  };

  function formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-gold" />
            All Shipments
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            UPS India shipment records for all orders. Manage status and track
            deliveries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div
              className="py-14 text-center border border-dashed border-border rounded-xl"
              data-ocid="vendor_dashboard.shipments_empty_state"
            >
              <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-serif text-lg text-foreground mb-2">
                No shipments yet
              </p>
              <p className="font-sans text-sm text-muted-foreground max-w-sm mx-auto">
                When customers place orders and shipments are created, they will
                appear here.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border border-border/60 overflow-hidden"
              data-ocid="vendor_dashboard.shipments_table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Order ID
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Tracking #
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Service
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                      Est. Delivery
                    </TableHead>
                    <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment, i) => {
                    const statusCfg = SHIPMENT_STATUS_CONFIG[shipment.status];
                    const rowIdx = i + 1;
                    const isDelivered = shipment.status === "delivered";

                    return (
                      <TableRow
                        key={shipment.id}
                        className="hover:bg-muted/20"
                        data-ocid={`vendor_dashboard.shipments_table.row.${rowIdx}`}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {shipment.orderId.slice(0, 12)}…
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          {shipment.trackingNumber}
                        </TableCell>
                        <TableCell className="font-sans text-sm text-foreground">
                          {shipment.serviceName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-sans text-sm text-muted-foreground">
                          {shipment.estimatedDelivery
                            ? formatShortDate(shipment.estimatedDelivery)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="font-sans text-xs h-7 px-2"
                              onClick={() =>
                                navigate({
                                  to: "/tracking/$trackingNumber",
                                  params: {
                                    trackingNumber: shipment.trackingNumber,
                                  },
                                })
                              }
                              data-ocid={`vendor_dashboard.track_button.${rowIdx}`}
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Track
                            </Button>
                            {!isDelivered && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="font-sans text-xs h-7 px-2"
                                onClick={() => handleAdvanceStatus(shipment.id)}
                                data-ocid={`vendor_dashboard.update_status_button.${rowIdx}`}
                              >
                                Advance Status
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard Content ────────────────────────────────────────────────────

function VendorDashboardContent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const vendorPrincipal = identity?.getPrincipal();
  const { data: stores, isLoading: storesLoading } =
    useGetStoresByVendor(vendorPrincipal);

  const principalStr = identity?.getPrincipal().toString() || "";
  const storedVendorId =
    typeof window !== "undefined"
      ? localStorage.getItem(`vendorId_${principalStr}`)
      : null;

  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!selectedStoreId && stores && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const displayName = userProfile?.name || `${principalStr.slice(0, 12)}…`;

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="flex flex-wrap gap-1 h-auto p-1">
        <TabsTrigger value="overview" className="text-sm">
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="shipments"
          className="text-sm gap-1.5"
          data-ocid="vendor_dashboard.shipments_tab"
        >
          <Truck className="w-3.5 h-3.5" />
          Shipments
        </TabsTrigger>
        <TabsTrigger
          value="wallet"
          className="text-sm gap-1.5"
          data-ocid="vendor_dashboard.wallet_tab"
        >
          <WalletIcon className="w-3.5 h-3.5" />
          Wallet
        </TabsTrigger>
        <TabsTrigger
          value="digital"
          className="text-sm gap-1.5"
          data-ocid="vendor_dashboard.digital_tab"
        >
          <Download className="w-3.5 h-3.5" />
          Digital
        </TabsTrigger>
        <TabsTrigger
          value="streams"
          className="text-sm gap-1.5"
          data-ocid="vendor_dashboard.streams_tab"
        >
          <Radio className="w-3.5 h-3.5" />
          Live Streams
        </TabsTrigger>
      </TabsList>

      {/* ── Overview Tab ────────────────────────────────────────────────────── */}
      <TabsContent value="overview" className="space-y-8">
        {/* Store Selector */}
        {!storesLoading && stores && stores.length > 0 && (
          <div className="flex items-center gap-4 bg-card border border-border rounded px-4 py-3">
            <StoreSelector
              selectedStoreId={selectedStoreId}
              onSelect={setSelectedStoreId}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded p-5">
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-5 h-5 text-gold" />
              <span className="font-sans text-sm text-muted-foreground">
                Vendor Account
              </span>
            </div>
            <p className="font-serif text-xl text-foreground truncate">
              {displayName}
            </p>
          </div>
          <div className="bg-card border border-border rounded p-5">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-gold" />
              <span className="font-sans text-sm text-muted-foreground">
                Products
              </span>
            </div>
            <Button
              asChild
              variant="ghost"
              className="p-0 h-auto font-serif text-xl text-foreground hover:text-gold"
            >
              <Link to="/vendor/products">
                Manage Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="bg-card border border-border rounded p-5">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-5 h-5 text-gold" />
              <span className="font-sans text-sm text-muted-foreground">
                Wholesale
              </span>
            </div>
            <Button
              asChild
              variant="ghost"
              className="p-0 h-auto font-serif text-xl text-foreground hover:text-gold"
              data-ocid="vendor.wholesale_link"
            >
              <Link to="/vendor/wholesale">
                Wholesale Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* My Stores */}
        <div className="bg-card border border-border rounded p-6">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">My Stores</h2>
          </div>
          <p className="font-sans text-sm text-muted-foreground mb-5">
            Manage all your stores under this vendor account. You can have up to
            5 stores.
          </p>
          <StoreListManager />
        </div>

        {/* Store Products */}
        <div className="bg-card border border-border rounded p-6">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">
              Store Products
            </h2>
          </div>
          <p className="font-sans text-sm text-muted-foreground mb-5">
            Add and manage products for the selected store.
          </p>

          {storesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !selectedStoreId ? (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-sans text-sm text-muted-foreground">
                {stores && stores.length > 0
                  ? "Select a store above to manage its products."
                  : "Create a store first to start adding products."}
              </p>
            </div>
          ) : (
            <StoreProductManager
              storeId={selectedStoreId}
              vendorId={principalStr}
            />
          )}
        </div>

        {/* Auctions */}
        {storedVendorId && (
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-serif text-xl text-foreground mb-5">
              My Auctions
            </h2>
            <p className="font-sans text-sm text-muted-foreground mb-5">
              Create and manage auctions for your products with live countdown
              timers.
            </p>
            <VendorAuctionsPanel vendorId={storedVendorId} />
          </div>
        )}

        {/* Payouts */}
        {storedVendorId && (
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-serif text-xl text-foreground mb-5">
              My Payouts
            </h2>
            <VendorPayoutsPanel vendorId={storedVendorId} />
          </div>
        )}

        {/* Order History */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="font-serif text-xl text-foreground mb-5">
            Order History
          </h2>
          <p className="font-sans text-sm text-muted-foreground mb-5">
            All orders containing your products, with commission and net payout
            details.
          </p>
          <VendorOrderHistory />
        </div>
      </TabsContent>

      {/* ── Shipments Tab ────────────────────────────────────────────────────── */}
      <TabsContent value="shipments">
        <VendorShipmentsTab />
      </TabsContent>

      {/* ── Wallet Tab ────────────────────────────────────────────────────────── */}
      <TabsContent value="wallet">
        <VendorWalletTab />
      </TabsContent>

      {/* ── Digital Tab ───────────────────────────────────────────────────────── */}
      <TabsContent value="digital" className="space-y-6">
        <div className="bg-card border border-border rounded p-6">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">
              Digital Products
            </h2>
          </div>
          <p className="font-sans text-sm text-muted-foreground mb-5">
            Configure download delivery settings for your digital products.
            Customers receive secure download links valid for 30 days.
          </p>
          <VendorDigitalManager selectedStoreId={selectedStoreId} />
        </div>
      </TabsContent>

      {/* ── Live Streams Tab ──────────────────────────────────────────────────── */}
      <TabsContent value="streams" className="space-y-6">
        <div className="bg-card border border-border rounded p-6">
          <VendorStreamManager selectedStoreId={selectedStoreId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function VendorDashboard() {
  const { identity } = useInternetIdentity();
  const { data: isApproved, isLoading } = useIsCallerApproved();

  if (!identity) {
    return (
      <AccessDenied message="Please sign in to access your vendor dashboard." />
    );
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!isApproved) {
    return (
      <AccessDenied
        message="Your vendor account is pending approval. Please wait for an admin to review your application."
        showHomeLink
      />
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">
          Vendor
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          My Store Dashboard
        </h1>
      </div>
      <VendorDashboardContent />
    </main>
  );
}
