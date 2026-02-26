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
  store?: StoreResponse;
}

interface FormState {
  name: string;
  description: string;
  contactInfo: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  contactInfo: '',
};

export default function StoreFormModal({ isOpen, onClose, store }: StoreFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [nameError, setNameError] = useState('');

  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const isEditMode = !!store;
  const isPending = createStore.isPending || updateStore.isPending;

  // Pre-populate form when editing
  useEffect(() => {
    if (store) {
      setForm({
        name: store.name,
        description: store.description,
        contactInfo: store.contactInfo,
      });
    } else {
      setForm(emptyForm);
    }
    setNameError('');
  }, [store, isOpen]);

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
      if (isEditMode && store) {
        await updateStore.mutateAsync({
          storeId: store.id,
          name: form.name.trim(),
          description: form.description.trim(),
          contactInfo: form.contactInfo.trim(),
        });
      } else {
        await createStore.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim(),
          contactInfo: form.contactInfo.trim(),
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
            {isEditMode ? 'Edit Store' : 'Create New Store'}
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            {isEditMode
              ? 'Update your store details below.'
              : 'Set up a new store under your vendor account.'}
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

          {/* Contact Info */}
          <div className="space-y-1.5">
            <Label htmlFor="store-contact" className="font-sans text-sm text-foreground">
              Contact Info
            </Label>
            <Input
              id="store-contact"
              value={form.contactInfo}
              onChange={(e) => handleChange('contactInfo', e.target.value)}
              placeholder="e.g. contact@yourstore.com or +1 555-0100"
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
              {isEditMode ? 'Save Changes' : 'Create Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
