import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart2,
  Building2,
  DollarSign,
  Search,
  Shield,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import ApprovalDashboard from "../components/admin/ApprovalDashboard";
import AuctionManagementPanel from "../components/admin/AuctionManagementPanel";
import OrderManagementPanel from "../components/admin/OrderManagementPanel";
import PayoutManagementPanel from "../components/admin/PayoutManagementPanel";
import TradeOfferManagementPanel from "../components/admin/TradeOfferManagementPanel";
import WholesaleManagementPanel from "../components/admin/WholesaleManagementPanel";
import { useIsCallerAdmin } from "../hooks/useQueries";
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from "../utils/currency";
import { convertFromUSD } from "../utils/currency";

// ─── Financials Tab ────────────────────────────────────────────────────────────

// Static mock platform stats
const MOCK_STATS = {
  totalTransactions: 2847,
  totalGMV: 0, // $0 in live system
  commissionEarned: 0, // $0 in live system
};

// Exchange rates relative to USD (1 USD = X units)
const EXCHANGE_RATE_DESCRIPTIONS: Record<string, string> = {
  USD: "US Dollar — Base currency",
  EUR: "Euro — European Union",
  GBP: "British Pound — United Kingdom",
  ICP: "Internet Computer Protocol — ICP Blockchain",
  AED: "UAE Dirham — United Arab Emirates",
  INR: "Indian Rupee — India",
  SGD: "Singapore Dollar — Singapore",
  AUD: "Australian Dollar — Australia",
  CAD: "Canadian Dollar — Canada",
};

function formatStatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function FinancialsTab() {
  const [lookupPrincipal, setLookupPrincipal] = useState("");
  const [lookupResult, setLookupResult] = useState<
    "idle" | "found" | "queried"
  >("idle");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPrincipal.trim()) return;
    setLookupResult("queried");
  };

  return (
    <div className="space-y-8">
      {/* ── Platform Summary Cards ──────────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-xl text-foreground mb-1">
          Platform Overview
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-5">
          Aggregate financial metrics across the entire marketplace
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="border-border/60"
            data-ocid="admin_dashboard.financials.transactions_card"
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-primary" />
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                  Total Transactions
                </span>
              </div>
              <p className="font-serif text-3xl font-bold text-foreground tabular-nums">
                {MOCK_STATS.totalTransactions.toLocaleString()}
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                All-time platform activity
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-border/60"
            data-ocid="admin_dashboard.financials.gmv_card"
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gold" />
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                  Gross Merchandise Volume
                </span>
              </div>
              <p className="font-serif text-3xl font-bold text-gold tabular-nums">
                {formatStatNumber(MOCK_STATS.totalGMV)}
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                Total value of completed orders
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-border/60"
            data-ocid="admin_dashboard.financials.commission_card"
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                  Commission Earned
                </span>
              </div>
              <p className="font-serif text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                {formatStatNumber(MOCK_STATS.commissionEarned)}
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                Platform fee revenue
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── User Wallet Lookup ──────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-gold" />
            User Wallet Lookup
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            Query on-chain wallet data for a specific user principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleLookup}
            className="flex gap-3 flex-col sm:flex-row"
          >
            <Input
              placeholder="Enter user principal (e.g. aaaaa-aa)"
              value={lookupPrincipal}
              onChange={(e) => {
                setLookupPrincipal(e.target.value);
                setLookupResult("idle");
              }}
              className="font-sans flex-1"
              data-ocid="admin_dashboard.wallet_lookup_input"
            />
            <Button
              type="submit"
              variant="outline"
              className="font-sans shrink-0"
              data-ocid="admin_dashboard.wallet_lookup_button"
            >
              <Search className="w-4 h-4 mr-2" />
              Look Up
            </Button>
          </form>

          {lookupResult === "queried" && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/60">
              <p className="font-sans text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Principal: </span>
                <span className="font-mono text-xs break-all">
                  {lookupPrincipal}
                </span>
              </p>
              <p className="font-sans text-sm text-muted-foreground mt-2 italic">
                In production, this queries on-chain wallet data for the given
                principal. Live wallet balances, transaction counts, and flags
                would appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Currency Rates Table ──────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            Supported Currencies & Exchange Rates
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            Approximate static rates relative to USD. Update via backend for
            live rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-md border border-border/60 overflow-hidden"
            data-ocid="admin_dashboard.currency_rates_table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                    Currency
                  </TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                    Symbol
                  </TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground text-right">
                    1 USD =
                  </TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SUPPORTED_CURRENCIES.map((code, i) => {
                  const rate = convertFromUSD(1, code);
                  const symbol = CURRENCY_SYMBOLS[code] ?? code;
                  const isBase = code === "USD";
                  return (
                    <TableRow
                      key={code}
                      className="hover:bg-muted/20"
                      data-ocid={`admin_dashboard.currency_rates_table.row.${i + 1}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-semibold text-foreground">
                            {code}
                          </span>
                          {isBase && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 text-gold border-gold/30"
                            >
                              Base
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">
                        {symbol}
                      </TableCell>
                      <TableCell className="font-sans text-sm font-mono text-right text-foreground tabular-nums">
                        {symbol}
                        {rate.toFixed(code === "ICP" ? 4 : 2)} {code}
                      </TableCell>
                      <TableCell className="font-sans text-xs text-muted-foreground">
                        {EXCHANGE_RATE_DESCRIPTIONS[code] ?? code}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access the admin dashboard.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Manage users, orders, and platform settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="approvals" className="text-sm">
            Approvals
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-sm">
            Orders
          </TabsTrigger>
          <TabsTrigger value="payouts" className="text-sm">
            Payouts
          </TabsTrigger>
          <TabsTrigger value="auctions" className="text-sm">
            Auctions
          </TabsTrigger>
          <TabsTrigger value="trade" className="text-sm">
            Trade Offers
          </TabsTrigger>
          <TabsTrigger
            value="wholesale"
            data-ocid="admin.wholesale_accounts_table"
            className="text-sm gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Wholesale
          </TabsTrigger>
          <TabsTrigger
            value="financials"
            className="text-sm gap-1.5"
            data-ocid="admin_dashboard.financials_tab"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Financials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <ApprovalDashboard />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagementPanel />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutManagementPanel />
        </TabsContent>

        <TabsContent value="auctions">
          <AuctionManagementPanel />
        </TabsContent>

        <TabsContent value="trade">
          <TradeOfferManagementPanel />
        </TabsContent>

        <TabsContent value="wholesale">
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-xl text-foreground">
                Wholesale Applications
              </h2>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                Review and manage wholesale account applications from businesses
                seeking bulk pricing access.
              </p>
            </div>
            <WholesaleManagementPanel />
          </div>
        </TabsContent>

        <TabsContent value="financials">
          <FinancialsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
