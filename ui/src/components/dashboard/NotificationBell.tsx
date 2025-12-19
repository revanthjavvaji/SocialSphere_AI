import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationBell: React.FC = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const bid = (user as any)?.bid;
            if (!bid) {
                console.error("No Business ID found for user");
                return;
            }
            const response = await fetch(`http://localhost:8000/gmail/daily/${bid}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            setSummary(data.summary);
            setCount(data.recent_count || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setSummary("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" onClick={fetchNotifications}>
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {count > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Daily AI Briefing
                </h4>
                <div className="text-sm text-muted-foreground">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {summary || "No important updates found for today."}
                        </p>
                    )}
                </div>
                {count > 0 && !loading && (
                    <div className="mt-3 text-xs text-right text-muted-foreground/50">
                        Based on {count} recent emails
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
