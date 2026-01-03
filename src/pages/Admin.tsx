import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Check, 
  X,
  Users,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface FraudFlag {
  id: string;
  transaction_id: string;
  flag_reason: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  transaction?: {
    id: string;
    amount: number;
    sender_id: string;
    receiver_id: string;
    transaction_type: string;
    status: string;
    created_at: string;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function FlaggedTransactionCard({ 
  flag, 
  onResolve 
}: { 
  flag: FraudFlag; 
  onResolve: (id: string, approved: boolean) => void;
}) {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (approved: boolean) => {
    setIsResolving(true);
    await onResolve(flag.id, approved);
    setIsResolving(false);
  };

  return (
    <Card className={flag.is_resolved ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">Flagged Transaction</p>
              <p className="text-sm text-muted-foreground mt-1">
                {flag.flag_reason}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-muted-foreground">
                  Amount: <span className="text-foreground font-medium">
                    {formatCurrency(Number(flag.transaction?.amount || 0))}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Type: <span className="text-foreground">
                    {flag.transaction?.transaction_type}
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Flagged: {format(new Date(flag.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {flag.is_resolved ? (
              <Badge className="bg-green-500/10 text-green-600">Resolved</Badge>
            ) : (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResolve(true)}
                  disabled={isResolving}
                  className="gap-1"
                >
                  {isResolving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleResolve(false)}
                  disabled={isResolving}
                  className="gap-1"
                >
                  {isResolving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            Transaction ID: {flag.transaction_id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [page, setPage] = useState(1);
  const [showResolved, setShowResolved] = useState(false);
  const pageSize = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fraud flags
  const { data: flagsData, isLoading: flagsLoading } = useQuery({
    queryKey: ['fraud-flags', page, showResolved],
    queryFn: async () => {
      let query = supabase
        .from('fraud_flags')
        .select('*, transaction:transactions(*)', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (!showResolved) {
        query = query.eq('is_resolved', false);
      }
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as FraudFlag[], count: count || 0 };
    }
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, transactionsRes, flaggedRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount').eq('status', 'SUCCESS'),
        supabase.from('fraud_flags').select('*', { count: 'exact', head: true }).eq('is_resolved', false)
      ]);
      
      const totalVolume = transactionsRes.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      return {
        totalUsers: usersRes.count || 0,
        totalVolume,
        pendingFlags: flaggedRes.count || 0
      };
    }
  });

  // Resolve flag mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ flagId, approved }: { flagId: string; approved: boolean }) => {
      // Get the flag and transaction
      const { data: flag, error: flagError } = await supabase
        .from('fraud_flags')
        .select('*, transaction:transactions(*)')
        .eq('id', flagId)
        .single();
      
      if (flagError) throw flagError;
      
      const transaction = flag.transaction;
      
      if (approved && transaction.status === 'FLAGGED') {
        // Complete the transaction - credit receiver
        const { data: receiverAccount, error: recError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('user_id', transaction.receiver_id)
          .single();
        
        if (recError) throw recError;
        
        const newBalance = Number(receiverAccount.balance) + Number(transaction.amount);
        
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('user_id', transaction.receiver_id);
        
        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'SUCCESS' })
          .eq('id', transaction.id);
      } else if (!approved && transaction.status === 'FLAGGED') {
        // Refund sender
        const { data: senderAccount, error: sendError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('user_id', transaction.sender_id)
          .single();
        
        if (sendError) throw sendError;
        
        const newBalance = Number(senderAccount.balance) + Number(transaction.amount);
        
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('user_id', transaction.sender_id);
        
        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'FAILED' })
          .eq('id', transaction.id);
      }
      
      // Mark flag as resolved
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase
        .from('fraud_flags')
        .update({
          is_resolved: true,
          resolved_by: userData.user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', flagId);
      
      return { approved };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fraud-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: data.approved ? 'Transaction Approved' : 'Transaction Rejected',
        description: data.approved 
          ? 'The transaction has been completed successfully.'
          : 'The transaction has been rejected and refunded.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to resolve',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleResolve = async (flagId: string, approved: boolean) => {
    await resolveMutation.mutateAsync({ flagId, approved });
  };

  const totalPages = Math.ceil((flagsData?.count || 0) / pageSize);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage users and review flagged transactions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalVolume || 0)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Flags</p>
                <p className="text-2xl font-bold">{stats?.pendingFlags || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Flagged Transactions</CardTitle>
                <CardDescription>
                  Review and resolve suspicious transactions
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowResolved(!showResolved);
                  setPage(1);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showResolved ? 'Hide Resolved' : 'Show Resolved'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {flagsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : flagsData?.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-medium text-lg mb-2">All Clear!</h3>
                <p className="text-muted-foreground">
                  {showResolved 
                    ? 'No flagged transactions found.'
                    : 'No pending flagged transactions to review.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {flagsData?.data.map((flag) => (
                  <FlaggedTransactionCard 
                    key={flag.id} 
                    flag={flag}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
