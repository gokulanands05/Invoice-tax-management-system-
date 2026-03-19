import { Invoice } from '@/types/invoice';

export type InvoiceIssueCode = 'duplicate_invoice' | 'tax_mismatch' | 'missing_fields';

export interface InvoiceIssue {
  code: InvoiceIssueCode;
  label: string;
  description: string;
}

export interface InvoiceIssueSummary {
  totalFlaggedInvoices: number;
  duplicateCount: number;
  taxMismatchCount: number;
  missingFieldsCount: number;
}

export interface InvoiceIssueResult {
  issueMap: Map<string, InvoiceIssue[]>;
  summary: InvoiceIssueSummary;
}

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function detectInvoiceIssues(invoices: Invoice[]): InvoiceIssueResult {
  const issueMap = new Map<string, InvoiceIssue[]>();
  const invoiceNumberCount = new Map<string, number>();

  invoices.forEach((invoice) => {
    const key = invoice.invoiceNumber.trim().toUpperCase();
    if (!key) return;
    invoiceNumberCount.set(key, (invoiceNumberCount.get(key) || 0) + 1);
  });

  let duplicateCount = 0;
  let taxMismatchCount = 0;
  let missingFieldsCount = 0;

  invoices.forEach((invoice) => {
    const issues: InvoiceIssue[] = [];

    const invoiceKey = invoice.invoiceNumber.trim().toUpperCase();
    const hasDuplicate = invoiceKey && (invoiceNumberCount.get(invoiceKey) || 0) > 1;
    if (hasDuplicate) {
      issues.push({
        code: 'duplicate_invoice',
        label: 'Duplicate Invoice',
        description: `Invoice number ${invoice.invoiceNumber} appears multiple times.`,
      });
      duplicateCount += 1;
    }

    const expectedTaxFromSplit = round2((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0));
    const storedTax = round2(invoice.taxAmount || 0);
    const computedTotal = round2((invoice.amount || 0) + storedTax);
    const storedTotal = round2(invoice.totalAmount || 0);

    const hasTaxMismatch = Math.abs(expectedTaxFromSplit - storedTax) > 0.5 || Math.abs(computedTotal - storedTotal) > 0.5;
    if (hasTaxMismatch) {
      issues.push({
        code: 'tax_mismatch',
        label: 'Tax Mismatch',
        description: 'Tax split or total amount does not match invoice values.',
      });
      taxMismatchCount += 1;
    }

    const hasMissingCore =
      !invoice.invoiceNumber.trim() ||
      !invoice.clientName.trim() ||
      !invoice.gstin.trim() ||
      !GSTIN_PATTERN.test(invoice.gstin.trim().toUpperCase()) ||
      Number.isNaN(invoice.dueDate.getTime()) ||
      invoice.items.length === 0 ||
      invoice.items.some((item) => !item.description.trim() || item.quantity <= 0 || item.rate < 0);

    if (hasMissingCore) {
      issues.push({
        code: 'missing_fields',
        label: 'Missing Fields',
        description: 'Required invoice fields are missing or invalid.',
      });
      missingFieldsCount += 1;
    }

    if (issues.length > 0) {
      issueMap.set(invoice.id, issues);
    }
  });

  return {
    issueMap,
    summary: {
      totalFlaggedInvoices: issueMap.size,
      duplicateCount,
      taxMismatchCount,
      missingFieldsCount,
    },
  };
}
