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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import type { WalletTransaction } from "../context/WalletContext";
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from "../utils/currency";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY_LABELS: Record<string, string> = {
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  ICP: "ICP — Internet Computer",
  AED: "AED — UAE Dirham",
  INR: "INR — Indian Rupee",
  SGD: "SGD — Singapore Dollar",
  AUD: "AUD — Australian Dollar",
  CAD: "CAD — Canadian Dollar",
};

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: CURRENCY_LABELS[code] ?? code,
  symbol: CURRENCY_SYMBOLS[code] ?? code,
}));

function formatBalance(cents: number, currency: string): string {
  if (currency === "ICP") {
    return (cents / 100).toFixed(4);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatAmount(cents: number, currency: string): string {
  if (currency === "ICP") {
    const val = cents / 100;
    return `${val % 1 === 0 ? val.toFixed(2) : val.toFixed(4)} ICP`;
  }
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

type TxConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ElementType;
  amountClass: string;
};

function getTxConfig(txType: WalletTransaction["txType"]): TxConfig {
  switch (txType) {
    case "deposit":
      return {
        label: "Deposit",
        variant: "default",
        icon: ArrowDownCircle,
        amountClass: "text-green-600 dark:text-green-400",
      };
    case "withdrawal":
      return {
        label: "Withdrawal",
        variant: "outline",
        icon: ArrowUpCircle,
        amountClass: "text-orange-600 dark:text-orange-400",
      };
    case "purchase":
      return {
        label: "Purchase",
        variant: "destructive",
        icon: ShoppingBag,
        amountClass: "text-destructive",
      };
    case "payout":
      return {
        label: "Payout",
        variant: "secondary",
        icon: TrendingUp,
        amountClass: "text-blue-600 dark:text-blue-400",
      };
  }
}

// ─── Spending Chart ────────────────────────────────────────────────────────────

function getLast7Days(): { label: string; startMs: number; endMs: number }[] {
  const days: { label: string; startMs: number; endMs: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 86400000;
    days.push({
      label: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(d),
      startMs: start,
      endMs: end,
    });
  }
  return days;
}

interface SpendingChartProps {
  transactions: WalletTransaction[];
}

function SpendingChart({ transactions }: SpendingChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const days = getLast7Days();

  const dailySpend = days.map((day) => {
    const total = transactions
      .filter(
        (tx) =>
          tx.txType === "purchase" &&
          tx.timestamp >= day.startMs &&
          tx.timestamp < day.endMs,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { ...day, total };
  });

  const maxSpend = Math.max(...dailySpend.map((d) => d.total), 1);

  const chartW = 560;
  const chartH = 120;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 8;
  const padBottom = 28;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;
  const barCount = dailySpend.length;
  const totalGap = innerW * 0.18;
  const gapW = totalGap / (barCount - 1);
  const barW = (innerW - totalGap) / barCount;

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH}`}
      className="w-full"
      style={{ height: 140 }}
      role="img"
      aria-label="Spending over last 7 days"
    >
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((frac) => {
        const y = padTop + innerH * (1 - frac);
        return (
          <line
            key={frac}
            x1={padLeft}
            y1={y}
            x2={chartW - padRight}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.5}
            opacity={0.1}
          />
        );
      })}

      {/* Bars */}
      {dailySpend.map((day, i) => {
        const barH = Math.max(
          (day.total / maxSpend) * innerH,
          day.total > 0 ? 4 : 0,
        );
        const x = padLeft + i * (barW + gapW);
        const y = padTop + innerH - barH;
        const isHovered = hoveredIndex === i;
        const labelY = chartH - 6;

        return (
          <g key={day.label}>
            {/* Invisible wider hit target */}
            <rect
              x={x - 4}
              y={padTop}
              width={barW + 8}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "default" }}
            />
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill="currentColor"
              className={isHovered ? "text-gold" : "text-primary/60"}
              style={{ transition: "all 0.15s ease" }}
            />
            {/* Hover tooltip */}
            {isHovered && day.total > 0 && (
              <g>
                <rect
                  x={Math.min(x - 4, chartW - padRight - 80)}
                  y={Math.max(y - 28, padTop)}
                  width={78}
                  height={20}
                  rx={4}
                  fill="hsl(var(--popover))"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                />
                <text
                  x={Math.min(x - 4, chartW - padRight - 80) + 39}
                  y={Math.max(y - 28, padTop) + 13}
                  textAnchor="middle"
                  fontSize={10}
                  fill="hsl(var(--popover-foreground))"
                  fontFamily="var(--font-sans, sans-serif)"
                >
                  ${(day.total / 100).toFixed(2)}
                </text>
              </g>
            )}
            {/* Day label */}
            <text
              x={x + barW / 2}
              y={labelY}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
              fontFamily="var(--font-sans, sans-serif)"
            >
              {day.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Wallet() {
  const { balance, currency, transactions, topUp, setCurrency } = useWallet();

  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpCurrency, setTopUpCurrency] = useState(currency);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingCurrency, setPendingCurrency] = useState("USD");

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalDeposited = transactions
    .filter((tx) => tx.txType === "deposit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = transactions
    .filter((tx) => tx.txType === "purchase")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPayouts = transactions
    .filter((tx) => tx.txType === "payout")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number.parseFloat(topUpAmount);
    if (!numericAmount || numericAmount <= 0) return;
    // convert to cents
    const amountInCents = Math.round(numericAmount * 100);
    setPendingAmount(amountInCents);
    setPendingCurrency(topUpCurrency);
    setConfirmOpen(true);
  };

  const handleConfirmTopUp = () => {
    topUp(pendingAmount, pendingCurrency);
    setTopUpAmount("");
    setConfirmOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <WalletIcon className="w-7 h-7 text-gold" />
        <h1 className="font-serif text-3xl text-foreground">My Wallet</h1>
      </div>

      {/* ── Balance Card ─────────────────────────────────────────────────────── */}
      <Card
        className="luxury-shadow-lg border-border/60 overflow-hidden"
        data-ocid="wallet.balance_card"
      >
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-[inherit]" />
        <CardHeader className="pb-2">
          <CardDescription className="text-muted-foreground font-sans text-xs uppercase tracking-widest">
            Available Balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <span className="font-serif text-5xl font-bold text-gold leading-none tabular-nums">
              {formatBalance(balance, currency)}
            </span>
            <span className="font-sans text-sm text-muted-foreground pb-1">
              {currency}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="currency-select"
              className="text-xs text-muted-foreground shrink-0"
            >
              Display currency:
            </Label>
            <Select value={currency} onValueChange={(val) => setCurrency(val)}>
              <SelectTrigger
                id="currency-select"
                className="w-52 h-8 text-xs"
                data-ocid="wallet.currency_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="border-border/60"
          data-ocid="wallet.stats.deposits_card"
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="w-4 h-4 text-green-500" />
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                Total Deposited
              </span>
            </div>
            <p className="font-serif text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {formatAmount(totalDeposited, currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60" data-ocid="wallet.stats.spent_card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-destructive" />
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                Total Spent
              </span>
            </div>
            <p className="font-serif text-2xl font-bold text-destructive tabular-nums">
              {formatAmount(totalSpent, currency)}
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-border/60"
          data-ocid="wallet.stats.payouts_card"
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-wide">
                Total Payouts
              </span>
            </div>
            <p className="font-serif text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatAmount(totalPayouts, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Spending Chart ────────────────────────────────────────────────────── */}
      <Card className="border-border/60" data-ocid="wallet.spending_chart">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Spending — Last 7 Days
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            Daily purchase totals over the past week
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {transactions.filter((tx) => tx.txType === "purchase").length ===
          0 ? (
            <div className="py-10 text-center">
              <p className="font-sans text-sm text-muted-foreground">
                No purchases yet — your spending chart will appear here.
              </p>
            </div>
          ) : (
            <SpendingChart transactions={transactions} />
          )}
        </CardContent>
      </Card>

      {/* ── Top-Up Form ───────────────────────────────────────────────────────── */}
      <Card className="luxury-shadow border-border/60">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold" />
            Add Funds
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            Top up your wallet to pay for orders instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTopUpSubmit} className="space-y-4">
            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="topup-amount"
                  className="font-sans text-sm text-foreground"
                >
                  Amount
                </Label>
                <Input
                  id="topup-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="font-sans"
                  required
                  data-ocid="wallet.topup_input"
                />
              </div>

              <div className="sm:w-48 space-y-1.5">
                <Label
                  htmlFor="topup-currency"
                  className="font-sans text-sm text-foreground"
                >
                  Currency
                </Label>
                <Select value={topUpCurrency} onValueChange={setTopUpCurrency}>
                  <SelectTrigger id="topup-currency" className="font-sans">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full sm:w-auto font-sans bg-primary hover:bg-primary/90"
              data-ocid="wallet.topup_submit_button"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Transaction History ───────────────────────────────────────────────── */}
      <Card className="luxury-shadow border-border/60">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-gold" />
            Transaction History
          </CardTitle>
          <CardDescription className="font-sans text-sm text-muted-foreground">
            {transactions.length > 0
              ? `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`
              : "No transactions yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div
              className="py-12 text-center space-y-2"
              data-ocid="wallet.transaction.empty_state"
            >
              <WalletIcon className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="font-sans text-sm text-muted-foreground">
                No transactions yet. Add funds to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/60">
              {transactions.map((tx, index) => {
                const config = getTxConfig(tx.txType);
                const Icon = config.icon;
                const isDebit =
                  tx.txType === "purchase" || tx.txType === "withdrawal";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-3.5"
                    data-ocid={`wallet.transaction.item.${index + 1}`}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-foreground truncate font-medium">
                        {tx.description}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        {formatDate(tx.timestamp)}
                        {tx.referenceId && (
                          <span className="ml-2 opacity-60">
                            ref: {tx.referenceId}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`font-sans text-sm font-semibold tabular-nums ${config.amountClass}`}
                      >
                        {isDebit ? "−" : "+"}
                        {formatAmount(tx.amount, tx.currency)}
                      </span>
                      <Badge
                        variant={config.variant}
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirmation Dialog ───────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Confirm Top-Up</DialogTitle>
            <DialogDescription className="font-sans text-sm">
              You're about to add{" "}
              <strong>{formatAmount(pendingAmount, pendingCurrency)}</strong> to
              your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-4 text-center space-y-1">
            <p className="font-sans text-xs text-muted-foreground uppercase tracking-widest">
              Amount to add
            </p>
            <p className="font-serif text-3xl text-gold font-bold">
              {formatAmount(pendingAmount, pendingCurrency)}
            </p>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="font-sans"
              data-ocid="wallet.topup_dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTopUp}
              className="font-sans bg-primary hover:bg-primary/90"
              data-ocid="wallet.topup_dialog.confirm_button"
            >
              Confirm & Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
