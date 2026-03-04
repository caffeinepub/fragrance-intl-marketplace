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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Package2,
  PlusCircle,
  Save,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type { StoreResponse, WholesaleTier } from "../backend";
import AccessDenied from "../components/common/AccessDenied";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetWholesaleTiers,
  useIsCallerApproved,
  useListStoreProducts,
  useMyStores,
  useSetWholesaleTiers,
} from "../hooks/useQueries";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface TierRow extends WholesaleTier {
  _localId: string;
}

function TierTableContent({
  storeId,
  productId,
}: {
  storeId: string;
  productId: string;
}) {
  const [localTiers, setLocalTiers] = useState<TierRow[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Form fields for adding a new tier
  const [newMinQty, setNewMinQty] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Real backend queries
  const { data: backendTiers = [], isLoading } =
    useGetWholesaleTiers(productId);
  const setTiersMutation = useSetWholesaleTiers();

  // Sync backend tiers into local state once loaded
  useEffect(() => {
    if (!isLoading && !initialized) {
      setLocalTiers(
        backendTiers.map((t, i) => ({
          ...t,
          _localId: `tier-${i}-${Date.now()}`,
        })),
      );
      setInitialized(true);
    }
  }, [backendTiers, isLoading, initialized]);

  // Reset when product changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resets on product change
  useEffect(() => {
    setInitialized(false);
    setLocalTiers([]);
  }, [productId]);

  const handleAddTier = () => {
    const minQty = Number.parseInt(newMinQty, 10);
    const priceCents = Math.round(Number.parseFloat(newPrice) * 100);

    if (!newMinQty || Number.isNaN(minQty) || minQty < 1) {
      toast.error("Minimum quantity must be at least 1.");
      return;
    }
    if (!newPrice || Number.isNaN(priceCents) || priceCents < 1) {
      toast.error("Price per unit must be a positive number.");
      return;
    }
    const duplicate = localTiers.find((t) => Number(t.minQty) === minQty);
    if (duplicate) {
      toast.error(`A tier for ${minQty}+ units already exists.`);
      return;
    }

    const newTier: TierRow = {
      minQty: BigInt(minQty),
      pricePerUnit: BigInt(priceCents),
      tierLabel: newLabel.trim() || "",
      _localId: `tier-new-${Date.now()}`,
    };
    setLocalTiers((prev) =>
      [...prev, newTier].sort((a, b) => Number(a.minQty) - Number(b.minQty)),
    );
    setNewMinQty("");
    setNewPrice("");
    setNewLabel("");
  };

  const handleDeleteTier = (localId: string) => {
    setLocalTiers((prev) => prev.filter((t) => t._localId !== localId));
  };

  const handleSave = async () => {
    try {
      await setTiersMutation.mutateAsync({
        storeId,
        productId,
        tiers: localTiers.map((t) => ({
          tierLabel: t.tierLabel,
          minQty: t.minQty,
          pricePerUnit: t.pricePerUnit,
        })),
      });
      toast.success("Wholesale tiers saved successfully.");
    } catch (err) {
      console.error("Save tiers error:", err);
      toast.error("Failed to save tiers. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div
        data-ocid="vendor.wholesale.loading_state"
        className="flex justify-center py-8"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Table */}
      <div>
        <h3 className="font-serif text-lg text-foreground mb-3">
          Current Tiers
        </h3>
        {localTiers.length === 0 ? (
          <div
            data-ocid="vendor.wholesale.empty_state"
            className="text-center py-10 border border-dashed border-border rounded-lg"
          >
            <Tag className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
            <p className="font-sans text-sm text-muted-foreground">
              No wholesale tiers set for this product yet.
            </p>
          </div>
        ) : (
          <div
            data-ocid="vendor.wholesale.table"
            className="rounded-lg border border-border overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-sans text-xs uppercase tracking-wider">
                    Min Quantity
                  </TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">
                    Price Per Unit
                  </TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider">
                    Label
                  </TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTiers.map((tier, idx) => (
                  <TableRow
                    key={tier._localId}
                    data-ocid={`vendor.wholesale.row.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {Number(tier.minQty)}+
                    </TableCell>
                    <TableCell className="text-gold font-bold">
                      {formatPrice(Number(tier.pricePerUnit))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tier.tierLabel || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`vendor.wholesale.delete_button.${idx + 1}`}
                        onClick={() => handleDeleteTier(tier._localId)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Delete tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Tier Form */}
      <div className="bg-muted/30 rounded-lg p-5 border border-border/60">
        <h3 className="font-serif text-base text-foreground mb-4 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-gold" />
          Add New Tier
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label htmlFor="min-qty" className="font-sans text-sm">
              Min Quantity
            </Label>
            <Input
              id="min-qty"
              data-ocid="vendor.wholesale.input"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 10"
              value={newMinQty}
              onChange={(e) => setNewMinQty(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price-unit" className="font-sans text-sm">
              Price Per Unit ($)
            </Label>
            <Input
              id="price-unit"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="e.g. 12.50"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tier-label" className="font-sans text-sm">
              Label{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="tier-label"
              placeholder="e.g. Distributor Rate"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
        </div>
        <Button
          data-ocid="vendor.wholesale.primary_button"
          variant="outline"
          onClick={handleAddTier}
          className="gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Add Tier
        </Button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        {setTiersMutation.isError && (
          <p
            data-ocid="vendor.wholesale.error_state"
            className="text-sm text-destructive mr-auto self-center"
          >
            Failed to save. Please try again.
          </p>
        )}
        {setTiersMutation.isSuccess && (
          <p
            data-ocid="vendor.wholesale.success_state"
            className="text-sm text-green-600 mr-auto self-center"
          >
            Tiers saved successfully.
          </p>
        )}
        <Button
          data-ocid="vendor.wholesale.save_button"
          onClick={handleSave}
          disabled={setTiersMutation.isPending}
          className="gap-2 min-w-36"
        >
          {setTiersMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Tiers
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function VendorWholesalePricingContent() {
  const { identity } = useInternetIdentity();
  const principalObj = identity?.getPrincipal();

  const { data: stores = [], isLoading: storesLoading } =
    useMyStores(principalObj);

  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const { data: products = [], isLoading: productsLoading } =
    useListStoreProducts(selectedStoreId || undefined);

  useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Reset product selection when store changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resets on store change
  useEffect(() => {
    setSelectedProductId("");
  }, [selectedStoreId]);

  const selectedStore = stores.find(
    (s: StoreResponse) => s.id === selectedStoreId,
  );
  const selectedProduct = products.find(
    (p: { id: string }) => p.id === selectedProductId,
  );

  return (
    <div className="space-y-8">
      {/* Store + Product Selectors */}
      <Card className="border border-border luxury-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Store className="w-5 h-5 text-gold" />
            Select Store & Product
          </CardTitle>
          <CardDescription className="font-sans text-sm">
            Choose which store and product you want to configure wholesale tiers
            for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm font-medium">Store</Label>
              {storesLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : stores.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No stores found. Create a store first.
                </p>
              ) : (
                <Select
                  value={selectedStoreId}
                  onValueChange={(v) => setSelectedStoreId(v)}
                >
                  <SelectTrigger data-ocid="vendor.wholesale.select">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store: StoreResponse) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-sm font-medium">Product</Label>
              {!selectedStoreId ? (
                <p className="text-sm text-muted-foreground pt-2">
                  Select a store first.
                </p>
              ) : productsLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground pt-2">
                  No products in this store yet.
                </p>
              ) : (
                <Select
                  value={selectedProductId}
                  onValueChange={(v) => setSelectedProductId(v)}
                >
                  <SelectTrigger data-ocid="vendor.wholesale.product_select">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: { id: string; title: string }) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {selectedStore && selectedProduct && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Badge
                variant="outline"
                className="text-xs border-gold/40 text-gold"
              >
                {selectedStore.name}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline" className="text-xs">
                {selectedProduct.title}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Management */}
      {selectedStoreId && selectedProductId ? (
        <Card className="border border-border luxury-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Tag className="w-5 h-5 text-gold" />
              Wholesale Tiers
            </CardTitle>
            <CardDescription className="font-sans text-sm">
              Set quantity-based pricing tiers. Buyers who purchase at or above
              a minimum quantity will see the corresponding price per unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TierTableContent
              storeId={selectedStoreId}
              productId={selectedProductId}
            />
          </CardContent>
        </Card>
      ) : (
        <div
          data-ocid="vendor.wholesale.empty_state"
          className="text-center py-14 border border-dashed border-border rounded-xl"
        >
          <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-sans text-sm text-muted-foreground">
            Select a store and product above to manage wholesale tiers.
          </p>
        </div>
      )}
    </div>
  );
}

export default function VendorWholesalePricing() {
  const { identity } = useInternetIdentity();
  const { data: isApproved, isLoading } = useIsCallerApproved();

  if (!identity) {
    return (
      <AccessDenied message="Please sign in to access wholesale pricing management." />
    );
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-2">
          Vendor
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          Wholesale Pricing
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Manage bulk discount tiers for your products.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <VendorWholesalePricingContent />
      </motion.div>
    </main>
  );
}
