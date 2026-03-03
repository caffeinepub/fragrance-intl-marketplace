import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import React from "react";

interface AccessDeniedProps {
  message?: string;
  showHomeLink?: boolean;
}

export default function AccessDenied({
  message = "You do not have permission to access this page.",
  showHomeLink = true,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldX className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="font-serif text-2xl text-foreground mb-3">
        Access Restricted
      </h2>
      <p className="text-muted-foreground font-sans max-w-sm mb-6">{message}</p>
      {showHomeLink && (
        <Button
          asChild
          variant="outline"
          className="border-gold/40 text-bronze hover:bg-gold/10"
        >
          <Link to="/">Return to Home</Link>
        </Button>
      )}
    </div>
  );
}
