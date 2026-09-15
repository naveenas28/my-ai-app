import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Bell,
  PlusCircle,
  Mic,
  HelpCircle,
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  CheckCircle,
  Camera,
  Send,
  Volume2,
  Sparkles,
  Globe,
  FileText,
  X,
  ChevronDown,
  Filter,
  User,
  MapPin,
  Tag,
  Plus,
  ArrowRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { VoicePostsSystem } from './VoicePostsSystem';
import { FarmerChatSystem } from './FarmerChatSystem';
import { subscribeToCommunityNotifications, markNotificationAsRead, CommunityNotification } from '../services/communityService';
import {
  fetchAllCountries,
  fetchStatesForCountry,
  fetchDistrictsForState,
  fetchSubDistrictsForDistrict,
  getDynamicAdminTerms,
  ApiCountry,
  ApiState,
  ApiDistrict,
  ApiSubDistrict
} from '../services/locationService';
import {
  GLOBAL_COUNTRIES,
  getCountryAdminTerms,
  getCountryInfo
} from '../data/globalLocationData';

interface CommunityTabViewProps {
  communitySubTab: 'feed' | 'voice' | 'chat';
  setCommunitySubTab: (sub: 'feed' | 'voice' | 'chat') => void;
  communityTab: 'all' | 'saved' | 'trending';
  setCommunityTab: (tab: 'all' | 'saved' | 'trending') => void;
  districtFilter: string;
  setDistrictFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  posts: any[];
  savedPostIds: string[];
  followedFarmers: string[];
  isJoined: boolean;
  userPhone: string;
  firebaseAuthUid: string;
  firebaseAuthName: string;
  postCategory: string;
  setPostCategory: (val: string) => void;
  postDistrict: string;
  setPostDistrict: (val: string) => void;
  postVillage: string;
  setPostVillage: (val: string) => void;
  newPostContent: string;
  setNewPostContent: (val: string) => void;
  isRecordingVoicePost: boolean;
  voiceRecordDuration: number;
  voicePostBase64: string | null;
  setVoicePostBase64: (val: string | null) => void;
  voicePostCaption: string;
  setVoicePostCaption: (val: string) => void;
  selectedPostImage: string | null;
  setSelectedPostImage: (val: string | null) => void;
  hiddenPostImageInputRef: React.RefObject<HTMLInputElement | null>;
  startVoiceRecording: () => void;
  stopVoiceRecording: () => void;
  handleImageConversion: (e: any, type: string) => void;
  handleCreatePost: (cat: string, dist: string, vil: string, country?: string, state?: string, subDistrict?: string) => void;
  handleToggleFollowFarmer: (author: string) => void;
  handleToggleLike: (postId: string) => void;
  handleToggleSavePost: (postId: string) => void;
  handleCreateComment: (postId: string) => void;
  aiTranslations: Record<string, string>;
  aiSummaries: Record<string, string>;
  aiSuggestions: Record<string, string>;
  activePostComments: Record<string, string>;
  setActivePostComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadingAiField: Record<string, boolean>;
  handleTranslatePost: (postId: string, lang: string) => void;
  handleSummarizePost: (postId: string, lang: string) => void;
  handleSuggestReplyMessage: (postId: string, lang: string) => void;
  t: any;
  currentLang: string;
  triggerToast: (msg: string) => void;
}

