import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateStore, useUpdateStore } from '../../hooks/useQueries';
import type { StoreResponse } from '../../backend';
import { Loader2 } from 'lucide-react';

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: StoreResponse;
}

interface FormState {
  name: string;
  description: string;
  contactEmail: string;
  logoUrl: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  contactEmail: '',
  logoUrl: '',
};

export default function StoreFormModal({ isOpen, onClose, mode, initialData }: StoreFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [nameError, setNameError] = useState('');

  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const isPending = createStore.isPending || updateStore.isPending;

  // Pre-populate form when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description,
        contactEmail: initialData.contactEmail,
        logoUrl: initialData.logoUrl,
      });
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
    setNameError('');
  }, [mode, initialData, isOpen]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' && value.trim()) {
      setNameError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Store name is required.');
      return;
    }

    try {
      if (mode === 'create') {
        await createStore.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim(),
          contactEmail: form.contactEmail.trim(),
          logoUrl: form.logoUrl.trim(),
        });
      } else if (mode === 'edit' && initialData) {
        await updateStore.mutateAsync({
          storeId: initialData.storeId,
          name: form.name.trim(),
          description: form.description.trim(),
          contactEmail: form.contactEmail.trim(),
          logoUrl: form.logoUrl.trim(),
        });
      }
      onClose();
    } catch {
      // Errors are handled by the mutation's onError toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            {mode === 'create' ? 'Create New Store' : 'Edit Store'}
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            {mode === 'create'
              ? 'Set up a new store under your vendor account.'
              : 'Update your store details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Store Name */}
          <div className="space-y-1.5">
            <Label htmlFor="store-name" className="font-sans text-sm text-foreground">
              Store Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="store-name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. My Fragrance Boutique"
              className={`font-sans text-sm ${nameError ? 'border-destructive' : 'border-border'}`}
              disabled={isPending}
            />
            {nameError && (
              <p className="text-xs text-destructive font-sans">{nameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="store-description" className="font-sans text-sm text-foreground">
              Description
            </Label>
            <Textarea
              id="store-description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your store..."
              rows={3}
              className="font-sans text-sm border-border resize-none"
              disabled={isPending}
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-1.5">
            <Label htmlFor="store-email" className="font-sans text-sm text-foreground">
              Contact Email
            </Label>
            <Input
              id="store-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="contact@yourstore.com"
              className="font-sans text-sm border-border"
              disabled={isPending}
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="store-logo" className="font-sans text-sm text-foreground">
              Logo URL
            </Label>
            <Input
              id="store-logo"
              value={form.logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="font-sans text-sm border-border"
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="font-sans border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="font-sans bg-gold text-background hover:bg-gold/90"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Store' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
