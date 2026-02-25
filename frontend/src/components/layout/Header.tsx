import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin, useIsCallerApproved } from '../../hooks/useQueries';
import LoginButton from '../auth/LoginButton';
import CartDropdown from '../cart/CartDropdown';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, Store, Package, ShoppingBag, ClipboardList, Shield } from 'lucide-react';

export default function Header() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isApproved } = useIsCallerApproved();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !!identity;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="Fragrance.Intl"
            className="w-8 h-8 rounded object-cover"
          />
          <div className="hidden sm:block">
            <span className="font-serif text-lg text-foreground tracking-wide group-hover:text-gold transition-colors">
              Fragrance<span className="text-gold">.Intl</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="font-sans text-sm hover:bg-gold/10 hover:text-gold">
            <Link to="/products">Shop</Link>
          </Button>
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="sm" asChild className="font-sans text-sm hover:bg-gold/10 hover:text-gold">
                <Link to="/my-orders">My Orders</Link>
              </Button>
              {isApproved ? (
                <Button variant="ghost" size="sm" asChild className="font-sans text-sm hover:bg-gold/10 hover:text-gold">
                  <Link to="/vendor/dashboard">My Store</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild className="font-sans text-sm hover:bg-gold/10 hover:text-gold">
                  <Link to="/vendor/register">Become a Vendor</Link>
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild className="font-sans text-sm hover:bg-gold/10 hover:text-gold">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <CartDropdown />

          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                  <User className="w-5 h-5 text-bronze" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-sans text-sm font-medium text-foreground truncate">
                    {userProfile?.name || 'User'}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground capitalize">
                    {userProfile?.role || 'customer'}
                  </p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/my-orders" className="flex items-center gap-2 cursor-pointer">
                    <ClipboardList className="w-4 h-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                {isApproved ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/vendor/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <Store className="w-4 h-4" />
                        My Store
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/vendor/products" className="flex items-center gap-2 cursor-pointer">
                        <Package className="w-4 h-4" />
                        My Products
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/vendor/register" className="flex items-center gap-2 cursor-pointer">
                      <Store className="w-4 h-4" />
                      Become a Vendor
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <LoginButton />

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gold/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start font-sans text-sm"
            onClick={() => setMobileOpen(false)}
          >
            <Link to="/products">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </Link>
          </Button>
          {isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="w-full justify-start font-sans text-sm"
                onClick={() => setMobileOpen(false)}
              >
                <Link to="/my-orders">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  My Orders
                </Link>
              </Button>
              {isApproved ? (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full justify-start font-sans text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to="/vendor/dashboard">
                    <Store className="w-4 h-4 mr-2" />
                    My Store
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full justify-start font-sans text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to="/vendor/register">
                    <Store className="w-4 h-4 mr-2" />
                    Become a Vendor
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full justify-start font-sans text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
