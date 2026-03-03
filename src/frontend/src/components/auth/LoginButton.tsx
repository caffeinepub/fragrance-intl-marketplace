import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  if (isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleAuth}
        className="border-gold/40 text-bronze hover:bg-gold/10 hover:border-gold font-sans text-sm"
      >
        <LogOut className="w-4 h-4 mr-1.5" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleAuth}
      disabled={isLoggingIn}
      className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans text-sm"
    >
      {isLoggingIn ? (
        <>
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          Signing In...
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-1.5" />
          Sign In
        </>
      )}
    </Button>
  );
}
