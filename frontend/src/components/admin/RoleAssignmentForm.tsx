import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAssignRole } from '../../hooks/useQueries';
import { UserRole } from '../../backend';
import { Principal } from '@icp-sdk/core/principal';
import { Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleAssignmentForm() {
  const [principalText, setPrincipalText] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.user);
  const assignRole = useAssignRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const principal = Principal.fromText(principalText.trim());
      await assignRole.mutateAsync({ user: principal, role });
      toast.success('Role assigned successfully');
      setPrincipalText('');
    } catch {
      toast.error('Failed to assign role. Check the principal ID.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <UserCog className="w-5 h-5 text-gold" />
        <h3 className="font-serif text-lg text-foreground">Assign User Role</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="principal" className="font-sans text-sm">Principal ID</Label>
        <Input
          id="principal"
          value={principalText}
          onChange={(e) => setPrincipalText(e.target.value)}
          placeholder="aaaaa-bbbbb-ccccc-..."
          required
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="font-sans text-sm">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UserRole.admin}>Admin</SelectItem>
            <SelectItem value={UserRole.user}>User</SelectItem>
            <SelectItem value={UserRole.guest}>Guest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={!principalText.trim() || assignRole.isPending}
        className="w-full bg-primary text-primary-foreground"
      >
        {assignRole.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</>
        ) : (
          'Assign Role'
        )}
      </Button>
    </form>
  );
}
