import React, { useState } from 'react';
import { 
  MessageSquare, 
  Sprout, 
  Bug, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Mic, 
  MicOff, 
  Award, 
  ArrowLeft, 
  Send, 
  Volume2, 
  X,
  Camera,
  Calendar,
  CloudRain,
  Droplets,
  FileText,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Info,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  ShieldCheck,
  User,
  Zap
} from 'lucide-react';
import { AICropPredictionSystem } from './AICropPredictionSystem';
import { SmartIrrigationAdvisor } from './SmartIrrigationAdvisor';
import { WeatherIntelligence } from './WeatherIntelligence';
import { KYCGovernmentBenefits } from './KYCGovernmentBenefits';

export interface AiAdvisorTabViewProps {
  currentLang: string;
  t: any;
  activeAiTool: 'chat' | 'cropPrediction' | 'pest' | 'soil' | 'yield' | 'finance' | 'voice' | 'sustainability' | 'irrigation' | 'weather' | 'schemes' | 'calendar' | null;
  setActiveAiTool: (tool: 'chat' | 'cropPrediction' | 'pest' | 'soil' | 'yield' | 'finance' | 'voice' | 'sustainability' | 'irrigation' | 'weather' | 'schemes' | 'calendar' | null) => void;
  fullUserProfile?: any;
  // Chat state
  chatHistory: Array<{ text: string; sender: 'user' | 'ai'; time: string }>;
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatLoading: boolean;
  triggerSendChatMessage: (msg: string) => void;
  // Voice state
  isRecording: boolean;
  startVoiceRecordingTrigger: () => void;
  speakVoiceOutput: (text: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  // Crop Doctor State
  hiddenFileInputRef: React.RefObject<HTMLInputElement>;
  handleLeafImageUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedLeafImage: string | null;
  setSelectedLeafImage: (url: string | null) => void;
  diagnosisReport: any;
  setDiagnosisReport: (rep: any) => void;
  isDiagnosing: boolean;
  scanHistory: any[];
  deleteScanHistoryItem: (id: string) => void;
  handleDiseaseExamplePick?: (type: string) => void;
  downloadCropHealthPdf?: (report: any) => void;
  // Budget ledger state
  expenses: any[];
  newExpenseTitle: string;
  setNewExpenseTitle: (val: string) => void;
  newExpenseAmount: string;
  setNewExpenseAmount: (val: string) => void;
  addExpenseItem: () => void;
  deleteExpenseItem: (id: string) => void;
  // Eco score
  compileEcoScore: () => number;
  triggerToast: (msg: string) => void;
}

export const AiAdvisorTabView: React.FC<AiAdvisorTabViewProps> = ({
  currentLang,
  t,
  activeAiTool,
  setActiveAiTool,
  fullUserProfile,
  chatHistory,
  chatInput,
  setChatInput,
  isChatLoading,
  triggerSendChatMessage,
  isRecording,
  startVoiceRecordingTrigger,
  speakVoiceOutput,
  chatEndRef,
  hiddenFileInputRef,
  handleLeafImageUploadChange,
  selectedLeafImage,
  setSelectedLeafImage,
  diagnosisReport,
  setDiagnosisReport,
  isDiagnosing,
  scanHistory,
  deleteScanHistoryItem,
  handleDiseaseExamplePick,
  downloadCropHealthPdf,
  expenses,
  newExpenseTitle,
  setNewExpenseTitle,
  newExpenseAmount,
  setNewExpenseAmount,
  addExpenseItem,
  deleteExpenseItem,
  compileEcoScore,
  triggerToast,
}) => {
  // Soil Health Tool State
  const [soilType, setSoilType] = useState('Red Sandy Loam');
  const [nitrogen, setNitrogen] = useState(120);
  const [phosphorus, setPhosphorus] = useState(50);
  const [potassium, setPotassium] = useState(40);
  const [soilCrop, setSoilCrop] = useState('Tomato');

  // Yield Prediction Tool State
  const [yieldCrop, setYieldCrop] = useState('Tomato');
  const [landAcres, setLandAcres] = useState('2');

  // Crop Calendar Tool State
  const [calendarCrop, setCalendarCrop] = useState('Tomato');
  const [sowingMonth, setSowingMonth] = useState('June');

  // Suggested Questions for Chat
  const SUGGESTED_QUESTIONS = [
    'What is the best fertilizer dose for Tomato?',
    'How to control Early Blight leaf spots on crops?',
    'When is the optimal sowing window for Ragi?',
    'What government subsidies are available for drip irrigation?'
  ];

  // Helper to get primary crop context
  const primaryCropsStr = fullUserProfile?.primaryCrops?.length > 0 
    ? fullUserProfile.primaryCrops.join(' & ') 
    : 'Tomato & Ragi';
  const farmerName = fullUserProfile?.name || 'Farmer Partner';
  const farmerLocation = fullUserProfile?.village 
    ? `${fullUserProfile.village}, ${fullUserProfile.district}`
    : 'Chikkaballapura';

  // Calculator for Soil Dose
  const getSoilDoseAdvice = () => {
    const urea = Math.round(nitrogen * 2.17);
    const dap = Math.round(phosphorus * 2.17);
    const mop = Math.round(potassium * 1.66);
    return { urea, dap, mop };
  };

  // Calculator for Yield & Revenue
  const getYieldEstimate = () => {
    const acres = parseFloat(landAcres) || 1;
    let baseYield = 15; // tons/acre
    let basePrice = 22000; // Rs/ton
    if (yieldCrop === 'Paddy') { baseYield = 2.5; basePrice = 28000; }
    if (yieldCrop === 'Ragi') { baseYield = 1.8; basePrice = 34000; }
    if (yieldCrop === 'Maize') { baseYield = 3.0; basePrice = 22000; }
    if (yieldCrop === 'Sugarcane') { baseYield = 40; basePrice = 3200; }
    if (yieldCrop === 'Chilli') { baseYield = 1.2; basePrice = 140000; }

    const minYield = (baseYield * acres * 0.9).toFixed(1);
    const maxYield = (baseYield * acres * 1.2).toFixed(1);
    const minRev = Math.round(parseFloat(minYield) * basePrice);
    const maxRev = Math.round(parseFloat(maxYield) * basePrice);

    return { minYield, maxYield, minRev, maxRev };
  };

  return (
    <div id="v_ai_advisor_tab" className="p-3 pb-24 space-y-4 animate-fadeIn max-w-xl mx-auto w-full select-none">
      
      {/* 🚀 1. HEADER (Fixed or Sticky at top) */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 rounded-3xl shadow-lg border border-emerald-600/30 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            <h1 className="text-base font-black tracking-tight">AI Advisor</h1>
          </div>
          <p className="text-xs text-emerald-100 font-semibold mt-1">
            Smart farming guidance for your field
          </p>
        </div>

        {/* Quick Voice / Language Trigger */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              if (activeAiTool === 'chat') {
                setActiveAiTool(null);
              } else {
                setActiveAiTool('chat');
                triggerToast('Opening Krishi AI Voice Assistant...');
              }
            }}
            className={`p-2.5 rounded-2xl font-black text-xs flex items-center space-x-1.5 shadow-md cursor-pointer transition-all active:scale-95 ${
              activeAiTool === 'chat' 
                ? 'bg-yellow-400 text-yellow-950 font-black' 
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
            title="Toggle AI Chat & Voice Guidance"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] uppercase font-bold">Voice AI</span>
          </button>
        </div>
      </div>

      {/* 🚀 ACTIVE TOOL SUB-VIEW HEADER BAR */}
      {activeAiTool && (
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-3 px-4 rounded-2xl flex items-center justify-between shadow-md">
          <button
            onClick={() => setActiveAiTool(null)}
            className="flex items-center space-x-1.5 text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer active:scale-95 transition-all text-emerald-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to AI Advisor</span>
          </button>
          <span className="font-extrabold text-xs tracking-wide text-yellow-300 uppercase truncate max-w-[180px]">
            {activeAiTool === 'chat' && '💬 AI Assistant Chat'}
            {activeAiTool === 'pest' && '🔬 Crop Doctor Scanner'}
            {activeAiTool === 'cropPrediction' && '🌱 Crop Recommendation'}
            {activeAiTool === 'soil' && '🌾 Soil Health & NPK'}
            {activeAiTool === 'yield' && '📈 Yield & Price Predictor'}
            {activeAiTool === 'calendar' && '📅 Farm Crop Calendar'}
            {activeAiTool === 'finance' && '💰 Farm Budget Ledger'}
            {activeAiTool === 'weather' && '🌩️ Weather Advice'}
            {activeAiTool === 'schemes' && '🏛️ Government Schemes'}
            {activeAiTool === 'irrigation' && '💧 Smart Irrigation Advisor'}
            {activeAiTool === 'sustainability' && '🎯 Eco & Organic Score'}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MAIN DASHBOARD (When activeAiTool === null) */}
      {/* ========================================================================= */}
      {!activeAiTool && (
        <div className="space-y-4">

          {/* 🌟 2. AI QUICK ACTIONS (2x2 Grid) */}
          <div className="space-y-2">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 px-1">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>AI Quick Actions</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Quick Action 1: Crop Doctor */}
              <button
                onClick={() => { setActiveAiTool('pest'); triggerToast('Opening Crop Doctor Leaf Scanner...'); }}
                className="bg-white hover:bg-emerald-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-sm hover:shadow transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Leaf Scanner</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Crop Doctor</span>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Instant camera leaf photo disease detection</p>
                </div>
              </button>

              {/* Quick Action 2: Pest & Disease */}
              <button
                onClick={() => { setActiveAiTool('pest'); triggerToast('Opening Pest & Disease Diagnosis...'); }}
                className="bg-white hover:bg-emerald-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-sm hover:shadow transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <Bug className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Diagnosis</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Pest & Disease</span>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Identify pests, bio-sprays & chemical controls</p>
                </div>
              </button>

              {/* Quick Action 3: Crop Recommendation */}
              <button
                onClick={() => { setActiveAiTool('cropPrediction'); triggerToast('Opening Crop Recommendation System...'); }}
                className="bg-white hover:bg-emerald-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-sm hover:shadow transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full uppercase">Sowing AI</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Crop Recommendation</span>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Seasonal crop selection based on soil & rainfall</p>
                </div>
              </button>

              {/* Quick Action 4: Soil Health */}
              <button
                onClick={() => { setActiveAiTool('soil'); triggerToast('Opening Soil Health & NPK Calculator...'); }}
                className="bg-white hover:bg-emerald-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-sm hover:shadow transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full uppercase">NPK & Soil</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Soil Health</span>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">NPK ratio evaluation & fertilizer dosage calculator</p>
                </div>
              </button>
            </div>
          </div>

          {/* 🌟 3. ADDITIONAL AI TOOLS (Compact Cards) */}
          <div className="space-y-2">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 px-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Additional AI Tools</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Tool 1: Yield Prediction */}
              <button
                onClick={() => { setActiveAiTool('yield'); triggerToast('Opening Yield & Price Predictor...'); }}
                className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-slate-100 text-left cursor-pointer transition-all shadow-2xs hover:shadow-sm space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 truncate">Yield Prediction</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">Harvest yield & Mandi price forecast</p>
              </button>

              {/* Tool 2: Crop Calendar */}
              <button
                onClick={() => { setActiveAiTool('calendar'); triggerToast('Opening Crop Calendar & Milestones...'); }}
                className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-slate-100 text-left cursor-pointer transition-all shadow-2xs hover:shadow-sm space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 truncate">Crop Calendar</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">Sowing timeline & stage milestones</p>
              </button>

              {/* Tool 3: Farm Finance */}
              <button
                onClick={() => { setActiveAiTool('finance'); triggerToast('Opening Farm Budget Ledger...'); }}
                className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-slate-100 text-left cursor-pointer transition-all shadow-2xs hover:shadow-sm space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 truncate">Farm Finance</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">Input costs & budget ledger</p>
              </button>

              {/* Tool 4: Weather-Based Advice */}
              <button
                onClick={() => { setActiveAiTool('weather'); triggerToast('Opening Weather-Based Intelligence...'); }}
                className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-slate-100 text-left cursor-pointer transition-all shadow-2xs hover:shadow-sm space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center">
                    <CloudRain className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 truncate">Weather Advice</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">Agro-meteorological alerts</p>
              </button>

              {/* Tool 5: Government Schemes */}
              <button
                onClick={() => { setActiveAiTool('schemes'); triggerToast('Opening Government Scheme Guidance...'); }}
                className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-slate-100 text-left cursor-pointer transition-all shadow-2xs hover:shadow-sm space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 truncate">Govt Schemes</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">Subsidies & DBT benefits matching</p>
              </button>

              {/* Tool 6: Irrigation Advice */}
              <button
                onClick={() => { setActiveAiTool('irrigation'); triggerToast('Opening Smart Irrigation Advisor...'); }}
                className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-slate-100 text-left cursor-pointer transition-all shadow-2xs hover:shadow-sm space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-xl flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 truncate">Irrigation Advice</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">Moisture triggers & drip control</p>
              </button>
            </div>
          </div>

          {/* 🌟 4. PERSONALIZED RECOMMENDATIONS */}
          <div className="bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-900 rounded-3xl p-4 text-white shadow-md border border-emerald-800 space-y-3">
            <div className="flex justify-between items-center border-b border-emerald-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-yellow-400 text-yellow-950 flex items-center justify-center font-black text-xs">
                  🌾
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-yellow-300">Personalized Field Advice</h3>
                  <p className="text-[10px] text-emerald-200">
                    Customized for {farmerName} ({farmerLocation})
                  </p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-extrabold border border-emerald-700">
                {primaryCropsStr}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Recommendation 1 */}
              <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-700/50 flex justify-between items-start space-x-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 block">💧 Irrigation Advisory</span>
                  <p className="font-semibold text-emerald-100 text-[11px]">
                    Soil moisture at 52% VMC. Schedule a 25-minute drip cycle for {primaryCropsStr} in the evening to optimize absorption.
                  </p>
                </div>
                <button
                  onClick={() => triggerSendChatMessage(`Tell me more about irrigation timing for my ${primaryCropsStr} crop`)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all"
                >
                  Ask AI
                </button>
              </div>

              {/* Recommendation 2 */}
              <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-700/50 flex justify-between items-start space-x-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-300 block">🛡️ Pest Prevention Alert</span>
                  <p className="font-semibold text-emerald-100 text-[11px]">
                    Humidity fluctuation increases Early Blight risk for Tomato in {farmerLocation}. Apply Neem seed oil extract (5ml/L water) as organic defense.
                  </p>
                </div>
                <button
                  onClick={() => triggerSendChatMessage(`How to prepare Neem oil bio spray for ${primaryCropsStr} pest prevention?`)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all"
                >
                  Ask AI
                </button>
              </div>
            </div>
          </div>

          {/* 🌟 5. AI ASSISTANT (Chat & Voice Section) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col space-y-3 p-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Krishi AI Assistant</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">24/7 Multilingual Smart Farming Q&A</p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                Gemini AI Active
              </span>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Suggested Questions:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setChatInput(q); triggerSendChatMessage(q); }}
                    className="text-[10px] bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 font-semibold px-2.5 py-1.5 rounded-xl transition-all text-left cursor-pointer"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 max-h-64 overflow-y-auto space-y-2.5">
              {chatHistory.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <MessageSquare className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">Ask anything about crops, soil, pests, or subsidies!</p>
                  <p className="text-[10px]">Type below or tap the microphone to ask in your local language.</p>
                </div>
              ) : (
                chatHistory.map((ch, idx) => (
                  <div key={idx} className={`flex ${ch.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                      ch.sender === 'user' 
                        ? 'bg-emerald-600 text-white rounded-br-none font-semibold' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs font-semibold'
                    }`}>
                      <p className="leading-relaxed">{ch.text}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[8px] opacity-60 font-mono">{ch.time}</span>
                        {ch.sender === 'ai' && (
                          <button
                            onClick={() => speakVoiceOutput(ch.text)}
                            className="ml-2 text-emerald-700 hover:text-emerald-950 p-0.5 rounded-full cursor-pointer"
                            title="Listen voice advice"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-3.5 py-2 flex space-x-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Controls */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={startVoiceRecordingTrigger}
                className={`p-2.5 rounded-2xl font-black text-xs flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Hold or tap to speak question"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-700" />}
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerSendChatMessage(chatInput); }}
                placeholder="Ask Krishi AI (e.g. Best fertilizer for Rice?)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
              />

