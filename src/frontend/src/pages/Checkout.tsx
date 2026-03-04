import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Truck, Wallet } from "lucide-react";
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Product as BackendProduct, ShoppingItem } from "../backend";
import type { ProductStatus, ProductType } from "../backend";
import PaymentGatewaySelector from "../components/PaymentGatewaySelector";
import OrderReview from "../components/checkout/OrderReview";
import ShippingAddressForm from "../components/checkout/ShippingAddressForm";
import type { ShippingAddress } from "../components/checkout/ShippingAddressForm";
import ShippingRateSelector from "../components/checkout/ShippingRateSelector";
import { useWallet } from "../context/WalletContext";
import {
  useCreateCheckoutSession,
  useGetCart,
  useGetProduct,
} from "../hooks/useQueries";
import type { CartItem, Product } from "../types";
import { convertFromUSD, formatCurrency } from "../utils/currency";
import { type ShippingRate, formatShippingPrice } from "../utils/shipping";

function backendToLocalProduct(p: BackendProduct): Product {
  const productType: ProductType =
    typeof p.productType === "object"
      ? (Object.keys(p.productType as object)[0] as unknown as ProductType)
      : p.productType;
  const status: ProductStatus =
    typeof p.status === "object"
      ? (Object.keys(p.status as object)[0] as unknown as ProductStatus)
      : p.status;
  return {
    id: p.id,
    vendorId: p.vendorId,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    productType,
    stock: Number(p.stock),
    image: p.image ?? null,
    status,
    variants: (p.variants ?? []).map((v) => ({
      name: v.name,
      value: v.value,
      priceAdjustment: Number(v.priceAdjustment),
      stockAdjustment: Number(v.stockAdjustment),
    })),
  };
}

