import React from 'react';
import { type CartItem, type Product } from '../../backend';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface CartSummaryProps {
  cartItems: CartItem[];
  products: Product[];
}

export default function CartSummary({ cartItems, products }: CartSummaryProps) {
  const subtotal = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + Number(product.price) * Number(item.quantity);
  }, 0);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="bg-card border border-border rounded p-6 space-y-4 sticky top-4">
      <h3 className="font-serif text-xl text-foreground">Order Summary</h3>

      <Separator className="bg-border" />

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-sans">
          <span className="text-muted-foreground">
            Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
          </span>
          <span className="text-foreground font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-sans">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">Calculated at checkout</span>
        </div>
      </div>

      <Separator className="bg-border" />

      <div className="flex justify-between font-serif text-lg">
        <span className="text-foreground">Total</span>
        <span className="text-gold">{formatPrice(subtotal)}</span>
      </div>

      <Button
        asChild
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
        disabled={cartItems.length === 0}
      >
        <Link to="/checkout">
          Proceed to Checkout
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>

      <Button asChild variant="outline" className="w-full border-gold/30 text-bronze hover:bg-gold/5">
        <Link to="/products">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>
      </Button>
    </div>
  );
}
