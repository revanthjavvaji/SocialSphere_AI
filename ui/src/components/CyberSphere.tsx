import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface CyberSphereProps {
    className?: string; // For positioning
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CyberSphere: React.FC<CyberSphereProps> = ({
    className = '',
    size = 'lg'
}) => {
    const sizeClasses = {
        sm: 'scale-75',
        md: 'scale-100',
        lg: 'scale-150',
        xl: 'scale-[2]'
    };

    return (
        <div className={`relative ${className}`}>
            <div className={`relative transform ${sizeClasses[size]}`}>
                {/* Pulsing glow - Replaced Blur with Radial Gradient for Performance */}
                <div
                    className="absolute inset-0 rounded-full animate-pulse will-change-[opacity]"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)'
                    }}
                />

                {/* Spinning Rings - Added will-change-transform */}
                <div className="w-32 h-32 relative will-change-transform">
                    <div className="absolute inset-0 border-2 border-violet-500/30 rounded-full animate-[spin_8s_linear_infinite]" />
                    <div className="absolute inset-2 border-2 border-t-transparent border-r-pink-500/40 border-b-violet-500/40 border-l-transparent rounded-full animate-[spin_6s_linear_infinite_reverse]" />
                    <div className="absolute inset-4 border-2 border-t-cyan-500/40 border-r-transparent border-b-transparent border-l-cyan-500/40 rounded-full animate-[spin_4s_linear_infinite]" />
                </div>


                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-md p-4 rounded-full border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <BrainCircuit className="w-8 h-8 text-violet-400 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};
