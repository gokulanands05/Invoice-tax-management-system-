export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type TaxStatus = 'pending' | 'filed' | 'paid';
export type InvoiceReviewStatus = 'accepted' | 'rejected' | 'pending';
export type AuditVerificationStatus = 'verified' | 'not_verified';

export interface AuditHistoryEntry {
  id: string;
  action: string;
  checkedBy: string;
  checkedAt: Date;
  remarks?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  gstin: string;
  totalBilled: number;
  pendingAmount: number;
  invoiceCount: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  gstin: string;
  amount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  createdAt: Date;
  items: InvoiceItem[];
  reviewStatus: InvoiceReviewStatus;
  verificationStatus: AuditVerificationStatus;
  remarks: string;
  auditHistory: AuditHistoryEntry[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface TaxRecord {
  id: string;
  type: string;
  period: string;
  amount: number;
  status: TaxStatus;
  dueDate: Date;
  filedDate?: Date;
  paidDate?: Date;
}

export interface Report {
  id: string;
  title: string;
  type: 'revenue' | 'tax' | 'client' | 'invoice';
  generatedAt: Date;
  data: unknown;
}

export interface DashboardMetrics {
  totalRevenue: number;
  pendingInvoices: number;
  pendingTaxes: number;
  totalClients: number;
  revenueGrowth: number;
  invoicesThisMonth: number;
  taxesDueThisMonth: number;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
}
