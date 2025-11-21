'use client';

import { Badge } from '@/components/ui';
import { getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { variant, icon: Icon } = getStatusColor(status);
  
  return (
    <Badge variant={variant} className={className}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}
