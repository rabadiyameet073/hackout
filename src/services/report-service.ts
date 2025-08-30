
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';

export async function getReport(reportId: string): Promise<DocumentData | null> {
  const reportRef = doc(db, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);

  if (reportSnap.exists()) {
    return reportSnap.data();
  } else {
    return null;
  }
}

export async function updateReport(reportId: string, data: Partial<DocumentData>) {
  const reportRef = doc(db, 'reports', reportId);
  await updateDoc(reportRef, data);
}
