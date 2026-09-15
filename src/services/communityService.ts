import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Post, Comment } from '../types';

export interface CreatePostData {
  author: string;
  authorUid: string;
  authorAvatar?: string;
  isVerified?: boolean;
  content: string;
  image?: string;
  voiceUrl?: string;
  voiceCaption?: string;
  voiceTranslation?: string;
  voiceSummary?: string;
  voiceLang?: string;
  country?: string;
  countryName?: string;
  countryCode?: string;
  state?: string;
  stateName?: string;
  stateCode?: string;
  district?: string;
  districtName?: string;
  districtCode?: string;
  subDistrict?: string;
  subDistrictName?: string;
  subDistrictCode?: string;
  village?: string;
  villageName?: string;
  category: string;
}

export interface CommunityNotification {
  id: string;
  userId: string;
  senderName: string;
  senderUid?: string;
  title: string;
  message: string;
  type: 'like' | 'comment' | 'follow' | 'voice' | 'post' | 'alert';
  postId?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Format Firestore timestamp or ISO date into human-friendly relative time
 */
export function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return 'Just now';
  let date: Date;

  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Just now';
  }

  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Global Diverse Initial Posts with authentic administrative hierarchy
const SEED_POSTS: CreatePostData[] = [
  {
    author: 'Malleshappa K.',
    authorUid: 'farmer_malleshappa_k',
    isVerified: true,
    content: 'Brothers, my local tomato crop was showing black spots on lower leaves. Visited AgriVerse AI doctor and found it is Early Blight! Sprayed Mancozeb 2g/L as suggested, now plants are fully healthy again! Strongly recommend trying the AI Doctor before spending too much on chemical advisors.',
    country: 'India',
    countryCode: 'IN',
    state: 'Karnataka',
    district: 'Chikkaballapura',
    subDistrict: 'Chikkaballapura',
    village: 'Anemadagu',
    category: 'disease'
  },
  {
    author: 'Wanjiku Mwangi',
    authorUid: 'farmer_wanjiku_m',
    isVerified: true,
    content: 'Greetings from Nakuru! Our potato cooperative harvested 18 bags per quarter-acre following the ridge spacing guidance. We are drying the harvest for market distribution.',
    country: 'Kenya',
    countryCode: 'KE',
    state: 'Rift Valley Region',
    district: 'Nakuru County',
    subDistrict: 'Naivasha Sub-County',
    village: 'Mai Mahiu',
    category: 'crop_update'
  },
  {
    author: 'Mateo Morales',
    authorUid: 'farmer_mateo_m',
    isVerified: true,
    content: 'Starting avocado harvest in Uruapan. Drip irrigation scheduling reduced our water footprint by 28% through dry season. Wishing great yields to all farmers worldwide!',
    country: 'Mexico',
    countryCode: 'MX',
    state: 'Michoacán',
    district: 'Valle de Uruapan',
    subDistrict: 'Uruapan Municipio',
    village: 'Capacuaro',
    category: 'general'
  },
  {
    author: 'Sukhdev Singh',
    authorUid: 'farmer_sukhdev_s',
    isVerified: true,
    content: 'Just harvested super premium Basmati paddy in Amritsar district. Yield average is 24 quintals per acre this season using the water-saving drip reminders. Direct mill buyers are welcome to coordinate prices.',
    country: 'India',
    countryCode: 'IN',
    state: 'Punjab',
    district: 'Amritsar',
    subDistrict: 'Amritsar II',
    village: 'Majitha Rural',
    category: 'crop_update'
  },
  {
    author: 'Elena Rossi',
    authorUid: 'farmer_elena_r',
    isVerified: true,
    content: 'Soil nitrogen enrichment with clover cover crop before spring planting worked wonders on our organic vineyards in Fresno County.',
    country: 'United States',
    countryCode: 'US',
    state: 'California',
    district: 'Fresno County',
    subDistrict: 'Central Valley District',
    village: 'Clovis',
    category: 'general'
  }
];

/**
 * Seed initial posts if Firestore is completely empty
 */
