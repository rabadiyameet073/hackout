'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dummyLeaderboard } from '@/lib/dummy-data';
import { Trophy } from 'lucide-react';
import React, { useMemo } from 'react';

const rankColors: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-700',
};

const LeaderboardList = ({ leaders }: { leaders: typeof dummyLeaderboard }) => (
  <div className="space-y-3">
    {leaders.map((user, index) => (
      <Card key={user.rank} className="shadow-md">
        <CardContent className="p-3 flex items-center gap-4">
          <div className="flex items-center justify-center w-10">
            {user.rank <= 3 ? (
              <Trophy className={`h-6 w-6 ${rankColors[user.rank]}`} fill="currentColor" />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{user.rank}</span>
            )}
          </div>
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-semibold font-headline">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.points.toLocaleString()} points</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function LeaderboardPage() {
  const weeklyLeaders = useMemo(() => {
    // Simulate weekly data by shuffling and adjusting points
    return [...dummyLeaderboard]
      .sort(() => Math.random() - 0.5)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        points: Math.floor(user.points / 4 + Math.random() * 50), // Simulate lower weekly points
      }))
      .sort((a,b) => b.points - a.points) // re-sort after point adjustment
      .map((user, index) => ({...user, rank: index + 1})); // re-assign rank
  }, []);

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">Leaderboard</h1>
        <p className="text-muted-foreground">Top contributors to our cause.</p>
      </header>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <LeaderboardList leaders={dummyLeaderboard} />
        </TabsContent>
        <TabsContent value="weekly">
          <LeaderboardList leaders={weeklyLeaders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
