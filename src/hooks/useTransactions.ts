import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'FLAGGED' | 'PENDING';
export type TransactionType = 'ADD_MONEY' | 'SEND_MONEY' | 'RECEIVE_MONEY';

export interface Transaction {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  amount: number;
  transaction_type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  sender_profile?: { email: string; full_name: string | null } | null;
  receiver_profile?: { email: string; full_name: string | null } | null;
}

interface UseTransactionsOptions {
  dateFrom?: Date;
  dateTo?: Date;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { user } = useAuth();
  const { dateFrom, dateTo, type, minAmount, maxAmount, page = 1, pageSize = 10 } = options;
  
  return useQuery({
    queryKey: ['transactions', user?.id, options],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 };
      
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }
      if (type) {
        query = query.eq('transaction_type', type);
      }
      if (minAmount !== undefined) {
        query = query.gte('amount', minAmount);
      }
      if (maxAmount !== undefined) {
        query = query.lte('amount', maxAmount);
      }
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data: data as Transaction[], count: count || 0 };
    },
    enabled: !!user,
  });
}

export function useAllTransactions(options: UseTransactionsOptions = {}) {
  const { page = 1, pageSize = 10 } = options;
  
  return useQuery({
    queryKey: ['all-transactions', options],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data: data as Transaction[], count: count || 0 };
    },
  });
}