function addressToString(address: ShippingAddress): string {
  const parts = [
    address.street,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country,
  ].filter(Boolean);
  return parts.join("\n");
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function ProductFetcher({
  storeId,
  productId,
  onResolved,
}: {
  storeId: string;
  productId: string;
  onResolved: (productId: string, product: Product | null) => void;
}) {
  const { data, isFetched } = useGetProduct(storeId, productId);

  React.useEffect(() => {
    if (isFetched) {
      onResolved(productId, data ? backendToLocalProduct(data) : null);
    }
  }, [isFetched, data, productId, onResolved]);

  return null;
}

// ── Currency Display ──────────────────────────────────────────────────────────

interface CurrencyDisplayProps {
  orderTotalCents: number;
}

function CurrencyDisplay({ orderTotalCents }: CurrencyDisplayProps) {
  const { currency } = useWallet();

  if (currency === "USD") return null; // Already shown in USD — no conversion needed

  const amountUSD = orderTotalCents / 100;
  const converted = convertFromUSD(amountUSD, currency);
  const formatted = formatCurrency(converted, currency);

  return (
    <div
      data-ocid="checkout.currency_display"
      className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-lg px-3 py-2.5"
    >
      <span className="font-sans text-xs text-muted-foreground">
        Approx. in {currency}
      </span>
      <span className="font-sans text-sm font-semibold text-primary tabular-nums">
        {formatted}
      </span>
    </div>
  );
}

// ── Pay with Wallet section ───────────────────────────────────────────────────

interface WalletPaySectionProps {
  orderTotal: number;
  onPayWithWallet: () => void;
  isPaying: boolean;
}

function WalletPaySection({
  orderTotal,
  onPayWithWallet,
  isPaying,
}: WalletPaySectionProps) {
  const { balance, currencySymbol, currency } = useWallet();
  const hasSufficientBalance = balance >= orderTotal;

  return (
    <div className="space-y-3">
      <Separator />
      <div className="space-y-2">
        <h3 className="font-serif text-base text-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gold" />
          Pay with Wallet
        </h3>
        <div
          className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5"
          data-ocid="checkout.wallet_balance_display"
        >
          <span className="font-sans text-sm text-muted-foreground">
            Wallet balance
          </span>
          <span
            className={`font-sans text-sm font-semibold tabular-nums ${hasSufficientBalance ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
          >
            {currencySymbol}
            {(balance / 100).toFixed(2)} {currency}
          </span>
        </div>

        {hasSufficientBalance ? (
          <Button
            onClick={onPayWithWallet}
            disabled={isPaying}
            className="w-full font-sans bg-green-600 hover:bg-green-700 text-white"
            data-ocid="checkout.pay_with_wallet_button"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Pay with Wallet ({formatPrice(orderTotal)})
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
                    className="w-full font-sans"
                    data-ocid="checkout.pay_with_wallet_button"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Pay with Wallet
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Insufficient balance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="font-sans text-xs text-muted-foreground text-center">
              Need <strong>{formatPrice(orderTotal - balance)}</strong> more.{" "}
              <Link
                to="/wallet"
                className="text-primary underline hover:no-underline"
                data-ocid="checkout.topup_wallet_link"
              >
                Top Up Wallet
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── External gateway button ──────────────────────────────────────────────────

const GATEWAY_LABELS: Record<string, string> = {
  paypal: "PayPal",
  square: "Square",
  wise: "Wise",
  payoneer: "Payoneer",
};

interface ExternalGatewayButtonProps {
  gateway: string;
  orderTotal: number;
  disabled?: boolean;
}

function ExternalGatewayButton({
  gateway,
  orderTotal,
  disabled,
}: ExternalGatewayButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const label = GATEWAY_LABELS[gateway] ?? gateway;

  const handleProceed = () => {
    setIsRedirecting(true);
    toast.info(
      `Redirecting to ${label}… (Demo mode — live integration pending)`,
    );
    setTimeout(() => {
      setIsRedirecting(false);
      navigate({ to: "/payment-cancel" });
    }, 2000);
  };

  return (
    <Button
      onClick={handleProceed}
      disabled={disabled || isRedirecting}
      className="w-full font-sans"
      data-ocid="checkout.proceed_external_gateway_button"
    >
      {isRedirecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirecting to {label}…
        </>
      ) : (
        <>
          <ArrowRight className="w-4 h-4 mr-2" />
          Proceed to {label} ({formatPrice(orderTotal)})
        </>
      )}
    </Button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Checkout() {
  const navigate = useNavigate();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const createCheckoutSession = useCreateCheckoutSession();
  const { debit } = useWallet();

  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress | null>(null);
  const [step, setStep] = useState<"shipping" | "rates" | "review">("shipping");
  const [resolvedProducts, setResolvedProducts] = useState<
    Map<string, Product>
  >(new Map());
  const [isWalletPaying, setIsWalletPaying] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("stripe");
  const [selectedShippingRate, setSelectedShippingRate] =
    useState<ShippingRate | null>(null);

  const items: CartItem[] = cartItems ?? [];

  const uniqueProductIds = React.useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    });
  }, [items]);

  const handleProductResolved = useCallback(
    (productId: string, product: Product | null) => {
      if (product) {
        setResolvedProducts((prev) => {
          const next = new Map(prev);
          next.set(productId, product);
          return next;
        });
      }
    },
    [],
  );

  const products = Array.from(resolvedProducts.values());

  const productsResolved =
    uniqueProductIds.length > 0 &&
    uniqueProductIds.every((item) => resolvedProducts.has(item.productId));

  const allDigital =
    productsResolved &&
    items.every((item) => {
      const product = resolvedProducts.get(item.productId);
      if (!product) return false;
      const pt =
        typeof product.productType === "object"
          ? Object.keys(product.productType as object)[0]
          : String(product.productType);
      return pt === "digital" || pt === "service";
    });

  const skipShipping = productsResolved && allDigital;

  // Calculate order subtotal in cents (products only)
  const orderSubtotal = React.useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      if (!product) return sum;
      const variant =
        item.variantIndex !== undefined
          ? product.variants?.[item.variantIndex]
          : null;
      const effectivePrice = variant
        ? product.price + variant.priceAdjustment
        : product.price;
      return sum + effectivePrice * item.quantity;
    }, 0);
  }, [items, products]);

  // Shipping cost in cents (convert paise to USD cents approx for simplicity)
  // 1 INR ≈ 0.012 USD → 1 paise ≈ 0.00012 USD → multiply by 0.012 to get USD cents
  const shippingCostCents = React.useMemo(() => {
    if (!selectedShippingRate || skipShipping) return 0;
    // Convert INR paise to USD cents at approximate rate (for display in USD cart)
    return Math.round(selectedShippingRate.priceInCents * 0.012);
  }, [selectedShippingRate, skipShipping]);

  const orderTotal = orderSubtotal + shippingCostCents;

  const handleShippingSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
    // For physical products → show rate selector; for digital → skip to review
    if (skipShipping) {
      setStep("review");
    } else {
      setStep("rates");
    }
  };

  const handleRateSelected = () => {
    setStep("review");
  };

  const handlePay = async () => {
    const productMap = new Map(products.map((p) => [p.id, p]));

    const shoppingItems: ShoppingItem[] = items.map((item) => {
      const product = productMap.get(item.productId);
      const variant =
        product && item.variantIndex !== undefined
          ? product.variants?.[item.variantIndex]
          : null;
      const effectivePrice = product
        ? variant
          ? product.price + variant.priceAdjustment
          : product.price
        : 0;

      return {
        productName: product?.title ?? item.productId,
        currency: "usd",
        quantity: BigInt(item.quantity),
        priceInCents: BigInt(effectivePrice),
        productDescription: product?.description ?? "",
      };
    });

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const successUrl = `${baseUrl}/payment-success`;
    const cancelUrl = `${baseUrl}/payment-failure`;

    const session = await createCheckoutSession.mutateAsync({
      items: shoppingItems,
      successUrl,
      cancelUrl,
    });

    if (!session?.url) throw new Error("Stripe session missing url");
    window.location.href = session.url;
  };

  const handlePayWithWallet = async () => {
    setIsWalletPaying(true);
    try {
      const orderId = `wallet-${Date.now()}`;
      const success = debit(
        orderTotal,
        `Order payment — ${items.length} item${items.length !== 1 ? "s" : ""}`,
        orderId,
      );
      if (success) {
        toast.success("Payment successful! Your order has been placed.");
        await navigate({
          to: "/order-confirmation/$orderId",
          params: { orderId },
        });
      } else {
        toast.error("Insufficient wallet balance. Please top up your wallet.");
      }
    } finally {
      setIsWalletPaying(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/products" })}
          className="text-primary underline text-sm"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const isExternalGateway = selectedGateway !== "stripe";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {uniqueProductIds.map((item) => {
        const parts = item.productId.split("::");
        const storeId = parts.length >= 2 ? parts[0] : item.productId;
        const productId =
          parts.length >= 2 ? parts.slice(1).join("::") : item.productId;
        return (
          <ProductFetcher
            key={item.productId}
            storeId={storeId}
            productId={productId}
            onResolved={handleProductResolved}
          />
        );
      })}

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {step === "shipping" ? (
        <ShippingAddressForm
          onSubmit={handleShippingSubmit}
          skipShipping={skipShipping}
        />
      ) : step === "rates" ? (
        /* ── Shipping Rate Selection Step ──────────────────────────────────── */
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <ShippingRateSelector
              destinationPin={shippingAddress?.zip ?? ""}
              onSelect={setSelectedShippingRate}
              selectedRate={selectedShippingRate}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("shipping")}
              className="font-sans"
              data-ocid="checkout.back_to_address_button"
            >
              ← Back
            </Button>
            <Button
              onClick={handleRateSelected}
              disabled={!selectedShippingRate}
              className="flex-1 font-sans bg-gold text-background hover:bg-gold/90"
              data-ocid="checkout.continue_to_review_button"
            >
              Continue to Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        /* ── Review & Payment Step ─────────────────────────────────────────── */
        <div className="space-y-5">
          {/* Order review (items + shipping) */}
          <OrderReview
            items={items}
            products={products}
            shippingAddress={
              shippingAddress ? addressToString(shippingAddress) : ""
            }
            skipShipping={skipShipping}
            onPay={handlePay}
            isPaying={createCheckoutSession.isPending}
            hidePayButton
          />

          {/* Shipping rate line item */}
          {selectedShippingRate && !skipShipping && (
            <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold shrink-0" />
                <div>
                  <p className="font-sans text-sm text-foreground font-medium">
                    {selectedShippingRate.serviceName}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Est. {selectedShippingRate.estimatedDays}{" "}
                    {selectedShippingRate.estimatedDays === 1
                      ? "business day"
                      : "business days"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-sans text-sm font-semibold text-foreground">
                  {formatShippingPrice(selectedShippingRate.priceInCents)}
                </p>
                <p className="font-sans text-xs text-muted-foreground">
                  ≈ {formatPrice(shippingCostCents)}
                </p>
              </div>
            </div>
          )}

          {/* Currency conversion display */}
          {productsResolved && orderTotal > 0 && (
            <CurrencyDisplay orderTotalCents={orderTotal} />
          )}

          {/* Payment gateway selector */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <PaymentGatewaySelector
              selectedGateway={selectedGateway}
              onSelect={setSelectedGateway}
              disabled={createCheckoutSession.isPending || isWalletPaying}
            />

            <Separator />

            {/* Stripe pay button or external gateway redirect */}
            {isExternalGateway ? (
              <ExternalGatewayButton
                gateway={selectedGateway}
                orderTotal={orderTotal}
                disabled={isWalletPaying}
              />
            ) : (
              <Button
                onClick={handlePay}
                disabled={createCheckoutSession.isPending || isWalletPaying}
                className="w-full font-sans bg-gold text-background hover:bg-gold/90"
                data-ocid="checkout.stripe_pay_button"
              >
                {createCheckoutSession.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting to Payment…
                  </>
                ) : (
                  <>💳 Pay with Stripe ({formatPrice(orderTotal)})</>
                )}
              </Button>
            )}
          </div>

          {/* Pay with Wallet */}
          {productsResolved && (
            <WalletPaySection
              orderTotal={orderTotal}
              onPayWithWallet={handlePayWithWallet}
              isPaying={isWalletPaying}
            />
          )}
        </div>
      )}
    </div>
  );
}
