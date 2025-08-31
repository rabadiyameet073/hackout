'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Logo } from '@/components/logo';
import { Waves, MapPin, ShieldCheck } from 'lucide-react';
import React from 'react';

const onboardingSteps = [
  {
    step: 1,
    icon: <Waves className="h-12 w-12 text-primary" />,
    title: 'Welcome to Coast Watcher',
    description: 'Your partner in protecting our beautiful coastlines. Join a community dedicated to preserving our marine environments.',
    image: {
      src: 'https://picsum.photos/800/600',
      alt: 'Beautiful clean coastline',
      hint: 'beautiful coastline'
    },
  },
  {
    step: 2,
    icon: <MapPin className="h-12 w-12 text-primary" />,
    title: 'Report Incidents Easily',
    description: 'See something, say something. Snap a photo, tag the location, and describe the issue. Your report helps us take action.',
    image: {
      src: 'https://picsum.photos/800/600',
      alt: 'Person taking a photo of a beach with their phone',
      hint: 'beach photo'
    },
  },
  {
    step: 3,
    icon: <ShieldCheck className="h-12 w-12 text-primary" />,
    title: 'Make a Real Impact',
    description: 'Earn points for your reports, climb the leaderboard, and become a recognized guardian of the coast. Let\'s make a difference together.',
    image: {
      src: 'https://picsum.photos/800/600',
      alt: 'Group of volunteers cleaning up a beach',
      hint: 'beach cleanup'
    },
  },
];

export default function OnboardingPage({ params }: { params: { step: string } }) {
  const router = useRouter();
  const awaitedParams = React.use(params);
  const currentStep = awaitedParams?.step ? parseInt(awaitedParams.step, 10) : 1;
  const currentStepIndex = currentStep - 1;

  if (isNaN(currentStepIndex) || currentStepIndex < 0 || currentStepIndex >= onboardingSteps.length) {
    router.push('/onboarding/1');
    return null;
  }
  
  const stepData = onboardingSteps[currentStepIndex];
  const isLastStep = currentStepIndex === onboardingSteps.length - 1;
  const progress = ((currentStepIndex + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      router.push('/login');
    } else {
      router.push(`/onboarding/${stepData.step + 1}`);
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center">
      <Logo className="mb-8" />
      <Card className="w-full overflow-hidden shadow-xl">
        <CardHeader className="p-0">
          <div className="relative h-60 w-full">
            <Image
              src={stepData.image.src}
              alt={stepData.image.alt}
              fill
              className="object-cover"
              data-ai-hint={stepData.image.hint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="mb-4 flex justify-center">{stepData.icon}</div>
          <CardTitle className="font-headline mb-2 text-2xl">{stepData.title}</CardTitle>
          <p className="text-muted-foreground">{stepData.description}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6 pt-0">
          <Progress value={progress} className="w-full" />
          <div className="w-full flex justify-between items-center mt-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleNext} className="bg-accent hover:bg-accent/90">
              {isLastStep ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
