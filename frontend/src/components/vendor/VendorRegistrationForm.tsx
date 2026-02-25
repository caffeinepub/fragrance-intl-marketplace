import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useCreateVendorProfile, useRequestApproval } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Loader2, Upload, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

interface VendorRegistrationFormProps {
  onSuccess?: () => void;
}

export default function VendorRegistrationForm({ onSuccess }: VendorRegistrationFormProps) {
  const { identity } = useInternetIdentity();
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createVendorProfile = useCreateVendorProfile();
  const requestApproval = useRequestApproval();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId.trim() || !storeName.trim()) return;

    const cleanId = storeId.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      let logoBlob: ExternalBlob | null = null;
      if (logoFile) {
        const bytes = new Uint8Array(await logoFile.arrayBuffer());
        logoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
      }

      await createVendorProfile.mutateAsync({
        id: cleanId,
        name: storeName.trim(),
        description: description.trim(),
        logo: logoBlob,
        contact: contact.trim(),
      });

      // Store vendor ID in localStorage so dashboard can retrieve it
      const principalStr = identity?.getPrincipal().toString() || '';
      if (principalStr) {
        localStorage.setItem(`vendorId_${principalStr}`, cleanId);
      }

      await requestApproval.mutateAsync();
      toast.success('Vendor registration submitted! Awaiting admin approval.');
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Registration failed. Please try again.');
    }
  };

  const isPending = createVendorProfile.isPending || requestApproval.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Store className="w-5 h-5 text-gold" />
        <h3 className="font-serif text-xl text-foreground">Register Your Store</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="storeId" className="font-sans text-sm">
            Store ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeId"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="my-fragrance-store"
            required
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Unique identifier, lowercase with hyphens</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="storeName" className="font-sans text-sm">
            Store Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="My Fragrance Store"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-sans text-sm">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell customers about your store and fragrances..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact" className="font-sans text-sm">Contact Info</Label>
        <Input
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="email@example.com or phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo" className="font-sans text-sm">Store Logo</Label>
        <div className="flex items-center gap-3">
          <label
            htmlFor="logo"
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gold/40 rounded cursor-pointer hover:bg-gold/5 transition-colors text-sm text-muted-foreground"
          >
            <Upload className="w-4 h-4" />
            {logoFile ? logoFile.name : 'Choose image'}
          </label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          />
        </div>
        {isPending && logoFile && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="h-1.5" />
        )}
      </div>

      <Button
        type="submit"
        disabled={!storeId.trim() || !storeName.trim() || isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
        ) : (
          'Submit Registration'
        )}
      </Button>
    </form>
  );
}
