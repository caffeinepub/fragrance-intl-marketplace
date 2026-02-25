import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useUpdateVendorProfile } from '../../hooks/useQueries';
import { ExternalBlob, type VendorProfile } from '../../backend';
import { Loader2, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

interface VendorProfileEditorProps {
  profile: VendorProfile;
}

export default function VendorProfileEditor({ profile }: VendorProfileEditorProps) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [contact, setContact] = useState(profile.contact);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const updateVendorProfile = useUpdateVendorProfile();

  useEffect(() => {
    setName(profile.name);
    setDescription(profile.description);
    setContact(profile.contact);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let logoBlob: ExternalBlob | null = null;
      if (logoFile) {
        const bytes = new Uint8Array(await logoFile.arrayBuffer());
        logoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
      }

      await updateVendorProfile.mutateAsync({
        id: profile.id,
        name: name.trim(),
        description: description.trim(),
        logo: logoBlob,
        contact: contact.trim(),
      });
      toast.success('Store profile updated successfully');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Update failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-sans text-sm">Store ID</Label>
          <Input value={profile.id} disabled className="font-mono text-sm bg-muted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-name" className="font-sans text-sm">
            Store Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description" className="font-sans text-sm">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-contact" className="font-sans text-sm">Contact Info</Label>
        <Input
          id="edit-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="font-sans text-sm">Update Logo</Label>
        <div className="flex items-center gap-3">
          <label
            htmlFor="edit-logo"
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gold/40 rounded cursor-pointer hover:bg-gold/5 transition-colors text-sm text-muted-foreground"
          >
            <Upload className="w-4 h-4" />
            {logoFile ? logoFile.name : 'Choose new image'}
          </label>
          <input
            id="edit-logo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          />
        </div>
        {updateVendorProfile.isPending && logoFile && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="h-1.5" />
        )}
      </div>

      <Button
        type="submit"
        disabled={!name.trim() || updateVendorProfile.isPending}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {updateVendorProfile.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" />Save Changes</>
        )}
      </Button>
    </form>
  );
}