              <button
                onClick={() => triggerSendChatMessage(chatInput)}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl cursor-pointer shrink-0 transition-all active:scale-95 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 1: CROP DOCTOR & PEST AI */}
      {/* ========================================================================= */}
      {activeAiTool === 'pest' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Bug className="w-4 h-4 text-rose-600" />
              <span>Crop Doctor Disease Diagnosis</span>
            </h4>
            <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded">Real Gemini AI Scanner</span>
          </div>

          {/* Preset Sample Leaf Pickers */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Try Sample Leaf Diagnosis:</span>
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <button
                onClick={() => handleDiseaseExamplePick && handleDiseaseExamplePick('healthy')}
                className="bg-slate-50 hover:bg-emerald-50 border px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Healthy Leaf</span>
              </button>
              <button
                onClick={() => handleDiseaseExamplePick && handleDiseaseExamplePick('blight')}
                className="bg-slate-50 hover:bg-amber-50 border px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Blight Leaf Spot</span>
              </button>
              <button
                onClick={() => handleDiseaseExamplePick && handleDiseaseExamplePick('rust')}
                className="bg-slate-50 hover:bg-rose-50 border px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Crop Blast Rust</span>
              </button>
            </div>
          </div>

          {/* Leaf Image Preview or Upload Dropzone */}
          {selectedLeafImage ? (
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-emerald-100 flex items-center justify-center">
              <img src={selectedLeafImage} alt="Leaf Preview" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
              
              {isDiagnosing && (
                <div className="absolute inset-0 bg-emerald-950/60 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">Gemini Spore Analysis...</span>
                </div>
              )}
              
              {!isDiagnosing && (
                <button 
                  onClick={() => { setSelectedLeafImage(null); setDiagnosisReport(null); }} 
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div 
              className="bg-emerald-50/50 border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-3xl p-5 text-center cursor-pointer transition-all" 
              onClick={() => hiddenFileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
              <p className="text-xs font-black text-slate-800">Scan Crop Leaf Photo</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Take camera photo or pick gallery image for instant disease AI detection</p>
              <input
                type="file"
                accept="image/*"
                ref={hiddenFileInputRef}
                className="hidden"
                onChange={handleLeafImageUploadChange}
              />
            </div>
          )}

          {/* Diagnosis Report Card */}
          {diagnosisReport && !isDiagnosing && (
            <div className="bg-slate-50 rounded-2xl border border-emerald-200 p-3.5 text-xs space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Diagnosed Condition</span>
                  <span className="font-black text-emerald-950 text-sm">{diagnosisReport.diseaseName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    diagnosisReport.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {diagnosisReport.severity || 'MEDIUM'} Severity
                  </span>
                  {downloadCropHealthPdf && (
                    <button
                      onClick={() => downloadCropHealthPdf(diagnosisReport)}
                      className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                      title="Download PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {diagnosisReport.symptoms && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Observed Symptoms</span>
                  <p className="text-slate-700 font-medium">{diagnosisReport.symptoms}</p>
                </div>
              )}

              {diagnosisReport.treatmentSuggestions && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Treatment Suggestions</span>
                  <p className="text-slate-700 font-semibold">{diagnosisReport.treatmentSuggestions}</p>
                </div>
              )}

              {diagnosisReport.organicControl && (
                <div className="bg-emerald-100/50 p-2 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">🍀 Organic Control</span>
                  <p className="text-emerald-900 font-semibold">{diagnosisReport.organicControl}</p>
                </div>
              )}
            </div>
          )}

          {/* Scan History Ledger */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h5 className="font-bold text-xs text-slate-700">Scan History Ledger ({scanHistory.length})</h5>
            {scanHistory.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No past leaf scans recorded yet.</p>
            ) : (
              scanHistory.map((rep) => (
                <div key={rep.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 block">{rep.diseaseName}</span>
                    <span className="text-[9px] text-slate-400">{new Date(rep.timestamp).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => deleteScanHistoryItem(rep.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 2: CROP RECOMMENDATION */}
      {/* ========================================================================= */}
      {activeAiTool === 'cropPrediction' && (
        <AICropPredictionSystem
          currentLang={currentLang}
          initialCropName=""
          onClose={() => setActiveAiTool(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 3: SOIL HEALTH & NPK */}
      {/* ========================================================================= */}
      {activeAiTool === 'soil' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Soil Health & NPK Calculator</span>
            </h4>
            <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Soil Test Matrix</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Select Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="Red Sandy Loam">Red Sandy Loam (Karnataka Plains)</option>
                <option value="Black Cotton Soil">Black Cotton Soil (Deccan Trap)</option>
                <option value="Alluvial Soil">Alluvial Soil (River Basins)</option>
                <option value="Laterite Soil">Laterite Soil (Coastal Belts)</option>
                <option value="Clay Loam">Clay Loam Soil</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Target Crop</label>
              <select
                value={soilCrop}
                onChange={(e) => setSoilCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="Tomato">Tomato</option>
                <option value="Paddy">Paddy / Rice</option>
                <option value="Ragi">Ragi / Millet</option>
                <option value="Maize">Maize</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Chilli">Chilli</option>
              </select>
            </div>

            {/* NPK Sliders */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Nitrogen (N) Target:</span>
                  <span className="text-emerald-700 font-mono">{nitrogen} kg/ha</span>
                </div>
                <input
                  type="range" min="40" max="250" value={nitrogen}
                  onChange={(e) => setNitrogen(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Phosphorus (P) Target:</span>
                  <span className="text-teal-700 font-mono">{phosphorus} kg/ha</span>
                </div>
                <input
                  type="range" min="20" max="150" value={phosphorus}
                  onChange={(e) => setPhosphorus(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Potassium (K) Target:</span>
                  <span className="text-amber-700 font-mono">{potassium} kg/ha</span>
                </div>
                <input
                  type="range" min="20" max="150" value={potassium}
                  onChange={(e) => setPotassium(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Fertilizer Advice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">⚡ Calculated Dosage Advice ({soilCrop}):</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-amber-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Urea</span>
                  <span className="font-extrabold text-slate-800 text-xs font-mono">{getSoilDoseAdvice().urea} kg/ha</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">DAP</span>
                  <span className="font-extrabold text-slate-800 text-xs font-mono">{getSoilDoseAdvice().dap} kg/ha</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">MOP</span>
                  <span className="font-extrabold text-slate-800 text-xs font-mono">{getSoilDoseAdvice().mop} kg/ha</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-900 font-medium pt-1">
                💡 Combine with 5 Tons/hectare of well-decomposed Farm Yard Manure (FYM) to enrich organic carbon in {soilType}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 4: YIELD & PRICE PREDICTOR */}
      {/* ========================================================================= */}
      {activeAiTool === 'yield' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Harvest Yield & Revenue Predictor</span>
            </h4>
            <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Mandi Forecast</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Selected Crop</label>
                <select
                  value={yieldCrop}
                  onChange={(e) => setYieldCrop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Paddy">Paddy / Rice</option>
                  <option value="Ragi">Ragi / Millet</option>
                  <option value="Maize">Maize</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Chilli">Dry Chilli</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Land Area (Acres)</label>
                <input
                  type="number"
                  value={landAcres}
                  onChange={(e) => setLandAcres(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none font-mono"
                  placeholder="e.g. 2"
                />
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block">📊 AI Yield Forecast:</span>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Estimated Yield</span>
                  <span className="font-black text-indigo-950 text-sm font-mono">
                    {getYieldEstimate().minYield} - {getYieldEstimate().maxYield} {yieldCrop === 'Tomato' || yieldCrop === 'Sugarcane' ? 'Tons' : 'Quintals'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Predicted Mandi Value</span>
                  <span className="font-black text-emerald-700 text-sm font-mono">
                    ₹{getYieldEstimate().minRev.toLocaleString()} - ₹{getYieldEstimate().maxRev.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-indigo-900 font-semibold leading-relaxed">
                📈 Prices for {yieldCrop} are projected to rise +8% during harvest fortnight in nearby Mandis due to regional demand trends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 5: CROP CALENDAR */}
      {/* ========================================================================= */}
      {activeAiTool === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Crop Activity Calendar & Milestones</span>
            </h4>
            <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Timeline AI</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Crop</label>
                <select
                  value={calendarCrop}
                  onChange={(e) => setCalendarCrop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Ragi">Ragi / Millet</option>
                  <option value="Paddy">Paddy / Rice</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Sowing Month</label>
                <select
                  value={sowingMonth}
                  onChange={(e) => setSowingMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="June">June (Kharif)</option>
                  <option value="July">July (Kharif)</option>
                  <option value="October">October (Rabi)</option>
                  <option value="January">January (Summer)</option>
                </select>
              </div>
            </div>

            {/* Timeline Milestones */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Activity Milestones ({calendarCrop} - Sown in {sowingMonth}):</span>
              
              <div className="space-y-2 border-l-2 border-emerald-500 pl-3 ml-1">
                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white"></div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase">Day 0-5: Land Prep & Basal Dose</span>
                  <p className="text-[11px] text-slate-600 font-medium">Deep ploughing, apply 10 tons compost FYM + basal DAP/Urea mixture.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 border-2 border-white"></div>
                  <span className="text-[10px] font-black text-teal-800 uppercase">Day 20-25: First Weeding & Drip Loop</span>
                  <p className="text-[11px] text-slate-600 font-medium">Remove inter-row weeds. Initiate regular micro-drip irrigation.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-amber-600 border-2 border-white"></div>
                  <span className="text-[10px] font-black text-amber-800 uppercase">Day 45-50: Flowering & Top Dressing</span>
                  <p className="text-[11px] text-slate-600 font-medium">Apply top dressing Urea & Micronutrient spray. Monitor for leaf spot pests.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white"></div>
                  <span className="text-[10px] font-black text-blue-800 uppercase">Day 90-110: Fruit Maturity & Harvest</span>
                  <p className="text-[11px] text-slate-600 font-medium">Harvest mature produce during early morning. Dispatch directly to Mandi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 6: FARM FINANCE & BUDGET */}
      {/* ========================================================================= */}
      {activeAiTool === 'finance' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Farm Budget & Expense Ledger</span>
            </h4>
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Expense Tracker</span>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              value={newExpenseTitle}
              onChange={(e) => setNewExpenseTitle(e.target.value)}
              placeholder="Expense title (e.g. Urea, Seeds)"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
            />
            <input
              type="number"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none font-mono"
            />
            <button
              onClick={addExpenseItem}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            {expenses.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic p-2 text-center">No expenses recorded yet.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center p-2 bg-white rounded-xl text-xs border border-slate-100 shadow-2xs">
                  <span className="font-bold text-slate-800">{exp.title || exp.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-emerald-700 font-mono">₹{exp.amount}</span>
                    <button onClick={() => deleteExpenseItem(exp.id)} className="text-slate-400 hover:text-rose-500 p-0.5 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-extrabold text-slate-800">
              <span>Total Expenses:</span>
              <span className="text-emerald-800 font-mono text-sm">
                ₹{expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 7: WEATHER-BASED ADVICE */}
      {/* ========================================================================= */}
      {activeAiTool === 'weather' && (
        <WeatherIntelligence
          currentLang={currentLang as any}
          onClose={() => setActiveAiTool(null)}
          triggerToast={triggerToast}
          uid={fullUserProfile?.uid}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 8: GOVERNMENT SCHEMES */}
      {/* ========================================================================= */}
      {activeAiTool === 'schemes' && (
        <KYCGovernmentBenefits
          uid={fullUserProfile?.uid || 'guest_uid'}
          initialProfile={fullUserProfile}
          onClose={() => setActiveAiTool(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 9: SMART IRRIGATION ADVISOR */}
      {/* ========================================================================= */}
      {activeAiTool === 'irrigation' && (
        <SmartIrrigationAdvisor
          currentLang={currentLang as any}
          onClose={() => setActiveAiTool(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 SUB-TOOL 10: ECO & SUSTAINABILITY SCORE */}
      {/* ========================================================================= */}
      {activeAiTool === 'sustainability' && (
        <div className="bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-900 rounded-3xl p-4 text-white shadow-md space-y-3 border border-emerald-800">
          <div className="flex justify-between items-center">
            <h4 className="font-black text-sm uppercase text-yellow-300">Organic Farming Eco-Score</h4>
            <span className="font-black font-mono text-xl text-yellow-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
              {compileEcoScore()} / 100
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-medium leading-relaxed">
            Your land maintains clean water-saving drip practices, bio-organic pest management, and zero stubble burning! Earned secondary verified Green Farm Badge.
          </p>
        </div>
      )}

    </div>
  );
};
