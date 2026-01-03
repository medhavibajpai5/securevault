import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from '@/hooks/useAccount';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { 
  Plus, 
  Send, 
  Wallet, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  ArrowRight
} from 'lucide-react';

const amountSchema = z.number().positive('Amount must be greater than 0').max(100000, 'Maximum amount is $100,000');
const emailSchema = z.string().email('Please enter a valid email address');

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function Transfer() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('action') === 'add' ? 'add' : 'send';
  
  const [addAmount, setAddAmount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const { data: account } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const addMoneyMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: currentAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = Number(currentAccount.balance) + amount;
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
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
      
      return { success: true, newBalance };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Money Added!',
        description: `Successfully added ${formatCurrency(Number(addAmount))} to your wallet.`,
      });
      setAddAmount('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add money',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const sendMoneyMutation = useMutation({
    mutationFn: async ({ amount, email, desc }: { amount: number; email: string; desc: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Find recipient by email
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!recipientProfile) throw new Error('Recipient not found. Please check the email address.');
      if (recipientProfile.id === user.id) throw new Error('You cannot send money to yourself.');
      
      // Check sender balance
      const { data: senderAccount, error: senderError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (senderError) throw senderError;
      if (Number(senderAccount.balance) < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Get fraud settings
      const { data: fraudSettings } = await supabase
        .from('fraud_settings')
        .select('*')
        .limit(1)
        .single();
      
      let status: 'SUCCESS' | 'FLAGGED' = 'SUCCESS';
      let flagReason = '';
      
      // Check for fraud indicators
      if (fraudSettings && amount > Number(fraudSettings.max_single_transaction)) {
        status = 'FLAGGED';
        flagReason = `Transaction amount $${amount} exceeds maximum threshold of $${fraudSettings.max_single_transaction}`;
      }
      
      // Check velocity (transactions in last N minutes)
      if (fraudSettings && status === 'SUCCESS') {
        const windowStart = new Date(Date.now() - fraudSettings.velocity_window_minutes * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id)
          .gte('created_at', windowStart);
        
        if (count && count >= fraudSettings.velocity_max_transactions) {
          status = 'FLAGGED';
          flagReason = `Too many transactions (${count}) within ${fraudSettings.velocity_window_minutes} minutes`;
        }
      }
      
      // Update sender balance
      const newSenderBalance = Number(senderAccount.balance) - amount;
      const { error: updateSenderError } = await supabase
        .from('accounts')
        .update({ balance: newSenderBalance })
        .eq('user_id', user.id);
      
      if (updateSenderError) throw updateSenderError;
      
      // Update recipient balance (only if not flagged)
      if (status === 'SUCCESS') {
        const { data: recipientAccount, error: recipientAccError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('user_id', recipientProfile.id)
          .single();
        
        if (recipientAccError) throw recipientAccError;
        
        const newRecipientBalance = Number(recipientAccount.balance) + amount;
        const { error: updateRecipientError } = await supabase
          .from('accounts')
          .update({ balance: newRecipientBalance })
          .eq('user_id', recipientProfile.id);
        
        if (updateRecipientError) throw updateRecipientError;
      }
      
      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          sender_id: user.id,
          receiver_id: recipientProfile.id,
          amount,
          transaction_type: 'SEND_MONEY',
          status,
          description: desc || 'P2P Transfer'
        })
        .select()
        .single();
      
      if (txError) throw txError;
      
      // If flagged, create fraud flag entry
      if (status === 'FLAGGED') {
        await supabase
          .from('fraud_flags')
          .insert({
            transaction_id: transaction.id,
            flag_reason: flagReason
          });
      }
      
      return { success: true, status, flagReason };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      if (data.status === 'FLAGGED') {
        toast({
          title: 'Transaction Flagged',
          description: 'Your transaction has been flagged for review. The amount has been deducted but will be held until review.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Money Sent!',
          description: `Successfully sent ${formatCurrency(Number(sendAmount))} to ${recipientEmail}.`,
        });
      }
      setSendAmount('');
      setRecipientEmail('');
      setDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send money',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    const amount = parseFloat(addAmount);
    try {
      amountSchema.parse(amount);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.addAmount = err.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      addMoneyMutation.mutate(amount);
    }
  };

  const handleSendMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    const amount = parseFloat(sendAmount);
    try {
      amountSchema.parse(amount);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.sendAmount = err.errors[0].message;
      }
    }
    
    try {
      emailSchema.parse(recipientEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.recipientEmail = err.errors[0].message;
      }
    }
    
    if (amount > Number(account?.balance || 0)) {
      newErrors.sendAmount = 'Insufficient balance';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      sendMoneyMutation.mutate({ amount, email: recipientEmail, desc: description });
    }
  };

  const quickAddAmounts = [50, 100, 250, 500, 1000];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transfer Money</h1>
          <p className="text-muted-foreground">Add funds or send money to others</p>
        </div>

        {/* Balance Card */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="font-bold text-lg">{formatCurrency(Number(account?.balance || 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="add" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Money
                </TabsTrigger>
                <TabsTrigger value="send" className="gap-2">
                  <Send className="w-4 h-4" />
                  Send Money
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="add">
                <form onSubmit={handleAddMoney} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="add-amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="add-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className="pl-8 text-lg h-12"
                      />
                    </div>
                    {errors.addAmount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.addAmount}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quick Add</Label>
                    <div className="flex flex-wrap gap-2">
                      {quickAddAmounts.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAddAmount(amt.toString())}
                        >
                          ${amt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={addMoneyMutation.isPending}
                  >
                    {addMoneyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {addAmount && formatCurrency(parseFloat(addAmount) || 0)}
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="send">
                <form onSubmit={handleSendMoney} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-email">Recipient Email</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                    {errors.recipientEmail && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.recipientEmail}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="send-amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="send-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        className="pl-8 text-lg h-12"
                      />
                    </div>
                    {errors.sendAmount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.sendAmount}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Note (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What's this for?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={sendMoneyMutation.isPending}
                  >
                    {sendMoneyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {sendAmount && formatCurrency(parseFloat(sendAmount) || 0)}
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
