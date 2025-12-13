import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, BrainCircuit } from 'lucide-react';

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
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isLoading) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        // Increase particle count for a denser network
        const particleCount = 80;
        const connectionDistance = 150;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                // Slower, smoother movement
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                // Violet/Cyan mix
                ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
                ctx.fill();
            }
        }

        // Init particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        // Gradient opacity based on distance
                        const opacity = 1 - dist / connectionDistance;
                        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity * 0.5})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isLoading]);

    if (!isLoading) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center overflow-hidden animate-in fade-in duration-300">
            {/* Neural Network Canvas Background */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none opacity-60"
            />

            {/* Central Core UI */}
            <div className="relative z-10 flex flex-col items-center p-12">
                {/* Core Animation */}
                <div className="relative mb-12 transform scale-150">
                    {/* Pulsing glow */}
                    <div className="absolute inset-0 bg-violet-500/20 blur-[50px] rounded-full animate-pulse" />

                    {/* Spinning Rings */}
                    <div className="w-32 h-32 relative">
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
