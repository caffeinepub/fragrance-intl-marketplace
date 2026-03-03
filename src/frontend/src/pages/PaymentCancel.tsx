import { Button } from "@/components/ui/button";
import { Link, useSearch } from "@tanstack/react-router";
import { ShoppingBag, ShoppingCart, XCircle } from "lucide-react";
import React from "react";

export default function PaymentCancel() {
  const search = useSearch({ strict: false }) as Record<string, string>;
  const orderId = search.orderId ?? "";

  return (
    <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
      {/* Cancel Icon */}
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-destructive" />
      </div>

      <h1 className="font-serif text-3xl text-foreground mb-3">
        Payment Cancelled
      </h1>
      <p className="font-sans text-muted-foreground mb-2">
        Your payment was cancelled and you have not been charged.
      </p>
      <p className="font-sans text-sm text-muted-foreground mb-8">
        Your order has been saved. You can return to your cart and try again
        whenever you're ready.
      </p>

      {orderId && (
        <p className="font-sans text-xs text-muted-foreground mb-6">
          Order reference:{" "}
          <span className="font-mono text-foreground">{orderId}</span>
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link to="/cart">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Return to Cart
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/products">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </main>
  );
}
