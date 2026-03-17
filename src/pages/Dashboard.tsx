import { DollarSign, FileText, Receipt, Users } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TaxDistributionChart } from '@/components/dashboard/TaxDistributionChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { PendingTaxes } from '@/components/dashboard/PendingTaxes';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';

export default function Dashboard() {
  const { metrics, source } = useAuditData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Auditor Dashboard</h1>
        <p className="text-muted-foreground">
          Review financial exposure, audit engagements, and compliance actions in one place.
          {source === 'demo' ? ' Demo data is showing until Supabase is fully connected.' : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Collected Revenue"
          value={formatCurrencyINR(metrics.totalRevenue)}
          change={metrics.revenueGrowth}
          icon={<DollarSign className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Open Engagements"
          value={formatCurrencyINR(metrics.pendingInvoices)}
          icon={<FileText className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Compliance Exposure"
          value={formatCurrencyINR(metrics.pendingTaxes)}
          icon={<Receipt className="h-6 w-6" />}
          variant="warning"
        />
        <MetricCard
          title="Active Clients"
          value={metrics.totalClients.toString()}
          icon={<Users className="h-6 w-6" />}
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
