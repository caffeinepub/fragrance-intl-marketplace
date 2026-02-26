import React, { useState, useEffect } from 'react';
import { ExternalBlob } from '../../backend';
import type { VendorProfile } from '../../types';
import { useUpdateVendorProfile } from '../../hooks/useQueries';
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
  const updateProfile = useUpdateVendorProfile();

  const [form, setForm] = useState({
    name: profile.name,
    description: profile.description,
    contact: profile.contact,
  });

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
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        name: form.name.trim(),
        description: form.description.trim(),
        logo: null,
        contact: form.contact.trim(),
      });
      toast.success('Profile updated successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
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
          disabled={updateProfile.isPending}
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
          disabled={updateProfile.isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm">Contact</Label>
        <Input
          value={form.contact}
          onChange={(e) => handleChange('contact', e.target.value)}
          placeholder="Email or phone"
          className="font-sans text-sm border-border"
          disabled={updateProfile.isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={updateProfile.isPending}
        className="font-sans bg-gold text-background hover:bg-gold/90"
      >
        {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
