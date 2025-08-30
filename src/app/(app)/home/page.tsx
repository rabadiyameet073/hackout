'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { dummyUser } from '@/lib/dummy-data';
import { Plus, MapPin, Smartphone, Bot, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locationPermission, setLocationPermission] = useState<PermissionState | 'unsupported'>('prompt');
  const [displayName, setDisplayName] = useState(dummyUser.name);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState(dummyUser.avatarUrl);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || user.displayName || dummyUser.name);
          setDisplayAvatarUrl(data.photoURL || user.photoURL || dummyUser.avatarUrl);
        } else {
          setDisplayName(user.displayName || dummyUser.name);
          setDisplayAvatarUrl(user.photoURL || dummyUser.avatarUrl);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermission('unsupported');
      return;
    }

    const requestLocationPermission = () => {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setLocationPermission(permissionStatus.state);
        
        if (permissionStatus.state === 'prompt') {
            toast({
                title: "Location Access",
                description: "This app uses your location to tag incident reports. Please allow location access when prompted by your browser.",
                duration: 8000,
            });
        }

        permissionStatus.onchange = () => {
            setLocationPermission(permissionStatus.state);
        };
      });
    };
    
    requestLocationPermission();

  }, [toast]);


  const handleRequestPermission = () => {
      if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  setLocationPermission('granted');
                  toast({
                      title: "Location Access Granted",
                      description: "Thank you for sharing your location.",
                  });
              },
              (error) => {
                  if (error.code === error.PERMISSION_DENIED) {
                    setLocationPermission('denied');
                  }
              }
          );
      }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-3xl font-bold font-headline text-primary">{displayName}</h1>
          </div>
          <Avatar className="h-12 w-12">
            <AvatarImage src={displayAvatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </header>
      
      {locationPermission !== 'granted' && (
        <Alert className="mb-6">
            <MapPin className="h-4 w-4" />
            <AlertTitle>
                {locationPermission === 'denied' ? 'Location Access Denied' : 'Enable Location Services'}
            </AlertTitle>
            <AlertDescription>
                {locationPermission === 'denied' 
                    ? 'Please enable location permissions in your browser settings to automatically tag your reports.'
                    : 'To automatically tag your reports with your location, please grant us access.'
                }
            </AlertDescription>
            {locationPermission === 'prompt' && (
                <div className="mt-4">
                    <Button onClick={handleRequestPermission}>Allow Access</Button>
                </div>
            )}
        </Alert>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold font-headline mb-4">Incidents Overview</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://picsum.photos/800/600"
                data-ai-hint="coastline aerial"
                alt="Coastal map"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold font-headline mb-4 text-center">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="text-center shadow-md">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Smartphone className="h-6 w-6" />
              </div>
              <CardTitle className="font-headline text-lg">1. You Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Citizens submit reports of environmental incidents through the app or by SMS, complete with photos and location data.</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Bot className="h-6 w-6" />
              </div>
              <CardTitle className="font-headline text-lg">2. AI Validates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Our AI system instantly analyzes the submitted photo and data to verify the report's authenticity and assess its severity.</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-md">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Send className="h-6 w-6" />
              </div>
              <CardTitle className="font-headline text-lg">3. Action is Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Verified reports are sent to the nearest forest department with actionable suggestions like penalties, reforestation tasks, or legal action.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Link href="/report" passHref className="fixed bottom-24 right-6 z-10">
        <Button size="icon" className="h-16 w-16 rounded-full bg-accent shadow-lg hover:bg-accent/90">
          <Plus className="h-9 w-9" />
        </Button>
      </Link>
    </div>
  );
}
