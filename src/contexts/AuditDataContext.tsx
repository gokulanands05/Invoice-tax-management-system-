import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification, Client, DashboardMetrics, Invoice, Report, TaxRecord, TaxStatus } from '@/types/invoice';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUPABASE_TABLES, isSupabaseConfigured } from '@/lib/appConfig';

type DataSource = 'live' | 'unavailable';

interface AuditDataContextType {
  source: DataSource;
  loading: boolean;
  clients: Client[];
  invoices: Invoice[];
  complianceRecords: TaxRecord[];
  metrics: DashboardMetrics;
  revenueChartData: { month: string; revenue: number; invoices: number }[];
  complianceDistributionData: { name: string; value: number }[];
  reports: Report[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  addClient: (client: Client) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  updateComplianceStatus: (recordId: string, status: TaxStatus) => Promise<void>;
  markAllNotificationsRead: () => void;
}

const defaultMetrics: DashboardMetrics = {
  totalRevenue: 0,
  pendingInvoices: 0,
  pendingTaxes: 0,
  totalClients: 0,
  revenueGrowth: 0,
  invoicesThisMonth: 0,
  taxesDueThisMonth: 0,
};

const AuditDataContext = createContext<AuditDataContextType>({
  source: 'unavailable',
  loading: true,
  clients: [],
  invoices: [],
  complianceRecords: [],
  metrics: defaultMetrics,
  revenueChartData: [],
  complianceDistributionData: [],
  reports: [],
  notifications: [],
  unreadNotificationCount: 0,
  addClient: async () => {},
  addInvoice: async () => {},
  deleteClient: async () => {},
  deleteInvoice: async () => {},
  updateComplianceStatus: async () => {},
  markAllNotificationsRead: () => {},
});

type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  address: string | null;
  total_billed: number | null;
  pending_amount: number | null;
  invoice_count: number | null;
  created_at: string;
};

type EngagementRow = {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: Invoice['status'];
  due_date: string;
  created_at: string;
  items: Invoice['items'] | null;
};

type ComplianceRow = {
  id: string;
  type: string;
  period: string;
  amount: number;
  status: TaxStatus;
  due_date: string;
  filed_date: string | null;
  paid_date: string | null;
};

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    company: row.company,
    address: row.address || '',
    totalBilled: row.total_billed || 0,
    pendingAmount: row.pending_amount || 0,
    invoiceCount: row.invoice_count || 0,
    createdAt: new Date(row.created_at),
  };
}

function mapEngagementRow(row: EngagementRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    clientName: row.client_name,
    amount: row.amount,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    status: row.status,
    dueDate: new Date(row.due_date),
    createdAt: new Date(row.created_at),
    items: row.items || [],
  };
}

function mapComplianceRow(row: ComplianceRow): TaxRecord {
  return {
    id: row.id,
    type: row.type,
    period: row.period,
    amount: row.amount,
    status: row.status,
    dueDate: new Date(row.due_date),
    filedDate: row.filed_date ? new Date(row.filed_date) : undefined,
    paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
  };
}

function buildMetrics(clients: Client[], invoices: Invoice[], complianceRecords: TaxRecord[]): DashboardMetrics {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
  const monthlyInvoices = invoices.filter(
    (invoice) => invoice.createdAt.getMonth() === currentMonth && invoice.createdAt.getFullYear() === currentYear,
  );
  const dueThisMonth = complianceRecords.filter(
    (record) => record.dueDate.getMonth() === currentMonth && record.dueDate.getFullYear() === currentYear,
  );

  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const pendingInvoices = invoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const pendingTaxes = complianceRecords
    .filter((record) => record.status === 'pending')
    .reduce((sum, record) => sum + record.amount, 0);

  return {
    totalRevenue,
    pendingInvoices,
    pendingTaxes,
    totalClients: clients.length,
    revenueGrowth: invoices.length ? 12.5 : 0,
    invoicesThisMonth: monthlyInvoices.length,
    taxesDueThisMonth: dueThisMonth.length,
  };
}

