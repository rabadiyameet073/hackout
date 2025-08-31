
export type Report = {
  id: string;
  userId: string;
  title: string;
  type: 'Pollution' | 'Deforestation' | 'Illegal Fishing' | 'Other';
  status: 'Pending' | 'In Review' | 'Resolved';
  imageUrl: string;
  location: string;
  date: string;
};

export type LeaderboardUser = {
  rank: number;
  name: string;
  avatarUrl: string;
  points: number;
};

export type BadgeInfo = {
  name: string;
  description: string;
  iconUrl: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  points: number;
  location?: string;
  bio?: string;
  badges: {
    name: string;
    iconUrl: string;
  }[];
};

export const allBadges: BadgeInfo[] = [
    { name: 'First Report', description: 'Submit your first incident report.', iconUrl: '/badge-first-report.svg' },
    { name: 'Cleanup Champion', description: 'Participate in 3 cleanup events.', iconUrl: '/badge-cleanup.svg' },
    { name: 'Top Contributor', description: 'Reach the top 10 on the leaderboard.', iconUrl: '/badge-top-contributor.svg' },
    { name: 'Photo Journalist', description: 'Submit 10 reports with photos.', iconUrl: '/badge-photo-journalist.svg' },
    { name: 'Community Leader', description: 'Recruit 5 new members.', iconUrl: '/badge-community-leader.svg' },
    { name: 'Coast Guardian', description: 'Submit 50 verified reports.', iconUrl: '/badge-coast-guardian.svg' },
    { name: 'Profile Pro', description: 'Complete your user profile 100%.', iconUrl: '/badge-profile-pro.svg' },
];

export const dummyReports: Report[] = [
  {
    id: '1',
    userId: 'user-1', // This is one of "my" reports
    title: 'Plastic waste accumulation on Turtle Cove',
    type: 'Pollution',
    status: 'Pending',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    location: 'Turtle Cove',
    date: '2023-11-02',
  },
  {
    id: '2',
    userId: 'user-2',
    title: 'Illegal logging in coastal forest',
    type: 'Deforestation',
    status: 'In Review',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    location: 'Greenwood Reserve',
    date: '2023-10-28',
  },
  {
    id: '3',
    userId: 'user-3',
    title: 'Fishing nets abandoned near Coral Reef',
    type: 'Illegal Fishing',
    status: 'Resolved',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    location: 'Coral Point',
    date: '2023-10-22',
  },
    {
    id: '4',
    userId: 'user-1', // This is one of "my" reports
    title: 'Oil Spill near Sunrise Beach',
    type: 'Pollution',
    status: 'Resolved',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    location: 'Sunrise Beach',
    date: '2023-10-15',
  },
  {
    id: '5',
    userId: 'user-4',
    title: 'Unusual algae bloom observed',
    type: 'Other',
    status: 'In Review',
    imageUrl: 'https://picsum.photos/400/300?random=5',
    location: 'Whispering Bay',
    date: '2023-11-05',
  },
];

export const dummyLeaderboard: LeaderboardUser[] = [
  { rank: 1, name: 'Eco Warrior', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', points: 1250 },
  { rank: 2, name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', points: 1100 },
  { rank: 3, name: 'Ocean Protector', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', points: 980 },
  { rank: 4, name: 'Alex Smith', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', points: 850 },
  { rank: 5, name: 'Sam Wilson', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026708d', points: 720 },
];

export const dummyUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@email.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026709d',
  points: 450,
  location: 'Coastal City, USA',
  bio: 'Passionate about marine conservation and keeping our beaches clean.',
  badges: [
    { name: 'First Report', iconUrl: '/badge-first-report.svg' },
    { name: 'Cleanup Champion', iconUrl: '/badge-cleanup.svg' },
  ],
};
