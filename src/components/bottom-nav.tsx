'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, ScrollText, Trophy, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { dummyUser } from '@/lib/dummy-data';


const navItems = [
  { href: '/home', label: 'Home', icon: LayoutGrid },
  { href: '/reports', label: 'Reports', icon: ScrollText },
  { href: '/leaderboard', label: 'Leaders', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Profile is incomplete if name is default, or if location/bio are missing
            if (!userData.displayName || userData.displayName === dummyUser.name || !userData.location || !userData.bio || !userData.photoURL || userData.photoURL === dummyUser.avatarUrl) {
                setIsProfileIncomplete(true);
            } else {
                setIsProfileIncomplete(false);
            }
        } else {
            // If the user document doesn't even exist, profile is definitely incomplete
            setIsProfileIncomplete(true);
        }
      } else {
        setIsProfileIncomplete(false);
      }
    };

    checkProfileCompleteness();
  }, [user, pathname]); // Re-check on navigation

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-lg">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isProfileTab = item.label === 'Profile';

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground transition-colors duration-200',
                  isActive ? 'text-primary' : 'hover:text-primary/80'
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.15 : 0}
                />
                <span className="text-xs font-medium">{item.label}</span>
                {isProfileTab && isProfileIncomplete && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
