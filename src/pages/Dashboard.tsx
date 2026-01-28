import { DollarSign, FileText, Receipt, Users } from 'lucide-react';
import { mockDashboardMetrics } from '@/data/mockData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TaxDistributionChart } from '@/components/dashboard/TaxDistributionChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { PendingTaxes } from '@/components/dashboard/PendingTaxes';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${mockDashboardMetrics.totalRevenue.toLocaleString()}`}
          change={mockDashboardMetrics.revenueGrowth}
          icon={<DollarSign className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Pending Invoices"
          value={`$${mockDashboardMetrics.pendingInvoices.toLocaleString()}`}
          icon={<FileText className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Pending Taxes"
          value={`$${mockDashboardMetrics.pendingTaxes.toLocaleString()}`}
          icon={<Receipt className="h-6 w-6" />}
          variant="warning"
        />
        <MetricCard
          title="Total Clients"
          value={mockDashboardMetrics.totalClients.toString()}
          icon={<Users className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <TaxDistributionChart />
      </div>

      {/* Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentInvoices />
        <PendingTaxes />
      </div>
    </div>
  );
}
