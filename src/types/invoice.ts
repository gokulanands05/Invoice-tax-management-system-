export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type TaxStatus = 'pending' | 'filed' | 'paid';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
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
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  createdAt: Date;
  items: InvoiceItem[];
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
