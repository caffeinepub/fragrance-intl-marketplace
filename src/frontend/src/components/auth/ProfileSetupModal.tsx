import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({
      name: name.trim(),
      email: email.trim() || undefined,
      role: "customer",
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-gold/20 bg-card"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
          </div>
          <DialogTitle className="font-serif text-2xl text-foreground">
            Welcome to Fragrance.Intl
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-sans">
            Please tell us your name to complete your profile setup.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-sans text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="border-border focus:border-gold focus:ring-gold/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-sans text-sm font-medium">
              Email{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="border-border focus:border-gold focus:ring-gold/20"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans"
            disabled={!name.trim() || saveProfile.isPending}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Marketplace"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
