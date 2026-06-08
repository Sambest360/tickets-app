import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  useAdminLogin, 
  useGetEventStats, 
  useGetRecentRegistrations, 
  useListTickets, 
  useCancelTicket 
} from "@workspace/api-client-react";
import { 
  Crown, Users, Ticket as TicketIcon, Banknote, ShieldAlert, 
  LogOut, Download, Search, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  
  if (!token) {
    return <AdminLogin onLogin={(t) => setToken(t)} />;
  }

  return <Dashboard token={token} onLogout={() => {
    localStorage.removeItem("admin_token");
    setToken(null);
  }} />;
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useAdminLogin();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          localStorage.setItem("admin_token", data.token);
          onLogin(data.token);
        },
        onError: () => {
          toast({
            title: "Login Failed",
            description: "Invalid credentials.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-8 pt-10">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle className="font-cinzel text-2xl text-primary">Admin Access</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">Crowned In His Glory 2026</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="bg-black border-primary/30 focus-visible:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-black border-primary/30 focus-visible:ring-primary"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-secondary text-black font-bold h-12"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Login"}
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Return to Site
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { data: stats, isLoading: statsLoading } = useGetEventStats();
  const [search, setSearch] = useState("");
  const { data: ticketsData, isLoading: ticketsLoading } = useListTickets({ search, limit: 100 });
  const cancelMutation = useCancelTicket();
  const { toast } = useToast();

  const handleCancel = (id: number) => {
    if (confirm("Are you sure you want to cancel this ticket?")) {
      cancelMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Ticket Cancelled", description: "The ticket has been marked as cancelled." });
            // In a real app we'd invalidate queries here
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to cancel ticket.", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleExport = () => {
    if (!ticketsData?.tickets) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Ticket Number,First Name,Last Name,Phone,Gender,Church,Status,Checked In\n"
      + ticketsData.tickets.map(t => 
          `${t.ticketNumber},${t.firstName},${t.lastName},${t.phone},${t.gender},${t.churchAssembly || ''},${t.status},${t.checkedIn ? 'Yes' : 'No'}`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "crowned_in_his_glory_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="font-cinzel font-bold text-lg text-primary hidden sm:inline">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/scan">
              <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                Scanner App
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-red-400">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sold</CardTitle>
              <TicketIcon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalTickets || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <Banknote className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-accent">
                {statsLoading ? <Skeleton className="h-8 w-24" /> : `R${stats?.totalRevenue || 0}`}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-green-500">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.checkedIn || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.remaining || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card className="bg-card border-primary/20">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="font-cinzel text-xl text-primary">All Tickets</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, phone, ticket..."
                  className="pl-8 bg-black border-primary/30"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={handleExport} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 whitespace-nowrap">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-primary/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-black/50">
                  <TableRow className="border-primary/20 hover:bg-transparent">
                    <TableHead className="text-primary font-medium">Ticket #</TableHead>
                    <TableHead className="text-primary font-medium">Name</TableHead>
                    <TableHead className="text-primary font-medium">Phone</TableHead>
                    <TableHead className="text-primary font-medium">Church</TableHead>
                    <TableHead className="text-primary font-medium">Status</TableHead>
                    <TableHead className="text-primary font-medium">Check-in</TableHead>
                    <TableHead className="text-primary font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        <Skeleton className="h-6 w-full max-w-sm mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : ticketsData?.tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ticketsData?.tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="border-primary/10 hover:bg-primary/5">
                        <TableCell className="font-mono text-xs">{ticket.ticketNumber}</TableCell>
                        <TableCell className="font-medium">{ticket.firstName} {ticket.lastName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{ticket.phone}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{ticket.churchAssembly || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === 'valid' ? 'default' : 'destructive'} 
                            className={ticket.status === 'valid' ? "bg-primary/20 text-primary hover:bg-primary/30 border-primary/30" : ""}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.checkedIn ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground border-border">
                              <Clock className="w-3 h-3 mr-1" /> No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancel(ticket.id)}
                            disabled={ticket.status === 'cancelled'}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 px-2"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
