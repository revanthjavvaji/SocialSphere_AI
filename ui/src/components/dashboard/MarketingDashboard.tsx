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
  Upload,
  Building2,
  Target,
  Users,
  Megaphone
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

// Mock content data
const mockContent: Record<string, { posts: number; posters: number; emails: number }> = {
  '2024-12-05': { posts: 2, posters: 1, emails: 0 },
  '2024-12-08': { posts: 1, posters: 0, emails: 1 },
  '2024-12-10': { posts: 3, posters: 2, emails: 1 },
  '2024-12-15': { posts: 1, posters: 1, emails: 2 },
  '2024-12-20': { posts: 2, posters: 0, emails: 1 },
};

const quickActions = [
  { icon: Camera, label: 'Generate Posts', color: 'from-pink-500 to-rose-500' },
  { icon: Image, label: 'Create Poster', color: 'from-violet-500 to-purple-500' },
  { icon: Mail, label: 'Draft Email', color: 'from-blue-500 to-cyan-500' },
  { icon: CalendarIcon, label: 'Weekly Plan', color: 'from-emerald-500 to-teal-500' },
];

export const MarketingDashboard: React.FC = () => {
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

  const getContentForDay = (day: number) => {
    return mockContent[getDateKey(day)];
  };

  const getContentIndicator = (content: typeof mockContent[string] | undefined) => {
    if (!content) return null;
    const total = content.posts + content.posters + content.emails;
    if (total === 0) return null;
    if (content.posts > 0 && content.posters > 0 && content.emails > 0) return 'P';
    return '●';
  };

  const getTooltipContent = (content: typeof mockContent[string] | undefined) => {
    if (!content) return 'No content scheduled';
    const parts = [];
    if (content.posts > 0) parts.push(`${content.posts} post${content.posts > 1 ? 's' : ''} posted`);
    if (content.posters > 0) parts.push(`${content.posters} poster${content.posters > 1 ? 's' : ''} created`);
    if (content.emails > 0) parts.push(`${content.emails} email${content.emails > 1 ? 's' : ''} sent`);
    return parts.length > 0 ? parts.join(', ') : 'No content scheduled';
  };

  // Mock stats
  const todayStats = {
    posts: 3,
    posters: 1,
    emails: 2,
  };

  return (
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
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors hover:bg-secondary ${
                          isToday ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        <span className={isToday ? 'font-bold' : ''}>{day}</span>
                        {indicator && (
                          <span className={`text-xs ${
                            indicator === 'P' ? 'text-accent' : 'text-primary'
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
            <div className="flex items-start gap-3">
              <Megaphone className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">Current Campaign</div>
                <div className="text-sm font-medium">Holiday Season 2024</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="w-3 h-3 mr-2" />
              Edit Business Info
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Upload className="w-3 h-3 mr-2" />
              Upload Brand Kit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
