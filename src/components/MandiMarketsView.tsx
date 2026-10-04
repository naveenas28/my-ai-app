import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  X,
  Building,
  Calendar,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  ArrowLeft,
  Mail,
  Navigation
} from 'lucide-react';
import { OfficialMandiRecord, MandiQueryResult } from '../services/providers/mandiDataProvider';

export interface MandiMarketsViewProps {
  currentLang?: string;
  triggerToast: (msg: string) => void;
  onSelectCommodityForChat?: (commodity: string, mandiName: string) => void;
}

export const MandiMarketsView: React.FC<MandiMarketsViewProps> = ({
  currentLang = 'en',
  triggerToast,
  onSelectCommodityForChat
}) => {
  const [mandis, setMandis] = useState<OfficialMandiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'modalPriceDesc' | 'modalPriceAsc' | 'marketName' | 'arrival'>('modalPriceDesc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // In-App Details Modal State
  const [selectedMandi, setSelectedMandi] = useState<OfficialMandiRecord | null>(null);

  // Fetch Mandis from backend endpoint
  const fetchMandis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedState && selectedState !== 'all') params.append('state', selectedState);
      if (selectedDistrict && selectedDistrict !== 'all') params.append('district', selectedDistrict);
      if (selectedCommodity && selectedCommodity !== 'all') params.append('commodity', selectedCommodity);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);

      const res = await fetch(`/api/agriculture/mandi?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data: MandiQueryResult = await res.json();
      if (data.success) {
        setMandis(data.mandis || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.states && data.states.length > 0) setAvailableStates(data.states);
        if (data.districts && data.districts.length > 0) setAvailableDistricts(data.districts);
        if (data.commodities && data.commodities.length > 0) setAvailableCommodities(data.commodities);
      } else {
        throw new Error(data.error || 'Failed to load mandi records.');
      }
    } catch (err: any) {
      console.error('[MandiMarketsView Fetch Error]:', err);
      setError('Unable to load official mandi records. Please tap retry.');
      setMandis([]);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedCommodity, searchQuery, page, limit, sortBy]);

  // Re-fetch when filters or sorting change
  useEffect(() => {
    fetchMandis();
  }, [fetchMandis]);

  // When state changes, reset district filter to 'all'
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setSelectedDistrict('all');
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedCommodity('all');
    setSearchQuery('');
    setSortBy('modalPriceDesc');
    setPage(1);
    triggerToast('Filters reset to all markets');
  };

  return (
    <div className="space-y-4">
      {/* 🌟 HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Official e-NAM 1,522 Connected Mandis Directory
              </span>
              <span className="bg-yellow-400 text-yellow-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                27 States & UTs
              </span>
            </div>
            <h2 className="text-xl font-black mt-1.5 flex items-center space-x-2">
              <span>National Agriculture Market (e-NAM) Directory</span>
            </h2>
            <p className="text-xs text-emerald-100 font-medium max-w-xl mt-1 leading-relaxed">
              Official pan-India network of 1,522 regulated APMC mandis across 27 States & UTs. View locations, traded commodities, live prices where published, verified contacts, and official government portals.
            </p>
          </div>

          <button
            onClick={() => { fetchMandis(); triggerToast('Refreshing official e-NAM mandi directory...'); }}
            disabled={loading}
            className="self-start md:self-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white px-3 py-2 rounded-2xl border border-white/20 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
            title="Refresh official e-NAM directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Directory</span>
          </button>
        </div>
      </div>

      {/* 🌟 FILTER CONTROLS BAR */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by mandi name, district, state, or crop (e.g., Chikkaballapura, Lasalgaon, Tomato, Wheat)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-10 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns Row: State, District, Commodity, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* State Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">All States ({availableStates.length})</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">All Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Commodity Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Commodity</label>
            <select
              value={selectedCommodity}
              onChange={(e) => { setSelectedCommodity(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">All Crops</option>
              {availableCommodities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="modalPriceDesc">Price: High to Low</option>
              <option value="modalPriceAsc">Price: Low to High</option>
              <option value="arrival">Highest Arrival (Tonnes)</option>
              <option value="marketName">Mandi Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Quick Commodity Pills */}
        <div className="pt-1 flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Quick:</span>
          {['all', 'Tomato', 'Ragi', 'Onion', 'Chilli', 'Paddy', 'Wheat', 'Cotton', 'Mustard', 'Soybean', 'Groundnut'].map((c) => {
            const isActive = selectedCommodity === c || (c === 'all' && selectedCommodity === 'all');
            return (
              <button
                key={c}
                onClick={() => { setSelectedCommodity(c); setPage(1); }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0 cursor-pointer transition-all active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c === 'all' ? 'All Crops' : c}
              </button>
            );
          })}
        </div>

        {/* Active Filters Summary & Reset */}
        {(selectedState !== 'all' || selectedDistrict !== 'all' || selectedCommodity !== 'all' || searchQuery) && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">
              Filtered results: <strong className="text-slate-900">{totalCount}</strong> e-NAM mandis found
            </span>
            <button
              onClick={handleResetFilters}
              className="text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 🌟 RESULTS STATUS / COUNT */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
          {selectedState !== 'all' ? `${selectedState} Mandis` : 'All 1,522 e-NAM Regulated Mandis'} ({totalCount})
        </span>
        <span className="text-[10px] text-slate-400 font-bold font-mono">
          Page {page} of {totalPages}
        </span>
      </div>

      {/* 🌟 LOADING STATE */}
      {loading && (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700">Loading official e-NAM directory (1,522 connected mandis)...</p>
          <p className="text-[10px] text-slate-400">Filtering official wholesale APMC markets across 27 States & UTs</p>
        </div>
      )}

      {/* 🌟 ERROR STATE */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h4 className="text-xs font-black text-rose-900">{error}</h4>
          <button
            onClick={fetchMandis}
            className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded-xl cursor-pointer shadow-sm active:scale-95"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* 🌟 EMPTY STATE */}
      {!loading && !error && mandis.length === 0 && (
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center space-y-2.5">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-xs font-black text-slate-800 uppercase">No Mandis Match Your Search Criteria</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Try adjusting your state, district, or crop filters to view available e-NAM connected wholesale yards.
          </p>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl cursor-pointer shadow-sm transition-all"
          >
            Show All 1,522 Mandis
          </button>
        </div>
      )}

      {/* 🌟 MANDI CARDS GRID */}
      {!loading && !error && mandis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {mandis.map((m) => {
            const hasPhone = Boolean(m.phone || m.mobile);
            const hasWhatsApp = Boolean(m.whatsapp);
            const officialPhone = m.phone || m.mobile;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              m.location ? `${m.location}, ${m.district}, ${m.state}` : `${m.market}, ${m.district}, ${m.state}`
            )}`;
            const commList = (m.commodities && m.commodities.length > 0)
              ? m.commodities.map(c => typeof c === 'string' ? c : c.commodity).join(', ')
              : m.primaryCommodity;

            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                {/* 1. Mandi Name, State, District & Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {m.district}, {m.state}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold" title="Last updated date">
                      {m.dataDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {m.market}
                  </h3>

                  <p className="text-[11px] text-slate-500 font-medium flex items-start space-x-1.5 leading-normal">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{m.location || m.address}</span>
                  </p>
                </div>

                {/* 2. Commodity & Current Price/Arrival Information */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex-1 mr-2 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Commodities</span>
                      <span className="font-extrabold text-slate-800 truncate block" title={commList}>
                        {commList}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Current Price</span>
                      {m.hasLivePrice && m.latestPrice ? (
                        <span className="font-black text-emerald-900 font-mono text-sm block">
                          {m.latestPrice}
                        </span>
                      ) : (
                        <span className="bg-amber-100/90 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">
                          Price data unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3-Column Price Metrics or Price Unavailable Notice */}
                  {m.hasLivePrice && m.modalPrice ? (
                    <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-200/70 text-center">
                      <div className="bg-white p-1 rounded-xl border border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block leading-tight">Min Price</span>
                        <span className="text-[11px] font-black text-slate-700 font-mono">₹{m.minPrice}</span>
                      </div>
                      <div className="bg-emerald-50/60 p-1 rounded-xl border border-emerald-100">
                        <span className="text-[8px] font-bold text-emerald-700 uppercase block leading-tight">Modal Price</span>
                        <span className="text-[11px] font-black text-emerald-900 font-mono">₹{m.modalPrice}</span>
                      </div>
                      <div className="bg-white p-1 rounded-xl border border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block leading-tight">Max Price</span>
                        <span className="text-[11px] font-black text-slate-700 font-mono">₹{m.maxPrice}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1.5 border-t border-slate-200/70 text-[10px] text-slate-500 font-medium text-center bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span>Daily auction bulletin not reported today.</span>
                    </div>
                  )}

                  {/* Arrival & Date */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                    <span>
                      Arrival: <strong className="text-slate-800">{m.arrivalQuantity || 'Arrival data unavailable'}</strong>
                    </span>
                    <span>
                      Updated: <strong className="text-slate-800">{m.dataDate}</strong>
                    </span>
                  </div>
                </div>

                {/* 3. Official Contacts (Phone, WhatsApp or Unavailable) */}
                <div className="text-[11px] bg-white rounded-xl py-0.5">
                  {hasPhone || hasWhatsApp ? (
                    <div className="space-y-1 text-[10px] text-slate-600 font-medium">
                      {hasPhone && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Official Phone: <strong className="font-mono text-slate-800 font-bold">{officialPhone}</strong></span>
                        </div>
                      )}
                      {hasWhatsApp && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <MessageCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>Official WhatsApp: <strong className="font-mono text-emerald-700 font-bold">+{m.whatsapp}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-800 flex items-center space-x-1 font-semibold bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/60">
                      <Info className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Official contact unavailable.</span>
                    </div>
                  )}
                </div>

                {/* 4. Action Buttons: [View Details], [Call Mandi], [Open Official Website], [View on Map], [WhatsApp] */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                  {/* Top Row: [View Details] & [Open Official Website] */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedMandi(m)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2 px-2 rounded-xl flex items-center justify-center space-x-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      title="View essential details and all traded commodities"
                    >
                      <Info className="w-3 h-3" />
                      <span>View Details</span>
                    </button>

                    <a
                      href={m.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2 px-2 rounded-xl flex items-center justify-center space-x-1 border border-slate-200 active:scale-95 transition-all text-center"
                      title="Open the official government mandi/market page in Chrome"
                    >
                      <ExternalLink className="w-3 h-3 text-blue-600" />
                      <span>Open Official Website</span>
                    </a>
                  </div>

                  {/* Bottom Row: [Call Mandi], [View on Map], [WhatsApp] */}
                  <div className="flex items-center gap-1.5">
                    {/* [Call Mandi] - only if official phone exists */}
                    {hasPhone && (
                      <a
                        href={`tel:${officialPhone}`}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center space-x-1 border border-emerald-200 active:scale-95 transition-all"
                        title={`Call official market phone: ${officialPhone}`}
                      >
                        <Phone className="w-3 h-3 text-emerald-700" />
                        <span>Call Mandi</span>
                      </a>
                    )}

                    {/* [View on Map] */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center space-x-1 border border-slate-200 active:scale-95 transition-all text-center"
                      title="Open mandi location on Google Maps"
                    >
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>View on Map</span>
                    </a>

                    {/* [WhatsApp] - only if officially verified WhatsApp exists */}
                    {hasWhatsApp && (
                      <a
                        href={`https://wa.me/${m.whatsapp}?text=Hello%20${encodeURIComponent(m.market)}%20Control%20Desk,%20inquiry%20regarding%20crop%20rates.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center space-x-1 shadow-2xs active:scale-95 transition-all"
                        title={`Chat on official verified WhatsApp: +${m.whatsapp}`}
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🌟 PAGINATION CONTROLS */}
      {!loading && !error && totalPages > 1 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center justify-between text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
          >
            ← Previous
          </button>
          <span className="text-[11px] font-bold text-slate-600">
            Page {page} of {totalPages} ({totalCount} Total Mandis)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 IN-APP MANDI DETAILS MODAL (Showing ONLY Essential Information) */}
      {/* ========================================================================= */}
      {selectedMandi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedMandi(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white cursor-pointer transition-all active:scale-95"
                  title="Close"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[9px] font-black uppercase text-emerald-300 tracking-wider block">
                    e-NAM Integrated APMC Market
                  </span>
                  <h3 className="text-sm font-black truncate max-w-xs sm:max-w-sm">
                    {selectedMandi.market}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedMandi(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white cursor-pointer transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Essential Information Only */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Essential: State, District, Location */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Market Location</span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {selectedMandi.location || selectedMandi.address}
                </p>
                <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-600 font-bold">
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">District: {selectedMandi.district}</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">State: {selectedMandi.state}</span>
                </div>
              </div>

              {/* Essential: Commodities & Price Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Commodities & Price Information</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    Last updated: {selectedMandi.dataDate}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedMandi.commodities && selectedMandi.commodities.length > 0 ? (
                    selectedMandi.commodities.map((item, idx) => {
                      const commName = typeof item === 'string' ? item : item.commodity;
                      const hasPrice = item && typeof item !== 'string' && item.modalPrice;

                      return (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-slate-800">{commName}</span>
                              {typeof item !== 'string' && item.variety && (
                                <span className="text-[10px] text-slate-500 font-medium block">Variety: {item.variety}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Current Price</span>
                              {hasPrice ? (
                                <span className="text-sm font-black text-emerald-900 font-mono block">
                                  ₹{item.modalPrice.toLocaleString('en-IN')} {item.unit || '₹ / Quintal'}
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">
                                  Price data unavailable
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Min, Max, Modal & Arrival if live price available */}
                          {hasPrice ? (
                            <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl text-center">
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase block">Min Price</span>
                                <span className="text-[11px] font-bold text-slate-700 font-mono">₹{item.minPrice}</span>
                              </div>
                              <div className="bg-emerald-50 rounded-lg py-0.5 border border-emerald-100">
                                <span className="text-[8px] font-bold text-emerald-700 uppercase block">Modal Price</span>
                                <span className="text-[11px] font-black text-emerald-900 font-mono">₹{item.modalPrice}</span>
                              </div>
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase block">Max Price</span>
                                <span className="text-[11px] font-bold text-slate-700 font-mono">₹{item.maxPrice}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-2 rounded-xl text-center text-[10px] text-slate-500">
                              Daily auction price not synchronized today.
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                            <span>
                              Arrival Quantity: <strong className="text-slate-700">{item.arrivalQuantity || 'Arrival data unavailable'}</strong>
                            </span>
                            <span>Date: <strong className="text-slate-700">{item.date || selectedMandi.dataDate}</strong></span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                      {selectedMandi.primaryCommodity} - Price data unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* Essential: Official Contacts (Phone / WhatsApp or Unavailable) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Official Market Contact</span>
                </h4>

                {selectedMandi.phone || selectedMandi.mobile || selectedMandi.whatsapp ? (
                  <div className="space-y-1.5">
                    {selectedMandi.phone && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Official Phone</span>
                          <span className="font-mono font-bold text-slate-800">{selectedMandi.phone}</span>
                        </div>
                        <a
                          href={`tel:${selectedMandi.phone}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Mandi</span>
                        </a>
                      </div>
                    )}

                    {selectedMandi.mobile && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Official Mobile</span>
                          <span className="font-mono font-bold text-slate-800">{selectedMandi.mobile}</span>
                        </div>
                        <a
                          href={`tel:${selectedMandi.mobile}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Mandi</span>
                        </a>
                      </div>
                    )}

                    {selectedMandi.whatsapp && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-emerald-100">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-700 uppercase block">Official Verified WhatsApp</span>
                          <span className="font-mono font-bold text-emerald-950">+{selectedMandi.whatsapp}</span>
                        </div>
                        <a
                          href={`https://wa.me/${selectedMandi.whatsapp}?text=Hello%20${encodeURIComponent(selectedMandi.market)}%20Desk,%20inquiry%20regarding%20crop%20rates.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-bold">Official contact unavailable.</span>
                  </div>
                )}
              </div>

              {/* Source Attribution */}
              <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 text-[11px] text-blue-900 flex items-start space-x-2">
                <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Official Source: {selectedMandi.source}. Regulated by Ministry of Agriculture & Farmers Welfare, Government of India. For full trade circulars, open the official portal below.
                </p>
              </div>
            </div>

            {/* Modal Bottom Action Bar:
                [Call Mandi] - only if official phone exists
                [WhatsApp] - only if officially verified WhatsApp exists
                [View on Map]
                [Open Official Website]
            */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* [Call Mandi] */}
                {(selectedMandi.phone || selectedMandi.mobile) && (
                  <a
                    href={`tel:${selectedMandi.phone || selectedMandi.mobile}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center space-x-1 shadow-2xs active:scale-95 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Mandi</span>
                  </a>
                )}

                {/* [WhatsApp] */}
                {selectedMandi.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedMandi.whatsapp}?text=Hello%20${encodeURIComponent(selectedMandi.market)}%20Desk,%20inquiry%20regarding%20crop%20rates.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center space-x-1 shadow-2xs active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {/* [View on Map] */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedMandi.location ? `${selectedMandi.location}, ${selectedMandi.district}, ${selectedMandi.state}` : `${selectedMandi.market}, ${selectedMandi.district}, ${selectedMandi.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="Open location on Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View on Map</span>
                </a>

                {/* [Open Official Website] */}
                <a
                  href={selectedMandi.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-2xs text-center"
                  title="Open official government mandi/market page in Chrome"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open Official Website</span>
                </a>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedMandi(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
