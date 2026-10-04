import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  Volume2,
  ShieldCheck,
  Heart,
  MessageSquare,
  Sparkles,
  Clock,
  Flag,
  Globe,
  Tag,
  MapPin,
  RotateCcw
} from 'lucide-react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Post } from '../types';
import { useI18n } from '../context/I18nContext';

interface VoicePostsSystemProps {
  currentLang?: string;
  triggerVisualToast: (msg: string) => void;
  userId: string;
  userName: string;
  district: string;
  village: string;
  isVerifiedUser: boolean;
}

const CROP_TAGS = [
  { value: 'Tomato', label: 'Tomato (ಟೊಮೆಟೊ)' },
  { value: 'Rice/Paddy', label: 'Rice / Paddy (ಭತ್ತ)' },
  { value: 'Onion', label: 'Onion (ಈರುಳ್ಳಿ)' },
  { value: 'Ragi/Millet', label: 'Ragi / Millet (ರಾಗಿ)' },
  { value: 'Cotton', label: 'Cotton (ಹತ್ತಿ)' },
  { value: 'Sugarcane', label: 'Sugarcane (ಕಬ್ಬು)' },
  { value: 'Vegetables', label: 'Vegetables (ತರಕಾರಿಗಳು)' },
  { value: 'General Farming', label: 'General Farming (ಸಾಮಾನ್ಯ ಕೃಷಿ)' }
];

const KARNATAKA_DISTRICTS = [
  'Chikkaballapura',
  'Kolar',
  'Mandya',
  'Dharwad',
  'Koppal',
  'Raichur',
  'Belagavi',
  'Tumakuru',
  'Shivamogga',
  'Mysuru',
  'Hassan',
  'Ballari'
];