function buildRevenueData(invoices: Invoice[]) {
  if (!invoices.length) {
    return [];
  }

  const buckets = new Map<string, { month: string; revenue: number; invoices: number }>();

  invoices.forEach((invoice) => {
    const month = invoice.createdAt.toLocaleString('en-IN', { month: 'short' });
    const existing = buckets.get(month);
    if (existing) {
      existing.revenue += invoice.totalAmount;
      existing.invoices += 1;
      return;
    }

    buckets.set(month, {
      month,
      revenue: invoice.totalAmount,
      invoices: 1,
    });
  });

  return Array.from(buckets.values()).slice(-6);
}

function buildComplianceDistribution(complianceRecords: TaxRecord[]) {
  if (!complianceRecords.length) {
    return [];
  }

  const grouped = new Map<string, number>();
  complianceRecords.forEach((record) => {
    grouped.set(record.type, (grouped.get(record.type) || 0) + record.amount);
  });

  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}

function buildReports(invoices: Invoice[], complianceRecords: TaxRecord[], clients: Client[]): Report[] {
  return [
    {
      id: 'audit-revenue',
      title: 'Audit Revenue Snapshot',
      type: 'revenue',
      generatedAt: new Date(),
      data: buildRevenueData(invoices),
    },
    {
      id: 'audit-compliance',
      title: 'Compliance Exposure Summary',
      type: 'tax',
      generatedAt: new Date(),
      data: buildComplianceDistribution(complianceRecords),
    },
    {
      id: 'audit-clients',
      title: 'Client Risk Coverage',
      type: 'client',
      generatedAt: new Date(),
      data: clients,
    },
  ];
}

