import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-yellow-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-md mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