export function VoicePostsSystem({
  currentLang,
  triggerVisualToast,
  userId,
  userName,
  district,
  village,
  isVerifiedUser
}: VoicePostsSystemProps) {
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Recording statuses
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [voiceRecordDuration, setVoiceRecordDuration] = useState(0);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const { language } = useI18n();

  // Form selections: Professional flow fields
  const [textTitle, setTextTitle] = useState('');
  const [textCaption, setTextCaption] = useState('');
  const [selectedCropTag, setSelectedCropTag] = useState('Tomato');
  const [selectedPostDistrict, setSelectedPostDistrict] = useState(district || 'Chikkaballapura');
  const [selectedPostVillage, setSelectedPostVillage] = useState(village || 'Anemadagu');
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState(language || currentLang || 'kn');

  useEffect(() => {
    if (language) {
      setSelectedVoiceLanguage(language);
    }
  }, [language]);

  // AI states
  const [isCapturingAI, setIsCapturingAI] = useState(false);
  const [aiCaptionsResult, setAiCaptionsResult] = useState<{
    transcription?: string;
    translation?: string;
    summary?: string;
  } | null>(null);

  // Active playing track
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState<Record<string, number>>({});
  const [audioPlaybackDuration, setAudioPlaybackDuration] = useState<Record<string, number>>({});

  // Active comments panel
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Flagged posts
  const [flaggedPosts, setFlaggedPosts] = useState<string[]>([]);

  // Media streams
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // 1. Listen to Realtime Firestore Collection and Server API fallback
  useEffect(() => {
    setLoading(true);

    const loadPostsFromServer = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const serverPosts = await res.json();
          if (Array.isArray(serverPosts) && serverPosts.length > 0) {
            setPostsList((prev) => (prev.length === 0 ? serverPosts : prev));
          }
        }
      } catch (e) {
        console.warn('Server posts fetch warning:', e);
      }
    };

    loadPostsFromServer();

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pData: Post[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          pData.push({
            id: docSnap.id,
            author: d.author || 'Farmer Partner',
            authorUid: d.authorUid,
            isVerified: d.isVerified || false,
            title: d.title,
            content: d.content || d.title || '',
            image: d.image,
            voiceUrl: d.voiceUrl,
            voiceDuration: d.voiceDuration,
            voiceCaption: d.voiceCaption || d.transcript,
            voiceTranslation: d.voiceTranslation,
            voiceSummary: d.voiceSummary,
            voiceLang: d.voiceLang || 'en',
            crop: d.crop || d.category || 'General',
            likes: d.likes || 0,
            likedBy: d.likedBy || [],
            district: d.district || 'Karnataka',
            village: d.village || '',
            category: d.category || 'general',
            postType: d.postType || (d.voiceUrl ? 'voice' : 'text'),
            time: d.createdAt?.toDate ? formatTimeAgo(d.createdAt.toDate()) : 'Recently',
            comments: d.comments || []
          } as any);
        });
        if (pData.length > 0) {
          setPostsList(pData);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore posts listener error, relying on server state:', error);
        loadPostsFromServer();
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatTimeAgo = (date: Date) => {
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  // 2. Audio timer duration counts
  const startDurationTimer = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
  };

  // 3. Audio Recording Actions
  const startRecordingFlow = async () => {
    setPreviewBlobUrl(null);
    setPreviewBase64(null);
    setAiCaptionsResult(null);
    audioChunksRef.current = [];
    setVoiceRecordDuration(0);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const blobUrl = URL.createObjectURL(audioBlob);
          setPreviewBlobUrl(blobUrl);

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setPreviewBase64(base64Data);
          };
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start(250);
        setRecorderState('recording');
        startDurationTimer();
        triggerVisualToast('Recording started. Speak clearly near your microphone.');
      } else {
        throw new Error('Microphone device access is unavailable');
      }
    } catch (err: any) {
      console.warn('Microphone error:', err);
      triggerVisualToast('Microphone access blocked. Please allow microphone permissions in browser.');
      setRecorderState('idle');
    }
  };

  const pauseRecordingFlow = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecorderState('paused');
      stopDurationTimer();
      triggerVisualToast('Recording paused.');
    }
  };

  const resumeRecordingFlow = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecorderState('recording');
      startDurationTimer();
      triggerVisualToast('Recording resumed.');
    }
  };

  const stopRecordingFlow = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      triggerVisualToast('Recording completed. Preview your audio below.');
    }
    setRecorderState('idle');
    stopDurationTimer();
  };

  const deleteRecordingFlow = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewBase64(null);
    setVoiceRecordDuration(0);
    setAiCaptionsResult(null);
    setRecorderState('idle');
    triggerVisualToast('Voice recording cleared.');
  };

  // 4. Optional Voice Note Auto-Captioning via Gemini
  const extractAICaptions = async () => {
    if (!previewBase64) {
      triggerVisualToast('Please record a voice note first.');
      return;
    }
    setIsCapturingAI(true);

    try {
      const response = await fetch('/api/voice/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: previewBase64,
          language: selectedVoiceLanguage
        })
      });

      if (response.ok) {
        const captions = await response.json();
        setAiCaptionsResult(captions);
        if (captions.transcription) {
          setTextCaption(captions.transcription);
          if (!textTitle) {
            setTextTitle(captions.transcription.substring(0, 50));
          }
        }
        triggerVisualToast('Auto-caption successfully generated!');
      } else {
        triggerVisualToast('Auto-caption service unavailable. You can enter a short title manually.');
      }
    } catch (e) {
      triggerVisualToast('Could not generate auto-caption. You can type a short title manually.');
    } finally {
      setIsCapturingAI(false);
    }
  };

  // 5. Professional & Secure Publish Voice Post to Firestore and Community Feed
  const publishVoicePost = async () => {
    if (!previewBase64) {
      triggerVisualToast('Please record audio before publishing.');
      return;
    }

    const activeUser = auth.currentUser;
    const effectiveAuthorUid = activeUser?.uid || (userId && userId !== 'guest_uid' ? userId : null);

    if (!effectiveAuthorUid) {
      triggerVisualToast('Please log in with your phone or account to publish a voice update.');
      return;
    }

    setIsPublishing(true);

    const postTitle = textTitle.trim() || textCaption.trim() || 'Voice Advisory Update';
    const postTranscript = aiCaptionsResult?.transcription || textCaption.trim() || '';

    const newPostData = {
      author: userName || activeUser?.displayName || 'Farmer Partner',
      authorUid: activeUser?.uid || effectiveAuthorUid,
      isVerified: isVerifiedUser,
      title: postTitle,
      content: postTranscript ? `${postTitle} — "${postTranscript}"` : postTitle,
      transcript: postTranscript,
      voiceCaption: postTranscript,
      voiceTranslation: aiCaptionsResult?.translation || undefined,
      voiceSummary: aiCaptionsResult?.summary || undefined,
      voiceLang: selectedVoiceLanguage,
      district: selectedPostDistrict,
      village: selectedPostVillage,
      crop: selectedCropTag,
      category: selectedCropTag.toLowerCase(),
      postType: 'voice',
      voiceUrl: previewBase64,
      voiceDuration: voiceRecordDuration || 5,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp()
    };

    let generatedId = `voice_${Date.now()}`;

    try {
      // 1. Write to Firestore 'posts' collection
      try {
        const docRef = await addDoc(collection(db, 'posts'), newPostData);
        generatedId = docRef.id;
      } catch (firestoreError: any) {
        console.warn('Firestore direct write warning, mirroring via community server endpoint:', firestoreError);
      }

      // 2. Mirror to Server /api/posts for offline and resilient persistence
      try {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newPostData,
            id: generatedId,
            createdAt: new Date().toISOString()
          })
        });
      } catch (apiError) {
        console.warn('API mirror warning:', apiError);
      }

      // 3. Immediately display the new voice post locally
      const publishedPost: Post = {
        id: generatedId,
        author: newPostData.author,
        authorUid: newPostData.authorUid,
        isVerified: newPostData.isVerified,
        title: newPostData.title,
        content: newPostData.content,
        district: newPostData.district,
        village: newPostData.village,
        crop: newPostData.crop,
        category: newPostData.category,
        postType: 'voice',
        voiceUrl: newPostData.voiceUrl,
        voiceDuration: newPostData.voiceDuration,
        voiceCaption: newPostData.voiceCaption,
        voiceTranslation: newPostData.voiceTranslation,
        voiceSummary: newPostData.voiceSummary,
        voiceLang: newPostData.voiceLang,
        likes: 0,
        likedBy: [],
        time: 'Just now',
        comments: []
      } as any;

      setPostsList((prev) => [publishedPost, ...prev.filter((p) => p.id !== generatedId)]);

      // 4. Required Success Notification
      triggerVisualToast('Voice update published successfully.');

      // 5. Clear / Reset recording form
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      setPreviewBase64(null);
      setVoiceRecordDuration(0);
      setTextTitle('');
      setTextCaption('');
      setAiCaptionsResult(null);
      setRecorderState('idle');
    } catch (err: any) {
      console.error('Community Voice Hub publish error:', err);
      triggerVisualToast('Failed to publish voice post. Please check your connection and account.');
    } finally {
      setIsPublishing(false);
    }
  };

  // 6. Custom Voice Note Track Players
  const handleTogglePlayback = (postId: string, url: string) => {
    if (playingPostId === postId) {
      audioElementsRef.current[postId]?.pause();
      setPlayingPostId(null);
    } else {
      // Pause preceding
      if (playingPostId && audioElementsRef.current[playingPostId]) {
        audioElementsRef.current[playingPostId].pause();
      }

      if (!audioElementsRef.current[postId]) {
        const audio = new Audio(url);
        audioElementsRef.current[postId] = audio;

        audio.ontimeupdate = () => {
          setAudioPlaybackProgress((prev) => ({
            ...prev,
            [postId]: audio.currentTime
          }));
        };

        audio.onloadedmetadata = () => {
          setAudioPlaybackDuration((prev) => ({
            ...prev,
            [postId]: audio.duration || 10
          }));
        };

        audio.onended = () => {
          setPlayingPostId(null);
          setAudioPlaybackProgress((prev) => ({ ...prev, [postId]: 0 }));
        };
      }

      audioElementsRef.current[postId]
        .play()
        .then(() => {
          setPlayingPostId(postId);
        })
        .catch((e) => {
          console.warn('Audio playback error:', e);
          setPlayingPostId(null);
        });
    }
  };

  // 7. Simple engagement: Like post
  const toggleLikePost = async (post: Post) => {
    const isLiked = post.likedBy?.includes(userId);
    const updatedLikedBy = isLiked
      ? (post.likedBy || []).filter((uid) => uid !== userId)
      : [...(post.likedBy || []), userId];
    const updatedLikes = isLiked ? Math.max(0, (post.likes || 1) - 1) : (post.likes || 0) + 1;

    setPostsList((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes: updatedLikes, likedBy: updatedLikedBy } : p))
    );

    try {
      const docRef = doc(db, 'posts', post.id);
      await updateDoc(docRef, { likes: updatedLikes, likedBy: updatedLikedBy });
    } catch (e) {
      // Mirror to server endpoint
      fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).catch(() => {});
    }
  };

  // 8. Add comment
  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim()) return;
    const authorName = userName || 'Farmer Partner';
    const commentObj = {
      id: `comm_${Date.now()}`,
      author: authorName,
      content: newCommentText.trim(),
      time: 'Just now'
    };

    setPostsList((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), commentObj] } : p))
    );

    setNewCommentText('');
    triggerVisualToast('Comment added.');

    try {
      fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: authorName, content: commentObj.content, authorUid: userId })
      }).catch(() => {});
    } catch (e) {
      console.warn('Comment write warning:', e);
    }
  };

  const languageNames: Record<string, string> = {
    kn: 'ಕನ್ನಡ (Kannada)',
    hi: 'हिंदी (Hindi)',
    en: 'English',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    ml: 'മലയാളം (Malayalam)'
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 🚀 STEP 1: VOICE NOTE RECORDING CONSOLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Mic className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Voice Community Hub</h3>
              <p className="text-[10px] text-slate-400 font-bold">Record and share voice updates with farmers</p>
            </div>
          </div>
          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            VOICE COMMUNITY
          </span>
        </div>

        {/* Dynamic Controls based on recorder state */}
        <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center space-y-3 border border-slate-100">
          {recorderState === 'idle' && !previewBlobUrl && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                Tap the microphone button to start recording your farming update
              </p>
              <button
                onClick={startRecordingFlow}
                className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 transition-all cursor-pointer mx-auto"
                title="Start Recording"
              >
                <Mic className="w-8 h-8" />
              </button>
            </div>
          )}

          {/* Active recording state */}
          {recorderState !== 'idle' && (
            <div className="text-center w-full space-y-4 py-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                <span className="text-xl font-mono font-black text-slate-800">
                  {Math.floor(voiceRecordDuration / 60).toString().padStart(2, '0')}:
                  {(voiceRecordDuration % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider pl-2">
                  {recorderState === 'recording' ? 'Recording' : 'Paused'}
                </span>
              </div>

              {/* Pause, Resume, Stop buttons row */}
              <div className="flex items-center justify-center space-x-3.5">
                {recorderState === 'recording' ? (
                  <button
                    onClick={pauseRecordingFlow}
                    className="p-3 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 transition-all cursor-pointer"
                    title="Pause"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={resumeRecordingFlow}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all cursor-pointer"
                    title="Resume"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={stopRecordingFlow}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Stop Recording</span>
                </button>
              </div>
            </div>
          )}

          {/* Audio preview state before publishing */}
          {previewBlobUrl && (
            <div className="w-full space-y-3.5">
              <div className="flex justify-between items-center bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <div className="flex items-center space-x-2">
                  <Volume2 className="text-emerald-700 w-4 h-4" />
                  <span className="text-[11px] text-emerald-950 font-extrabold">
                    Audio Preview ({voiceRecordDuration}s Recorded)
                  </span>
                </div>
                <button
                  onClick={deleteRecordingFlow}
                  className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase flex items-center space-x-1 cursor-pointer"
                  title="Discard recording"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>
              </div>

              <audio src={previewBlobUrl} controls className="w-full h-9 bg-white rounded-full text-emerald-900" />

              {/* Language selection & Optional Auto-caption */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">
                    Spoken Language
                  </label>
                  <select
                    value={selectedVoiceLanguage}
                    onChange={(e) => setSelectedVoiceLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-200 outline-none p-2 rounded-xl text-slate-800 font-bold text-xs"
                  >
                    {Object.entries(languageNames).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={extractAICaptions}
                    disabled={isCapturingAI}
                    className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1 shadow-sm transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isCapturingAI ? 'Transcribing...' : 'Auto-Caption (Gemini)'}</span>
                  </button>
                </div>
              </div>

              {/* Short Title / Note */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-extrabold uppercase block">
                  Short Title / Note (Topic)
                </label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g. Tomato leaf curl advisory, Mandi price update..."
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-semibold outline-none text-slate-800 focus:border-emerald-500"
                />
              </div>

              {/* AI result visualization previews if extracted */}
              {aiCaptionsResult && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-2xl border border-indigo-100 space-y-1.5 text-xs">
                  <h5 className="font-extrabold text-indigo-950 flex items-center space-x-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Gemini Auto-Caption Summary</span>
                  </h5>
                  <div className="space-y-1 text-[11px] text-slate-700 leading-normal">
                    <p>
                      <strong>Transcript:</strong> {aiCaptionsResult.transcription}
                    </p>
                    {aiCaptionsResult.translation && (
                      <p>
                        <strong>English:</strong> {aiCaptionsResult.translation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Location & Crop Tag Controls */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded-2xl text-[10px] font-bold text-slate-700">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase">District</span>
                  <select
                    value={selectedPostDistrict}
                    onChange={(e) => setSelectedPostDistrict(e.target.value)}
                    className="bg-transparent font-black text-slate-800 outline-none cursor-pointer text-xs"
                  >
                    {KARNATAKA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase">Village</span>
                  <input
                    type="text"
                    value={selectedPostVillage}
                    onChange={(e) => setSelectedPostVillage(e.target.value)}
                    placeholder="Village name"
                    className="bg-transparent font-black text-slate-800 focus:bg-white px-1 py-0.5 rounded border-none outline-none text-xs"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase">Crop Tag</span>
                  <select
                    value={selectedCropTag}
                    onChange={(e) => setSelectedCropTag(e.target.value)}
                    className="bg-transparent font-black text-slate-800 outline-none cursor-pointer text-xs"
                  >
                    {CROP_TAGS.map((crop) => (
                      <option key={crop.value} value={crop.value}>
                        {crop.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publish Voice Update Button */}
              <button
                onClick={publishVoicePost}
                disabled={isPublishing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-60"
              >
                {isPublishing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-white" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-200" />
                    <span>Publish Voice Update</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 STEP 2: VOICE BROADCAST FEED CHANNELS */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5 pl-1">
          <Volume2 className="w-4 h-4 text-emerald-600" />
          <span>Regional Voice Updates ({postsList.filter((p) => p.voiceUrl).length})</span>
        </h4>

        {loading ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-6">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-slate-500 font-bold">Loading community voice updates...</p>
          </div>
        ) : postsList.filter((p) => p.voiceUrl).length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs font-semibold">
            No voice updates shared yet. Record and publish the first update above! 🎙️
          </div>
        ) : (
          <div className="space-y-3">
            {postsList
              .filter((post) => post.voiceUrl && !flaggedPosts.includes(post.id))
              .map((post) => {
                const isLiked = post.likedBy?.includes(userId);

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3 animate-fadeIn"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                          {(post.author || 'F')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <p className="text-xs font-bold text-slate-800">{post.author}</p>
                            {post.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />}
                          </div>
                          <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-bold">
                            <span className="flex items-center space-x-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>
                                {post.district}
                                {post.village ? ` • ${post.village}` : ''}
                              </span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{post.time || 'Recently'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Crop Tag Pill */}
                      {post.crop && (
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                          🌾 {post.crop}
                        </span>
                      )}
                    </div>

                    {/* Title / Note */}
                    {post.title && (
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                        {post.title}
                      </h4>
                    )}

                    {/* Integrated audio track player */}
                    {post.voiceUrl && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center space-x-3">
                        <button
                          onClick={() => handleTogglePlayback(post.id, post.voiceUrl!)}
                          className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0 hover:bg-emerald-700 active:scale-95 transition-all outline-none cursor-pointer"
                        >
                          {playingPostId === post.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          )}
                        </button>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                            <span>🎙️ Audio Note ({post.voiceLang?.toUpperCase() || 'Audio'})</span>
                            <span className="font-mono">
                              {Math.floor((audioPlaybackProgress[post.id] || 0) % 60).toString().padStart(2, '0')}s /{' '}
                              {post.voiceDuration ? `${post.voiceDuration}s` : '00:15s'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all"
                              style={{
                                width: `${
                                  audioPlaybackDuration[post.id]
                                    ? Math.min(
                                        100,
                                        ((audioPlaybackProgress[post.id] || 0) / audioPlaybackDuration[post.id]) * 100
                                      )
                                    : 0
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Caption / Transcript */}
                    {post.voiceCaption && post.voiceCaption !== post.title && (
                      <p className="text-[11px] text-slate-600 font-medium italic bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        "{post.voiceCaption}"
                      </p>
                    )}

                    {/* Bottom engagement row bar (Clean: Like & Comments only, NO fake stats) */}
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleLikePost(post)}
                        className={`flex items-center space-x-1.5 hover:text-red-500 cursor-pointer ${
                          isLiked ? 'text-red-500' : ''
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{post.likes || 0} Likes</span>
                      </button>

                      <button
                        onClick={() => setActiveCommentPostId((prev) => (prev === post.id ? null : post.id))}
                        className={`flex items-center space-x-1.5 hover:text-emerald-700 cursor-pointer ${
                          activeCommentPostId === post.id ? 'text-emerald-700' : ''
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </button>
                    </div>

                    {/* Comments drawer */}
                    {activeCommentPostId === post.id && (
                      <div className="border-t border-slate-100 pt-3 space-y-2.5 animate-fadeIn">
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {(!post.comments || post.comments.length === 0) ? (
                            <p className="text-[10px] text-slate-400 font-medium py-1">No comments yet. Be the first to reply!</p>
                          ) : (
                            post.comments.map((comment, index) => (
                              <div key={comment.id || index} className="bg-slate-50 p-2 rounded-xl text-[10px]">
                                <div className="flex justify-between font-bold text-slate-700">
                                  <span>{comment.author}</span>
                                  <span className="text-[8px] text-slate-400">{comment.time || 'Recently'}</span>
                                </div>
                                <p className="text-slate-600 mt-0.5">{comment.content}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Add a reply..."
                            className="flex-1 bg-slate-50 border text-xs p-2 rounded-xl focus:bg-white outline-none"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
