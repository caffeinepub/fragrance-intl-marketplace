import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ArrowRight } from 'lucide-react';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ShippingAddressFormProps {
  address?: ShippingAddress;
  onChange?: (address: ShippingAddress) => void;
  onSubmit?: (address: ShippingAddress) => void;
  skipShipping?: boolean;
}

const EMPTY: ShippingAddress = {
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
};

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'India', 'Germany', 'France', 'Other',
];

export default function ShippingAddressForm({
  address: externalAddress,
  onChange,
  onSubmit,
  skipShipping = false,
}: ShippingAddressFormProps) {
  const [internal, setInternal] = React.useState<ShippingAddress>(externalAddress ?? EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // Use controlled value if provided, otherwise internal state
  const address = externalAddress ?? internal;

  const update = (field: keyof ShippingAddress, value: string) => {
    const updated = { ...address, [field]: value };
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (onChange) {
      onChange(updated);
    } else {
      setInternal(updated);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State / Province is required';
    if (!address.zip.trim()) newErrors.zip = 'ZIP / Postal code is required';
    if (!address.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (onSubmit) {
      onSubmit(address);
    }
  };

  // Auto-skip for digital-only orders
  if (skipShipping) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-lg text-foreground">Delivery</h3>
        </div>
        <p className="font-sans text-sm text-muted-foreground">
          Your order contains only digital or service items — no shipping address required.
        </p>
        {onSubmit && (
          <Button
            type="button"
            onClick={() => onSubmit(EMPTY)}
            className="font-sans bg-gold text-background hover:bg-gold/90"
          >
            Continue to Review
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-gold" />
        <h3 className="font-serif text-lg text-foreground">Shipping Address</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street" className="font-sans text-sm">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="street"
          value={address.street}
          onChange={(e) => update('street', e.target.value)}
          placeholder="123 Main Street, Apt 4B"
          className={errors.street ? 'border-destructive' : ''}
        />
        {errors.street && (
          <p className="text-xs text-destructive">{errors.street}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="font-sans text-sm">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="New York"
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="font-sans text-sm">
            State / Province <span className="text-destructive">*</span>
          </Label>
          <Input
            id="state"
            value={address.state}
            onChange={(e) => update('state', e.target.value)}
            placeholder="NY"
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zip" className="font-sans text-sm">
            ZIP / Postal Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="zip"
            value={address.zip}
            onChange={(e) => update('zip', e.target.value)}
            placeholder="10001"
            className={errors.zip ? 'border-destructive' : ''}
          />
          {errors.zip && (
            <p className="text-xs text-destructive">{errors.zip}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="font-sans text-sm">
            Country <span className="text-destructive">*</span>
          </Label>
          <Select value={address.country} onValueChange={(v) => update('country', v)}>
            <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-xs text-destructive">{errors.country}</p>
          )}
        </div>
      </div>

      {onSubmit && (
        <Button
          type="submit"
          className="font-sans bg-gold text-background hover:bg-gold/90 w-full"
        >
          Continue to Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );

  if (onSubmit) {
    return <form onSubmit={handleSubmit}>{content}</form>;
  }

  return <div>{content}</div>;
}
