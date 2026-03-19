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

const COLORS = ['hsl(239, 84%, 67%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(280, 84%, 60%)', 'hsl(0, 84%, 60%)'];

export function ReportsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const { toast } = useToast();
  const { reports, revenueChartData, complianceDistributionData, clients } = useAuditData();

  const clientRevenueData = clients.map(client => ({
    name: client.company.split(' ')[0],
    revenue: client.totalBilled,
    pending: client.pendingAmount,
  }));

  const downloadJSON = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  const handleGenerateReport = () => {
    downloadJSON(`audit-snapshot-${Date.now()}.json`, {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      revenue: revenueChartData,
      compliance: complianceDistributionData,
      clients: clientRevenueData,
    });

    toast({
      title: "Report Generated",
      description: "Snapshot exported successfully.",
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
                  <Button variant="ghost" size="icon" onClick={() => downloadJSON(`${report.id}.json`, report)}>
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
