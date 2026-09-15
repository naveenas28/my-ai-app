import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Send, 
  FileText, 
  Sparkles, 
  DollarSign, 
  Check, 
  MapPin, 
  ShoppingCart, 
  Truck, 
  ChevronRight, 
  Volume2, 
  Megaphone, 
  User, 
  Calendar, 
  MessageSquare, 
  Activity,
  Award,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { LanguageCode } from '../types';

interface CooperativeNetworkProps {
  currentLang: LanguageCode;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

interface Coop {
  id: string;
  name: string;
  type: 'village' | 'crop' | 'irrigation' | 'machinery';
  description: string;
  district: string;
  village: string;
  crop?: string;
  creatorUid: string;
  creatorName: string;
  membersCount: number;
  createdAt: any;
}

interface SharedResource {
  id: string;
  cooperativeId: string;
  name: string;
  type: 'tractor' | 'labor' | 'irrigation' | 'seed_purchase';
  status: 'available' | 'booked' | 'active' | 'completed';
  providerUid: string;
  providerName: string;
  costShare: number;
  savingsPct: number;
  description: string;
  bookedByUid?: string;
  bookedByName?: string;
  bookedUntil?: string;
}

interface CoopChatMessage {
  id: string;
  cooperativeId: string;
  senderUid: string;
  senderName: string;
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceCaption?: string;
  translatedContent?: string;
  createdAt: any;
}

interface Announcement {
  id: string;
  cooperativeId: string;
  title: string;
  content: string;
  authorName: string;
  authorUid: string;
  createdAt: any;
}

interface CollectiveSale {
  id: string;
  cooperativeId: string;
  cropName: string;
  targetQty: string;
  currentQty: string;
  pricePerKg: number;
  status: 'collecting' | 'completed';
  contributors: { [uid: string]: { name: string; qty: string } };
}

export function CooperativeNetwork({ currentLang, onClose, triggerToast }: CooperativeNetworkProps) {
  const [coops, setCoops] = useState<Coop[]>([]);
  const [selectedCoop, setSelectedCoop] = useState<Coop | null>(null);
  const [activeTab, setActiveTab] = useState<'coops' | 'resources' | 'marketplace' | 'ai'>('coops');
  
  // Realtime lists inside selected cooperative
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [messages, setMessages] = useState<CoopChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [collectiveSales, setCollectiveSales] = useState<CollectiveSale[]>([]);
  
  // Create Form models
  const [showCreateCoop, setShowCreateCoop] = useState(false);
  const [coopForm, setCoopForm] = useState({
    name: '',
    type: 'village' as Coop['type'],
    description: '',
    district: 'Mandya',
    village: 'Mandya Rural',
    crop: ''
  });

  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'tractor' as SharedResource['type'],
    costShare: 1500,
    savingsPct: 30,
    description: ''
  });

  // Chat sending model
  const [chatInput, setChatInput] = useState('');
  const [chatVoiceBase64, setChatVoiceBase64] = useState<string | null>(null);
  const [chatImageBase64, setChatImageBase64] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Gemini AI state
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Auto-mandi user name
  const userName = auth.currentUser?.displayName || 'Farmer ' + (auth.currentUser?.uid?.substring(0, 4) || 'Guest');
  const userUid = auth.currentUser?.uid || 'guest-uid';

  // Translating labels
  const t = {
    title: currentLang === 'kn' ? 'ಕೂಟ ಕೃಷಿ ಜಾಲ' : currentLang === 'hi' ? 'सहकारी खेती नेटवर्क' : 'Cooperative Farming Network',
    subtitle: currentLang === 'kn' ? 'ಸಣ್ಣ ಹಿಡುವಳಿದಾರರ ಒಗ್ಗಟ್ಟು ಮತ್ತು ಆರ್ಥಿಕ ಸಾಮರ್ಥ್ಯ' : currentLang === 'hi' ? 'छोटे किसानों की सामूहिक आर्थिक शक्ति व सहयोग' : 'Shoring up smallholder yield through collective power',
    villageGroup: currentLang === 'kn' ? 'ಗ್ರಾಮ ಕೂಟ' : currentLang === 'hi' ? 'ग्राम सहकारी' : 'Village Group',
    cropGroup: currentLang === 'kn' ? 'ಬೆಳೆ ಕೂಟ' : currentLang === 'hi' ? 'फसल समूह' : 'Crop Group',
    irrigationGroup: currentLang === 'kn' ? 'ನೀರಾವರಿ ಕೂಟ' : currentLang === 'hi' ? 'सिंचाई समूह' : 'Irrigation Group',
    machineryGroup: currentLang === 'kn' ? 'ಯಂತ್ರೋಪಕರಣ ಕೂಟ' : currentLang === 'hi' ? 'मशीनरी समूह' : 'Machinery Sharing',
    joined: currentLang === 'kn' ? 'ಸೇರಿದೆ' : currentLang === 'hi' ? 'शामिल' : 'Joined',
    join: currentLang === 'kn' ? 'ಸೇರಿ' : currentLang === 'hi' ? 'शामिल हों' : 'Join Network',
    announcements: currentLang === 'kn' ? 'ಪ್ರಮುಖ ಘೋಷಣೆಗಳು' : currentLang === 'hi' ? 'महत्वपूर्ण घोषणाएं' : 'Cooperative Announcements',
    resources: currentLang === 'kn' ? 'ಹಂಚಿಕೆ ಉಪಕರಣಗಳು' : currentLang === 'hi' ? 'साझे संसाधन' : 'Shared Resources',
    collectiveSale: currentLang === 'kn' ? 'ಸಂಗ್ರಹ ಮಾರಾಟ' : currentLang === 'hi' ? 'सामूहिक बिक्री' : 'Collective Sales & Mandi Bulk',
    chat: currentLang === 'kn' ? 'ಕೂಟ ಚರ್ಚೆ' : currentLang === 'hi' ? 'सहकारी चर्चा' : 'Cooperative Chat (Multilingual)',
    aiAdvisor: currentLang === 'kn' ? 'ಎಐ ಕೂಟ ಸಲಹೆಗಾರ' : currentLang === 'hi' ? 'AI सहकारी सलाहकार' : 'AI Coop Partner',
    createGroup: currentLang === 'kn' ? 'ಹೊಸ ಕೂಟ ಸೃಷ್ಟಿಸಿ' : currentLang === 'hi' ? 'नया सहकारी समूह बनाएं' : 'Create New Coop',
  };

  // 1. Snapshot Listener for Cooperatives
  useEffect(() => {
    const qCoops = query(collection(db, 'cooperatives'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qCoops, (snap) => {
      const list: Coop[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Coop);
      });
      
      // Seed default coop models if totally empty on fresh user session
      if (snap.empty) {
        seedInitialCooperatives();
      } else {
        setCoops(list);
      }
    }, (error) => {
      console.error('Cooperative real-time loader failed: ', error);
    });

    return unsubscribe;
  }, []);

  const seedInitialCooperatives = async () => {
    try {
      const defaultList = [
        {
          name: 'Mandya Sugarcane Growers Association',
          type: 'crop',
          description: 'Jointly sourcing organic fertilizer and managing harvesting queues to prevent sugar crushing delays.',
          district: 'Mandya',
          village: 'Melukote',
          crop: 'Sugarcane',
          creatorUid: 'system',
          creatorName: 'AgriVerse Director',
          membersCount: 42,
          createdAt: new Date()
        },
        {
          name: 'Kolar Drip Irrigation & Water Pool',
          type: 'irrigation',
          description: 'Cooperative sharing of borewell water and drip line supplies across dryland paddy sectors.',
          district: 'Kolar',
          village: 'Chitrakoot',
          crop: 'Tomato',
          creatorUid: 'system',
          creatorName: 'Water Board President',
          membersCount: 18,
          createdAt: new Date()
        },
        {
          name: 'Raichur Collective Harvester Fleet',
          type: 'machinery',
          description: 'Shared rotational booking for large crawler harvesters saving 40% on standard machinery leases.',
          district: 'Raichur',
          village: 'Gabbur',
          crop: 'Cotton & Paddy',
          creatorUid: 'system',
          creatorName: 'Shri Ramappa',
          membersCount: 31,
          createdAt: new Date()
        }
      ];

      for (const item of defaultList) {
        await addDoc(collection(db, 'cooperatives'), item);
      }
    } catch (err) {
      console.error('Error seeding default cooperatives: ', err);
    }
  };

  // 2. Realtime Load of Cooperative Nested Models
  useEffect(() => {
    if (!selectedCoop) {
      setResources([]);
      setMessages([]);
      setAnnouncements([]);
      setCollectiveSales([]);
      return;
    }

    // A. Listen to Shared Resources
    const qResources = query(
      collection(db, 'shared_resources'), 
      where('cooperativeId', '==', selectedCoop.id),
      orderBy('createdAt', 'desc')
    );
    const unsubResources = onSnapshot(qResources, (snap) => {
      const list: SharedResource[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SharedResource);
      });
      setResources(list);
    });

    // B. Listen to Cooperative Chat
    const qChat = query(
      collection(db, 'cooperative_chats'),
      where('cooperativeId', '==', selectedCoop.id),
      orderBy('createdAt', 'asc')
    );
    const unsubChat = onSnapshot(qChat, (snap) => {
      const list: CoopChatMessage[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CoopChatMessage);
      });
      setMessages(list);
    });

    // C. Listen to Announcements
    const qAnn = query(
      collection(db, 'announcements'),
      where('cooperativeId', '==', selectedCoop.id),
      orderBy('createdAt', 'desc')
    );
    const unsubAnn = onSnapshot(qAnn, (snap) => {
      const list: Announcement[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(list);
    });

    return () => {
      unsubResources();
      unsubChat();
      unsubAnn();
    };
  }, [selectedCoop]);

  // Create & Manage Forms
  const handleCreateCoop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coopForm.name.trim() || !coopForm.description.trim()) {
      triggerToast('Please complete all cooperative information');
      return;
    }

    try {
      const payload = {
        name: coopForm.name,
        type: coopForm.type,
        description: coopForm.description,
        district: coopForm.district,
        village: coopForm.village,
        crop: coopForm.crop || 'All Crops',
        creatorUid: userUid,
        creatorName: userName,
        membersCount: 1,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'cooperatives'), payload);
      triggerToast(`Cooperative "${coopForm.name}" created successfully! 🌾`);
      setShowCreateCoop(false);
      setCoopForm({
        name: '',
        type: 'village',
        description: '',
        district: 'Mandya',
        village: 'Mandya Rural',
        crop: ''
      });
    } catch (err) {
      console.error(err);
      triggerToast('Could not store cooperative network');
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoop) return;
    if (!resourceForm.name.trim()) return;

    try {
      const payload = {
        cooperativeId: selectedCoop.id,
        name: resourceForm.name,
        type: resourceForm.type,
        status: 'available',
        providerUid: userUid,
        providerName: userName,
        costShare: Number(resourceForm.costShare),
        savingsPct: Number(resourceForm.savingsPct),
        description: resourceForm.description || `Shared ${resourceForm.type} item`,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'shared_resources'), payload);
      triggerToast('Shared resource logged into pool! 🚜');
      setResourceForm({
        name: '',
        type: 'tractor',
        costShare: 1500,
        savingsPct: 30,
        description: ''
      });
    } catch (err) {
      console.error(err);
      triggerToast('Failed to create shared item');
    }
  };

  // Resources Booking Flow
  const handleBookResource = async (resId: string) => {
    try {
      const ref = doc(db, 'shared_resources', resId);
      await updateDoc(ref, {
        status: 'booked',
        bookedByUid: userUid,
        bookedByName: userName,
        bookedUntil: new Date(Date.now() + 86400000 * 2).toLocaleDateString() // booked for next 2 days
      });
      triggerToast('Resource successfully reserved! Please contact owner.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseResource = async (resId: string) => {
    try {
      const ref = doc(db, 'shared_resources', resId);
      await updateDoc(ref, {
        status: 'available',
        bookedByUid: null,
        bookedByName: null,
        bookedUntil: null
      });
      triggerToast('Resource released back in cooperative pool.');
    } catch (err) {
      console.error(err);
    }
  };

  // Cooperative Announcements
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoop) return;
    const title = prompt('Enter Announcement Title:');
    const content = prompt('Enter Announcement Content:');
    
    if (!title || !content) return;

    try {
      const payload = {
        cooperativeId: selectedCoop.id,
        title,
        content,
        authorName: userName,
        authorUid: userUid,
        createdAt: new Date()
      };
      await addDoc(collection(db, 'announcements'), payload);
      triggerToast('📢 Live coop announcement dispatched!');
    } catch (err) {
      console.error(err);
    }
  };

  // Group Chat Sends
  const sendChatMessage = async () => {
    if (!selectedCoop) return;
    if (!chatInput.trim() && !chatVoiceBase64 && !chatImageBase64) return;

    try {
      const payload = {
        cooperativeId: selectedCoop.id,
        senderUid: userUid,
        senderName: userName,
        content: chatInput.trim() || (chatVoiceBase64 ? 'Voice note recorded' : 'Shared photo'),
        ...(chatVoiceBase64 && { voiceUrl: chatVoiceBase64, voiceCaption: 'Click play to listen translation' }),
        ...(chatImageBase64 && { imageUrl: chatImageBase64 }),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'cooperative_chats'), payload);
      setChatInput('');
      setChatVoiceBase64(null);
      setChatImageBase64(null);
      
      // Auto-scroll chat box UI
      setTimeout(() => {
        const el = document.getElementById('coop_msg_end');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
    }
  };

  // Simulating Voice Note Recording
  const startRecording = () => {
    setIsRecording(true);
    triggerToast('🎙️ Recording voice post... speak now');
    
    // Check for standard mic interface support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          const chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/mpeg' });
            const reader = new FileReader();
            reader.onloadend = () => {
              setChatVoiceBase64(reader.result as string);
              triggerToast('🎙️ Voice attached! Click Send.');
            };
            reader.readAsDataURL(blob);
          };

          recorder.start();
        })
        .catch((err) => {
          console.warn('Recording simulation started (no micro permissions allowed inside iframe):');
          generateMockVoice();
        });
    } else {
      generateMockVoice();
    }
  };

  const generateMockVoice = () => {
    // Elegant base64 mock voice signal
    setTimeout(() => {
      setChatVoiceBase64('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGFtZTMuMTAwAEluZm8AAAAPAAAD...MOCK');
      setIsRecording(false);
      triggerToast('🎙️ Voice attached via simulated audio node! Click Send.');
    }, 2000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  };

  // Image upload simulator
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setChatImageBase64(reader.result as string);
      triggerToast('📸 Photo loaded! Ready to send.');
    };
    reader.readAsDataURL(file);
  };

  // Gemini Live Chat Translations
  const translateMessage = async (msgId: string, text: string) => {
    setTranslatingMessageId(msgId);
    triggerToast('🤖 Querying Gemini Multilingual Translator...');
    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          targetLang: currentLang
        })
      });

      const data = await res.json();
      const updatedMessages = messages.map(m => {
        if (m.id === msgId) {
          return { ...m, translatedContent: data.translatedText };
        }
        return m;
      });
      setMessages(updatedMessages);
      triggerToast('Translation completed! 🌍');
    } catch (err) {
      console.error(err);
      triggerToast('Service temporarily offline');
    } finally {
      setTranslatingMessageId(null);
    }
  };

  // Gemini AI Assistant Callouts
  const requestAiAnalysis = async (actionType: 'opportunities' | 'savings' | 'rotation') => {
    setIsAiLoading(true);
    setAiResponse('');
    triggerToast('🪐 Consulting Gemini Cooperative Agent...');

    let messagePrompt = '';
    if (actionType === 'opportunities') {
      messagePrompt = `Analyze the current active cooperatives in district ${selectedCoop?.district || 'Mandya'} specializing in ${selectedCoop?.crop || 'Sugarcane'}. Suggest 3 tactical cooperative opportunities for shared storage, collective marketing, and direct-to-city bulk supply chains. Frame it with expected profits. Respond in ${currentLang}.`;
    } else if (actionType === 'savings') {
      messagePrompt = `Calculate the economic benefit of shared machinery (crawler harvesters and high capacity borewell motors) and bulk group buying of organic fertilizers compared to independent buying for a 5-farmer group in Mandya. Outline exact percentage savings. Respond in ${currentLang}.`;
    } else {
      messagePrompt = `Create a community crop rotation and equipment sharing calendar for tractor rotation across 4 adjoining Paddy blocks during the sowing season to optimize machine uptime and prevent field idling. Respond in ${currentLang}.`;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messagePrompt,
          language: currentLang
        })
      });

      const data = await res.json();
      setAiResponse(data.text);
    } catch (err) {
      console.error(err);
      setAiResponse('Fallback: Collective buying saves approximately 28% of base seed cost and reduces transport overheads by Rs. 850 per metric tonne.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Custom AI Query
  const sendCustomAiAssistant = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    triggerToast('⚡ Parsing group plan with Gemini AI...');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `${aiPrompt}. Detail how this collaborative step saves money for individual small farmers. Focus on resource optimization.`,
          language: currentLang
        })
      });

      const data = await res.json();
      setAiResponse(data.text);
      setAiPrompt('');
    } catch (err) {
      console.error(err);
      setAiResponse('Unable to reach AI server. Please verify your connection or try again later.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div id="cooperative_tab_hub" className="relative w-full flex-1 flex flex-col bg-slate-50 pb-28 animate-slideUp">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-4 py-3 sticky.top-0 z-40 flex justify-between items-center shadow-md grow-0 shrink-0">
        <div className="flex items-center space-x-2">
          <Users className="w-5.5 h-5.5 text-teal-300 animate-pulse" />
          <div>
            <h3 className="text-xs font-black tracking-tight leading-none uppercase">{t.title}</h3>
            <span className="text-[9px] font-bold text-emerald-200">{t.subtitle}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-all cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Main Container Split Grid */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT COLUMN: Coop Selection Panel */}
        <div className={`p-4 space-y-4 shrink-0 transition-all ${selectedCoop ? 'hidden md:block w-full md:w-80' : 'w-full'}`}>
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-850 uppercase tracking-widest">
              Available Farmer Alliances
            </h4>
            <button 
              onClick={() => setShowCreateCoop(!showCreateCoop)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Coop</span>
            </button>
          </div>

          {/* Creation Form popup drawer */}
          {showCreateCoop && (
            <form onSubmit={handleCreateCoop} className="bg-white border-2 border-emerald-500 rounded-3xl p-4 shadow-xl space-y-3 animate-fadeIn">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max">
                New Alliance
              </span>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Cooperative Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Malavalli Tractor Alliance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none uppercase focus:bg-white"
                  value={coopForm.name}
                  onChange={(e) => setCoopForm({...coopForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                    value={coopForm.type}
                    onChange={(e: any) => setCoopForm({...coopForm, type: e.target.value})}
                  >
                    <option value="village">Village Group</option>
                    <option value="crop">Crop Group</option>
                    <option value="irrigation">Water Sharing</option>
                    <option value="machinery">Machinery Pool</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Focus Crop</label>
                  <input 
                    type="text"
                    placeholder="e.g. Paddy"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                    value={coopForm.crop}
                    onChange={(e) => setCoopForm({...coopForm, crop: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">District</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                    value={coopForm.district}
                    onChange={(e) => setCoopForm({...coopForm, district: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Village/Mandi</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                    value={coopForm.village}
                    onChange={(e) => setCoopForm({...coopForm, village: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Rules & Description</label>
                <textarea 
                  rows={2}
                  placeholder="Explain group resource guidelines..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
                  value={coopForm.description}
                  onChange={(e) => setCoopForm({...coopForm, description: e.target.value})}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateCoop(false)}
                  className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wider"
                >
                  Deploy Coop
                </button>
              </div>
            </form>
          )}

          {/* List of existing cooperations */}
          <div className="space-y-3">
            {coops.map((coop) => (
              <div 
                key={coop.id}
                onClick={() => {
                  setSelectedCoop(coop);
                  setActiveTab('coops');
                  triggerToast(`Entered ${coop.name} control room!`);
                }}
                className={`p-3.5 rounded-3xl border cursor-pointer transition-all ${
                  selectedCoop?.id === coop.id 
                    ? 'bg-emerald-550 border-emerald-600 text-white shadow-lg' 
                    : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] font-black uppercase py-0.5 px-2 rounded-full ${
                    selectedCoop?.id === coop.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {coop.type}
                  </span>
                  <span className={`text-[9.5px] font-extrabold ${selectedCoop?.id === coop.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                    👥 {coop.membersCount} Farmers
                  </span>
                </div>
                <h5 className="text-[12.5px] font-black tracking-tight leading-tight uppercase">
                  {coop.name}
                </h5>
                <p className={`text-[10px] mt-1 line-clamp-2 ${selectedCoop?.id === coop.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {coop.description}
                </p>
                <div className="mt-3 pt-2 border-t border-dashed border-white/20 flex items-center justify-between text-[9px] font-semibold opacity-75">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {coop.village}, {coop.district}
                  </span>
                  <span>🌱 {coop.crop}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat, resources, marketplace tabs of selected cooperative */}
        {selectedCoop ? (
          <div className="flex-1 bg-white flex flex-col border-l border-slate-150 animate-fadeIn">
            
            {/* Active coop breadcrumbs info */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex items-center justify-between">
              <div className="space-y-0.5">
                <button 
                  onClick={() => setSelectedCoop(null)}
                  className="md:hidden text-xs font-black text-emerald-700 uppercase flex items-center space-x-1 mr-2"
                >
                  ← All Groups
                </button>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">
                  {selectedCoop.name}
                </h4>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
                  <span>📍 {selectedCoop.village}</span>
                  <span>•</span>
                  <span>Focus: {selectedCoop.crop}</span>
                </div>
              </div>

              <div className="flex space-x-1">
                <button 
                  onClick={handleCreateAnnouncement}
                  className="bg-amber-100 hover:bg-amber-100 text-amber-900 text-[9px] font-black uppercase py-1 px-2.5 rounded-lg flex items-center"
                >
                  <Megaphone className="w-3.5 h-3.5 mr-1" />
                  Alert
                </button>
              </div>
            </div>

            {/* Nested tabs inside active Coop */}
            <div className="bg-slate-100/50 p-2 border-b border-slate-150 flex space-x-1 text-center font-bold">
              {[
                { id: 'coops', label: t.chat, icon: MessageSquare },
                { id: 'resources', label: t.resources, icon: Activity },
                { id: 'marketplace', label: t.collectiveSale, icon: Truck },
                { id: 'ai', label: t.aiAdvisor, icon: Sparkles }
              ].map((tb) => {
                const Icon = tb.icon;
                return (
                  <button
                    key={tb.id}
                    onClick={() => {
                      setActiveTab(tb.id as any);
                    }}
                    className={`flex-1 py-2 px-1 text-[10px] font-black uppercase rounded-xl flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-1.5 border transition-all cursor-pointer ${
                      activeTab === tb.id 
                        ? 'bg-emerald-700 text-white border-emerald-800' 
                        : 'bg-white text-slate-600 border-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline-block">{tb.label}</span>
                  </button>
                );
              })}
            </div>

            {/* MAIN NESTED VIEWPORTS CONTROLLERS */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-slate-50">
              
              {/* SUBVIEW A: WHATSAPP-LIKE REALTIME GROUP CHAT */}
              {activeTab === 'coops' && (
                <div className="flex-1 flex flex-col relative h-full">
                  
                  {/* Live warnings marquee list */}
                  {announcements.length > 0 && (
                    <div className="bg-amber-50 border-b border-amber-150 px-3 py-2 animate-fadeIn space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest flex items-center">
                        <Megaphone className="w-3.5 h-3.5 mr-1 animate-bounce" /> Broadcast reminders
                      </span>
                      {announcements.map((ann) => (
                        <div key={ann.id} className="text-xs text-slate-800">
                          <strong className="text-amber-990">{ann.title}:</strong> {ann.content}
                          <span className="text-[9px] text-slate-400 block mt-0.5">Dispatched by Member {ann.authorName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message List Log Grid */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                        <h5 className="text-xs font-black text-slate-500">Network discussions are active.</h5>
                        <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto font-medium">Type below in English, Kannada or Hindi to engage with collective members.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderUid === userUid;
                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <span className="text-[9px] text-slate-500 font-extrabold mb-1">
                              {msg.senderName} {isMe && '(You)'}
                            </span>
                            
                            <div className={`p-3 rounded-3xl text-xs space-y-1.5 shadow-sm border ${
                              isMe 
                                ? 'bg-gradient-to-tr from-emerald-700 to-emerald-600 text-white rounded-tr-none border-emerald-500' 
                                : 'bg-white text-slate-800 rounded-tl-none border-slate-150'
                            }`}>
                              
                              {msg.imageUrl && (
                                <img 
                                  src={msg.imageUrl} 
                                  alt="Shared" 
                                  className="rounded-2xl max-h-[160px] max-w-full object-cover mb-1 border border-slate-100" 
                                />
                              )}

                              {msg.voiceUrl && (
                                <div className="flex items-center space-x-2 p-2 bg-black/5 rounded-xl border border-black/5">
                                  <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                                  <span className="text-[9.5px] font-black uppercase">Voice Note (Attached)</span>
                                </div>
                              )}

                              <p className="font-semibold leading-relaxed break-words">{msg.content}</p>

                              {/* Translated display block */}
                              {msg.translatedContent && (
                                <div className={`p-2.5 rounded-2xl text-[10.5px] border ${
                                  isMe ? 'bg-emerald-800/55 border-emerald-600 text-emerald-100' : 'bg-slate-50 border-slate-100 text-rose-950 font-semibold'
                                }`}>
                                  <div className="flex items-center space-x-1 pb-1 mb-1 border-b border-black/5 text-[8.5px] font-black uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3 text-yellow-300 mr-1" />
                                    <span>Gemini Translated ({currentLang}):</span>
                                  </div>
                                  <span>{msg.translatedContent}</span>
                                </div>
                              )}

                              {/* Translate trigger button */}
                              {!msg.translatedContent && (
                                <button
                                  disabled={translatingMessageId === msg.id}
                                  onClick={() => translateMessage(msg.id, msg.content)}
                                  className="text-[9.5px] font-black uppercase text-yellow-300 underline tracking-wider block"
                                >
                                  {translatingMessageId === msg.id ? 'Translating...' : 'Translate 🌐'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div id="coop_msg_end" />
                  </div>

                  {/* Message Input Toolbar Area */}
                  <div className="bg-white p-3 border-t border-slate-200 flex flex-col space-y-2 shrink-0">
                    
                    {/* Media Attachments previews */}
                    {(chatVoiceBase64 || chatImageBase64) && (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 animate-fadeIn">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-800 uppercase">
                            {chatVoiceBase64 ? 'Voice Message Ready' : 'Tomato Photo Ready'}
                          </span>
                        </div>
                        <button 
                          onClick={() => { setChatVoiceBase64(null); setChatImageBase64(null); }}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <label className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-200">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageInput} 
                        />
                        <span className="text-lg">📸</span>
                      </label>

                      <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isRecording ? 'bg-red-500 text-white animate-ping' : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <span className="text-lg">{isRecording ? '🛑' : '🎙️'}</span>
                      </button>

                      <input 
                        type="text"
                        placeholder="Type WhatsApp group message..."
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') sendChatMessage(); }}
                      />

                      <button 
                        onClick={sendChatMessage}
                        className="w-10 h-10 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                      >
                        <Send className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW B: SHARED RESOURCES POOL */}
              {activeTab === 'resources' && (
                <div className="p-4 space-y-4">
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      New Shared Asset Registration
                    </span>
                    <form onSubmit={handleCreateResource} className="space-y-4 text-xs font-bold font-sans">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Resource Name</label>
                        <input 
                          type="text"
                          placeholder="e.g. VST Shakti MT 180 Tractor"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:bg-white text-xs font-bold uppercase"
                          value={resourceForm.name}
                          onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500">Resource Type</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                            value={resourceForm.type}
                            onChange={(e: any) => setResourceForm({...resourceForm, type: e.target.value})}
                          >
                            <option value="tractor">Tractor & Tillers</option>
                            <option value="labor">Harvesting Labor Pool</option>
                            <option value="irrigation">Water Drip Source</option>
                            <option value="seed_purchase">Bulk Seed Buyout</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500">Co-Pay Rate (₹)</label>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                            value={resourceForm.costShare}
                            onChange={(e) => setResourceForm({...resourceForm, costShare: Number(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Asset Condition / Group Guidelines</label>
                        <input 
                          type="text"
                          placeholder="Rate covers diesel. Return clean by sunset."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                          value={resourceForm.description}
                          onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md"
                      >
                        Publish Shared Asset
                      </button>
                    </form>
                  </div>

                  {/* Active listings resources */}
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Active Share Pool Listings
                  </h5>

                  <div className="space-y-3">
                    {resources.length === 0 ? (
                      <p className="text-[11px] text-slate-400 font-bold bg-white p-6 rounded-2xl text-center border">No active equipment sharing logged. Use form above to seed.</p>
                    ) : (
                      resources.map((resItem) => {
                        const isPrimaryProvider = resItem.providerUid === userUid;
                        return (
                          <div key={resItem.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <span className="text-[9px] bg-slate-50 text-slate-600 font-extrabold py-0.5 px-2 rounded-full uppercase">
                                  {resItem.type}
                                </span>
                                <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                                  {resItem.name}
                                </h4>
                              </div>

                              <span className={`text-[9.5px] font-black uppercase py-0.5 px-2.5 rounded-full ${
                                resItem.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {resItem.status}
                              </span>
                            </div>

                            <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                              {resItem.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-2xl text-[10px]">
                              <div>
                                <span className="block text-slate-400 uppercase leading-none mb-1">Provider</span>
                                <strong className="text-slate-800">{resItem.providerName}</strong>
                              </div>
                              <div>
                                <span className="block text-slate-400 uppercase leading-none mb-1">Group Co-Pay</span>
                                <strong className="text-emerald-700 font-mono">₹{resItem.costShare} <span className="text-[8px] font-light text-slate-400">({resItem.savingsPct}% saved)</span></strong>
                              </div>
                            </div>

                            {/* Book action logic */}
                            <div className="pt-2 flex justify-between items-center border-t border-slate-50">
                              {resItem.status === 'available' ? (
                                <button 
                                  onClick={() => handleBookResource(resItem.id)}
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm"
                                >
                                  Reserve Shared Resource
                                </button>
                              ) : (
                                <div className="w-full flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 font-bold">
                                    Booked by: 👤 {resItem.bookedByName} ({resItem.bookedUntil})
                                  </span>
                                  {(resItem.bookedByUid === userUid || isPrimaryProvider) && (
                                    <button 
                                      onClick={() => handleReleaseResource(resItem.id)}
                                      className="text-red-500 hover:underline font-black uppercase text-[9px]"
                                    >
                                      Release
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* SUBVIEW C: SHARED MARKETPLACE TRANSPORT */}
              {activeTab === 'marketplace' && (
                <div className="p-4 space-y-4">
                  
                  {/* Top explanation box */}
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase">
                        Bulk Mandi Truck Coordinator
                      </h4>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                      Small farmers suffer from immense transport overheads and lack bargaining leverage at APMC markets.
                    </p>
                    <div className="p-3 bg-emerald-50 text-emerald-950 font-bold text-[10px] rounded-2xl space-y-1">
                      <span>✓ Jointly schedule 5-18 Tonne freight vehicles to Mandya Mandi</span>
                      <span>✓ Save up to 45% on roundtrip transportation commissions</span>
                    </div>
                  </div>

                  {/* Seeded active bulk bookings */}
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Alliance Transport Coordinator
                  </h5>

                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] bg-emerald-50 text-emerald-800 font-black py-0.5 px-2 rounded-full uppercase">
                          Sowing Bulk Buyout
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mt-1">
                          Bulk Onion Seed Procurement (Sona/M-12)
                        </h4>
                      </div>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-bold">
                        Collecting
                      </span>
                    </div>

                    <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                      Sourcing premium onion seeds directly from regional seed farms in Hubli. Placing a collective order worth 300Kg unlocks a wholesale discount of 35%.
                    </p>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="text-slate-400">Total Sourced Volume:</span>
                        <span className="font-extrabold text-slate-800">190Kg / 300Kg</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: '63%' }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px]">
                      <span className="text-emerald-700 font-bold">🎯 Expected wholesale discount: 35%</span>
                      <button 
                        onClick={() => triggerToast('Matched! 50Kg onion bulk order registered.')}
                        className="bg-emerald-600 text-white text-[9.5px] font-black uppercase py-2 px-3 rounded-xl tracking-wider hover:bg-emerald-700"
                      >
                        Contribute Volume
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] bg-slate-100 text-slate-605 font-black py-0.5 px-2 rounded-full uppercase">
                          Collective Selling
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mt-1">
                          Joint Sugarcane Transportation To Mandir Factory
                        </h4>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                        Arranged
                      </span>
                    </div>

                    <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                      Consolidating 14 Tonnes sugarcane crops to send via unified flatbed carrier. Slashes independent tractor logistics diesel charges in half.
                    </p>

                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Trip Timing: <strong className="text-slate-700 font-extrabold">Next Monday 06:00 AM</strong></span>
                      <button 
                        onClick={() => triggerToast('Trip joined! Slashed ₹850 diesel commission.')}
                        className="bg-emerald-700 text-white text-[9.5px] font-black uppercase py-2 px-3 rounded-xl tracking-wider hover:bg-emerald-800"
                      >
                        Book Truck Spot
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW D: GEMINI COOPERATIVE AI ASSISTANT */}
              {activeTab === 'ai' && (
                <div className="p-4 space-y-4">
                  <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-4 shadow-lg border border-indigo-950 space-y-3 relative overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5.5 h-5.5 text-yellow-300 animate-spin" />
                      <h4 className="text-xs font-black uppercase tracking-tight">
                        Gemini Cooperative Director
                      </h4>
                    </div>
                    <p className="text-[10.5px] text-indigo-200 font-semibold leading-relaxed">
                      Unlock economic leverage. Scan alliance data to generate optimal roster schedules, estimate group savings, or detect supply-chain opportunities.
                    </p>

                    {/* Pre-set actions buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                      <button 
                        onClick={() => requestAiAnalysis('opportunities')}
                        className="bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 p-2.5 rounded-xl text-left text-[11px] font-bold text-white transition-all cursor-pointer"
                      >
                        ✨ Suggest Co-op Opportunities
                      </button>
                      <button 
                        onClick={() => requestAiAnalysis('savings')}
                        className="bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 p-2.5 rounded-xl text-left text-[11px] font-bold text-white transition-all cursor-pointer"
                      >
                        🚜 Estimate Equipment Savings
                      </button>
                      <button 
                        onClick={() => requestAiAnalysis('rotation')}
                        className="bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 p-2.5 rounded-xl text-left text-[11px] font-bold text-white transition-all cursor-pointer"
                      >
                        📅 Optimize Tractor Rotation List
                      </button>
                    </div>
                  </div>

                  {/* Dynamic response stream box */}
                  {(isAiLoading || aiResponse) && (
                    <div className="bg-white rounded-3xl p-4 border border-indigo-100 shadow-xl space-y-2 relative">
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-55/70 text-[10px] font-bold text-indigo-700">
                        <span className="uppercase tracking-wider">Gemini Live Consultation report</span>
                        {isAiLoading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                      </div>

                      {aiResponse ? (
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                          {aiResponse}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Gemini is processing active farmer models...</p>
                      )}
                    </div>
                  )}

                  {/* Manual QA prompt bar */}
                  <div className="bg-white rounded-3xl p-4 border border-slate-150 shadow-sm space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-slate-500">
                      Co-op Custom Query Analyst
                    </h5>
                    <div className="flex space-x-2">
                      <input 
                        type="text"
                        placeholder="e.g. How do we share fuel costs fairly for an 18HP tiller?"
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') sendCustomAiAssistant(); }}
                      />
                      <button 
                        disabled={isAiLoading}
                        onClick={sendCustomAiAssistant}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Ask AI
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center py-16 bg-slate-50 px-4 text-center select-none grow">
            <Users className="w-16 h-16 text-slate-300 animate-pulse mb-3" />
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">No Cooperative Selected</h4>
            <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto mt-1 leading-relaxed font-semibold">
              Select or deploy a Farmer Alliance cooperative on the left panel to engage in WhatsApp-like chats, shared implements, and group selling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
