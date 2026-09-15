import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  Truck,
  Tractor,
  TrendingUp,
  TrendingDown,
  Tag,
  X,
  ChevronRight,
  Calendar,
  Clock,
  Sparkles,
  Package,
  Check,
  Info,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  Navigation
} from 'lucide-react';
import { ProductItem, CropPrice, LanguageCode, TranslationSet } from '../types';
import { MOCK_CROP_PRICES } from '../data';

export interface MachineryItem {
  id: string;
  name: string;
  category: 'Tractor' | 'Harvester' | 'Implement' | 'Irrigation';
  image: string;
  rentalPrice: string;
  location: string;
  availability: 'Available Now' | 'Booked Today' | 'Available Tomorrow';
  ownerName: string;
  ownerPhone: string;
  specs: string;
}

export interface LogisticsOption {
  id: string;
  carrierName: string;
  vehicleType: string;
  capacity: string;
  pricePerKm: string;
  location: string;
  eta: string;
  phone: string;
  image: string;
}

export const MOCK_MACHINERY: MachineryItem[] = [
  {
    id: 'm1',
    name: 'John Deere 5050D Tractor (50 HP)',
    category: 'Tractor',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=400',
    rentalPrice: '₹800 / hour',
    location: 'Chikkaballapura Hub',
    availability: 'Available Now',
    ownerName: 'Shankar Gowda',
    ownerPhone: '+919876543210',
    specs: 'Dual clutch, Power steering, Rotavator hook ready'
  },
  {
    id: 'm2',
    name: 'Kubota Crawler Sugarcane Harvester',
    category: 'Harvester',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400',
    rentalPrice: '₹2,500 / acre',
    location: 'Mandya Coop Pool',
    availability: 'Available Now',
    ownerName: 'Mandya Farmers Society',
    ownerPhone: '+919845012345',
    specs: 'Self-propelled, 98% clean stalk recovery'
  },
  {
    id: 'm3',
    name: 'Multi-Crop Thresher & Paddy Cleaner',
    category: 'Implement',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
    rentalPrice: '₹600 / hour',
    location: 'Dharwad Rural Center',
    availability: 'Available Tomorrow',
    ownerName: 'Basavaraj Patil',
    ownerPhone: '+919731234567',
    specs: 'Diesel Engine driven, high grain output'
  },
  {
    id: 'm4',
    name: 'Heavy Duty 5-Rotor Rotavator',
    category: 'Implement',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=400',
    rentalPrice: '₹450 / hour',
    location: 'Kolar District Pool',
    availability: 'Available Now',
    ownerName: 'Kolar Agro Machinery',
    ownerPhone: '+919448098765',
    specs: 'Boron steel blades, soil pulverization ready'
  }
];

