import React, { useEffect, useRef } from 'react';

interface NeuralBackgroundProps {
    opacity?: number;
    particleCurrentColor?: string;
    className?: string;
    // Removed specific center props as positioning is now dynamic/random
}

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({
    opacity = 1,
    particleCurrentColor = '139, 92, 246', // violet-500 default
    className = '',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Configuration
        const clusterCount = 6; // "Many spheres" (increased from 3)
        const nodesPerCluster = 60; // Denser for better circular shape
        const clusterBaseRadius = 80; // Slightly smaller base to fit more
        const perspective = 800;
        const connectionDistance = 40; // Tighter connections for better shape definition

        // State classes
        class Cluster {
            x: number;
            y: number;
            z: number;
            vx: number;
            vy: number;
            angleY: number;
            angleX: number;
            rotationSpeed: number;
            radius: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                // Deeper depth field for "not plane" look
                this.z = (Math.random() - 0.5) * 600;

                // Slow drift
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;

                this.angleY = Math.random() * Math.PI * 2;
                this.angleX = Math.random() * Math.PI * 2;
                this.rotationSpeed = 0.001 + Math.random() * 0.001;

                // Varied sizes: 0.6x to 1.4x
                this.radius = clusterBaseRadius * (0.6 + Math.random() * 0.8);
            }

            update(w: number, h: number) {
                this.x += this.vx;
                this.y += this.vy;
                this.angleY += this.rotationSpeed;
                this.angleX += this.rotationSpeed * 0.5;

                // Bounce off edges (extended bounds to allow partial off-screen)
                if (this.x < -150 || this.x > w + 150) this.vx *= -1;
                if (this.y < -150 || this.y > h + 150) this.vy *= -1;
            }
        }

        class Node {
            x: number; // Relative to cluster
            y: number;
            z: number;

            // Rendered state
            screenX: number = 0;
            screenY: number = 0;
            scale: number = 1;
            alpha: number = 1;

            constructor(x: number, y: number, z: number) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
        }

        let clusters: { data: Cluster, nodes: Node[] }[] = [];

        // Resize handler
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        };
        window.addEventListener('resize', resize);
        resize();

        // Initialize world
        const initWorld = () => {
            clusters = [];
            const w = window.innerWidth;
            const h = window.innerHeight;

            for (let c = 0; c < clusterCount; c++) {
                const cluster = new Cluster(w, h);

                // Try to find non-overlapping position
                let attempts = 0;
                let overlap = true;
                while (overlap && attempts < 20) {
                    overlap = false;
                    for (let existing of clusters) {
                        const ex = existing.data;
                        const dx = cluster.x - ex.x;
                        const dy = cluster.y - ex.y;
                        if (Math.sqrt(dx * dx + dy * dy) < (cluster.radius + ex.radius + 100)) {
                            overlap = true;
                            cluster.x = Math.random() * w;
                            cluster.y = Math.random() * h;
                            break;
                        }
                    }
                    attempts++;
                }

                const nodes: Node[] = [];

                // Fibonacci Sphere distribution for reliable sphere shape
                const phi = Math.PI * (3 - Math.sqrt(5));
                for (let i = 0; i < nodesPerCluster; i++) {
                    const y = 1 - (i / (nodesPerCluster - 1)) * 2;
                    const radiusAtY = Math.sqrt(1 - y * y);
                    const theta = phi * i;

                    const x = Math.cos(theta) * radiusAtY;
                    const z = Math.sin(theta) * radiusAtY;

                    const r = cluster.radius; // Use cluster-specific radius
                    nodes.push(new Node(x * r, y * r, z * r));
                }
                clusters.push({ data: cluster, nodes });
            }
        };

        const renderFrame = () => {
            if (!ctx || !canvas) return;
            const width = window.innerWidth;
            const height = window.innerHeight;

            ctx.clearRect(0, 0, width, height);

            clusters.forEach(group => {
                const { data: cluster, nodes } = group;
                cluster.update(width, height);

                // COLLISION DETECTION & REPULSION
                clusters.forEach(otherGroup => {
                    const other = otherGroup.data;
                    if (cluster === other) return;

                    const dx = cluster.x - other.x;
                    const dy = cluster.y - other.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = cluster.radius + other.radius + 50; // Radius + padding

                    if (distSq < minDist * minDist) {
                        const dist = Math.sqrt(distSq) || 1; // avoid div by zero
                        const overlap = minDist - dist;

                        // Push away vector
                        const nx = dx / dist;
                        const ny = dy / dist;

                        // Apply soft repulsion forces to velocities
                        const force = 0.005; // Gentle push
                        cluster.vx += nx * force * overlap;
                        cluster.vy += ny * force * overlap;

                        // Also separate positions slightly to prevent sticking
                        const separation = 0.05;
                        cluster.x += nx * overlap * separation;
                        cluster.y += ny * overlap * separation;
                    }
                });

                const cosY = Math.cos(cluster.angleY);
                const sinY = Math.sin(cluster.angleY);
                const cosX = Math.cos(cluster.angleX);
                const sinX = Math.sin(cluster.angleX);

                // 1. Transform Nodes
                nodes.forEach(node => {
                    // Rotate local (relative to cluster center)
                    let rx = node.x * cosY - node.z * sinY;
                    let rz = node.z * cosY + node.x * sinY;

                    let ry = node.y * cosX - rz * sinX;
                    rz = rz * cosX + node.y * sinX;

                    // Translate to world position
                    const wx = rx + cluster.x;
                    const wy = ry + cluster.y;
                    const wz = rz + cluster.z;

                    // Project
                    const scale = perspective / (perspective + wz);
                    node.scale = scale;
                    node.screenX = width / 2 + (wx - width / 2) * scale; // Keep logic simple: relative to center of screen? 
                    // Wait, cluster.x/y are screen coordinates (0 to width), but projection works relative to camera center.
                    // Let's assume camera is at w/2, h/2.
                    // So world -> camera space:
                    const camX = wx - width / 2;
                    const camY = wy - height / 2;

                    node.screenX = width / 2 + camX * scale;
                    node.screenY = height / 2 + camY * scale;

                    node.alpha = Math.max(0.1, Math.min(1, (scale - 0.2) * 2));
                    // Store rotated Z for distance check correctness? No, relative distance is fine.
                    // Actually for intra-cluster connections, we can use the *relative* 3D distance 
                    // which is constant if rigid, OR check screen distance.
                    // Checking screen distance is standard for these "plexus" effects.
                });

                // 2. Draw Connections (Intra-cluster)
                const sqConnDist = connectionDistance * connectionDistance;

                // Only connect within cluster
                for (let i = 0; i < nodes.length; i++) {
                    const n1 = nodes[i];
                    for (let j = i + 1; j < nodes.length; j++) {
                        const n2 = nodes[j];

                        // Simple 2D screen distance check for visual connecting effect
                        const dx = n1.screenX - n2.screenX;
                        const dy = n1.screenY - n2.screenY;
                        const distSq = dx * dx + dy * dy;

                        if (distSq < sqConnDist) {
                            ctx.beginPath();
                            ctx.moveTo(n1.screenX, n1.screenY);
                            ctx.lineTo(n2.screenX, n2.screenY);
                            const alpha = (1 - distSq / sqConnDist) * n1.alpha; // approximate alpha
                            ctx.strokeStyle = `rgba(${particleCurrentColor}, ${alpha * 0.6})`;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                }

                // 3. Draw Nodes
                nodes.forEach(node => {
                    ctx.beginPath();
                    const size = 1.5 * node.scale;
                    ctx.arc(node.screenX, node.screenY, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${particleCurrentColor}, ${node.alpha})`;
                    ctx.fill();
                });
            });

            animationFrameId = requestAnimationFrame(renderFrame);
        };

        initWorld();
        renderFrame();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCurrentColor]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none ${className}`}
            style={{ opacity }}
        />
    );
};
