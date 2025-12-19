import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { NeuralBackground } from './NeuralBackground';
import { CyberSphere } from './CyberSphere';

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading,
    message = "Initializing AI Core",
    subMessage = "Establishing neural connections..."
}) => {
    if (!isLoading) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center overflow-hidden animate-in fade-in duration-300">
            {/* Neural Network Canvas Background */}
            <NeuralBackground className="absolute inset-0" opacity={0.6} />

            {/* Central Core UI */}
            <div className="relative z-10 flex flex-col items-center p-12">
                {/* Core Animation */}
                <div className="relative mb-12">
                    <CyberSphere size="lg" />
                </div>

                {/* Text */}
                <div className="space-y-4 text-center">
                    <h2 className="text-3xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-gradient-x">
                        {message}
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground font-mono text-sm uppercase tracking-widest">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="animate-pulse">{subMessage}</span>
                    </div>
                    {/* Thinking lines */}
                    <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-violet-500/50 to-transparent rounded-full animate-pulse" />
                </div>
            </div>
        </div>,
        document.body
    );
};
