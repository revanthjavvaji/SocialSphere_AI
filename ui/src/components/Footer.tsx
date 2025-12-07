import React from 'react';
import { Wifi, Cpu, Database, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/health');
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span>Status: {isOnline ? 'AI Agents Online' : 'System Offline'}</span>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Multi-Agent</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>MCP Tools</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>RAG Enabled</span>
            </div>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <span>v0.1 · SocialSphere AI Demo</span>
        </div>
      </div>
    </footer>
  );
};
