'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { dummyUser, allBadges } from '@/lib/dummy-data';
import { Star, LogOut, Edit, ChevronRight, Upload, MapPin, Percent } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { auth, storage, db } from '@/lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

type UserProfile = {
  displayName?: string;
  photoURL?: string;
  email?: string;
  location?: string;
  bio?: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<UserProfile>({});

  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [newBio, setNewBio] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfileData(data);
          setNewName(data.displayName || user.displayName || '');
          setNewLocation(data.location || '');
          setNewBio(data.bio || '');
        } else {
            // Pre-fill with auth data if firestore doc doesn't exist
            setNewName(user.displayName || '');
        }
      }
    };
    fetchProfileData();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const handleProfileUpdate = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let photoURL = profileData.photoURL || user.photoURL;

      if (newPhoto) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, newPhoto);
        photoURL = await getDownloadURL(storageRef);
      }
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: newName, photoURL });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = { 
        displayName: newName, 
        photoURL,
        location: newLocation, 
        bio: newBio 
      };
      await setDoc(userDocRef, updatedData, { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      
      setProfileData(prev => ({...prev, ...updatedData}));
      resetEditState();
      setIsDialogOpen(false); 
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhoto(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const resetEditState = () => {
    setNewName(profileData.displayName || user?.displayName || '');
    setNewPhoto(null);
    setPhotoPreviewUrl(null);
    setNewLocation(profileData.location || '');
    setNewBio(profileData.bio || '');
  }
  
  const handleDialogOpening = () => {
      resetEditState();
      setIsDialogOpen(true);
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetEditState();
    }
    setIsDialogOpen(open);
  }

  const displayName = profileData.displayName || user?.displayName || dummyUser.name;
  const displayEmail = user?.email || dummyUser.email;
  const displayAvatarUrl = profileData.photoURL || user?.photoURL || dummyUser.avatarUrl;
  const displayLocation = profileData.location || '';
  const displayBio = profileData.bio || '';
  
  const profileCompletion = useMemo(() => {
      let score = 0;
      if (displayName !== dummyUser.name) score += 25;
      if (displayAvatarUrl !== dummyUser.avatarUrl) score += 25;
      if (displayLocation) score += 25;
      if (displayBio) score += 25;
      return score;
  }, [displayName, displayAvatarUrl, displayLocation, displayBio]);

  const userBadges = useMemo(() => {
      const badges = [...dummyUser.badges];
      if (profileCompletion === 100) {
          const profileBadge = allBadges.find(b => b.name === 'Profile Pro');
          if (profileBadge && !badges.some(b => b.name === 'Profile Pro')) {
              badges.push({name: profileBadge.name, iconUrl: profileBadge.iconUrl});
          }
      }
      return badges;
  }, [profileCompletion]);

  const unlockedBadgeIds = new Set(userBadges.map(b => b.name));
  const displayedBadges = allBadges.filter(b => unlockedBadgeIds.has(b.name)).slice(0, 3);


  return (
    <div className="p-4 pb-20">
      <header className="flex flex-col items-center text-center pt-8 pb-6">
        <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50">
          <AvatarImage src={displayAvatarUrl} alt={displayName} />
          <AvatarFallback className="text-3xl">
            {displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-headline">{displayName}</h1>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDialogOpening}>
                        <Edit className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                              <AvatarImage src={photoPreviewUrl || displayAvatarUrl} alt="New Avatar Preview"/>
                              <AvatarFallback>{(newName || displayName).charAt(0)}</AvatarFallback>
                          </Avatar>
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Photo
                          </Button>
                          <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*" className="hidden"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">
                                Location
                            </Label>
                            <Input id="location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="col-span-3" placeholder="e.g., Coastal City, USA" />
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="bio" className="text-right pt-2">
                                Bio
                            </Label>
                            <Textarea id="bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} className="col-span-3" placeholder="Tell us about yourself" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleProfileUpdate} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <p className="text-muted-foreground">{displayEmail}</p>
        {displayLocation && (
            <div className="flex items-center text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 mr-1.5" />
                <span>{displayLocation}</span>
            </div>
        )}
      </header>
      
      {displayBio && (
          <Card className="mb-4 text-left shadow-md">
            <CardContent className="p-4">
              <p className="text-sm italic text-muted-foreground">{displayBio}</p>
            </CardContent>
          </Card>
      )}
      
      <Card className="mb-4 shadow-md">
        <CardHeader>
            <CardTitle className="font-headline text-lg">Profile Completion</CardTitle>
            <CardDescription>Complete your profile to earn more points!</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <Progress value={profileCompletion} className="h-2 flex-grow" />
                <span className="text-lg font-bold font-headline text-primary">{profileCompletion}%</span>
            </div>
        </CardContent>
      </Card>


      <Card className="mb-4 text-center shadow-md">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Points</p>
          <div className="flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-yellow-400 fill-current" />
            <p className="text-3xl font-bold font-headline text-primary">
              {dummyUser.points.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-lg">My Badges</CardTitle>
          <Link href="/profile/badges" passHref>
            <Button variant="ghost" size="sm">
              View all
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {displayedBadges.map((badge) => (
              <div key={badge.name} className="flex flex-col items-center gap-2">
                <div className={`relative h-16 w-16 ${!unlockedBadgeIds.has(badge.name) ? 'opacity-30 grayscale' : ''}`}>
                  <Image src={badge.iconUrl} alt={badge.name} fill />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{badge.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
      </div>
    </div>
  );
}