export function AuditDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [source, setSource] = useState<DataSource>('unavailable');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<TaxRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const metrics = buildMetrics(clients, invoices, complianceRecords);
  const revenueChartData = buildRevenueData(invoices);
  const complianceDistributionData = buildComplianceDistribution(complianceRecords);
  const reports = buildReports(invoices, complianceRecords, clients);
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length;

  function addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        read: false,
        ...notification,
      },
      ...prev,
    ].slice(0, 25));
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }

  function handleRealtimeEvent(table: string, eventType: string, payload: Record<string, unknown>) {
    if (table === SUPABASE_TABLES.clients && eventType === 'INSERT') {
      const company = String(payload.company || 'A client');
      addNotification({
        title: 'New client added',
        description: `${company} was added to your workspace.`,
      });
      return;
    }

    if (table === SUPABASE_TABLES.engagements && eventType === 'INSERT') {
      const invoiceNumber = String(payload.invoice_number || 'New bill');
      const clientName = String(payload.client_name || 'Unknown client');
      addNotification({
        title: 'New bill created',
        description: `${invoiceNumber} was created for ${clientName}.`,
      });
      return;
    }

    if (table === SUPABASE_TABLES.compliance && eventType === 'UPDATE') {
      const type = String(payload.type || 'Compliance record');
      const status = String(payload.status || 'updated');
      addNotification({
        title: 'Compliance status updated',
        description: `${type} is now marked as ${status}.`,
      });
    }
  }

  async function loadWorkspaceData() {
    if (!user || !isSupabaseConfigured) {
      setSource('unavailable');
      setClients([]);
      setInvoices([]);
      setComplianceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [clientsResult, invoicesResult, complianceResult] = await Promise.all([
        supabase
          .from(SUPABASE_TABLES.clients)
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from(SUPABASE_TABLES.engagements)
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from(SUPABASE_TABLES.compliance)
          .select('*')
          .eq('owner_id', user.id)
          .order('due_date', { ascending: true }),
      ]);

      if (clientsResult.error || invoicesResult.error || complianceResult.error) {
        throw clientsResult.error || invoicesResult.error || complianceResult.error;
      }

      setClients((clientsResult.data as ClientRow[]).map(mapClientRow));
      setInvoices((invoicesResult.data as EngagementRow[]).map(mapEngagementRow));
      setComplianceRecords((complianceResult.data as ComplianceRow[]).map(mapComplianceRow));
      setSource('live');
    } catch (error) {
      console.error('Supabase could not load workspace data.', error);
      setClients([]);
      setInvoices([]);
      setComplianceRecords([]);
      setSource('unavailable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspaceData();
  }, [user]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      return;
    }

    const channel = supabase
      .channel(`audit-workspace-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SUPABASE_TABLES.clients, filter: `owner_id=eq.${user.id}` },
        (payload) => {
          handleRealtimeEvent(SUPABASE_TABLES.clients, payload.eventType, (payload.new || payload.old || {}) as Record<string, unknown>);
          void loadWorkspaceData();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SUPABASE_TABLES.engagements, filter: `owner_id=eq.${user.id}` },
        (payload) => {
          handleRealtimeEvent(SUPABASE_TABLES.engagements, payload.eventType, (payload.new || payload.old || {}) as Record<string, unknown>);
          void loadWorkspaceData();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SUPABASE_TABLES.compliance, filter: `owner_id=eq.${user.id}` },
        (payload) => {
          handleRealtimeEvent(SUPABASE_TABLES.compliance, payload.eventType, (payload.new || payload.old || {}) as Record<string, unknown>);
          void loadWorkspaceData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  async function addClient(client: Client) {
    if (!user || !isSupabaseConfigured) {
      setClients((prev) => [client, ...prev]);
      return;
    }

    const { error } = await supabase.from(SUPABASE_TABLES.clients).insert({
      id: client.id,
      owner_id: user.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
      total_billed: client.totalBilled,
      pending_amount: client.pendingAmount,
      invoice_count: client.invoiceCount,
      created_at: client.createdAt.toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  async function addInvoice(invoice: Invoice) {
    if (!user || !isSupabaseConfigured) {
      setInvoices((prev) => [invoice, ...prev]);
      return;
    }

    const { error } = await supabase.from(SUPABASE_TABLES.engagements).insert({
      id: invoice.id,
      owner_id: user.id,
      invoice_number: invoice.invoiceNumber,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      amount: invoice.amount,
      tax_amount: invoice.taxAmount,
      total_amount: invoice.totalAmount,
      status: invoice.status,
      due_date: invoice.dueDate.toISOString(),
      created_at: invoice.createdAt.toISOString(),
      items: invoice.items,
    });

    if (error) {
      throw error;
    }
  }

  async function updateComplianceStatus(recordId: string, status: TaxStatus) {
    const now = new Date().toISOString();

    if (!user || !isSupabaseConfigured) {
      setComplianceRecords((prev) =>
        prev.map((record) =>
          record.id === recordId
            ? {
                ...record,
                status,
                filedDate: status === 'filed' ? new Date() : record.filedDate,
                paidDate: status === 'paid' ? new Date() : record.paidDate,
              }
            : record,
        ),
      );
      return;
    }

    const payload =
      status === 'paid'
        ? { status, paid_date: now }
        : status === 'filed'
          ? { status, filed_date: now }
          : { status };

    const { error } = await supabase
      .from(SUPABASE_TABLES.compliance)
      .update(payload)
      .eq('id', recordId)
      .eq('owner_id', user.id);

    if (error) {
      throw error;
    }
  }

  async function deleteClient(clientId: string) {
    if (!user || !isSupabaseConfigured) {
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      return;
    }

    const { error } = await supabase.from(SUPABASE_TABLES.clients).delete().eq('id', clientId).eq('owner_id', user.id);
    if (error) {
      throw error;
    }
  }

  async function deleteInvoice(invoiceId: string) {
    if (!user || !isSupabaseConfigured) {
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      return;
    }

    const { error } = await supabase.from(SUPABASE_TABLES.engagements).delete().eq('id', invoiceId).eq('owner_id', user.id);
    if (error) {
      throw error;
    }
  }

  return (
    <AuditDataContext.Provider
      value={{
        source,
        loading,
        clients,
        invoices,
        complianceRecords,
        metrics,
        revenueChartData,
        complianceDistributionData,
        reports,
        notifications,
        unreadNotificationCount,
        addClient,
        addInvoice,
        deleteClient,
        deleteInvoice,
        updateComplianceStatus,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuditDataContext.Provider>
  );
}

export function useAuditData() {
  return useContext(AuditDataContext);
}
