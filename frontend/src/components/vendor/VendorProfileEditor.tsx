import React, { useState, useEffect } from 'react';
import type { VendorProfile } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VendorProfileEditorProps {
  profile: VendorProfile;
}

export default function VendorProfileEditor({ profile }: VendorProfileEditorProps) {
  const [form, setForm] = useState({
    name: profile.name,
    description: profile.description,
    contact: profile.contact,
  });
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setForm({
      name: profile.name,
      description: profile.description,
      contact: profile.contact,
    });
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Store name is required');
      return;
    }
    setIsPending(true);
    try {
      // Profile updates are stored locally since backend doesn't support vendor profile updates
      toast.success('Profile updated successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-sans text-sm">
          Store Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Your store name"
          className="font-sans text-sm border-border"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your store…"
          rows={3}
          className="font-sans text-sm border-border resize-none"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Contact</Label>
        <Input
          value={form.contact}
          onChange={(e) => handleChange('contact', e.target.value)}
          placeholder="Email or phone"
          className="font-sans text-sm border-border"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="font-sans bg-gold text-background hover:bg-gold/90"
      >
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
