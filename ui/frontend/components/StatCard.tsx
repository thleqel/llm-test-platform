'use client';

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  // Color schemes for different stat types
  const getColorScheme = () => {
    if (title.toLowerCase().includes('passed')) {
      return {
        bg: 'from-emerald-500 to-green-600',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-600',
        accentBg: 'bg-emerald-500/5',
        border: 'border-emerald-200',
        glow: 'shadow-emerald-500/20'
      };
    }
    if (title.toLowerCase().includes('failed')) {
      return {
        bg: 'from-rose-500 to-red-600',
        iconBg: 'bg-rose-500/10',
        iconColor: 'text-rose-600',
        accentBg: 'bg-rose-500/5',
        border: 'border-rose-200',
        glow: 'shadow-rose-500/20'
      };
    }
    if (title.toLowerCase().includes('test')) {
      return {
        bg: 'from-blue-500 to-indigo-600',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600',
        accentBg: 'bg-blue-500/5',
        border: 'border-blue-200',
        glow: 'shadow-blue-500/20'
      };
    }
    return {
      bg: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      accentBg: 'bg-purple-500/5',
      border: 'border-purple-200',
      glow: 'shadow-purple-500/20'
    };
  };

  const colors = getColorScheme();

  return (
    <Card className={cn(
      "relative group p-6 overflow-hidden hover-lift",
      colors.border
    )}>
      {/* Background gradient accent */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-10 transition-opacity",
        colors.bg
      )} />
      
      {/* Icon section */}
      <div className="relative flex items-start justify-between mb-4">
        <div className={cn(
          "p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300",
          colors.iconBg,
          colors.iconColor
        )}>
          {icon && <div className="w-8 h-8">{icon}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <p className="section-title text-gray-500 mb-3">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className={cn(
            "text-5xl font-semibold bg-gradient-to-r bg-clip-text text-transparent",
            colors.bg
          )}>
            {value}
          </p>
        </div>
        
        {subtitle && (
          <div className="mt-3 flex items-center gap-2">
            <div className={cn(
              "h-1 w-1 rounded-full",
              colors.bg.split(' ')[0].replace('from-', 'bg-')
            )} />
            <p className="text-sm text-gray-600 font-semibold">{subtitle}</p>
          </div>
        )}

        {trend && (
          <div className={cn(
            "mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border",
            trend.positive 
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
              : 'bg-rose-100 text-rose-700 border-rose-200'
          )}>
            {trend.positive ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        colors.bg
      )} />
    </Card>
  );
}
