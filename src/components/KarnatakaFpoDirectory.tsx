import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Wheat,
  FileText,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { GovernmentFPO, FpoFilterOptions } from '../types/fpo';
import {
  getAllKarnatakaFpos,
  filterKarnatakaFpos,
  getUniqueDistricts,
  getUniqueMajorCrops,
  getUniqueLegalForms
} from '../services/fpoService';

interface KarnatakaFpoDirectoryProps {
  userDistrict?: string;
  triggerToast?: (msg: string) => void;
}

export function KarnatakaFpoDirectory({
  userDistrict = 'Karnataka',
  triggerToast
}: KarnatakaFpoDirectoryProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedLegalForm, setSelectedLegalForm] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination / Display limit
  const PAGE_SIZE = 12;
  const [displayCount, setDisplayCount] = useState<number>(PAGE_SIZE);

  // Modal State for full details view
  const [selectedFpo, setSelectedFpo] = useState<GovernmentFPO | null>(null);

  // Data Loading with error resilience
  const { allFpos, loadError } = useMemo(() => {
    try {
      const data = getAllKarnatakaFpos();
      return { allFpos: data, loadError: data.length === 0 };
    } catch (err) {
      console.error('Error reading Karnataka FPO directory:', err);
      return { allFpos: [], loadError: true };
    }
  }, []);

  const uniqueDistricts = useMemo(() => getUniqueDistricts(), []);
  const uniqueCrops = useMemo(() => getUniqueMajorCrops(), []);
  const uniqueLegalForms = useMemo(() => getUniqueLegalForms(), []);

  // Filtered & District-prioritized FPOs
  const filteredFpos = useMemo(() => {
    const options: FpoFilterOptions = {
      searchQuery,
      district: selectedDistrict,
      crop: selectedCrop,
      legalForm: selectedLegalForm,
      userDistrict
    };
    return filterKarnatakaFpos(options);
  }, [searchQuery, selectedDistrict, selectedCrop, selectedLegalForm, userDistrict]);

  // Reset pagination when filter criteria change
  React.useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery, selectedDistrict, selectedCrop, selectedLegalForm]);

  const activeFilterCount = (selectedDistrict !== 'all' ? 1 : 0) +
    (selectedCrop !== 'all' ? 1 : 0) +
    (selectedLegalForm !== 'all' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('all');
    setSelectedCrop('all');
    setSelectedLegalForm('all');
    setDisplayCount(PAGE_SIZE);
    if (triggerToast) triggerToast('Filters reset to show all Karnataka FPOs');
  };

  const visibleFpos = filteredFpos.slice(0, displayCount);
  const hasMore = displayCount < filteredFpos.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredFpos.length));
  };

  if (loadError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3 m-3">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h4 className="text-sm font-bold text-red-900">Government FPO data could not be loaded.</h4>
        <p className="text-xs text-red-700">Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* 1. SEARCH & FILTER CONTROLS */}
      <div className="bg-white border-b border-slate-200 p-3 space-y-2.5 shrink-0 shadow-xs">
        {/* Search input */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-slate-100 hover:bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 rounded-2xl px-3 py-2 flex items-center space-x-2 border border-slate-200 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, hubs or farmers..."
              className="bg-transparent w-full text-xs text-slate-800 font-semibold placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-2xl border flex items-center space-x-1 text-xs font-bold transition-all shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Filter FPOs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Filter Dropdowns */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* District Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                District ({uniqueDistricts.length})
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-emerald-600"
              >
                <option value="all">All Karnataka Districts</option>
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d} {userDistrict && d.toLowerCase() === userDistrict.toLowerCase() ? '★ (Your District)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Major Crop Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Major Crop
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-emerald-600"
              >
                <option value="all">All Crops ({uniqueCrops.length})</option>
                {uniqueCrops.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Legal Form Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Legal Form
              </label>
              <select
                value={selectedLegalForm}
                onChange={(e) => setSelectedLegalForm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-emerald-600"
              >
                <option value="all">All Legal Forms</option>
                {uniqueLegalForms.map((lf) => (
                  <option key={lf} value={lf}>{lf}</option>
                ))}
              </select>
            </div>

            {/* Reset button inside filter drawer */}
            {activeFilterCount > 0 && (
              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section Heading & Verification Label */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-[11px] uppercase font-black text-slate-800 tracking-wider flex items-center space-x-1">
              <span>KARNATAKA GOVERNMENT-LISTED FPOs</span>
            </h3>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>🏛 Government Source</span>
            </span>
          </div>

          <span className="text-[10px] font-bold text-slate-500">
            {filteredFpos.length} of {allFpos.length} FPOs
          </span>
        </div>
      </div>

      {/* 2. DIRECTORY LIST / SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
        {filteredFpos.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">
              No government-listed FPOs found for this search.
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Try searching by another district, crop, or registration number, or reset your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
            >
              Show All Karnataka FPOs
            </button>
          </div>
        ) : (
          <>
            {visibleFpos.map((fpo) => {
              const isUserDistrict = userDistrict && fpo.district.toLowerCase() === userDistrict.toLowerCase();

              return (
                <div
                  key={fpo.id}
                  className={`bg-white rounded-2xl border p-3.5 space-y-2.5 transition-all shadow-xs hover:shadow-md ${
                    isUserDistrict
                      ? 'border-emerald-300 ring-1 ring-emerald-200 bg-linear-to-b from-emerald-50/20 to-white'
                      : 'border-slate-200/80 hover:border-emerald-200'
                  }`}
                >
                  {/* Card Header: FPO Name + Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="inline-flex items-center space-x-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                          <span>🏛 Government Listed</span>
                        </span>
                        {isUserDistrict && (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span>📍 Your District</span>
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {fpo.legalForm}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 leading-tight pt-1">
                        🏛 {fpo.fpoName}
                      </h4>
                    </div>

                    <span className="text-[9px] text-slate-400 font-bold shrink-0">
                      #{fpo.sNo}
                    </span>
                  </div>

                  {/* Card Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">{fpo.district}</span>
                      <span className="text-slate-400">({fpo.state})</span>
                    </div>

                    <div className="flex items-center space-x-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 text-[10px]">CIN / Reg:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 truncate" title={fpo.registrationNumber}>
                        {fpo.registrationNumber}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 text-[10px]">Reg Date:</span>
                      <span className="font-semibold text-slate-700">{fpo.registrationDate}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 truncate">
                      <Wheat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-slate-500 text-[10px]">Crops:</span>
                      <span className="font-semibold text-slate-800 truncate" title={fpo.majorCrops.join(', ')}>
                        {fpo.majorCrops.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Address Snippet */}
                  <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                    <span className="font-bold text-slate-600">📍 Address: </span>
                    {fpo.address}
                  </p>

                  {/* Officially Published Contact / Email (Only if officially published) */}
                  {(fpo.contact || fpo.email) && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px]">
                      {fpo.contact && (
                        <a
                          href={`tel:${fpo.contact}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200 transition"
                          title="Call officially published phone"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-700" />
                          <span>{fpo.contact}</span>
                        </a>
                      )}
                      {fpo.email && (
                        <a
                          href={`mailto:${fpo.email}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200 transition"
                          title="Email officially published contact"
                        >
                          <Mail className="w-2.5 h-2.5 text-indigo-700" />
                          <span className="truncate max-w-[180px]">{fpo.email}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Status & Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-semibold">
                      <span>Status: Not verified</span>
                      <span>•</span>
                      <span>AgriVerse: NOT CONNECTED</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {fpo.contact && (
                        <a
                          href={`tel:${fpo.contact}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200 flex items-center space-x-1 transition"
                        >
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>CONTACT</span>
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedFpo(fpo)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10px] font-black tracking-wide transition shadow-xs"
                      >
                        VIEW DETAILS
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination / Load More */}
            {hasMore && (
              <div className="p-3 text-center">
                <button
                  onClick={handleLoadMore}
                  className="w-full py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-black transition shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <span>Load More Karnataka FPOs</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {filteredFpos.length - visibleFpos.length} remaining
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. FPO DETAILS MODAL / DIALOG */}
      {selectedFpo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-emerald-900 text-white p-4 flex items-start justify-between shrink-0">
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span className="text-[9px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                    🏛 Government Listed (SFAC)
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700">
                    {selectedFpo.legalForm}
                  </span>
                </div>
                <h3 className="text-sm font-black leading-snug">
                  {selectedFpo.fpoName}
                </h3>
                <p className="text-[10px] text-emerald-200">
                  📍 {selectedFpo.district}, {selectedFpo.state} • Record #{selectedFpo.sNo}
                </p>
              </div>

              <button
                onClick={() => setSelectedFpo(null)}
                className="p-1.5 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-white transition shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs scrollbar-none flex-1">
              {/* Official Registration Details */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Registration Details
                </h4>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-semibold">Registration / CIN:</span>
                    <span className="font-mono font-bold text-slate-800 text-right select-all">
                      {selectedFpo.registrationNumber || 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Registration Date:</span>
                    <span className="font-bold text-slate-800">
                      {selectedFpo.registrationDate || 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Legal Form:</span>
                    <span className="font-bold text-slate-800">
                      {selectedFpo.legalForm || 'Not available'}
                    </span>
                  </div>
                  {selectedFpo.programme && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Programme:</span>
                      <span className="font-bold text-slate-800">
                        {selectedFpo.programme}
                      </span>
                    </div>
                  )}
                  {selectedFpo.resourceInstitution && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-500 font-semibold">Resource Institution:</span>
                      <span className="font-bold text-slate-800 text-right">
                        {selectedFpo.resourceInstitution}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Major Crops */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Major Crops
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFpo.majorCrops.map((crop, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1"
                    >
                      <Wheat className="w-3 h-3 text-amber-700" />
                      <span>{crop}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Officially Registered Address
                </h4>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-slate-700 leading-relaxed font-medium">
                  {selectedFpo.address || 'Not available'}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Officially Published Contact Information
                </h4>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Contact Person:</span>
                    <span className="font-bold text-slate-800">
                      {selectedFpo.contactPerson || 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Phone Contact:</span>
                    {selectedFpo.contact ? (
                      <a
                        href={`tel:${selectedFpo.contact}`}
                        className="font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{selectedFpo.contact}</span>
                      </a>
                    ) : (
                      <span className="font-bold text-slate-400">Not available</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Email:</span>
                    {selectedFpo.email ? (
                      <a
                        href={`mailto:${selectedFpo.email}`}
                        className="font-bold text-indigo-700 hover:underline flex items-center space-x-1"
                      >
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{selectedFpo.email}</span>
                      </a>
                    ) : (
                      <span className="font-bold text-slate-400">Not available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* AgriVerse Community Status */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  AgriVerse Community Status
                </h4>
                <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 text-slate-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="font-black text-slate-800 text-[11px]">
                      AgriVerse Community: {selectedFpo.communityStatus || 'NOT CONNECTED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    This organization is verified against the official Government of India dataset. Government registration does not represent active presence or current online status on AgriVerse. Representatives may connect this FPO after administrative verification.
                  </p>
                </div>
              </div>

              {/* Source & Verification Transparency Box */}
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-black text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Source & Verification</span>
                </div>
                <div className="space-y-1 text-[10px] text-slate-600">
                  <p>
                    <span className="font-bold text-slate-700">Source: </span>
                    {selectedFpo.sourceName}
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Source Directory: </span>
                    {selectedFpo.sourceUpdatedDate}
                  </p>
                  <p className="italic text-slate-500 pt-0.5">
                    “Information sourced from official government-published FPO data.”
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <a
                href={selectedFpo.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-xs"
              >
                <span>VIEW OFFICIAL SOURCE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedFpo(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
