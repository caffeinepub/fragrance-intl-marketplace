import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Principal } from "@dfinity/principal";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../../backend";
import { useAssignRole } from "../../hooks/useQueries";

export default function RoleAssignmentForm() {
  const assignRole = useAssignRole();
  const [principalStr, setPrincipalStr] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const principal = Principal.fromText(principalStr.trim());
      await assignRole.mutateAsync({ user: principal, role });
      toast.success("Role assigned successfully");
      setPrincipalStr("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to assign role");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label
          htmlFor="principal-input"
          className="text-sm font-medium text-foreground mb-1 block"
        >
          User Principal
        </label>
        <Input
          id="principal-input"
          value={principalStr}
          onChange={(e) => setPrincipalStr(e.target.value)}
          placeholder="aaaaa-aa..."
          required
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Role</p>
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
      <Button type="submit" disabled={assignRole.isPending}>
        {assignRole.isPending ? "Assigning…" : "Assign Role"}
      </Button>
    </form>
  );
}
