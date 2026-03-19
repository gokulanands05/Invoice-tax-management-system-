import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { Download, Plus, FileText, TrendingUp, Users, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCompactCurrencyINR, formatCurrencyINR } from '@/lib/formatters';
import { detectInvoiceIssues } from '@/lib/fraudChecks';

const COLORS = ['hsl(239, 84%, 67%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(280, 84%, 60%)', 'hsl(0, 84%, 60%)'];

interface GeneratedReport {
  id: string;
  title: string;
  type: 'monthly' | 'tax' | 'audit';
  generatedAt: Date;
  rows: Array<Record<string, string | number>>;
}

export function ReportsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const { toast } = useToast();
  const { reports, revenueChartData, complianceDistributionData, clients, invoices } = useAuditData();

  const clientRevenueData = clients.map(client => ({
    name: client.company.split(' ')[0],
    revenue: client.totalBilled,
    pending: client.pendingAmount,
  }));

  const { issueMap } = detectInvoiceIssues(invoices);

  const downloadCSV = (filename: string, rows: Array<Record<string, string | number>>) => {
    if (!rows.length) {
      toast({ title: 'No data', description: 'Nothing to export for this section.', variant: 'destructive' });
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSnapshotCSV = () => {
    const rows: Array<Record<string, string | number>> = [
      ...revenueChartData.map((row) => ({ section: 'Revenue', key: row.month, value: row.revenue, count: row.invoices })),
      ...complianceDistributionData.map((row) => ({ section: 'Compliance', key: row.name, value: row.value, count: 1 })),
      ...clientRevenueData.map((row) => ({ section: 'Clients', key: row.name, value: row.revenue, count: row.pending })),
    ];

    downloadCSV(`audit-snapshot-${Date.now()}.csv`, rows);
  };

  const pushGeneratedReport = (report: GeneratedReport) => {
    setGeneratedReports((prev) => [report, ...prev].slice(0, 20));
  };

  const handleGenerateMonthlyReport = () => {
    const rows = invoices.map((invoice) => ({
      invoice_number: invoice.invoiceNumber,
      invoice_date: format(invoice.createdAt, 'yyyy-MM-dd'),
      client: invoice.clientName,
      taxable_amount: invoice.amount,
      tax_amount: invoice.taxAmount,
      total_amount: invoice.totalAmount,
      review_status: invoice.reviewStatus,
      verification_status: invoice.verificationStatus,
    }));

    if (!rows.length) {
      toast({ title: 'No data', description: 'No invoices available for monthly report.', variant: 'destructive' });
      return;
    }

    const fileName = `monthly-report-${Date.now()}.csv`;
    downloadCSV(fileName, rows);
    pushGeneratedReport({
      id: `monthly-${Date.now()}`,
      title: 'Monthly Report',
      type: 'monthly',
      generatedAt: new Date(),
      rows,
    });

    toast({ title: 'Monthly report generated', description: 'Monthly CSV exported successfully.' });
  };

  const handleGenerateTaxReport = () => {
    const rows = invoices.map((invoice) => ({
      invoice_number: invoice.invoiceNumber,
      gstin: invoice.gstin,
      taxable_amount: invoice.amount,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      tax_amount: invoice.taxAmount,
      total_amount: invoice.totalAmount,
    }));

    if (!rows.length) {
      toast({ title: 'No data', description: 'No invoices available for tax report.', variant: 'destructive' });
      return;
    }

    const fileName = `tax-report-${Date.now()}.csv`;
    downloadCSV(fileName, rows);
    pushGeneratedReport({
      id: `tax-${Date.now()}`,
      title: 'Tax Report',
      type: 'tax',
      generatedAt: new Date(),
      rows,
    });

    toast({ title: 'Tax report generated', description: 'Tax CSV exported successfully.' });
  };

  const handleGenerateAuditReport = () => {
    const rows = invoices.map((invoice) => ({
      invoice_number: invoice.invoiceNumber,
      review_status: invoice.reviewStatus,
      verification_status: invoice.verificationStatus,
      remarks: invoice.remarks || '-',
      issue_count: (issueMap.get(invoice.id) || []).length,
      issues: (issueMap.get(invoice.id) || []).map((issue) => issue.label).join(' | ') || 'None',
      last_audit_action: invoice.auditHistory[0]?.action || 'No action',
      last_checked_by: invoice.auditHistory[0]?.checkedBy || '-',
    }));

    if (!rows.length) {
      toast({ title: 'No data', description: 'No invoices available for audit report.', variant: 'destructive' });
      return;
    }

    const fileName = `audit-report-${Date.now()}.csv`;
    downloadCSV(fileName, rows);
    pushGeneratedReport({
      id: `audit-${Date.now()}`,
      title: 'Audit Report',
      type: 'audit',
      generatedAt: new Date(),
      rows,
    });

    toast({ title: 'Audit report generated', description: 'Audit CSV exported successfully.' });
  };

  const downloadRecentReport = (report: { id: string; type: string; data: unknown }) => {
    if (report.type === 'revenue' && Array.isArray(report.data)) {
      const rows = (report.data as Array<{ month: string; revenue: number; invoices: number }>).map((row) => ({
        month: row.month,
        revenue: row.revenue,
        invoices: row.invoices,
      }));
      downloadCSV(`${report.id}.csv`, rows);
      return;
    }

    if (report.type === 'tax' && Array.isArray(report.data)) {
      const rows = (report.data as Array<{ name: string; value: number }>).map((row) => ({
        type: row.name,
        amount: row.value,
      }));
      downloadCSV(`${report.id}.csv`, rows);
      return;
    }

    if (report.type === 'client' && Array.isArray(report.data)) {
      const rows = (report.data as Array<{ name: string; company: string; email: string; totalBilled: number; pendingAmount: number }>).map((row) => ({
        name: row.name,
        company: row.company,
        email: row.email,
        total_billed: row.totalBilled,
        pending_amount: row.pendingAmount,
      }));
      downloadCSV(`${report.id}.csv`, rows);
      return;
    }

    downloadCSV(`${report.id}.csv`, [{ message: 'No structured data available' }]);
  };

  const handleGenerateReport = () => {
    downloadSnapshotCSV();

    toast({
      title: "Report Generated",
      description: "Snapshot CSV exported successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Audit Reports</h1>
          <p className="text-muted-foreground">Auditor-focused analytics for collections, compliance, and client exposure</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateReport} className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Snapshot
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <p className="font-medium">Monthly Report</p>
          <p className="text-sm text-muted-foreground">Invoice-wise monthly billing and audit status.</p>
          <Button className="mt-3 w-full" onClick={handleGenerateMonthlyReport}>Generate Monthly Report</Button>
        </div>
        <div className="glass-card p-4">
          <p className="font-medium">Tax Report</p>
          <p className="text-sm text-muted-foreground">GSTIN and tax breakup (CGST/SGST/IGST).</p>
          <Button className="mt-3 w-full" onClick={handleGenerateTaxReport}>Generate Tax Report</Button>
        </div>
        <div className="glass-card p-4">
          <p className="font-medium">Audit Report</p>
          <p className="text-sm text-muted-foreground">Review decisions, verification, and issue flags.</p>
          <Button className="mt-3 w-full" onClick={handleGenerateAuditReport}>Generate Audit Report</Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-display">Revenue Trend</h3>
                <p className="text-sm text-muted-foreground">Monthly collections analysis</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('revenue-trend.csv', revenueChartData.map((row) => ({ month: row.month, revenue: row.revenue, invoices: row.invoices })))}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" stroke="hsl(220, 9%, 46%)" fontSize={12} />
                <YAxis stroke="hsl(220, 9%, 46%)" fontSize={12} tickFormatter={(value) => formatCompactCurrencyINR(value)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [formatCurrencyINR(value), 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(239, 84%, 67%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(239, 84%, 67%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tax Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Receipt className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-display">Compliance Breakdown</h3>
                <p className="text-sm text-muted-foreground">Distribution by statutory category</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('compliance-breakdown.csv', complianceDistributionData.map((row) => ({ type: row.name, amount: row.value })))}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {complianceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrencyINR(value), 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Revenue */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-display">Client Exposure</h3>
                <p className="text-sm text-muted-foreground">Billed and outstanding amounts by client</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('client-exposure.csv', clientRevenueData.map((row) => ({ client: row.name, billed: row.revenue, outstanding: row.pending })))}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis type="number" stroke="hsl(220, 9%, 46%)" fontSize={12} tickFormatter={(value) => formatCompactCurrencyINR(value)} />
                <YAxis dataKey="name" type="category" stroke="hsl(220, 9%, 46%)" fontSize={12} width={80} />
                <Tooltip formatter={(value: number) => [formatCurrencyINR(value), '']} />
                <Bar dataKey="revenue" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} name="Billed" />
                <Bar dataKey="pending" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} name="Outstanding" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generated Reports List */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-display">Recent Reports</h3>
                <p className="text-sm text-muted-foreground">Previously generated reports</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {format(report.generatedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => downloadCSV(`${report.id}.csv`, report.rows)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {reports.map((report) => (
              <div 
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {format(report.generatedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => downloadRecentReport(report)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
