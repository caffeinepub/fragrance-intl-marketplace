import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Building2,
  Download,
  Gavel,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  User,
  Wallet,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useIsCallerAdmin,
  useIsCallerApproved,
} from "../../hooks/useQueries";
import NotificationBell from "../notifications/NotificationBell";

export default function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isApproved } = useIsCallerApproved();
  const { data: isAdmin } = useIsCallerAdmin();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const displayName =
    userProfile?.name || `${identity?.getPrincipal().toString().slice(0, 8)}…`;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/generated/logo-mark.dim_256x256.png"
              alt="Logo"
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-lg text-foreground">
              Fragrance.Intl
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/products"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.products_link"
            >
              Products
            </Link>
            <Link
              to="/auctions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.auctions_link"
            >
              Auctions
            </Link>
            <Link
              to="/live"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              data-ocid="nav.live_link"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </Link>
            <Link
              to="/wholesale"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.wholesale_link"
            >
              Wholesale
            </Link>
            {isAuthenticated && isApproved && (
              <Link
                to="/vendor/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="nav.vendor_link"
              >
                Vendor
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="nav.admin_link"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: "/wallet" })}
                  aria-label="Wallet"
                  data-ocid="header.wallet_link"
                >
                  <Wallet className="w-5 h-5" />
                </Button>
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: "/cart" })}
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Button>
              </>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-24 truncate">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/wallet" })}
                    data-ocid="header.wallet_link"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    My Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/my-orders" })}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/my-downloads" })}
                    data-ocid="header.my_downloads_link"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    My Downloads
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/trade-offers" })}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Trade Offers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/wholesale" })}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Wholesale
                  </DropdownMenuItem>
                  {isApproved && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/vendor/dashboard" })}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Vendor Dashboard
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/admin" })}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleAuth}
                    className="text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleAuth} disabled={isLoggingIn} size="sm">
                {isLoggingIn ? "Logging in…" : "Login"}
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            <Link
              to="/products"
              className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/auctions"
              className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Auctions
            </Link>
            <Link
              to="/live"
              className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Live Streams
            </Link>
            <Link
              to="/wholesale"
              className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              data-ocid="nav.wholesale_link"
            >
              Wholesale
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/wallet"
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                  data-ocid="header.wallet_link"
                >
                  My Wallet
                </Link>
                <Link
                  to="/notifications"
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notifications
                </Link>
                <Link
                  to="/cart"
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cart
                </Link>
                <Link
                  to="/my-orders"
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  to="/my-downloads"
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                  data-ocid="header.my_downloads_link"
                >
                  My Downloads
                </Link>
                <Link
                  to="/trade-offers"
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trade Offers
                </Link>
              </>
            )}
            {isApproved && (
              <Link
                to="/vendor/dashboard"
                className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Vendor Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
