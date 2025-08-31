'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Report, dummyReports } from '@/lib/dummy-data';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type AppReport = Report & {
  createdAt?: Timestamp;
};

const statusColors: Record<Report['status'], string> = {
  Pending: 'bg-yellow-400/20 text-yellow-700 border-yellow-400/50',
  'In Review': 'bg-blue-400/20 text-blue-700 border-blue-400/50',
  Resolved: 'bg-green-400/20 text-green-700 border-green-400/50',
};

const ReportList = ({ reports, loading }: { reports: AppReport[], loading: boolean }) => {
    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden shadow-md">
                        <Skeleton className="h-40 w-full" />
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-6 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No reports found.</p>
            </div>
        )
    }

    return (
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden shadow-md">
            <div className="relative h-40 w-full">
              <Image
                src={report.imageUrl}
                alt={report.title}
                fill
                className="object-cover"
                data-ai-hint="environmental incident"
              />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-lg">{report.title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground pt-1">
                <MapPin className="h-4 w-4 mr-1.5"/>
                <span>{report.location}</span>
                <span className="mx-2">•</span>
                <span>{report.date}</span>
              </div>
            </CardHeader>
            <CardContent>
                <Badge variant="outline" className={cn("font-semibold", statusColors[report.status])}>
                  {report.status}
                </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<AppReport[]>([]);
  const [allReports, setAllReports] = useState<AppReport[]>([]);
  const [myReportsLoading, setMyReportsLoading] = useState(true);
  const [allReportsLoading, setAllReportsLoading] = useState(true);

  useEffect(() => {
    const fetchMyReports = async () => {
      if (!user) {
        setMyReportsLoading(false);
        return;
      }
      setMyReportsLoading(true);
      try {
        const q = query(
          collection(db, 'reports'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const reports = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              date: data.createdAt ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
            } as AppReport;
        });
        
        setMyReports(reports);
      } catch (error) {
        console.error("Error fetching user reports: ", error);
        setMyReports([]);
      } finally {
        setMyReportsLoading(false);
      }
    };
    
    const fetchAllReports = async () => {
        setAllReportsLoading(true);
        try {
            const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const reports = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.createdAt ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
                } as AppReport
            });
            setAllReports(reports);
        } catch (error) {
            console.error("Error fetching all reports: ", error);
            setAllReports([]);
        } finally {
            setAllReportsLoading(false);
        }
    }

    fetchMyReports();
    fetchAllReports();
  }, [user]);

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">Reports</h1>
        <p className="text-muted-foreground">Track incident reports.</p>
      </header>
      <Tabs defaultValue="all-reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="all-reports">All Reports</TabsTrigger>
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="all-reports">
          <ReportList reports={allReports} loading={allReportsLoading} />
        </TabsContent>
        <TabsContent value="my-reports">
          <ReportList reports={myReports} loading={myReportsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
