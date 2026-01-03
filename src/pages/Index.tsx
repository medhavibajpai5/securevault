import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Wallet, 
  ArrowRight, 
  Lock, 
  Zap, 
  Users,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useEffect } from 'react';

const features = [
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    description: 'Your funds are protected with industry-leading encryption and fraud detection.'
  },
  {
    icon: Zap,
    title: 'Instant Transfers',
    description: 'Send money to anyone instantly, 24/7, with no hidden fees.'
  },
  {
    icon: Users,
    title: 'P2P Payments',
    description: 'Split bills, pay friends, or receive payments with just an email address.'
  },
  {
    icon: TrendingUp,
    title: 'Real-time Tracking',
    description: 'Monitor all your transactions with detailed history and analytics.'
  }
];

const benefits = [
  'No monthly fees',
  'Instant money transfers',
  'Advanced fraud protection',
  '24/7 customer support',
  'Detailed transaction history',
  'Role-based access control'
];

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">SecureVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Enterprise-Grade Financial Security
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Secure Financial Transactions
              <span className="text-primary"> Made Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience banking-level security with our production-grade REST API system. 
              Send money, manage wallets, and track transactions with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Built for Security & Speed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with robust security measures 
              to deliver a seamless financial experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Everything You Need for Secure Transactions
              </h2>
              <p className="text-muted-foreground mb-8">
                From personal payments to business transactions, SecureVault provides 
                the tools and security you need to manage your finances with confidence.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <Card className="bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Available Balance</p>
                    <p className="text-3xl font-bold">$12,450.00</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-primary-foreground/10 rounded-lg">
                    <span className="text-sm">Today's Transactions</span>
                    <span className="font-semibold">+$2,340</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary-foreground/10 rounded-lg">
                    <span className="text-sm">Pending Transfers</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                </div>
              </Card>
              
              <div className="absolute -top-4 -right-4 bg-green-500 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of users who trust SecureVault for their financial transactions. 
            Create your free account in seconds.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">SecureVault</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SecureVault. Production-grade secure financial transactions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