async function seedInitialPostsIfNeeded(): Promise<void> {
  try {
    const postsRef = collection(db, 'posts');
    const snap = await getDocs(query(postsRef, limit(1)));
    if (snap.empty) {
      console.log('Seeding initial community posts to Firestore...');
      for (const item of SEED_POSTS) {
        await addDoc(postsRef, {
          ...item,
          likes: Math.floor(Math.random() * 20) + 5,
          likedBy: [],
          comments: [
            {
              id: `comm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              author: 'Basavaraj (Mandya)',
              authorUid: 'farmer_basavaraj_m',
              content: 'Very helpful suggestion, thank you!',
              time: '1h ago',
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    console.warn('Seed posts warning (non-blocking):', err);
  }
}

/**
 * Real-time subscription to Community Posts
 */
export function subscribeToCommunityPosts(
  onUpdate: (posts: Post[]) => void,
  onError?: (err: any) => void
): () => void {
  // Check and seed once
  seedInitialPostsIfNeeded().catch(() => {});

  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback check on API
        fetch('/api/posts')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              onUpdate(data);
            } else {
              onUpdate([]);
            }
          })
          .catch(() => onUpdate([]));
        return;
      }

      const posts: Post[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          author: data.author || 'AgriVerse Farmer',
          authorUid: data.authorUid || '',
          authorAvatar: data.authorAvatar || undefined,
          isVerified: data.isVerified !== false,
          content: data.content || '',
          image: data.image || undefined,
          voiceUrl: data.voiceUrl || undefined,
          voiceCaption: data.voiceCaption || undefined,
          voiceTranslation: data.voiceTranslation || undefined,
          voiceSummary: data.voiceSummary || undefined,
          voiceLang: data.voiceLang || undefined,
          likes: typeof data.likes === 'number' ? data.likes : (data.likedBy?.length || 0),
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          country: data.country || 'India',
          countryName: data.countryName || data.country || 'India',
          countryCode: data.countryCode || 'IN',
          state: data.state || 'Karnataka',
          stateName: data.stateName || data.state || 'Karnataka',
          stateCode: data.stateCode || '',
          district: data.district || 'Chikkaballapura',
          districtName: data.districtName || data.district || 'Chikkaballapura',
          districtCode: data.districtCode || '',
          subDistrict: data.subDistrict || '',
          subDistrictName: data.subDistrictName || data.subDistrict || '',
          subDistrictCode: data.subDistrictCode || '',
          village: data.village || '',
          villageName: data.villageName || data.village || '',
          category: data.category || 'general',
          comments: Array.isArray(data.comments) ? data.comments : [],
          time: formatTimeAgo(data.createdAt),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      });

      onUpdate(posts);
    },
    (error) => {
      console.warn('Firestore posts realtime subscription error, falling back to server API:', error);
      handleFirestoreError(error, OperationType.GET, 'posts');
      if (onError) onError(error);

      // Fallback to Express backend
      fetch('/api/posts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) onUpdate(data);
        })
        .catch(e => console.warn('Offline posts fallback failed:', e));
    }
  );

  return unsubscribe;
}

/**
 * Create a new community post
 */
export async function createCommunityPost(postData: CreatePostData): Promise<Post> {
  const postsRef = collection(db, 'posts');

  const newPostDoc = {
    author: postData.author,
    authorUid: postData.authorUid,
    authorAvatar: postData.authorAvatar || null,
    isVerified: postData.isVerified ?? true,
    content: postData.content,
    image: postData.image || null,
    voiceUrl: postData.voiceUrl || null,
    voiceCaption: postData.voiceCaption || null,
    voiceTranslation: postData.voiceTranslation || null,
    voiceSummary: postData.voiceSummary || null,
    voiceLang: postData.voiceLang || null,
    country: postData.country || 'India',
    countryName: postData.countryName || postData.country || 'India',
    countryCode: postData.countryCode || 'IN',
    state: postData.state || 'Karnataka',
    stateName: postData.stateName || postData.state || 'Karnataka',
    stateCode: postData.stateCode || '',
    district: postData.district || 'Chikkaballapura',
    districtName: postData.districtName || postData.district || 'Chikkaballapura',
    districtCode: postData.districtCode || '',
    subDistrict: postData.subDistrict || '',
    subDistrictName: postData.subDistrictName || postData.subDistrict || '',
    subDistrictCode: postData.subDistrictCode || '',
    village: postData.village || '',
    villageName: postData.villageName || postData.village || '',
    category: postData.category || 'general',
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(postsRef, newPostDoc);

    // Also mirror to server.ts for fallback resilience
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...postData,
        id: docRef.id
      })
    }).catch(() => {});

    // Broadcast community notification for followers/district
    createCommunityNotification({
      userId: 'global',
      senderName: postData.author,
      senderUid: postData.authorUid,
      title: `🌾 New post by ${postData.author}`,
      message: postData.content.substring(0, 80) + (postData.content.length > 80 ? '...' : ''),
      type: postData.voiceUrl ? 'voice' : 'post',
      postId: docRef.id
    }).catch(() => {});

    return {
      id: docRef.id,
      ...newPostDoc,
      image: postData.image,
      voiceUrl: postData.voiceUrl,
      voiceCaption: postData.voiceCaption,
      time: 'Just now',
      createdAt: new Date().toISOString()
    } as Post;
  } catch (error) {
    console.error('Firestore create post failed, falling back to server API:', error);
    handleFirestoreError(error, OperationType.CREATE, 'posts');

    // Fallback directly to server API
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    if (!res.ok) {
      throw new Error('Failed to create post');
    }

    return await res.json();
  }
}

/**
 * Toggle like on a community post (Optimistic & Atomic)
 */
export async function toggleCommunityPostLike(
  postId: string,
  userId: string,
  userName: string
): Promise<{ likes: number; likedBy: string[] }> {
  const postRef = doc(db, 'posts', postId);

  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      // Fallback to server API
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await res.json();
    }

    const data = postSnap.data();
    const currentLikedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
    const isCurrentlyLiked = currentLikedBy.includes(userId);

    let updatedLikedBy: string[];
    let newLikes: number;

    if (isCurrentlyLiked) {
      updatedLikedBy = currentLikedBy.filter(id => id !== userId);
      newLikes = Math.max(0, (data.likes || 1) - 1);
      await updateDoc(postRef, {
        likedBy: arrayRemove(userId),
        likes: increment(-1)
      });
    } else {
      updatedLikedBy = [...currentLikedBy, userId];
      newLikes = (data.likes || 0) + 1;
      await updateDoc(postRef, {
        likedBy: arrayUnion(userId),
        likes: increment(1)
      });

      // Send notification to author if not liking own post
      if (data.authorUid && data.authorUid !== userId) {
        createCommunityNotification({
          userId: data.authorUid,
          senderName: userName,
          senderUid: userId,
          title: '❤️ New Like on your post',
          message: `${userName} liked your update: "${(data.content || '').substring(0, 40)}..."`,
          type: 'like',
          postId: postId
        }).catch(() => {});
      }
    }

    // Mirror to server API in background
    fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).catch(() => {});

    return { likes: newLikes, likedBy: updatedLikedBy };
  } catch (error) {
    console.error('Firestore toggle like error, falling back to server API:', error);
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);

    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return await res.json();
  }
}

/**
 * Add a comment to a community post
 */
export async function addCommunityPostComment(
  postId: string,
  commentData: { author: string; authorUid: string; content: string }
): Promise<Comment> {
  const postRef = doc(db, 'posts', postId);
  const newComment: Comment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    author: commentData.author,
    authorUid: commentData.authorUid,
    content: commentData.content,
    time: 'Just now',
    createdAt: new Date().toISOString()
  };

  try {
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      const postData = postSnap.data();
      // Send notification to post author
      if (postData.authorUid && postData.authorUid !== commentData.authorUid) {
        createCommunityNotification({
          userId: postData.authorUid,
          senderName: commentData.author,
          senderUid: commentData.authorUid,
          title: '💬 New comment on your post',
          message: `${commentData.author} commented: "${commentData.content.substring(0, 60)}"`,
          type: 'comment',
          postId: postId
        }).catch(() => {});
      }
    }

    // Mirror to server API
    fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    }).catch(() => {});

    return newComment;
  } catch (error) {
    console.error('Firestore add comment failed, falling back to server API:', error);
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);

    const res = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    return await res.json();
  }
}

/**
 * Create a persistent notification in Firestore
 */
export async function createCommunityNotification(notification: {
  userId: string;
  senderName: string;
  senderUid?: string;
  title: string;
  message: string;
  type: 'like' | 'comment' | 'follow' | 'voice' | 'post' | 'alert';
  postId?: string;
}): Promise<void> {
  try {
    const notifsRef = collection(db, 'notifications');
    await addDoc(notifsRef, {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to write notification to Firestore:', err);
  }
}

/**
 * Subscribe to notifications for the current user
 */
export function subscribeToCommunityNotifications(
  userId: string,
  onUpdate: (notifications: CommunityNotification[]) => void
): () => void {
  const notifsRef = collection(db, 'notifications');
  
  // Listen for notifications targeted to the user or global
  const q = query(
    notifsRef,
    orderBy('createdAt', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const allNotifs: CommunityNotification[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            userId: d.userId,
            senderName: d.senderName || 'Farmer Partner',
            senderUid: d.senderUid,
            title: d.title || 'Community Update',
            message: d.message || '',
            type: d.type || 'alert',
            postId: d.postId,
            read: d.read ?? false,
            createdAt: formatTimeAgo(d.createdAt)
          };
        })
        .filter(n => n.userId === userId || n.userId === 'global' || !userId);

      onUpdate(allNotifs);
    },
    (error) => {
      console.warn('Notifications realtime listener issue (using fallback):', error);
    }
  );
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (err) {
    console.warn('Could not mark notification as read:', err);
  }
}

/**
 * Sync saved posts with Firestore and localStorage
 */
export async function syncSavedPosts(userId: string, savedPostIds: string[]): Promise<void> {
  localStorage.setItem('agri_saved_posts', JSON.stringify(savedPostIds));
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      savedPostIds: savedPostIds,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Sync followed farmers with Firestore and localStorage
 */
export async function syncFollowedFarmers(userId: string, followedList: string[]): Promise<void> {
  localStorage.setItem('agri_followed_farmers', JSON.stringify(followedList));
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      followedFarmers: followedList,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    // Non-blocking
  }
}
