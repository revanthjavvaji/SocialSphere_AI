import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ChatConsole } from '@/components/dashboard/ChatConsole';
import { MarketingDashboard } from '@/components/dashboard/MarketingDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

const Dashboard: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom navbar with logout */}
      <Navbar>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-sm text-muted-foreground hidden sm:block">
            Welcome, {user?.fullName?.split(' ')[0]}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </Navbar>

      <main className="flex-1 pt-20">
        <div className="h-[calc(100vh-5rem-3.5rem)] flex flex-row">
          {/* Chat Console - Left Side */}
          <div className="w-[45%] h-full border-r border-border/50 bg-card/30">
            <ChatConsole />
          </div>

          {/* Marketing Dashboard - Right Side */}
          <div className="w-[55%] h-full overflow-hidden">
            <MarketingDashboard />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
