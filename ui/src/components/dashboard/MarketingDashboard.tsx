import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

import {
  Camera,
  Image,
  Mail,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  Building2,
  Target,
  Users
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Initial state for calendar data
const initialCalendarData: Record<string, Record<string, number>> = {};

const quickActions = [
  {
    icon: Camera,
    label: 'Generate Posts',
    color: 'from-pink-500 to-rose-500',
    prompt: 'Create engaging social media posts for [Topic] targeting [Audience]. Include emojis and hashtags.'
  },
  {
    icon: Image,
    label: 'Create Poster',
    color: 'from-violet-500 to-purple-500',
    prompt: 'Design a marketing poster for [Event/Product]. Visual style: [Modern/Classic]. Text to include: "[Headline]"'
  },
  {
    icon: Mail,
    label: 'Draft Email',
    color: 'from-blue-500 to-cyan-500',
    prompt: 'Draft a [Newsletter/Promo] email about [Subject]. Tone: Professional. Key details: [Points]'
  },
  {
    icon: CalendarIcon,
    label: 'Weekly Plan',
    color: 'from-emerald-500 to-teal-500',
    prompt: 'Generate a content calendar for next week focusing on [Theme/Goal]. Include mix of posts and stories.'
  },
];

export const MarketingDashboard: React.FC<{ onQuickAction: (text: string) => void }> = ({ onQuickAction }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDateKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const [calendarData, setCalendarData] = useState(initialCalendarData);

  const getContentForDay = (day: number) => {
    return calendarData[getDateKey(day)];
  };

  const getContentIndicator = (content: Record<string, number> | undefined) => {
    if (!content) return null;
    const total = Object.values(content).reduce((a, b) => a + b, 0);
    return total > 0 ? '●' : null;
  };

  const getTooltipContent = (content: Record<string, number> | undefined) => {
    if (!content) return 'No content scheduled';
    const parts = [];
    if (content.instagram) parts.push(`${content.instagram} Insta post${content.instagram > 1 ? 's' : ''}`);
    if (content.facebook) parts.push(`${content.facebook} Facebook post${content.facebook > 1 ? 's' : ''}`);
    if (content.x) parts.push(`${content.x} X post${content.x > 1 ? 's' : ''}`);
    if (content.gmail) parts.push(`${content.gmail} email${content.gmail > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : 'No content scheduled';
  };





  // Real stats state
  const [todayStats, setTodayStats] = useState({
    posts: 0,
    posters: 0,
    emails: 0,
  });

  // Fetch daily stats
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user?.bid) return;

      try {
        const response = await fetch(`http://localhost:8000/stats/daily/${user.bid}`);
        if (response.ok) {
          const data = await response.json();
          // Backend returns: posts_generated, posters_created
          // We map them to our UI state. Emails are not yet tracked in backend stats endpoint, default to 0.
          setTodayStats({
            posts: data.posts_generated || 0,
            posters: data.posters_created || 0,
            emails: 0 // Placeholder until email tracking is added
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    const fetchCalendarStats = async () => {
      if (!user?.bid) return;
      try {
        const response = await fetch(`http://localhost:8000/stats/calendar/${user.bid}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarData(data);
        }
      } catch (error) {
        console.error("Failed to fetch calendar stats:", error);
      }
    };

    fetchStats();
    fetchCalendarStats();

    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(() => {
      fetchStats();
      fetchCalendarStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.bid]);

  return (
    <>


      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Today's Overview */}
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">Today's Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
              <div className="text-2xl font-display font-bold text-pink-500">{todayStats.posts}</div>
              <div className="text-sm text-muted-foreground">Posts Generated</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="text-2xl font-display font-bold text-violet-500">{todayStats.posters}</div>
              <div className="text-sm text-muted-foreground">Posters Created</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="text-2xl font-display font-bold text-blue-500">{todayStats.emails}</div>
              <div className="text-sm text-muted-foreground">Emails Drafted</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onQuickAction(action.prompt)}
                className={`p-4 rounded-xl bg-gradient-to-br ${action.color} text-primary-foreground flex items-center gap-3 hover:opacity-90 transition-opacity group`}
              >
                <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Content Calendar</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/50 p-4">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <TooltipProvider>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const content = getContentForDay(day);
                  const indicator = getContentIndicator(content);
                  const isToday = day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <Tooltip key={day}>
                      <TooltipTrigger asChild>
                        <button
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors hover:bg-secondary ${isToday ? 'bg-primary text-primary-foreground' : ''
                            }`}
                        >
                          <span className={isToday ? 'font-bold' : ''}>{day}</span>
                          {indicator && (
                            <span className={`text-xs ${indicator === 'P' ? 'text-accent' : 'text-primary'
                              } ${isToday ? 'text-primary-foreground' : ''}`}>
                              {indicator}
                            </span>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{getTooltipContent(content)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="text-primary">●</span> Content exists
              </div>
              <div className="flex items-center gap-1">
                <span>○</span> Empty
              </div>
              <div className="flex items-center gap-1">
                <span className="text-accent">P</span> Mixed content
              </div>
            </div>
          </div>
        </div>

        {/* Business Profile */}
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">Business Profile</h3>
          <div className="rounded-xl bg-card border border-border/50 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Business Name</div>
                  <div className="text-sm font-medium">{user?.businessName || 'Your Business'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Industry</div>
                  <div className="text-sm font-medium">{user?.industry || 'Not set'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Target Audience</div>
                  <div className="text-sm font-medium">Professionals 25-45</div>
                </div>
              </div>

            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-3 h-3 mr-2" />
                Edit Business Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
