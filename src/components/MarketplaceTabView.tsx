import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Tag,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ProductItem, CropPrice, LanguageCode, TranslationSet } from '../types';
import { MOCK_CROP_PRICES } from '../data';
import { MandiMarketsView } from './MandiMarketsView';

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface MarketplaceTabViewProps {
  products: ProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  mandiPricesList?: CropPrice[];
  showSellForm: boolean;
  setShowSellForm: (show: boolean) => void;
  newCropName: string;
  setNewCropName: (val: string) => void;
  newCropPrice: string;
  setNewCropPrice: (val: string) => void;
  newCropQty: string;
  setNewCropQty: (val: string) => void;
  newCropLocation: string;
  setNewCropLocation: (val: string) => void;
  selectedProductImage: string | null;
  setSelectedProductImage: (val: string | null) => void;
  hiddenProductImageInputRef: React.RefObject<HTMLInputElement>;
  handleImageConversion: (e: React.ChangeEvent<HTMLInputElement>, type: 'post' | 'product') => void;
  handleHostMarketSale: (e: React.FormEvent) => Promise<void>;
  isJoined: boolean;
  userPhone: string;
  t: TranslationSet;
  currentLang: LanguageCode;
  triggerToast: (msg: string) => void;
  setActiveTab: (tab: 'home' | 'community' | 'marketplace' | 'assistant' | 'profile') => void;
  setSelectedPredictedCrop: (crop: CropPrice) => void;
  triggerCropPredictionInsight: (crop: CropPrice) => void;
}

