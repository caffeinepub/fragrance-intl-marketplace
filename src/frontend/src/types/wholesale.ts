// Local wholesale types — backend implementation coming in future session

export interface WholesaleTier {
  minQuantity: bigint;
  pricePerUnit: bigint;
  label?: string;
}

export interface WholesaleAccount {
  id: string;
  principal: any;
  companyName: string;
  taxId?: string;
  businessDescription?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: bigint;
  approvedAt?: bigint;
}

export type WholesaleAccountStatus = WholesaleAccount["status"];
