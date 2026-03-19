import { FileText, CheckCircle2, Clock3, Receipt } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TaxDistributionChart } from '@/components/dashboard/TaxDistributionChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { PendingTaxes } from '@/components/dashboard/PendingTaxes';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';

export default function Dashboard() {
  const { source, invoices, complianceRecords } = useAuditData();

  const totalInvoices = invoices.length;
  const verifiedInvoices = invoices.filter((invoice) => invoice.verificationStatus === 'verified').length;
  const pendingAudits = invoices.filter(
    (invoice) => invoice.reviewStatus === 'pending' || invoice.verificationStatus === 'not_verified',
  ).length;
  const totalTaxSummary = complianceRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Auditor Dashboard</h1>
        <p className="text-muted-foreground">
          Review invoice audit progress and tax exposure in one place.
          {source !== 'live' ? ' Live data is unavailable until Supabase is connected.' : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invoices"
          value={totalInvoices.toString()}
          icon={<FileText className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Verified Invoices"
          value={verifiedInvoices.toString()}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Pending Audits"
          value={pendingAudits.toString()}
          icon={<Clock3 className="h-6 w-6" />}
          variant="warning"
        />
        <MetricCard
          title="Tax Summary"
          value={formatCurrencyINR(totalTaxSummary)}
          icon={<Receipt className="h-6 w-6" />}
          variant="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <TaxDistributionChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentInvoices />
        <PendingTaxes />
      </div>
    </div>
  );
}
