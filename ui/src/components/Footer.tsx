import React from 'react';
import { Wifi, Cpu, Database, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Status: AI Agents Online</span>
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
