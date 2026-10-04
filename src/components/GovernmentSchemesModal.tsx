import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Landmark, 
  Award, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  UserCheck
} from 'lucide-react';
import { 
  VERIFIED_GOVERNMENT_SCHEMES, 
  OfficialGovernmentScheme 
} from '../services/providers/governmentDataProvider';

export interface GovernmentSchemesModalProps {
  onClose: () => void;
  onOpenKyc?: () => void;
  currentLang?: string;
  triggerToast?: (msg: string) => void;
}

export const GovernmentSchemesModal: React.FC<GovernmentSchemesModalProps> = ({
  onClose,
  onOpenKyc,
  triggerToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const categories = [
    'All',
    'Income Support',
    'Crop Insurance',
    'Irrigation',
    'Soil Care',
    'Credit',
    'Machinery',
    'Organic'
  ];

  const filteredSchemes = useMemo(() => {
    return VERIFIED_GOVERNMENT_SCHEMES.filter((scheme) => {
      const matchesCategory = 
        selectedCategory === 'All' || 
        scheme.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        scheme.title.toLowerCase().includes(q) ||
        scheme.benefit.toLowerCase().includes(q) ||
        scheme.eligibility.toLowerCase().includes(q) ||
        scheme.documentsNeeded.some(d => d.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedSchemeId(prev => prev === id ? null : id);
  };

  const handlePortalClick = (url: string, title: string) => {
    if (triggerToast) {
      triggerToast(`Redirecting to official portal for ${title}...`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-900 text-white p-5 flex items-start justify-between relative shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <Landmark className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Direct Official Portals
                </span>
                <span className="text-[10px] font-bold text-yellow-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% Verified
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                Government Schemes & Subsidies
              </h2>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Official Government of India agricultural welfare directory
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close Government Schemes"
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full text-white cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, subsidy, or crop..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-[11px] transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scheme List Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-slate-100/40">
          {filteredSchemes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No schemes found matching your search</p>
              <p className="text-xs text-slate-500">Try clearing the search query or selecting a different category.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-2 text-xs font-bold text-emerald-700 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredSchemes.map((scheme) => {
              const isExpanded = expandedSchemeId === scheme.id;
              return (
                <div 
                  key={scheme.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-xs hover:border-emerald-200 transition-all space-y-3"
                >
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {scheme.category}
                    </span>
                    {scheme.subsidyPercentage && (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        {scheme.subsidyPercentage}
                      </span>
                    )}
                  </div>

                  {/* Title & Authority */}
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {scheme.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Authority: {scheme.sourceAuthority}
                    </p>
                  </div>

                  {/* Benefit Block */}
                  <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100/70">
                    <span className="text-[9px] font-black uppercase text-emerald-900 tracking-wider block mb-1">
                      Direct Financial & Operational Benefit
                    </span>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {scheme.benefit}
                    </p>
                  </div>

                  {/* Eligibility Preview */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Eligibility
                    </span>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-700">
                      {scheme.eligibility}
                    </p>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-150 animate-fade-in text-xs">
                      {/* Documents Needed */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" /> Required Documents
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {scheme.documentsNeeded.map((doc, idx) => (
                            <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-semibold">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Application Process */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                          Application Process & Steps
                        </span>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                          {scheme.applicationProcess}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(scheme.id)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer py-1"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Requirements & Process'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center space-x-2">
                      {onOpenKyc && (
                        <button
                          onClick={onOpenKyc}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Link Land Profile</span>
                        </button>
                      )}
                      <a
                        href={scheme.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handlePortalClick(scheme.officialUrl, scheme.title)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-[11px] font-black cursor-pointer transition-all shadow-xs flex items-center space-x-1.5"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-white border-t border-slate-200 text-center shrink-0">
          <p className="text-[10px] text-slate-500 font-medium">
            AgriVerse AI directly connects you to authenticated Central & State government portals. We never charge any fee for government schemes.
          </p>
        </div>
      </div>
    </div>
  );
};
