import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCart } from "../../hooks/useQueries";

export default function CartDropdown() {
  const { identity } = useInternetIdentity();
  const { data: cartItems } = useGetCart();

  const itemCount = cartItems?.length || 0;

  if (!identity) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-gold/10"
        asChild
      >
        <Link to="/cart">
          <ShoppingBag className="w-5 h-5 text-bronze" />
        </Link>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gold/10"
        >
          <ShoppingBag className="w-5 h-5 text-bronze" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-base text-foreground">Cart</h4>
            <span className="text-xs text-muted-foreground font-sans">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          </div>

          {itemCount === 0 ? (
            <p className="text-sm text-muted-foreground font-sans text-center py-4">
              Your cart is empty
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cartItems?.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                    {item.productId}
                  </span>
                  <span className="text-foreground font-sans ml-2 flex-shrink-0">
                    ×{Number(item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-sm"
          >
            <Link to="/cart">View Cart</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