export const CommunityTabView: React.FC<CommunityTabViewProps> = ({
  communitySubTab,
  setCommunitySubTab,
  communityTab,
  setCommunityTab,
  districtFilter: propDistrictFilter,
  setDistrictFilter: setPropDistrictFilter,
  categoryFilter,
  setCategoryFilter,
  posts,
  savedPostIds,
  followedFarmers,
  isJoined,
  userPhone,
  firebaseAuthUid,
  firebaseAuthName,
  postCategory,
  setPostCategory,
  postDistrict: propPostDistrict,
  setPostDistrict: setPropPostDistrict,
  postVillage: propPostVillage,
  setPostVillage: setPropPostVillage,
  newPostContent,
  setNewPostContent,
  isRecordingVoicePost,
  voiceRecordDuration,
  voicePostBase64,
  setVoicePostBase64,
  voicePostCaption,
  setVoicePostCaption,
  selectedPostImage,
  setSelectedPostImage,
  hiddenPostImageInputRef,
  startVoiceRecording,
  stopVoiceRecording,
  handleImageConversion,
  handleCreatePost,
  handleToggleFollowFarmer,
  handleToggleLike,
  handleToggleSavePost,
  handleCreateComment,
  aiTranslations,
  aiSummaries,
  aiSuggestions,
  activePostComments,
  setActivePostComments,
  loadingAiField,
  handleTranslatePost,
  handleSummarizePost,
  handleSuggestReplyMessage,
  t,
  currentLang,
  triggerToast,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsList, setNotificationsList] = useState<CommunityNotification[]>([]);

  // Global API Countries state
  const [apiCountries, setApiCountries] = useState<ApiCountry[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(true);
  const [countryApiError, setCountryApiError] = useState<string | null>(null);

  // Global Hierarchical Location States for Feed Filtering
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [subDistrictFilter, setSubDistrictFilter] = useState<string>('all');

  // Dynamic filter state options loaded from real API
  const [filterStates, setFilterStates] = useState<ApiState[]>([]);
  const [isLoadingFilterStates, setIsLoadingFilterStates] = useState<boolean>(false);
  const [filterDistricts, setFilterDistricts] = useState<ApiDistrict[]>([]);
  const [isLoadingFilterDistricts, setIsLoadingFilterDistricts] = useState<boolean>(false);
  const [filterSubDistricts, setFilterSubDistricts] = useState<ApiSubDistrict[]>([]);
  const [isLoadingFilterSubDistricts, setIsLoadingFilterSubDistricts] = useState<boolean>(false);

  // Global Hierarchical Location States for Post Creation
  const [postCountry, setPostCountry] = useState<string>('India');
  const [postState, setPostState] = useState<string>('Karnataka');
  const [postDistrict, setPostDistrict] = useState<string>('Chikkaballapura');
  const [postSubDistrict, setPostSubDistrict] = useState<string>('Chikkaballapura');
  const [postVillage, setPostVillage] = useState<string>('');

  // Dynamic post creation state options loaded from real API
  const [postStates, setPostStates] = useState<ApiState[]>([]);
  const [isLoadingPostStates, setIsLoadingPostStates] = useState<boolean>(false);
  const [postDistricts, setPostDistricts] = useState<ApiDistrict[]>([]);
  const [isLoadingPostDistricts, setIsLoadingPostDistricts] = useState<boolean>(false);
  const [postSubDistricts, setPostSubDistricts] = useState<ApiSubDistrict[]>([]);
  const [isLoadingPostSubDistricts, setIsLoadingPostSubDistricts] = useState<boolean>(false);

  // Dynamic admin terms for filter bar & post creation
  const filterAdminTerms = useMemo(() => getDynamicAdminTerms(countryFilter), [countryFilter]);
  const postAdminTerms = useMemo(() => getDynamicAdminTerms(postCountry), [postCountry]);

  // Load all global countries on mount from Real Free Global API
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCountries(true);
    fetchAllCountries()
      .then((data) => {
        if (isMounted) {
          setApiCountries(data);
          setIsLoadingCountries(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API Country fetch warning:', err);
          setCountryApiError('Unable to load locations. Please check your connection and try again.');
          setIsLoadingCountries(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cascading Filter: Fetch States when countryFilter changes
  useEffect(() => {
    if (!countryFilter || countryFilter === 'all') {
      setFilterStates([]);
      setFilterDistricts([]);
      setFilterSubDistricts([]);
      return;
    }
    let isMounted = true;
    setIsLoadingFilterStates(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === countryFilter.toLowerCase());
    fetchStatesForCountry(countryFilter, countryObj?.code)
      .then((states) => {
        if (isMounted) {
          setFilterStates(states);
          setIsLoadingFilterStates(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API States fetch error:', err);
          setFilterStates([]);
          setIsLoadingFilterStates(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [countryFilter, apiCountries]);

  // Cascading Filter: Fetch Districts when stateFilter changes
  useEffect(() => {
    if (!countryFilter || countryFilter === 'all' || !stateFilter || stateFilter === 'all') {
      setFilterDistricts([]);
      setFilterSubDistricts([]);
      return;
    }
    let isMounted = true;
    setIsLoadingFilterDistricts(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === countryFilter.toLowerCase());
    const stateObj = filterStates.find(s => s.name.toLowerCase() === stateFilter.toLowerCase());
    fetchDistrictsForState(countryFilter, stateFilter, countryObj?.code || stateObj?.countryCode)
      .then((dists) => {
        if (isMounted) {
          setFilterDistricts(dists);
          setIsLoadingFilterDistricts(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API Districts fetch error:', err);
          setFilterDistricts([]);
          setIsLoadingFilterDistricts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [countryFilter, stateFilter, filterStates, apiCountries]);

  // Cascading Filter: Fetch Sub-Districts when districtFilter changes
  useEffect(() => {
    if (!countryFilter || countryFilter === 'all' || !stateFilter || stateFilter === 'all' || !districtFilter || districtFilter === 'all') {
      setFilterSubDistricts([]);
      return;
    }
    let isMounted = true;
    setIsLoadingFilterSubDistricts(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === countryFilter.toLowerCase());
    fetchSubDistrictsForDistrict(countryFilter, stateFilter, districtFilter, countryObj?.code)
      .then((subDists) => {
        if (isMounted) {
          setFilterSubDistricts(subDists);
          setIsLoadingFilterSubDistricts(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API Sub-districts fetch error:', err);
          setFilterSubDistricts([]);
          setIsLoadingFilterSubDistricts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [countryFilter, stateFilter, districtFilter, apiCountries]);

  // Cascading Post Creation: Fetch States when postCountry changes
  useEffect(() => {
    if (!postCountry) return;
    let isMounted = true;
    setIsLoadingPostStates(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === postCountry.toLowerCase());
    fetchStatesForCountry(postCountry, countryObj?.code)
      .then((states) => {
        if (isMounted) {
          setPostStates(states);
          setIsLoadingPostStates(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API Post States fetch error:', err);
          setPostStates([]);
          setIsLoadingPostStates(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [postCountry, apiCountries]);

  // Cascading Post Creation: Fetch Districts when postState changes
  useEffect(() => {
    if (!postCountry || !postState) return;
    let isMounted = true;
    setIsLoadingPostDistricts(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === postCountry.toLowerCase());
    const stateObj = postStates.find(s => s.name.toLowerCase() === postState.toLowerCase());
    fetchDistrictsForState(postCountry, postState, countryObj?.code || stateObj?.countryCode)
      .then((dists) => {
        if (isMounted) {
          setPostDistricts(dists);
          setIsLoadingPostDistricts(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API Post Districts fetch error:', err);
          setPostDistricts([]);
          setIsLoadingPostDistricts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [postCountry, postState, postStates, apiCountries]);

  // Cascading Post Creation: Fetch Sub-Districts when postDistrict changes
  useEffect(() => {
    if (!postCountry || !postState || !postDistrict) return;
    let isMounted = true;
    setIsLoadingPostSubDistricts(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === postCountry.toLowerCase());
    fetchSubDistrictsForDistrict(postCountry, postState, postDistrict, countryObj?.code)
      .then((subDists) => {
        if (isMounted) {
          setPostSubDistricts(subDists);
          setIsLoadingPostSubDistricts(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Location API Post Sub-districts fetch error:', err);
          setPostSubDistricts([]);
          setIsLoadingPostSubDistricts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [postCountry, postState, postDistrict, apiCountries]);

  // Subscribe to real-time community notifications
  useEffect(() => {
    const unsub = subscribeToCommunityNotifications(firebaseAuthUid, (notifs) => {
      setNotificationsList(notifs);
    });
    return () => unsub();
  }, [firebaseAuthUid]);

  const unreadCount = notificationsList.filter(n => !n.read).length;

  // Categories definition
  const CATEGORIES = [
    { id: 'all', label: 'All Discussions', icon: '🌾' },
    { id: 'crop_update', label: 'Crops', icon: '🌽' },
    { id: 'disease', label: 'Pest & Disease', icon: '🐛' },
    { id: 'weather', label: 'Weather', icon: '⛈️' },
    { id: 'market', label: 'Market', icon: '📈' },
    { id: 'general', label: 'Farming Tips', icon: '💡' },
    { id: 'schemes', label: 'Govt Schemes', icon: '🏛️' },
  ];

  // Filter posts based on search, hierarchical location (country, state, district), category, and tab
  const filteredPosts = posts
    .filter((post) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = post.content?.toLowerCase().includes(q);
        const matchesAuthor = post.author?.toLowerCase().includes(q);
        const matchesVillage = post.village?.toLowerCase().includes(q);
        const matchesSubDistrict = post.subDistrict?.toLowerCase().includes(q);
        const matchesDistrict = post.district?.toLowerCase().includes(q);
        const matchesState = post.state?.toLowerCase().includes(q);
        const matchesCountry = post.country?.toLowerCase().includes(q);
        if (!matchesContent && !matchesAuthor && !matchesVillage && !matchesSubDistrict && !matchesDistrict && !matchesState && !matchesCountry) {
          return false;
        }
      }

      // Country filter
      if (countryFilter !== 'all' && post.country && post.country !== countryFilter) {
        return false;
      }

      // State filter
      if (stateFilter !== 'all' && post.state && post.state !== stateFilter) {
        return false;
      }

      // District filter
      if (districtFilter !== 'all' && post.district && post.district !== districtFilter) {
        return false;
      }

      // Sub-district / Taluk filter
      if (subDistrictFilter !== 'all' && post.subDistrict && post.subDistrict !== subDistrictFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'crops' || categoryFilter === 'market') {
          if (post.category !== 'crop_update') return false;
        } else if (categoryFilter === 'schemes' || categoryFilter === 'tips') {
          if (post.category !== 'general') return false;
        } else if (post.category !== categoryFilter) {
          return false;
        }
      }
      // Saved tab
      if (communityTab === 'saved') return savedPostIds.includes(post.id);
      return true;
    })
    .sort((a, b) => {
      const aFollowed = followedFarmers.includes(a.author) ? 1 : 0;
      const bFollowed = followedFarmers.includes(b.author) ? 1 : 0;
      if (aFollowed !== bFollowed) return bFollowed - aFollowed;
      if (communityTab === 'trending') return (b.likes || 0) - (a.likes || 0);
      return 0;
    });

  return (
    <div id="v_community_page" className="p-3.5 space-y-4 animate-fadeIn max-w-xl mx-auto w-full pb-24 text-slate-800">
      
      {/* 1. HEADER */}
      <header id="community_header" className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-xs flex items-center justify-between relative z-20">
        <div>
          <h1 className="text-base font-black text-slate-800 flex items-center space-x-1.5 leading-none">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Community</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1">
            Connect with farmers and share knowledge
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Search Toggle Icon */}
          <button
            onClick={() => {
              setShowSearchInput(!showSearchInput);
              if (showSearchInput) setSearchQuery('');
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showSearchInput || searchQuery 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
            }`}
            title="Search posts"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Icon */}
          <button
            onClick={() => {
              setShowNotificationsModal(!showNotificationsModal);
              if (!showNotificationsModal && unreadCount > 0) {
                notificationsList.forEach(n => {
                  if (!n.read) markNotificationAsRead(n.id);
                });
              }
            }}
            className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200/80 cursor-pointer transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notifications Drawer */}
      {showNotificationsModal && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs space-y-2.5 animate-fadeIn shadow-sm">
          <div className="flex justify-between items-center font-bold text-emerald-900 border-b border-emerald-200/60 pb-2">
            <span className="flex items-center space-x-1.5 font-black text-xs">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Community Notifications ({notificationsList.length})</span>
            </span>
            <button
              onClick={() => setShowNotificationsModal(false)}
              className="text-emerald-700 hover:text-emerald-900 text-[10px] uppercase font-black cursor-pointer px-2 py-0.5 rounded-lg hover:bg-emerald-100/60"
            >
              Close
            </button>
          </div>

          {notificationsList.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notificationsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) markNotificationAsRead(item.id);
                    if (item.type === 'voice') setCommunitySubTab('voice');
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-white/80 border-emerald-100 text-slate-700'
                      : 'bg-white border-emerald-300 shadow-2xs text-slate-900 font-bold'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-emerald-800 flex items-center space-x-1">
                      <span>{item.type === 'like' ? '❤️' : item.type === 'comment' ? '💬' : item.type === 'voice' ? '🎙️' : '🌾'}</span>
                      <span>{item.title}</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">{item.createdAt}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium leading-snug">{item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-emerald-800 text-[11px] font-medium">
              No recent notifications. You are all caught up! 🌾
            </div>
          )}
        </div>
      )}

      {/* Inline Search Bar */}
      {showSearchInput && (
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2 animate-fadeIn">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, farmer name, village..."
            className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none py-1"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Sub-Nav Switcher (Feed / Voice Hub / Farmers Chat) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/80">
        <button
          onClick={() => setCommunitySubTab('feed')}
          className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            communitySubTab === 'feed'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🚀 Feed</span>
        </button>
        <button
          onClick={() => {
            setCommunitySubTab('voice');
            triggerToast('Opened Voice Hub 🎙️');
          }}
          className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            communitySubTab === 'voice'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🎙️ Voice Hub</span>
        </button>
        <button
          onClick={() => {
            setCommunitySubTab('chat');
            triggerToast('Opened Peer Farmer Chat 💬');
          }}
          className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            communitySubTab === 'chat'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>💬 Farmer Chat</span>
        </button>
      </div>

      {/* RENDER VOICE HUB IF ACTIVE */}
      {communitySubTab === 'voice' && (
        <VoicePostsSystem
          currentLang={currentLang}
          triggerVisualToast={triggerToast}
          userId={firebaseAuthUid}
          userName={firebaseAuthName}
          district={postDistrict}
          village={postVillage}
          isVerifiedUser={isJoined}
        />
      )}

      {/* RENDER FARMER CHAT IF ACTIVE */}
      {communitySubTab === 'chat' && (
        <FarmerChatSystem
          currentLang={currentLang}
          triggerVisualToast={triggerToast}
          userId={firebaseAuthUid}
          userName={firebaseAuthName}
          district={postDistrict}
          village={postVillage}
          isVerifiedUser={isJoined}
        />
      )}

      {/* RENDER MAIN COMMUNITY FEED IF ACTIVE */}
      {communitySubTab === 'feed' && (
        <>
          {/* 2. COMMUNITY QUICK ACTIONS (CLEAN 2x2 GRID) */}
          <div id="community_quick_actions" className="space-y-2">
            <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center justify-between">
              <span>⚡ Community Quick Actions</span>
              <span className="text-[9px] text-slate-400 font-bold">2x2 grid</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1: Create Post */}
              <button
                onClick={() => {
                  setShowCreateCard(true);
                  triggerToast('Composition form ready');
                  setTimeout(() => {
                    document.getElementById('new_post_content_area')?.focus();
                  }, 100);
                }}
                className="bg-white hover:bg-emerald-50/80 active:scale-[0.98] rounded-2xl p-3 border border-slate-200/80 text-left flex items-center space-x-3 cursor-pointer shadow-2xs transition-all group"
              >
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">Create Post</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">Share crop updates</span>
                </div>
              </button>

              {/* Action 2: Voice Post */}
              <button
                onClick={() => {
                  setCommunitySubTab('voice');
                  triggerToast('Opening Voice Hub...');
                }}
                className="bg-white hover:bg-indigo-50/80 active:scale-[0.98] rounded-2xl p-3 border border-slate-200/80 text-left flex items-center space-x-3 cursor-pointer shadow-2xs transition-all group"
              >
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">Voice Post</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">Record sound note</span>
                </div>
              </button>

              {/* Action 3: Ask the Community */}
              <button
                onClick={() => {
                  setPostCategory('general');
                  setNewPostContent('❓ [Question for Community]: ');
                  setShowCreateCard(true);
                  triggerToast('Type your question for fellow farmers');
                  setTimeout(() => {
                    document.getElementById('new_post_content_area')?.focus();
                  }, 100);
                }}
                className="bg-white hover:bg-amber-50/80 active:scale-[0.98] rounded-2xl p-3 border border-slate-200/80 text-left flex items-center space-x-3 cursor-pointer shadow-2xs transition-all group"
              >
                <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">Ask Community</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">Get farming advice</span>
                </div>
              </button>

              {/* Action 4: Farmer Chat */}
              <button
                onClick={() => {
                  setCommunitySubTab('chat');
                  triggerToast('Opening Farmer Chat...');
                }}
                className="bg-white hover:bg-teal-50/80 active:scale-[0.98] rounded-2xl p-3 border border-slate-200/80 text-left flex items-center space-x-3 cursor-pointer shadow-2xs transition-all group"
              >
                <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">Farmer Chat</span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">Peer real-time chat</span>
                </div>
              </button>
            </div>
          </div>

          {/* 4. CATEGORIES (COMPACT CHIPS) */}
          <div id="community_categories" className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                🏷️ Categories
              </h2>
              <span className="text-[9px] text-slate-400 font-bold">Filter feed by topic</span>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
              {CATEGORIES.map((cat) => {
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      triggerToast(`Filtered by ${cat.label}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center space-x-1.5 border ${
                      isActive
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hierarchical Location & Feed Tabs Filter Row */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-700 flex items-center space-x-1">
                <span>📍</span>
                <span>Location & Feed Filters</span>
              </span>
              {(countryFilter !== 'all' || stateFilter !== 'all' || districtFilter !== 'all' || subDistrictFilter !== 'all') && (
                <button
                  onClick={() => {
                    setCountryFilter('all');
                    setStateFilter('all');
                    setDistrictFilter('all');
                    setSubDistrictFilter('all');
                    triggerToast('Location filters reset to all regions');
                  }}
                  className="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Location
                </button>
              )}
            </div>

            {/* Hierarchical Filter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Country Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block truncate">
                  🌍 {filterAdminTerms.country}
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    setCountryFilter(newCountry);
                    setStateFilter('all');
                    setDistrictFilter('all');
                    setSubDistrictFilter('all');
                    triggerToast(`Filter: ${newCountry === 'all' ? 'All Countries' : newCountry}`);
                  }}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">🌐 All Countries</option>
                  {isLoadingCountries && apiCountries.length === 0 ? (
                    <option disabled>Loading countries from API...</option>
                  ) : (
                    (apiCountries.length > 0 ? apiCountries : GLOBAL_COUNTRIES).map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag || '📍'} {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* State / Province Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block truncate">
                  🏛️ {filterAdminTerms.state}
                </label>
                <select
                  value={stateFilter}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setStateFilter(newState);
                    setDistrictFilter('all');
                    setSubDistrictFilter('all');
                    triggerToast(`Filter: ${newState === 'all' ? `All ${filterAdminTerms.state}s` : newState}`);
                  }}
                  disabled={countryFilter === 'all'}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">📍 All {filterAdminTerms.state}s</option>
                  {isLoadingFilterStates ? (
                    <option disabled>Loading {filterAdminTerms.state}s from API...</option>
                  ) : (
                    filterStates.map((st) => (
                      <option key={st.code || st.name} value={st.name}>
                        {st.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* District / County Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block truncate">
                  📍 {filterAdminTerms.district}
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    const newDist = e.target.value;
                    setDistrictFilter(newDist);
                    setSubDistrictFilter('all');
                    triggerToast(`Filter: ${newDist === 'all' ? `All ${filterAdminTerms.district}s` : newDist}`);
                  }}
                  disabled={countryFilter === 'all' || stateFilter === 'all'}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">📍 All {filterAdminTerms.district}s</option>
                  {isLoadingFilterDistricts ? (
                    <option disabled>Loading {filterAdminTerms.district}s from API...</option>
                  ) : (
                    filterDistricts.map((d) => (
                      <option key={d.code || d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Sub-District / Taluk Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block truncate">
                  🏘️ {filterAdminTerms.subDistrict}
                </label>
                {countryFilter === 'all' || stateFilter === 'all' || districtFilter === 'all' ? (
                  <select
                    disabled
                    className="w-full bg-slate-50 text-slate-400 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-not-allowed opacity-60"
                  >
                    <option>Select {filterAdminTerms.district} first</option>
                  </select>
                ) : isLoadingFilterSubDistricts ? (
                  <div className="w-full bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold flex items-center space-x-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
                    <span className="truncate">Loading {filterAdminTerms.subDistrict}s...</span>
                  </div>
                ) : filterSubDistricts.length === 0 ? (
                  <div className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-medium italic truncate">
                    Location data unavailable for this level
                  </div>
                ) : (
                  <select
                    value={subDistrictFilter}
                    onChange={(e) => {
                      setSubDistrictFilter(e.target.value);
                      triggerToast(`Filter: ${e.target.value === 'all' ? `All ${filterAdminTerms.subDistrict}s` : e.target.value}`);
                    }}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="all">📍 All {filterAdminTerms.subDistrict}s</option>
                    {filterSubDistricts.map((sd) => (
                      <option key={sd.code || sd.name} value={sd.name}>
                        {sd.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Feed Sorting Tabs */}
            <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-slate-400">🔥 Feed Feed</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 w-full sm:w-auto">
                <button
                  onClick={() => setCommunityTab('all')}
                  className={`flex-1 sm:flex-initial px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    communityTab === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCommunityTab('saved')}
                  className={`flex-1 sm:flex-initial px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    communityTab === 'saved' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Saved ({savedPostIds.length})
                </button>
                <button
                  onClick={() => setCommunityTab('trending')}
                  className={`flex-1 sm:flex-initial px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    communityTab === 'trending' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Trending
                </button>
              </div>
            </div>
          </div>

          {/* CREATE POST CARD (TOGGLEABLE OR ALWAYS ACCESSIBLE) */}
          {(showCreateCard || newPostContent || selectedPostImage || voicePostBase64) && (
            <div id="community_create_box" className="bg-white rounded-3xl border border-emerald-200 shadow-md p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                    {isJoined ? t.profile.farmerName[0] : 'F'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{isJoined ? t.profile.farmerName : 'AgriVerse Partner'}</p>
                    <p className="text-[9px] text-slate-400 font-bold">New Community Post</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Category inside post composition */}
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-black rounded-xl px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="general">💬 General</option>
                    <option value="disease">🐛 Pests</option>
                    <option value="weather">⛈️ Weather</option>
                    <option value="crop_update">🌾 Crop/Harvest</option>
                  </select>

                  <button
                    onClick={() => setShowCreateCard(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Hierarchical Location for post */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500 flex items-center space-x-1">
                    <span>📍</span>
                    <span>Post Location ({postAdminTerms.country} • {postAdminTerms.state} • {postAdminTerms.district})</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-bold text-slate-700">
                  {/* Country Select */}
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">
                      {postAdminTerms.country}
                    </label>
                    <select
                      value={postCountry}
                      onChange={(e) => {
                        const newC = e.target.value;
                        setPostCountry(newC);
                      }}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[10px] font-bold cursor-pointer"
                    >
                      {(apiCountries.length > 0 ? apiCountries : GLOBAL_COUNTRIES).map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.flag || '📍'} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State Select */}
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">
                      {postAdminTerms.state}
                    </label>
                    <select
                      value={postState}
                      onChange={(e) => {
                        const newSt = e.target.value;
                        setPostState(newSt);
                      }}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[10px] font-bold cursor-pointer"
                    >
                      {isLoadingPostStates ? (
                        <option disabled>Loading {postAdminTerms.state}s...</option>
                      ) : (
                        postStates.map((st) => (
                          <option key={st.code || st.name} value={st.name}>
                            {st.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* District Select */}
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">
                      {postAdminTerms.district}
                    </label>
                    <select
                      value={postDistrict}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        setPostDistrict(newDist);
                      }}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[10px] font-bold cursor-pointer"
                    >
                      {isLoadingPostDistricts ? (
                        <option disabled>Loading {postAdminTerms.district}s...</option>
                      ) : (
                        postDistricts.map((d) => (
                          <option key={d.code || d.name} value={d.name}>
                            {d.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Sub-District / Taluk */}
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">
                      {postAdminTerms.subDistrict}
                    </label>
                    {isLoadingPostSubDistricts ? (
                      <div className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 truncate flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
                        <span>Loading...</span>
                      </div>
                    ) : postSubDistricts.length > 0 ? (
                      <select
                        value={postSubDistrict}
                        onChange={(e) => setPostSubDistrict(e.target.value)}
                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[10px] font-bold cursor-pointer"
                      >
                        {postSubDistricts.map((sd) => (
                          <option key={sd.code || sd.name} value={sd.name}>
                            {sd.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={postSubDistrict}
                        onChange={(e) => setPostSubDistrict(e.target.value)}
                        placeholder={`${postAdminTerms.subDistrict}...`}
                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[10px] font-bold"
                      />
                    )}
                  </div>

                  {/* Village / Town */}
                  <div className="col-span-2 sm:col-span-2">
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">
                      {postAdminTerms.village}
                    </label>
                    <input
                      type="text"
                      value={postVillage}
                      onChange={(e) => setPostVillage(e.target.value)}
                      placeholder={`Enter ${postAdminTerms.village.toLowerCase()} name...`}
                      className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg px-2 py-1 outline-none text-[10px] font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Text Area Input */}
              <textarea
                id="new_post_content_area"
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={currentLang === 'kn' ? 'ನಿಮ್ಮ ಕೃಷಿ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ಕೊಯ್ಲು ಫೋಟೋಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ...' : 'Share crop updates, ask questions, or post harvest photos...'}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl p-3 text-xs font-medium outline-none transition-all resize-none"
              />

              {/* Voice recording indicator */}
              {isRecordingVoicePost && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-2xl animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></div>
                    <span className="text-[10px] text-red-800 font-black uppercase tracking-wider">
                      Recording Voice Note... {voiceRecordDuration}s
                    </span>
                  </div>
                  <button
                    onClick={stopVoiceRecording}
                    className="bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl hover:bg-red-700 cursor-pointer"
                  >
                    Stop & Attach
                  </button>
                </div>
              )}

              {/* Voice Attachment Preview */}
              {voicePostBase64 && (
                <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-indigo-800 font-black uppercase tracking-wider flex items-center space-x-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🎙️ Voice Note Attached</span>
                    </span>
                    <button
                      onClick={() => {
                        setVoicePostBase64(null);
                        setVoicePostCaption('');
                      }}
                      className="text-red-500 hover:text-red-700 font-bold text-[9px] uppercase cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <audio controls src={voicePostBase64} className="w-full h-8 cursor-pointer rounded" />
                </div>
              )}

              {/* Image attachment preview */}
              {selectedPostImage && (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200">
                  <img referrerPolicy="no-referrer" src={selectedPostImage} alt="Attachment" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelectedPostImage(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full cursor-pointer hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => hiddenPostImageInputRef.current?.click()}
                    className="p-2 hover:bg-slate-50 hover:text-emerald-700 rounded-xl flex items-center space-x-1 text-slate-500 text-[10px] font-bold border border-slate-200 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Photo</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={hiddenPostImageInputRef as any}
                    className="hidden"
                    onChange={(e) => handleImageConversion(e, 'post')}
                  />

                  <button
                    onClick={() => {
                      if (isRecordingVoicePost) {
                        stopVoiceRecording();
                      } else {
                        startVoiceRecording();
                      }
                    }}
                    className={`p-2 rounded-xl flex items-center space-x-1 text-[10px] font-bold border transition-all cursor-pointer ${
                      isRecordingVoicePost 
                        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                        : voicePostBase64 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'hover:bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Mic className={`w-4 h-4 ${isRecordingVoicePost ? 'text-red-600' : 'text-indigo-600'}`} />
                    <span>{isRecordingVoicePost ? 'Recording...' : 'Voice'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const countryObj = apiCountries.find(c => c.name.toLowerCase() === postCountry.toLowerCase()) || getCountryInfo(postCountry);
                    const stateObj = postStates.find(s => s.name.toLowerCase() === postState.toLowerCase());
                    const distObj = postDistricts.find(d => d.name.toLowerCase() === postDistrict.toLowerCase());
                    const subDistObj = postSubDistricts.find(sd => sd.name.toLowerCase() === postSubDistrict.toLowerCase());

                    handleCreatePost(
                      postCategory,
                      {
                        country: postCountry,
                        countryName: countryObj?.name || postCountry,
                        countryCode: countryObj?.code || 'IN',
                        state: postState,
                        stateName: stateObj?.name || postState,
                        stateCode: stateObj?.code || '',
                        district: postDistrict,
                        districtName: distObj?.name || postDistrict,
                        districtCode: distObj?.code || '',
                        subDistrict: postSubDistrict,
                        subDistrictName: subDistObj?.name || postSubDistrict,
                        subDistrictCode: subDistObj?.code || '',
                        village: postVillage,
                        villageName: postVillage
                      }
                    );
                    setShowCreateCard(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
                >
                  <span>Share Post</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* 3. COMMUNITY FEED LIST */}
          <div id="community_feed_list" className="space-y-3.5">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                📢 Farmers Feed ({filteredPosts.length})
              </h2>
              <button
                onClick={() => {
                  setShowCreateCard(true);
                  triggerToast('Opening post form...');
                }}
                className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 cursor-pointer"
              >
                + New Post
              </button>
            </div>

            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                const isLiked = (post.likedBy || []).includes(isJoined ? t.profile.farmerName : 'guest_user');
                const isSaved = savedPostIds.includes(post.id);
                const isFollowing = followedFarmers.includes(post.author);

                return (
                  <div
                    key={post.id}
                    className={`bg-white rounded-3xl border shadow-xs p-4 space-y-3 transition-all ${
                      isFollowing ? 'border-amber-200 ring-2 ring-amber-100/40' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Post Header: Farmer Info & Topic */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200/60 flex items-center justify-center font-black text-emerald-800 text-xs uppercase shadow-2xs">
                          {post.author ? post.author[0] : 'F'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 flex items-center space-x-1">
                            <span>{post.author}</span>
                            {post.isVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />}
                            {isFollowing && (
                              <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded uppercase font-black tracking-wider leading-none">
                                Connected
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">
                            📍 {[post.village, post.subDistrict && post.subDistrict !== post.district ? post.subDistrict : null, post.district, post.state, post.country && post.country !== 'India' ? post.country : null].filter(Boolean).join(', ') || 'Agri Community'} • {post.time || 'Recently'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {/* Topic badge */}
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          {post.category === 'disease' ? '🐛 Pests' : post.category === 'weather' ? '⛈️ Weather' : post.category === 'crop_update' ? '🌾 Crops' : '💬 Tips'}
                        </span>

                        {/* Follow Button */}
                        <button
                          onClick={() => handleToggleFollowFarmer(post.author)}
                          className={`text-[9px] font-black uppercase px-2 py-1 rounded-xl border transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isFollowing ? '✓ Connected' : '+ Connect'}
                        </button>
                      </div>
                    </div>

                    {/* Post Text Content */}
                    <div>
                      <p className="text-xs leading-relaxed text-slate-700 font-medium">
                        {post.content}
                      </p>

                      {/* AI Translation output */}
                      {aiTranslations[post.id] && (
                        <div className="mt-2 bg-emerald-50/60 p-2.5 rounded-2xl text-[11px] leading-relaxed text-emerald-900 border border-emerald-200/60 animate-fadeIn space-y-1 font-medium">
                          <span className="text-[9px] uppercase font-black text-emerald-700 flex items-center space-x-0.5">
                            <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" />
                            <span>Gemini AI Translated:</span>
                          </span>
                          <p>{aiTranslations[post.id]}</p>
                        </div>
                      )}

                      {/* AI Synopsis output */}
                      {aiSummaries[post.id] && (
                        <div className="mt-2 bg-indigo-50/50 p-2.5 rounded-2xl text-[11px] leading-relaxed text-indigo-900 border border-indigo-200/60 animate-fadeIn space-y-1 font-medium">
                          <span className="text-[9px] uppercase font-black text-indigo-700 flex items-center space-x-0.5">
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>AI Synopsis:</span>
                          </span>
                          <p>• {aiSummaries[post.id]}</p>
                        </div>
                      )}
                    </div>

                    {/* Voice audio player */}
                    {post.voiceUrl && (
                      <div className="bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100 space-y-1">
                        <div className="flex items-center justify-between text-indigo-800 text-[10px] font-bold">
                          <span className="flex items-center space-x-1">
                            <Volume2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            <span>🎙️ Farmer Voice Note</span>
                          </span>
                          <span className="text-[8px] bg-indigo-100 text-indigo-800 font-black px-1.5 rounded uppercase">Audio</span>
                        </div>
                        <audio controls src={post.voiceUrl} className="w-full h-8 cursor-pointer max-w-full" />
                        {post.voiceCaption && (
                          <p className="text-[10px] text-indigo-900 font-medium bg-white p-2 rounded-xl border border-indigo-100">
                            {post.voiceCaption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Image attachment */}
                    {post.image?.startsWith('data:image') || post.image?.startsWith('http') ? (
                      <div className="rounded-2xl overflow-hidden max-h-[220px] border border-slate-100">
                        <img referrerPolicy="no-referrer" src={post.image} alt="Crop sample" className="w-full h-full object-cover" />
                      </div>
                    ) : null}

                    {/* AI Expert Tools Bar */}
                    <div className="flex items-center bg-slate-50 p-2 rounded-2xl justify-between border border-slate-100 text-[10px] font-bold text-slate-500">
                      <span className="text-[8px] font-black uppercase text-emerald-700 flex items-center space-x-0.5 shrink-0">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>AI Assistance:</span>
                      </span>

                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleTranslatePost(post.id, currentLang)}
                          className={`px-2 py-0.5 rounded-lg bg-white border cursor-pointer ${
                            loadingAiField[`${post.id}_translate`] ? 'animate-pulse text-indigo-600' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          🌍 Translate
                        </button>
                        <button
                          onClick={() => handleSummarizePost(post.id, currentLang)}
                          className={`px-2 py-0.5 rounded-lg bg-white border cursor-pointer ${
                            loadingAiField[`${post.id}_summarize`] ? 'animate-pulse text-emerald-600' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          ⚡ Synopsis
                        </button>
                        <button
                          onClick={() => handleSuggestReplyMessage(post.id, currentLang)}
                          className={`px-2 py-0.5 rounded-lg bg-white border cursor-pointer ${
                            loadingAiField[`${post.id}_suggest`] ? 'animate-pulse text-amber-600' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          💡 Suggest Reply
                        </button>
                      </div>
                    </div>

                    {/* AI Proposed Suggestion Prompt */}
                    {aiSuggestions[post.id] && (
                      <div
                        onClick={() => {
                          setActivePostComments(prev => ({ ...prev, [post.id]: aiSuggestions[post.id] }));
                          triggerToast('AI proposed response pasted into comment box!');
                        }}
                        className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl text-[10px] text-amber-900 cursor-pointer hover:bg-amber-100/60 transition-all space-y-1"
                      >
                        <span className="text-[8px] font-black uppercase text-amber-800">💡 Click to insert proposed reply:</span>
                        <p className="italic font-medium">"{aiSuggestions[post.id]}"</p>
                      </div>
                    )}

                    {/* Post Actions Row: Like, Comment, Share, Save */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <div className="flex items-center space-x-2">
                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all text-xs font-black cursor-pointer ${
                            isLiked
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                          <span>{isLiked ? 'Liked' : 'Like'}</span>
                          <span className="font-mono text-[11px]">{post.likes || 0}</span>
                        </button>

                        {/* Comment Count */}
                        <div className="flex items-center space-x-1 text-slate-500 font-bold text-[11px] pl-1">
                          <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{post.comments?.length || 0} Comments</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Bookmark / Save */}
                        <button
                          onClick={() => handleToggleSavePost(post.id)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Bookmark post"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => {
                            const shareText = `AgriVerse AI Update by ${post.author}:\n"${post.content}"`;
                            navigator.clipboard.writeText(shareText);
                            triggerToast('Post copied to clipboard for sharing!');
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Share post"
                        >
                          <Share2 className="w-4 h-4 text-emerald-600" />
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {post.comments?.length > 0 && (
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        {post.comments.map((comm: any) => (
                          <div key={comm.id} className="text-xs pb-1 border-b border-slate-100/80 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800">{comm.author}</span>
                              <span className="text-[8px] text-slate-400 font-bold">{comm.time || 'now'}</span>
                            </div>
                            <p className="text-slate-600 font-medium text-[11px] leading-snug">{comm.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Comment Input Box */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={activePostComments[post.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivePostComments(prev => ({ ...prev, [post.id]: val }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateComment(post.id);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 text-xs py-2 px-3 rounded-xl outline-none font-semibold text-slate-800"
                      />
                      <button
                        onClick={() => handleCreateComment(post.id)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                        title="Send comment"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No posts found in this category.</p>
                <p className="text-[10px] text-slate-400">Be the first farmer to share an update or question!</p>
                <button
                  onClick={() => setShowCreateCard(true)}
                  className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create First Post
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
