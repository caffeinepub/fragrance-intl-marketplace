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
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Package2,
  Percent,
  Phone,
  Shield,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { WholesaleAccount } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMyWholesaleAccount,
  useRegisterWholesaleAccount,
} from "../hooks/useQueries";

const BENEFITS = [
  {
    icon: Percent,
    title: "Tiered Bulk Discounts",
    description:
      "Access exclusive pricing that scales with your order volume — the more you buy, the more you save.",
  },
  {
    icon: Package2,
    title: "Priority Fulfillment",
    description:
      "Wholesale orders are prioritized in our fulfilment queue for faster processing and shipping.",
  },
  {
    icon: Phone,
    title: "Dedicated Support",
    description:
      "A dedicated account manager to assist with large orders, custom requests, and sourcing needs.",
  },
  {
    icon: Shield,
    title: "Verified Business Status",
    description:
      "Your account is marked as a verified wholesale buyer, unlocking gated pricing across all stores.",
  },
];

function getStatusConfig(status: string) {
  if (status === "approved") {
    return {
      icon: BadgeCheck,
      label: "Wholesale Access Active",
      description:
        "Your account has been approved. You now have access to wholesale pricing across the marketplace.",
      badgeClass: "bg-green-100 text-green-800 border-green-300",
      iconClass: "text-green-500",
      bgClass: "bg-green-50 border-green-200",
    };
  }
  if (status === "rejected") {
    return {
      icon: XCircle,
      label: "Application Rejected",
      description:
        "Unfortunately your application was not approved at this time. Please contact support for more information.",
      badgeClass: "bg-red-100 text-red-800 border-red-300",
      iconClass: "text-red-500",
      bgClass: "bg-red-50 border-red-200",
    };
  }
  return {
    icon: Clock,
    label: "Application Pending",
    description:
      "Your wholesale application is under review. We typically process applications within 1–2 business days.",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
    iconClass: "text-yellow-500",
    bgClass: "bg-yellow-50 border-yellow-200",
  };
}

function StatusCard({ account }: { account: WholesaleAccount }) {
  const statusStr =
    typeof account.status === "object"
      ? (Object.keys(account.status as object)[0] ?? "pending")
      : String(account.status);

  const config = getStatusConfig(statusStr);
  const Icon = config.icon;

  return (
    <Card
      data-ocid="wholesale.status_card"
      className={`border ${config.bgClass} luxury-shadow`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full bg-white/60 ${config.iconClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-serif text-xl text-foreground">
                {config.label}
              </h3>
              <Badge className={`text-xs capitalize ${config.badgeClass}`}>
                {statusStr}
              </Badge>
            </div>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Business</span>
                <p className="font-medium text-foreground">
                  {account.businessName}
                </p>
              </div>
              {account.taxId && (
                <div>
                  <span className="text-muted-foreground">Tax ID</span>
                  <p className="font-medium text-foreground">{account.taxId}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Registered</span>
                <p className="font-medium text-foreground">
                  {new Date(Number(account.createdAt)).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </p>
              </div>
              {account.reviewedAt !== undefined &&
                account.reviewedAt !== null && (
                  <div>
                    <span className="text-muted-foreground">Reviewed</span>
                    <p className="font-medium text-foreground">
                      {new Date(Number(account.reviewedAt)).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                )}
            </div>
            {statusStr === "approved" && (
              <div className="mt-4 flex items-center gap-2 text-green-700 font-medium text-sm">
                <CheckCircle2 className="w-4 h-4" />
                You have wholesale access
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WholesaleRegistration() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");

  // Real backend queries
  const { data: existingAccount, isLoading: loadingAccount } =
    useGetMyWholesaleAccount();
  const registerMutation = useRegisterWholesaleAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error("Please log in to register for wholesale access.");
      return;
    }
    if (!businessName.trim()) {
      toast.error("Business name is required.");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        businessName: businessName.trim(),
        taxId: taxId.trim(),
      });
      toast.success(
        "Application submitted! We'll review your request shortly.",
      );
      setBusinessName("");
      setTaxId("");
    } catch (err) {
      console.error("Wholesale registration error:", err);
      toast.error("Failed to submit application. Please try again.");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <p className="font-sans text-xs text-gold uppercase tracking-[0.25em] mb-3">
          Business Programme
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
          Wholesale Access
        </h1>
        <p className="font-sans text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Join our exclusive wholesale programme and unlock tiered pricing,
          priority fulfilment, and dedicated support for your business.
        </p>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
      >
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="bg-card border border-border rounded-lg p-5 flex gap-4 luxury-shadow"
            >
              <div className="p-2 rounded-md bg-gold/10 h-fit">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-serif text-base text-foreground mb-1">
                  {benefit.title}
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Registration / Status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-2xl mx-auto"
      >
        {loadingAccount ? (
          <div data-ocid="wholesale.loading_state" className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : existingAccount ? (
          <StatusCard account={existingAccount} />
        ) : registerMutation.isSuccess ? (
          <Card className="border border-green-200 bg-green-50 luxury-shadow">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-serif text-xl text-foreground mb-2">
                Application Submitted
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                Thank you! Your wholesale application is under review. We'll
                notify you once it's processed.
              </p>
            </CardContent>
          </Card>
        ) : !identity ? (
          <Card className="border border-border luxury-shadow">
            <CardContent className="pt-6 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl text-foreground mb-2">
                Sign In Required
              </h3>
              <p className="font-sans text-sm text-muted-foreground mb-4">
                Please sign in to apply for wholesale access.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/" })}
                className="gap-2"
                data-ocid="wholesale.secondary_button"
              >
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border luxury-shadow">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">
                Apply for Wholesale Access
              </CardTitle>
              <CardDescription className="font-sans text-sm">
                Complete the form below. Applications are typically reviewed
                within 1–2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                data-ocid="wholesale.register_form"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-name"
                    className="font-sans text-sm font-medium"
                  >
                    Business Name{" "}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </Label>
                  <Input
                    id="business-name"
                    data-ocid="wholesale.input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Fragrance Distributors Ltd."
                    required
                    autoComplete="organization"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="tax-id"
                    className="font-sans text-sm font-medium"
                  >
                    Tax ID / VAT Number{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="tax-id"
                    data-ocid="wholesale.taxid_input"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="GB123456789"
                    autoComplete="off"
                  />
                </div>

                {registerMutation.isError && (
                  <p
                    data-ocid="wholesale.error_state"
                    className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
                  >
                    Failed to submit application. Please try again.
                  </p>
                )}

                <Button
                  type="submit"
                  data-ocid="wholesale.submit_button"
                  className="w-full gap-2"
                  disabled={registerMutation.isPending || !businessName.trim()}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </main>
  );
}