export const MarketplaceTabView: React.FC<MarketplaceTabViewProps> = ({
  products,
  mandiPricesList,
  showSellForm,
  setShowSellForm,
  newCropName,
  setNewCropName,
  newCropPrice,
  setNewCropPrice,
  newCropQty,
  setNewCropQty,
  newCropLocation,
  setNewCropLocation,
  selectedProductImage,
  hiddenProductImageInputRef,
  handleImageConversion,
  handleHostMarketSale,
  isJoined,
  t,
  currentLang,
  triggerToast,
  setActiveTab,
  setSelectedPredictedCrop,
  triggerCropPredictionInsight
}) => {
  const displayedPrices = (mandiPricesList && mandiPricesList.length > 0) ? mandiPricesList : MOCK_CROP_PRICES;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'seeds' | 'fertilizer' | 'produce'>('all');
  const [activeMarketSection, setActiveMarketSection] = useState<'buy' | 'sell' | 'mandi'>('buy');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Detail modals state
  const [selectedPriceDetail, setSelectedPriceDetail] = useState<CropPrice | null>(null);

  // Add to cart helper
  const handleAddToCart = (product: ProductItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        triggerToast(`Updated ${product.title} in cart (${existing.quantity + 1})`);
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        triggerToast(`Added ${product.title} to your farm cart 🛒`);
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategoryFilter === 'all') return true;
    if (selectedCategoryFilter === 'seeds') return p.title.toLowerCase().includes('seed');
    if (selectedCategoryFilter === 'fertilizer')
      return p.title.toLowerCase().includes('fertilizer') || p.title.toLowerCase().includes('dung');
    if (selectedCategoryFilter === 'produce')
      return (
        !p.title.toLowerCase().includes('seed') &&
        !p.title.toLowerCase().includes('fertilizer')
      );
    return true;
  });

  // Calculate cart total
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div id="v_marketplace_bazaar" className="p-3 pb-24 space-y-4 animate-fadeIn max-w-xl mx-auto font-sans">

      {/* 1. HEADER */}
      <div className="bg-gradient-to-r from-emerald-850 to-teal-900 text-white p-4 rounded-3xl shadow-lg border border-emerald-500/20 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl">🏪</span>
              <h2 className="text-lg font-black tracking-tight text-white">
                {t.marketplace.title || 'Marketplace'}
              </h2>
            </div>
            <p className="text-[11px] font-medium text-emerald-200 leading-tight mt-0.5">
              {currentLang === 'kn'
                ? 'ರೈತರ ನೇರ ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಮಂಡಿ ದರ ಸೂಚ್ಯಂಕ'
                : 'Direct farm produce trades & live APMC mandi prices'}
            </p>
          </div>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl border border-white/20 transition-all cursor-pointer"
            title="Farm Cart"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full border-2 border-emerald-900 shadow-sm animate-pulse">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Products/Crops Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentLang === 'kn'
                ? 'ಬೆಳೆಗಳು, ಬೀಜಗಳು, ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...'
                : t.marketplace.searchPlaceholder || 'Search crops, seeds, or produce...'
            }
            className="w-full bg-white text-slate-800 placeholder:text-slate-400 text-xs font-semibold pl-10 pr-9 py-2.5 rounded-2xl outline-none shadow-inner border border-emerald-100/30 focus:ring-2 focus:ring-emerald-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MARKETPLACE QUICK ACTIONS (Clean 2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Action 1: Buy Crops */}
        <button
          onClick={() => {
            setActiveMarketSection('buy');
            setSelectedCategoryFilter('all');
            const el = document.getElementById('market_listings_section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            triggerToast('Browsing direct farm crops & inputs listing');
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${activeMarketSection === 'buy'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
            }`}
        >
          <div
            className={`p-2.5 rounded-xl ${activeMarketSection === 'buy' ? 'bg-emerald-700/80 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
          >
            <Tag className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Buy Produce</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${activeMarketSection === 'buy' ? 'text-emerald-200' : 'text-slate-500'
                }`}
            >
              Crops & Seeds
            </p>
          </div>
        </button>

        {/* Action 2: Sell Crops */}
        <button
          onClick={() => {
            setActiveMarketSection('sell');
            setShowSellForm(true);
            const el = document.getElementById('post_harvest_sell_form');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            triggerToast('Opening harvest listing form');
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${showSellForm || activeMarketSection === 'sell'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
            }`}
        >
          <div
            className={`p-2.5 rounded-xl ${showSellForm || activeMarketSection === 'sell'
                ? 'bg-emerald-700/80 text-white'
                : 'bg-emerald-100 text-emerald-800'
              }`}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Sell Harvest</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${showSellForm || activeMarketSection === 'sell' ? 'text-emerald-200' : 'text-slate-500'
                }`}
            >
              List farm offer
            </p>
          </div>
        </button>

        {/* Action 3: APMC Mandi Rates */}
        <button
          onClick={() => {
            setActiveMarketSection('mandi');
            triggerToast('Viewing live APMC mandi prices');
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${activeMarketSection === 'mandi'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
            }`}
        >
          <div
            className={`p-2.5 rounded-xl ${activeMarketSection === 'mandi' ? 'bg-emerald-700/80 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Mandi Rates</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${activeMarketSection === 'mandi' ? 'text-emerald-200' : 'text-slate-500'
                }`}
            >
              Live APMC prices
            </p>
          </div>
        </button>

        {/* Action 4: Cart & Orders */}
        <button
          onClick={() => {
            setIsCartOpen(true);
            triggerToast('Viewing farm cart and direct orders');
          }}
          className="p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200"
        >
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 relative">
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                {cartItemCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Farm Cart</h4>
            <p className="text-[9px] font-medium mt-0.5 truncate text-slate-500">
              {cartItemCount > 0 ? `${cartItemCount} item(s) selected` : 'Review orders'}
            </p>
          </div>
        </button>
      </div>

      {/* 🌟 APMC MANDI RATES VIEW (Comprehensive Experience) */}
      {activeMarketSection === 'mandi' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <button
              onClick={() => {
                setActiveMarketSection('buy');
                triggerToast('Back to Marketplace Produce');
              }}
              className="text-xs font-bold text-slate-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
            >
              <span>← Back to Farm Produce</span>
            </button>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              AGMARKNET Data
            </span>
          </div>

          <MandiMarketsView
            currentLang={currentLang}
            triggerToast={triggerToast}
          />
        </div>
      )}

      {activeMarketSection !== 'mandi' && (
        <>
          {/* SELL REGISTRATION FORM (Post Harvest) */}
          {showSellForm && (
        <form
          id="post_harvest_sell_form"
          onSubmit={handleHostMarketSale}
          className="bg-white rounded-3xl border-2 border-emerald-600 p-4 space-y-3.5 shadow-xl animate-fadeIn scroll-mt-20"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Plus className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                  {t.marketplace.sellTitle || 'List Your Harvest'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {t.marketplace.sellDescription || 'Fill details to get direct buyers'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSellForm(false)}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                {t.marketplace.cropName || 'Crop name'} *
              </label>
              <input
                type="text"
                required
                value={newCropName}
                onChange={(e) => setNewCropName(e.target.value)}
                placeholder="E.g., Tomato (Organic F1 Hybrid), Basmati rice..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  {t.marketplace.price || 'Expected Price (₹)'} *
                </label>
                <input
                  type="text"
                  required
                  value={newCropPrice}
                  onChange={(e) => setNewCropPrice(e.target.value.replace(/\D/g, ''))}
                  placeholder="Price per Kg/Quintal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  {t.marketplace.quantity || 'Quantity'}
                </label>
                <input
                  type="text"
                  value={newCropQty}
                  onChange={(e) => setNewCropQty(e.target.value)}
                  placeholder="E.g., 50 Bags / 2 Tonnes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                District Location
              </label>
              <input
                type="text"
                value={newCropLocation}
                onChange={(e) => setNewCropLocation(e.target.value)}
                placeholder="E.g., Anemadagu Village, Chikkaballapura"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                {t.marketplace.imageUpload || 'Add harvest photo'}
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => hiddenProductImageInputRef.current?.click()}
                  className="p-2.5 border border-dashed border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold bg-emerald-50/50 hover:bg-emerald-100 transition-all flex items-center space-x-1"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Choose Harvest Photo</span>
                </button>
                {selectedProductImage && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-lg">
                    Photo Loaded ✓
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={hiddenProductImageInputRef}
                className="hidden"
                onChange={(e) => handleImageConversion(e, 'product')}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-200/50 transition-all cursor-pointer"
          >
            {t.marketplace.submitOffer || 'List Harvest for Sale'}
          </button>
        </form>
      )}

      {/* 3. MARKET PRICES (Compact Cards) */}
      <div id="apmc_prices_section" className="space-y-2.5 bg-slate-50 p-3.5 rounded-3xl border border-slate-100 scroll-mt-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {currentLang === 'kn' ? 'ಮಂಡಿ ಬೆಲೆ ಸೂಚ್ಯಂಕ' : 'APMC Live Market Prices'}
            </h3>
          </div>
          <button
            onClick={() => {
              setActiveMarketSection('mandi');
              triggerToast('Exploring all official APMC mandis');
            }}
            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-0.5 shadow-2xs"
          >
            <span>All Mandis</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {displayedPrices.map((crop) => {
            const isUp = crop.trend === 'up';
            const isDown = crop.trend === 'down';

            return (
              <div
                key={crop.id}
                className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-slate-800 leading-tight">
                      {crop.name}
                    </h4>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center shrink-0 ${isUp
                          ? 'bg-emerald-50 text-emerald-700'
                          : isDown
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {isUp && <TrendingUp className="w-3 h-3 mr-0.5" />}
                      {isDown && <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {crop.change || 'Stable'}
                    </span>
                  </div>

                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    📍 {crop.mandi || 'Karnataka APMC Mandi'}
                  </p>
                </div>

                <div className="pt-1 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Price</span>
                    <span className="text-xs font-extrabold text-emerald-900 font-mono">
                      {crop.price}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPriceDetail(crop);
                      triggerToast(`Inspecting market trend analysis for ${crop.name}`);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-extrabold px-2 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-0.5"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PRODUCTS / LISTINGS */}
      <div id="market_listings_section" className="space-y-3 scroll-mt-20">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1">
              <span>🌾</span>
              <span>Available Farm Crops & Seed Listings</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Direct from verified partner farmers & mandis
            </p>
          </div>

          <span className="text-[10px] font-bold text-slate-500">
            {filteredProducts.length} items
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${selectedCategoryFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('produce')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${selectedCategoryFilter === 'produce'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            Fresh Produce
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('seeds')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${selectedCategoryFilter === 'seeds'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            Seeds & Grains
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('fertilizer')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${selectedCategoryFilter === 'fertilizer'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            Organic Fertilizers
          </button>
        </div>

        {/* Products Grid */}
        <div className="space-y-3.5">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/60 overflow-hidden flex flex-col transition-all hover:border-emerald-200"
            >
              <div className="relative h-40 bg-slate-100">
                <img
                  referrerPolicy="no-referrer"
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 bg-black/60 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  {item.quantity}
                </span>

                {item.isVerified && (
                  <span className="absolute bottom-2.5 right-2.5 bg-emerald-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center shadow-md">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>Verified Mandi Partner</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-2.5">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.location}</span>
                    </p>

                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      Seller: {item.seller}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-800 truncate mt-1">
                    {item.title}
                  </h4>
                </div>

                <div className="flex justify-between items-baseline py-1 border-y border-slate-50">
                  <span className="text-xs text-slate-400 font-bold">Price</span>
                  <span className="text-base font-black text-emerald-850 font-mono">
                    {item.price}
                  </span>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex space-x-2 pt-0.5">
                  <a
                    href={`tel:${item.phone}`}
                    onClick={() => {
                      triggerToast(`Connecting telephone call to seller (${item.seller})...`);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-100 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.marketplace.buyNow || 'Call Seller'}</span>
                  </a>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerToast(`Checking APMC price metrics for ${item.title}...`);
                      setActiveTab('home');
                      setSelectedPredictedCrop(displayedPrices[0]);
                      triggerCropPredictionInsight(displayedPrices[0]);
                    }}
                    className="px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
                    title="Price Audit AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Price Audit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )}

      {/* --- SLIDE-OVER MODAL: CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full flex flex-col p-4 space-y-4 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-800">Your Farm Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Your cart is empty</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Add seeds, fertilizers or produce to contact sellers directly
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const cleanPhone = (item.product.phone || '').replace(/[^0-9]/g, '');
                  const waText = encodeURIComponent(
                    `Namaste! I would like to purchase ${item.quantity} unit(s) of ${item.product.title} (${item.product.price}) listed on AgriVerse.`
                  );
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="text-xs font-black text-slate-800 line-clamp-1">
                              {item.product.title}
                            </h4>
                            <p className="text-[10px] text-emerald-800 font-extrabold font-mono">
                              {item.product.price}
                            </p>
                            <p className="text-[9px] text-slate-500 font-semibold">
                              Seller: {item.product.seller}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border">
                            Qty: {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              setCart((prev) =>
                                prev.filter((i) => i.product.id !== item.product.id)
                              )
                            }
                            className="text-red-500 text-xs font-bold p-1 hover:bg-red-50 rounded"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                        {item.product.phone && (
                          <a
                            href={`tel:${item.product.phone}`}
                            onClick={() => triggerToast(`Dialing ${item.product.seller}...`)}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Seller</span>
                          </a>
                        )}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => triggerToast(`Opening WhatsApp chat with ${item.product.seller}...`)}
                            className="flex-1 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1"
                          >
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] text-slate-500 text-center font-medium">
                  Connect directly with verified farmers to finalize pricing & gate delivery.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCart([]);
                      triggerToast('Farm cart cleared');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      triggerToast('Connecting to seller contacts');
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 1: PRICE DETAILS & AI ANALYSIS --- */}
      {selectedPriceDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl border border-emerald-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded uppercase">
                  Mandi Trend Analytics
                </span>
                <h3 className="text-sm font-black text-slate-800 mt-1">
                  {selectedPriceDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPriceDetail(null)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[9px] font-bold text-emerald-800 uppercase block">Current APMC Price</span>
                <p className="text-base font-black text-emerald-900 font-mono">
                  {selectedPriceDetail.price}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Trend: {selectedPriceDetail.change}
                </span>
              </div>

              {selectedPriceDetail.nextSeasonPredicted && (
                <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 space-y-1">
                  <span className="text-[9px] font-black text-indigo-800 uppercase flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gemini AI 30-Day Forecast:</span>
                  </span>
                  <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                    {selectedPriceDetail.nextSeasonPredicted}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setSelectedPriceDetail(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const cropToPredict = selectedPriceDetail;
                  setSelectedPriceDetail(null);
                  setActiveTab('home');
                  setSelectedPredictedCrop(cropToPredict);
                  triggerCropPredictionInsight(cropToPredict);
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md hover:bg-emerald-700"
              >
                Full AI Advisory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
