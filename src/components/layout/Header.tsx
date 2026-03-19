import { Bell, Search, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAuditData } from '@/contexts/AuditDataContext';

export function Header() {
  const { signOut, user } = useAuth();
  const { source, notifications, unreadNotificationCount, markAllNotificationsRead, clients, invoices, complianceRecords, reports } = useAuditData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as { id: string; label: string; path: string; type: string }[];

    const clientMatches = clients
      .filter((client) =>
        client.name.toLowerCase().includes(q) ||
        client.company.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q),
      )
      .map((client) => ({
        id: `client-${client.id}`,
        label: `${client.company} (${client.name})`,
        path: '/clients',
        type: 'Client',
      }));

    const invoiceMatches = invoices
      .filter((invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.clientName.toLowerCase().includes(q),
      )
      .map((invoice) => ({
        id: `invoice-${invoice.id}`,
        label: `${invoice.invoiceNumber} - ${invoice.clientName}`,
        path: '/invoices',
        type: 'Bill',
      }));

    const complianceMatches = complianceRecords
      .filter((record) =>
        record.type.toLowerCase().includes(q) ||
        record.period.toLowerCase().includes(q),
      )
      .map((record) => ({
        id: `compliance-${record.id}`,
        label: `${record.type} (${record.period})`,
        path: '/taxes',
        type: 'Compliance',
      }));

    const reportMatches = reports
      .filter((report) => report.title.toLowerCase().includes(q))
      .map((report) => ({
        id: `report-${report.id}`,
        label: report.title,
        path: '/reports',
        type: 'Report',
      }));

    return [...clientMatches, ...invoiceMatches, ...complianceMatches, ...reportMatches].slice(0, 8);
  }, [searchQuery, clients, invoices, complianceRecords, reports]);

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setSearchQuery('');
  };

  const handleSearchSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (searchResults.length > 0) {
      handleSearchSelect(searchResults[0].path);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search engagements, clients, reports..."
          className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
        />
        {searchQuery.trim() && (
          <div className="absolute z-40 mt-2 w-full rounded-lg border border-border bg-popover shadow-lg">
            {searchResults.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
            ) : (
              searchResults.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                  onClick={() => handleSearchSelect(result.path)}
                >
                  <span>{result.label}</span>
                  <span className="text-xs text-muted-foreground">{result.type}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="hidden sm:flex">
          {source === 'live' ? 'Realtime live' : 'Realtime unavailable'}
        </Badge>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={markAllNotificationsRead}>
                Mark all read
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                No live notifications yet
              </DropdownMenuItem>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 cursor-pointer">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-sm text-muted-foreground">{notification.description}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(user?.email?.[0] || 'A').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{user?.email?.split('@')[0] || 'Auditor'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