export const MOCK_LOGISTICS: LogisticsOption[] = [
  {
    id: 'l1',
    carrierName: 'Kaveri Agri Flatbed Logistics',
    vehicleType: 'Eicher 14ft Open Truck',
    capacity: 'Up to 5.5 Tonnes',
    pricePerKm: '₹18 / km',
    location: 'Chikkaballapura to Kolar APMC',
    eta: '30 mins away',
    phone: '+919900112233',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l2',
    carrierName: 'Karnataka Express Produce Pickup',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    capacity: '1.5 Tonnes (Vegetable Crate Ready)',
    pricePerKm: '₹14 / km',
    location: 'Mandya to Bengaluru APMC',
    eta: '15 mins away',
    phone: '+919888776655',
    image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l3',
    carrierName: 'Chilly Cold Chain Reefer Express',
    vehicleType: 'Refrigerated Cold Container',
    capacity: '3.0 Tonnes (Temp controlled 4°C)',
    pricePerKm: '₹24 / km',
    location: 'Dharwad to Goa Market',
    eta: 'Available on Booking',
    phone: '+919777665544',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400'
  }
];

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface MarketplaceTabViewProps {
  products: ProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'seeds' | 'fertilizer' | 'produce'>('all');
  const [activeMarketSection, setActiveMarketSection] = useState<'buy' | 'sell' | 'rent' | 'logistics'>('buy');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Detail modals state
  const [selectedPriceDetail, setSelectedPriceDetail] = useState<CropPrice | null>(null);
  const [rentingItem, setRentingItem] = useState<MachineryItem | null>(null);
  const [rentHours, setRentHours] = useState('4');
  const [rentDeliveryLocation, setRentDeliveryLocation] = useState('Anemadagu Village, KA');

  // Logistics booking state
  const [bookingLogistics, setBookingLogistics] = useState<LogisticsOption | null>(null);
  const [pickupAddr, setPickupAddr] = useState('Farm Gate, Chikkaballapura');
  const [dropMandi, setDropMandi] = useState('Yeshwanthpur APMC Mandi, Bengaluru');
  const [cargoWeight, setCargoWeight] = useState('2.5 Tonnes');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [activeTrackingResult, setActiveTrackingResult] = useState<string | null>(null);

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
                ? 'ನೇರ ಖರೀದಿ, ಉಪಕರಣ ಬಾಡಿಗೆ ಮತ್ತು ಮಂಡಿ ರವಾನೆ'
                : 'Direct harvest trades, machinery hire & APMC logistics'}
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
                ? 'ಬೆಳೆಗಳು, ಬೀಜಗಳು, ಉಪಕರಣಗಳನ್ನು ಹುಡುಕಿ...'
                : t.marketplace.searchPlaceholder || 'Search crops, seeds, or equipment...'
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
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${
            activeMarketSection === 'buy'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeMarketSection === 'buy' ? 'bg-emerald-700/80 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Tag className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Buy Crops</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${
                activeMarketSection === 'buy' ? 'text-emerald-200' : 'text-slate-500'
              }`}
            >
              Fresh produce & seeds
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
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${
            showSellForm || activeMarketSection === 'sell'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              showSellForm || activeMarketSection === 'sell'
                ? 'bg-emerald-700/80 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Sell Crops</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${
                showSellForm || activeMarketSection === 'sell' ? 'text-emerald-200' : 'text-slate-500'
              }`}
            >
              Post harvest offer
            </p>
          </div>
        </button>

        {/* Action 3: Machinery Rental */}
        <button
          onClick={() => {
            setActiveMarketSection('rent');
            const el = document.getElementById('machinery_rental_section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            triggerToast('Viewing equipment & machinery rentals');
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${
            activeMarketSection === 'rent'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeMarketSection === 'rent' ? 'bg-emerald-700/80 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Tractor className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Machinery Rental</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${
                activeMarketSection === 'rent' ? 'text-emerald-200' : 'text-slate-500'
              }`}
            >
              Tractors & Harvesters
            </p>
          </div>
        </button>

        {/* Action 4: Logistics */}
        <button
          onClick={() => {
            setActiveMarketSection('logistics');
            const el = document.getElementById('logistics_section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            triggerToast('Opened APMC mandi transport booking');
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 cursor-pointer shadow-sm ${
            activeMarketSection === 'logistics'
              ? 'bg-emerald-800 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-100 hover:border-emerald-200'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeMarketSection === 'logistics' ? 'bg-emerald-700/80 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black leading-tight">Logistics</h4>
            <p
              className={`text-[9px] font-medium mt-0.5 truncate ${
                activeMarketSection === 'logistics' ? 'text-emerald-200' : 'text-slate-500'
              }`}
            >
              Trucks & Cold Vans
            </p>
          </div>
        </button>
      </div>

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
      <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-3xl border border-slate-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {currentLang === 'kn' ? 'ಮಂಡಿ ಬೆಲೆ ಸೂಚ್ಯಂಕ' : 'APMC Live Market Prices'}
            </h3>
          </div>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase">
            Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {MOCK_CROP_PRICES.map((crop) => {
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
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center shrink-0 ${
                        isUp
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
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('produce')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
              selectedCategoryFilter === 'produce'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Fresh Produce
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('seeds')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
              selectedCategoryFilter === 'seeds'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Seeds & Grains
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('fertilizer')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
              selectedCategoryFilter === 'fertilizer'
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
                    onClick={(e) => {
                      e.preventDefault();
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
                      setSelectedPredictedCrop(MOCK_CROP_PRICES[0]);
                      triggerCropPredictionInsight(MOCK_CROP_PRICES[0]);
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

      {/* 5. MACHINERY RENTAL */}
      <div id="machinery_rental_section" className="space-y-3 pt-2 scroll-mt-20">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Tractor className="w-4 h-4 text-emerald-700" />
              <span>Machinery & Equipment Rental</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Book tractors, harvesters & implements near your farm
            </p>
          </div>

          <span className="text-[9px] bg-yellow-100 text-yellow-800 font-black px-2 py-0.5 rounded-full uppercase">
            4 Machines Ready
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {MOCK_MACHINERY.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-lg p-3.5 space-y-3 transition-all hover:border-emerald-200"
            >
              <div className="flex space-x-3">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                  <img
                    referrerPolicy="no-referrer"
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        item.availability === 'Available Now'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {item.availability}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {item.name}
                  </h4>

                  <p className="text-[9px] text-slate-400 font-bold flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{item.location}</span>
                  </p>

                  <p className="text-[9px] text-slate-500 font-semibold italic truncate">
                    {item.specs}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Rate</span>
                  <span className="text-xs font-black text-emerald-850 font-mono">
                    {item.rentalPrice}
                  </span>
                </div>

                <div className="flex space-x-1.5">
                  <a
                    href={`tel:${item.ownerPhone}`}
                    onClick={(e) => {
                      e.preventDefault();
                      triggerToast(`Dialing machine owner ${item.ownerName}...`);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                    title="Call Owner"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      setRentingItem(item);
                      triggerToast(`Initiating rental booking for ${item.name}`);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Tractor className="w-3.5 h-3.5" />
                    <span>Rent Now</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. LOGISTICS & TRANSPORT */}
      <div id="logistics_section" className="space-y-3 pt-2 scroll-mt-20">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>APMC Transport & Logistics</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Consolidated trucks, Maxi autos & refrigerated carriers
            </p>
          </div>

          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase">
            3 Logistics Partners
          </span>
        </div>

        {/* Live Trucking Options */}
        <div className="space-y-3">
          {MOCK_LOGISTICS.map((truck) => (
            <div
              key={truck.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-md p-3.5 space-y-3"
            >
              <div className="flex space-x-3 items-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                  <img
                    referrerPolicy="no-referrer"
                    src={truck.image}
                    alt={truck.vehicleType}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] bg-teal-50 text-teal-800 font-black px-2 py-0.5 rounded uppercase">
                      {truck.vehicleType}
                    </span>
                    <span className="text-[8px] text-emerald-700 font-extrabold">
                      {truck.eta}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {truck.carrierName}
                  </h4>

                  <p className="text-[9px] text-slate-500 font-semibold flex items-center space-x-1">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span>Capacity: {truck.capacity}</span>
                  </p>

                  <p className="text-[9px] text-slate-400 font-bold flex items-center space-x-1">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>Route: {truck.location}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Rate</span>
                  <span className="text-xs font-black text-emerald-850 font-mono">
                    {truck.pricePerKm}
                  </span>
                </div>

                <div className="flex space-x-1.5">
                  <a
                    href={`tel:${truck.phone}`}
                    onClick={(e) => {
                      e.preventDefault();
                      triggerToast(`Connecting call to driver (${truck.carrierName})...`);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      setBookingLogistics(truck);
                      triggerToast(`Opening transport booking for ${truck.carrierName}`);
                    }}
                    className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Book Carrier</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Waybill Tracking Tool */}
        <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white p-4 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h4 className="text-xs font-black tracking-wider uppercase text-emerald-300">
              Track Harvest Consignment
            </h4>
          </div>

          <p className="text-[10px] text-emerald-100 font-medium">
            Enter AgriVerse Waybill / Trucking ID to check live position & APMC gate entry
          </p>

          <div className="flex space-x-2">
            <input
              type="text"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
              placeholder="E.g., AGRI-LOG-8842"
              className="flex-1 bg-white/10 text-white placeholder:text-emerald-300/60 text-xs font-mono font-bold px-3 py-2 rounded-xl outline-none border border-white/20 focus:border-emerald-400"
            />
            <button
              onClick={() => {
                if (!trackingIdInput.trim()) {
                  setActiveTrackingResult(
                    '🚛 Waybill AGRI-LOG-8842: Driver M. Ramesh (Bolero Maxi). Location: 12 km from Yeshwanthpur APMC. Estimated Arrival: 25 mins.'
                  );
                  setTrackingIdInput('AGRI-LOG-8842');
                  triggerToast('Loaded sample tracking ID AGRI-LOG-8842');
                } else {
                  setActiveTrackingResult(
                    `🚛 Waybill ${trackingIdInput.toUpperCase()}: Vehicle in transit on NH-44. GPS Speed: 42 km/h. Temp inside container: 5°C. Arrival on schedule.`
                  );
                  triggerToast(`Locating consignment ID: ${trackingIdInput}`);
                }
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xs rounded-xl cursor-pointer transition-all shrink-0"
            >
              Track
            </button>
          </div>

          {activeTrackingResult && (
            <div className="p-3 bg-white/10 rounded-2xl border border-emerald-400/30 text-xs font-medium leading-relaxed text-emerald-100 animate-fadeIn space-y-1">
              <span className="text-[9px] font-black uppercase text-emerald-300 block">
                Live GPS Carrier Report:
              </span>
              <p>{activeTrackingResult}</p>
            </div>
          )}
        </div>
      </div>

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
                    Add seeds, fertilizers or produce to place direct orders
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
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
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    triggerToast('Order request placed successfully! Sellers notified.');
                    setCart([]);
                    setIsCartOpen(false);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  Confirm Order ({cartItemCount} Items)
                </button>
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

      {/* --- MODAL 2: MACHINERY RENTAL BOOKING --- */}
      {rentingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl border border-emerald-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded uppercase">
                  Equipment Lease Request
                </span>
                <h3 className="text-xs font-black text-slate-800 mt-1">
                  {rentingItem.name}
                </h3>
              </div>
              <button
                onClick={() => setRentingItem(null)}
                className="p-1 bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[10px] text-slate-500">
                Owner: <span className="font-bold text-slate-800">{rentingItem.ownerName}</span> ({rentingItem.location})
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Duration Needed
                </label>
                <select
                  value={rentHours}
                  onChange={(e) => setRentHours(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="2">2 Hours (Quick tilling)</option>
                  <option value="4">4 Hours (Half Day)</option>
                  <option value="8">8 Hours (Full Day)</option>
                  <option value="24">24 Hours (Full Lease)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Delivery Field Location
                </label>
                <input
                  type="text"
                  value={rentDeliveryLocation}
                  onChange={(e) => setRentDeliveryLocation(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl text-[10px] text-emerald-900 font-medium">
                💰 Rate: <span className="font-bold">{rentingItem.rentalPrice}</span>. Fuel & operator included.
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setRentingItem(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerToast(`Rental request for ${rentingItem.name} sent to ${rentingItem.ownerName}!`);
                  setRentingItem(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md hover:bg-emerald-700"
              >
                Confirm Lease
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: LOGISTICS BOOKING --- */}
      {bookingLogistics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl border border-teal-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <span className="text-[8px] bg-teal-100 text-teal-800 font-black px-2 py-0.5 rounded uppercase">
                  APMC Carrier Dispatch
                </span>
                <h3 className="text-xs font-black text-slate-800 mt-1">
                  {bookingLogistics.carrierName}
                </h3>
              </div>
              <button
                onClick={() => setBookingLogistics(null)}
                className="p-1 bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Pickup Farm Address
                </label>
                <input
                  type="text"
                  value={pickupAddr}
                  onChange={(e) => setPickupAddr(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Destination APMC Mandi
                </label>
                <input
                  type="text"
                  value={dropMandi}
                  onChange={(e) => setDropMandi(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Cargo Weight
                </label>
                <input
                  type="text"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="bg-teal-50 p-2.5 rounded-xl text-[10px] text-teal-900 font-medium">
                🚚 Carrier: <span className="font-bold">{bookingLogistics.vehicleType}</span> ({bookingLogistics.pricePerKm})
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setBookingLogistics(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerToast(`Transport carrier booked! Waybill generated: AGRI-LOG-8842.`);
                  setBookingLogistics(null);
                }}
                className="flex-1 py-2.5 bg-teal-800 text-white font-black text-xs rounded-xl shadow-md hover:bg-teal-900"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
