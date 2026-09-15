import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface FarmingReminder {
  id: string;
  uid: string;
  text: string;
  done: boolean;
  createdAt?: any;
}

const DEFAULT_REMINDERS = [
  { text: 'Water the tomato beds - Soil dryness is index 4', done: false },
  { text: 'Check onion leaves for purple blotch dampness', done: false },
  { text: 'Apply bio-fertilizer to paddy blocks - 10 days since last dose', done: true }
];

/**
 * Real-time Firestore listener for user farming reminders
 */
export function subscribeToReminders(
  uid: string,
  onUpdate: (reminders: FarmingReminder[]) => void
): () => void {
  const remindersCol = collection(db, 'reminders');
  const q = query(remindersCol, where('uid', '==', uid));

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default initial reminders for new user
        for (const def of DEFAULT_REMINDERS) {
          try {
            await addDoc(remindersCol, {
              uid,
              text: def.text,
              done: def.done,
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.warn('Seed reminder failed:', e);
          }
        }
      } else {
        const list: FarmingReminder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            uid: data.uid || uid,
            text: data.text || '',
            done: Boolean(data.done),
            createdAt: data.createdAt
          };
        });
        onUpdate(list);
      }
    },
    (error) => {
      console.warn('Reminders Firestore listener error, falling back to local state:', error);
    }
  );

  return unsubscribe;
}

export async function addReminderInFirestore(uid: string, text: string): Promise<string> {
  const remindersCol = collection(db, 'reminders');
  const docRef = await addDoc(remindersCol, {
    uid,
    text: text.trim(),
    done: false,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function toggleReminderInFirestore(id: string, currentDone: boolean): Promise<void> {
  const remRef = doc(db, 'reminders', id);
  await updateDoc(remRef, {
    done: !currentDone
  });
}

export async function deleteReminderInFirestore(id: string): Promise<void> {
  const remRef = doc(db, 'reminders', id);
  await deleteDoc(remRef);
}
