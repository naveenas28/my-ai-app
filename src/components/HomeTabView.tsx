import React, { useState } from 'react';
import { 
  Sprout, 
  ShieldCheck, 
  Mic, 
  AlertTriangle, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  Camera, 
  Bookmark, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Globe, 
  User, 
  Bell, 
  ChevronRight,
  Sun,
  CloudSun,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { LANGUAGES } from '../data';

interface HomeTabViewProps {
  userPhone: string;
  regPhone?: string;
  fullUserProfile: any;
  liveWeather: any;
  t: any;
  currentLang: string;
  setCurrentLang: (lang: any) => void;
  reminders: Array<{ id: string; text: string; done: boolean }>;
  newReminderText: string;
  setNewReminderText: (val: string) => void;
  addReminder: () => void;
  toggleReminder: (id: string, currentDone: boolean) => void;
  deleteReminder: (id: string) => void;
  onOpenWeather: () => void;
  onOpenCropDoctor: () => void;
  onOpenWaterTracker: () => void;
  onOpenGovSchemes: () => void;
  onNavigateTab: (tab: 'home' | 'community' | 'marketplace' | 'assistant' | 'profile') => void;
  triggerToast: (msg: string) => void;
}

export const HomeTabView: React.FC<HomeTabViewProps> = ({
  userPhone,
  regPhone,
  fullUserProfile,
  liveWeather,
  t,
  currentLang,
  setCurrentLang,
  reminders,
  newReminderText,
  setNewReminderText,
  addReminder,
  toggleReminder,
  deleteReminder,
  onOpenWeather,
  onOpenCropDoctor,
  onOpenWaterTracker,
  onOpenGovSchemes,
  onNavigateTab,
  triggerToast,
}) => {
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Display top 2-3 reminders if not showAll
  const displayedReminders = showAllReminders ? reminders : reminders.slice(0, 3);
  const activeCount = reminders.filter(r => !r.done).length;

  const farmerName = fullUserProfile?.name || (userPhone ? `+91 ${userPhone}` : (regPhone ? `+91 ${regPhone}` : 'Farmer Partner'));

  return (
    <div id="v_home_tab" className="p-3.5 space-y-3.5 animate-fadeIn max-w-xl mx-auto w-full pb-20 text-slate-800">
      
      {/* 1. HEADER BAR */}
      <header id="home_top_header" className="bg-white rounded-2xl border border-slate-100 p-3 shadow-xs flex items-center justify-between relative z-20">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm text-slate-800 leading-none flex items-center space-x-1">
              <span>AgriVerse</span>
              <span className="text-emerald-600">AI</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Krishi Smart Companion</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="bg-slate-50 hover:bg-emerald-50 active:scale-95 border border-slate-200/80 px-2.5 py-1.5 rounded-xl flex items-center space-x-1 text-xs font-bold text-slate-700 cursor-pointer transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span className="uppercase text-[11px] font-black">{currentLang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 animate-fadeIn">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setShowLangDropdown(false);
                      triggerToast(`Language changed to ${lang.localName}`);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50 ${
                      currentLang === lang.code ? 'font-black text-emerald-800 bg-emerald-50/60' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <span>{lang.localName}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Button */}
          <button
            onClick={() => {
              setShowNotificationModal(!showNotificationModal);
              triggerToast('System notifications synced');
            }}
            className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200/80 cursor-pointer active:scale-95 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {(liveWeather?.hasSevereRainAlert ?? true) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={() => onNavigateTab('profile')}
            className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 cursor-pointer active:scale-95 transition-all shadow-xs overflow-hidden"
            title="View Profile"
          >
            {fullUserProfile?.profilePhotoUrl ? (
              <img src={fullUserProfile.profilePhotoUrl} alt="User" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <User className="w-4.5 h-4.5 text-emerald-700" />
            )}
          </button>
        </div>
      </header>

      {/* Notifications Drawer Banner */}
      {showNotificationModal && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs space-y-1 animate-fadeIn">
          <div className="flex justify-between items-center font-bold text-amber-900">
            <span className="flex items-center space-x-1">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Active Notifications</span>
            </span>
            <button onClick={() => setShowNotificationModal(false)} className="text-amber-700 text-[10px] uppercase font-black">Close</button>
          </div>
          <p className="text-amber-800 text-[11px]">⛈️ Severe Rainfall Advisory active for Mandya / Rural KA.</p>
          <p className="text-amber-800 text-[11px]">🌾 Govt PM-Kisan 17th Installment distribution active.</p>
        </div>
      )}

      {/* 2. WELCOME CARD */}
      <div id="home_welcome_card" className="bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-4 text-white shadow-lg border border-emerald-700/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="bg-white/15 backdrop-blur-md text-yellow-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-yellow-300 mr-1" />
              <span>Verified Partner</span>
            </span>
            <span className="text-[10px] text-emerald-200 font-semibold">📍 {liveWeather?.locationName || 'Mandya, KA'}</span>
          </div>

          <div>
            <h2 className="text-base font-black leading-tight text-white">
              Welcome back, {farmerName}! 👋
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium mt-0.5 leading-relaxed">
              Ready for today's field work? Check live weather alerts & crop tasks below.
            </p>
          </div>

          {/* Voice/AI Question Input Bar */}
          <div 
            onClick={() => {
              onNavigateTab('assistant');
              triggerToast('Opening Krishi AI Voice Advisor...');
            }} 
            className="bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/25 p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-inner"
          >
            <span className="text-xs text-white/90 font-semibold truncate flex-1 mr-2">
              🎙️ Ask Krishi AI anything in Kannada, Hindi, English...
            </span>
            <div className="w-7 h-7 rounded-xl bg-yellow-400 text-yellow-950 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-6 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-white" />
        </div>
      </div>

      {/* 3. IMPORTANT ALERT (COMPACT) */}
      {(liveWeather?.hasSevereRainAlert ?? true) && (
        <div 
          id="home_important_alert" 
          className="bg-red-50 hover:bg-red-100/80 border-2 border-red-200/80 rounded-2xl p-3 flex space-x-3 items-center shadow-xs transition-all"
        >
          <div className="bg-red-500 text-white rounded-xl p-2 shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-red-900 text-xs uppercase tracking-wide truncate">
                {liveWeather?.alertTitle || '⛈️ Emergency Rainfall Alert'}
              </h3>
              <button 
                onClick={onOpenWeather} 
                className="text-[10px] font-black text-red-700 hover:text-red-900 underline shrink-0 cursor-pointer ml-1"
              >
                View Details →
              </button>
            </div>
            <p className="text-[11px] text-red-700 font-medium leading-snug mt-0.5 line-clamp-2">
              {liveWeather?.alertDescription || 'Heavy localized rainfall expected (65mm+). Delay pesticide spray and clear field drainage lines.'}
            </p>
          </div>
        </div>
      )}

      {/* 4. WEATHER SUMMARY CARD */}
      <div 
        id="home_weather_summary_card" 
        className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                Weather Summary
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                📍 {liveWeather?.locationName || 'Mandya Rural District, KA'}
              </p>
            </div>
          </div>
          <button 
            onClick={onOpenWeather}
            className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/60 cursor-pointer transition-all flex items-center space-x-1"
          >
            <span>View Weather</span>
            <ChevronRight className="w-3 h-3 text-emerald-600" />
          </button>
        </div>

        {/* Temperature & Condition Metrics */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-slate-900">
                {liveWeather?.temperature ? `${liveWeather.temperature}°C` : '28°C'}
              </span>
              <span className="text-xs text-slate-400 font-bold">Live</span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {liveWeather?.condition || 'Heavy Rain Likely'}
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl text-[11px] font-semibold text-slate-600 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span>Humidity</span>
              </span>
              <span className="text-slate-900 font-black font-mono">
                {liveWeather?.humidity ? `${liveWeather.humidity}%` : '82%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-1">
                <Wind className="w-3 h-3 text-indigo-500" />
                <span>Rain Prob.</span>
              </span>
              <span className="text-emerald-700 font-black font-mono">
                {liveWeather?.rainfallChance ? `${liveWeather.rainfallChance}%` : '80%'}
              </span>
            </div>
          </div>
        </div>

        {/* Small 5-Day Forecast */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">5-Day Weather Forecast</p>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {(liveWeather?.forecast || [
              { day: 'Mon', tempMax: 28, tempMin: 21, rainProb: 80 },
              { day: 'Tue', tempMax: 27, tempMin: 20, rainProb: 75 },
              { day: 'Wed', tempMax: 30, tempMin: 22, rainProb: 20 },
              { day: 'Thu', tempMax: 31, tempMin: 23, rainProb: 15 },
              { day: 'Fri', tempMax: 29, tempMin: 21, rainProb: 40 }
            ]).slice(0, 5).map((f: any, idx: number) => (
              <div key={idx} className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100/80 flex flex-col items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">{f.day}</span>
                <div className="my-1">
                  {f.rainProb > 50 ? (
                    <CloudRain className="w-4 h-4 text-blue-500" />
                  ) : f.rainProb > 25 ? (
                    <CloudSun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <span className="text-[10px] font-black text-slate-800">{f.tempMax}°</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. QUICK ACTIONS (CLEAN 2x2 MOBILE GRID) */}
      <div id="home_quick_actions_section" className="space-y-2">
        <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center justify-between">
          <span>⚡ Quick Actions</span>
          <span className="text-[9px] text-slate-400 font-bold lowercase">2x2 mobile grid</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Crop Doctor */}
          <button 
            onClick={onOpenCropDoctor}
            className="bg-white hover:bg-emerald-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-xs transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                AI Scan
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Crop Doctor</span>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                Camera leaf disease diagnosis & treatment
              </p>
            </div>
          </button>

          {/* Card 2: Weather */}
          <button 
            onClick={onOpenWeather}
            className="bg-white hover:bg-indigo-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-xs transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <CloudRain className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full uppercase border border-indigo-100">
                Live
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Weather Hub</span>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                Micro-climate, rain alerts & 7-day forecast
              </p>
            </div>
          </button>

          {/* Card 3: Water Tracker */}
          <button 
            onClick={onOpenWaterTracker}
            className="bg-white hover:bg-cyan-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-xs transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-cyan-600 text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full uppercase border border-cyan-100">
                Smart
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Water Tracker</span>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                Soil moisture & automated pump scheduling
              </p>
            </div>
          </button>

          {/* Card 4: Government Schemes */}
          <button 
            onClick={onOpenGovSchemes}
            className="bg-white hover:bg-amber-50/70 active:scale-[0.98] rounded-3xl p-3.5 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-xs transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Bookmark className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full uppercase border border-amber-100">
                Subsidies
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">Government Schemes</span>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                PM-Kisan, subsidies & loan eligibility
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 6. TODAY'S FARMING REMINDERS */}
      <div id="home_reminders_section" className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-black text-xs">
              📅
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                Today's Farming Reminders
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">{activeCount} active tasks</p>
            </div>
          </div>

          <button
            onClick={() => setShowAllReminders(!showAllReminders)}
            className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl cursor-pointer transition-all border border-emerald-200/60"
          >
            {showAllReminders ? 'Show Less' : `View All (${reminders.length})`}
          </button>
        </div>

        {/* Add Reminder Input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newReminderText}
            onChange={(e) => setNewReminderText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addReminder(); }}
            placeholder="Add memo (e.g. Apply Neem oil spray at 5 PM)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
          <button
            onClick={addReminder}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs"
            title="Add reminder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Reminders List (2-3 items by default) */}
        <div className="space-y-1.5">
          {displayedReminders.length > 0 ? (
            displayedReminders.map((rem) => (
              <div
                key={rem.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all border ${
                  rem.done 
                    ? 'bg-slate-50/70 border-slate-100 text-slate-400' 
                    : 'bg-emerald-50/40 border-emerald-100 text-slate-800 font-semibold'
                }`}
              >
                <button
                  onClick={() => toggleReminder(rem.id, rem.done)}
                  className="flex items-center space-x-2.5 text-left flex-1 min-w-0 cursor-pointer"
                >
                  {rem.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`text-xs truncate ${rem.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {rem.text}
                  </span>
                </button>
                <button
                  onClick={() => deleteReminder(rem.id)}
                  className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                  title="Delete memo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 font-medium italic text-center py-2">
              No active reminders. Add one above!
            </p>
          )}
        </div>
      </div>

    </div>
  );
};
