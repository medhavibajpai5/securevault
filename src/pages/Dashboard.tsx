import { useAccount } from '@/hooks/useAccount';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import Layout from '@/components/Layout';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import Skeleton from '@/components/ui/skeleton';

import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  TrendingUp,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUCCESS':
      return (
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
          Success
        </Badge>
      );
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'FLAGGED':
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
          Flagged
        </Badge>
      );
    case 'PENDING':
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TransactionRow({
  transaction,
  userId,
}: {
  transaction: Transaction;
  userId: string;
}) {
  const isSender = transaction.sender_id === userId;
  const isCredit =
    transaction.transaction_type === 'ADD_MONEY' ||
    transaction.transaction_type === 'RECEIVE_MONEY' ||
    (!isSender && transaction.transaction_type === 'SEND_MONEY');

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCredit ? 'bg-green-500/10' : 'bg-primary/10'
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="w-5 h-5 text-green-600" />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {transaction.transaction_type === 'ADD_MONEY' && 'Added Money'}
            {transaction.transaction_type === 'SEND_MONEY' &&
              (isSender ? 'Sent Money' : 'Received Money')}
            {transaction.transaction_type === 'RECEIVE_MONEY' &&
              'Received Money'}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(
              new Date(transaction.created_at),
              'MMM d, yyyy • h:mm a'
            )}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-semibold ${
            isCredit ? 'text-green-600' : 'text-foreground'
          }`}
        >
          {isCredit ? '+' : '-'}
          {formatCurrency(Number(transaction.amount))}
        </p>
        {getStatusBadge(transaction.status)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: account, isLoading: accountLoading } = useAccount();
  const { data: transactionsData, isLoading: txLoading } =
    useTransactions({ pageSize: 5 });
  const { data: profile } = useProfile();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back
            {profile?.full_name
              ? `, ${profile.full_name.split(' ')[0]}`
              : ''}
            !
          </h1>
          <p className="text-muted-foreground">
            Here's your financial overview
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">
                  Total Balance
                </p>
                {accountLoading ? (
                  <Skeleton className="h-10 w-48 mt-2 bg-primary-foreground/20" />
                ) : (
                  <p className="text-4xl font-bold mt-1">
                    {formatCurrency(
                      Number(account?.balance || 0),
                      account?.currency
                    )}
                  </p>
                )}
                <p className="text-primary-foreground/60 text-xs mt-2">
                  Last updated: {format(new Date(), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                asChild
                className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link to="/transfer?action=add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Money
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/transfer">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Send
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              transactionsData?.data.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  userId={account?.user_id || ''}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Security Tip</p>
              <p className="text-sm text-muted-foreground">
                Never share your login credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
