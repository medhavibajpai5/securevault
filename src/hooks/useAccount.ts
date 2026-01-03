import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Account {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAccount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['account', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Account | null;
    },
    enabled: !!user,
  });
}

export function useAddMoney() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get current balance
      const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = Number(account.balance) + amount;
      
      // Update balance
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          receiver_id: user.id,
          amount,
          transaction_type: 'ADD_MONEY',
          status: 'SUCCESS',
          description: 'Added money to wallet'
        });
      
      if (txError) throw txError;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}
