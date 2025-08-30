import { Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <Waves className="h-6 w-6" />
      <h1 className="text-xl font-bold font-headline text-primary">
        Coast Watcher
      </h1>
    </div>
  );
}
