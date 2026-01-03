import { useState } from 'react';
import { useTransactions, Transaction, TransactionType } from '@/hooks/useTransactions';
import { useAccount } from '@/hooks/useAccount';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUCCESS':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Success</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'FLAGGED':
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Flagged</Badge>;
    case 'PENDING':
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TransactionCard({ transaction, userId }: { transaction: Transaction; userId: string }) {
  const isSender = transaction.sender_id === userId;
  const isCredit = transaction.transaction_type === 'ADD_MONEY' || 
                   transaction.transaction_type === 'RECEIVE_MONEY' ||
                   (!isSender && transaction.transaction_type === 'SEND_MONEY');
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCredit ? 'bg-green-500/10' : 'bg-primary/10'
            }`}>
              {isCredit ? (
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
              ) : (
                <ArrowUpRight className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {transaction.transaction_type === 'ADD_MONEY' && 'Added Money'}
                {transaction.transaction_type === 'SEND_MONEY' && (isSender ? 'Sent Money' : 'Received Money')}
                {transaction.transaction_type === 'RECEIVE_MONEY' && 'Received Money'}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
              {transaction.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  "{transaction.description}"
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-foreground'}`}>
              {isCredit ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
            </p>
            <div className="mt-1">
              {getStatusBadge(transaction.status)}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            ID: {transaction.id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const pageSize = 10;
  
  const { data: account } = useAccount();
  const { data: transactionsData, isLoading } = useTransactions({
    page,
    pageSize,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
  });

  const totalPages = Math.ceil((transactionsData?.count || 0) / pageSize);

  const clearFilters = () => {
    setTypeFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground">
              {transactionsData?.count || 0} total transactions
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={typeFilter} 
                    onValueChange={(v) => {
                      setTypeFilter(v as TransactionType | 'ALL');
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="ADD_MONEY">Add Money</SelectItem>
                      <SelectItem value="SEND_MONEY">Send Money</SelectItem>
                      <SelectItem value="RECEIVE_MONEY">Receive Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Amount Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => {
                        setMinAmount(e.target.value);
                        setPage(1);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => {
                        setMaxAmount(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactionsData?.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {typeFilter !== 'ALL' || dateFrom || dateTo || minAmount || maxAmount
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start by adding money to your wallet or sending money to someone.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactionsData?.data.map((tx) => (
              <TransactionCard 
                key={tx.id} 
                transaction={tx} 
                userId={account?.user_id || ''} 
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
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
      </div>
    </Layout>
  );
}
