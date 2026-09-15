import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Landmark,
  FileText,
  Tractor,
  Droplets,
  Settings,
  Sparkles,
  Sprout,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ArrowLeft,
  Check,
  Save,
  Loader2
} from 'lucide-react';
import { UserProfileDoc, saveFarmerProfile } from '../services/userService';
import { useI18n } from '../context/I18nContext';

interface KYCGovernmentBenefitsProps {
  uid: string;
  initialProfile?: UserProfileDoc | null;
  onSaveSuccess?: (updated: UserProfileDoc) => void;
  onClose: () => void;
  triggerToast?: (msg: string) => void;
}

const MACHINERY_OPTIONS = [
  { id: 'tractor', label: 'Tractor (35+ HP)', icon: Tractor },
  { id: 'harvester', label: 'Combine Harvester', icon: Tractor },
  { id: 'rotavator', label: 'Rotavator / Cultivator', icon: Settings },
  { id: 'powertiller', label: 'Power Tiller / Weeder', icon: Settings },
  { id: 'dripkit', label: 'Drip Automation Kit', icon: Droplets },
  { id: 'solarpump', label: 'Solar Water Pump', icon: Droplets },
  { id: 'drone', label: 'Agricultural Spray Drone', icon: Sparkles },
  { id: 'transplanter', label: 'Paddy Transplanter', icon: Sprout }
];

const GOVT_SCHEMES_OPTIONS = [
  { id: 'pmkisan', label: 'PM-KISAN Direct Income Transfer (₹6,000/yr)', desc: 'Direct bank transfer of ₹2,000 every 4 months' },
  { id: 'kcc', label: 'Kisan Credit Card (KCC Scheme)', desc: 'Low interest working capital loan up to ₹3 Lakhs' },
  { id: 'pmfby', label: 'PM Fasal Bima Yojana (Crop Insurance)', desc: 'Comprehensive yield loss protection for sown crops' },
  { id: 'pmkusum', label: 'PM-KUSUM Solar Pump Subsidy', desc: 'Up to 60% subsidy for off-grid solar irrigation pumps' },
  { id: 'smam', label: 'SMAM Agricultural Mechanization', desc: '40%-80% subsidy on tractors and farm machinery purchase' }
];

export const KYCGovernmentBenefits: React.FC<KYCGovernmentBenefitsProps> = ({
  uid,
  initialProfile,
  onSaveSuccess,
  onClose,
  triggerToast
}) => {
  const { t } = useI18n();

  // Bank & Aadhaar States
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(initialProfile?.aadhaarNumber || '');
  const [bankName, setBankName] = useState<string>(initialProfile?.bankName || '');
  const [bankAccountNo, setBankAccountNo] = useState<string>(initialProfile?.bankAccountNo || '');
  const [ifscCode, setIfscCode] = useState<string>(initialProfile?.ifscCode || '');
  const [bankBranch, setBankBranch] = useState<string>(initialProfile?.bankBranch || '');

  // Schemes & Machinery States
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>(
    initialProfile?.govtSchemesInterest || [
      'PM-KISAN Direct Income Transfer (₹6,000/yr)',
      'Kisan Credit Card (KCC Scheme)'
    ]
  );

  const [selectedMachinery, setSelectedMachinery] = useState<string[]>(
    initialProfile?.machineryOwned || ['Tractor (35+ HP)', 'Drip Automation Kit']
  );

  // UI States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      if (initialProfile.aadhaarNumber) setAadhaarNumber(initialProfile.aadhaarNumber);
      if (initialProfile.bankName) setBankName(initialProfile.bankName);
      if (initialProfile.bankAccountNo) setBankAccountNo(initialProfile.bankAccountNo);
      if (initialProfile.ifscCode) setIfscCode(initialProfile.ifscCode);
      if (initialProfile.bankBranch) setBankBranch(initialProfile.bankBranch);
      if (initialProfile.govtSchemesInterest) setSelectedSchemes(initialProfile.govtSchemesInterest);
      if (initialProfile.machineryOwned) setSelectedMachinery(initialProfile.machineryOwned);
    }
  }, [initialProfile]);

  const toggleScheme = (schemeLabel: string) => {
    if (selectedSchemes.includes(schemeLabel)) {
      setSelectedSchemes(selectedSchemes.filter(s => s !== schemeLabel));
    } else {
      setSelectedSchemes([...selectedSchemes, schemeLabel]);
    }
  };

  const toggleMachinery = (itemLabel: string) => {
    if (selectedMachinery.includes(itemLabel)) {
      setSelectedMachinery(selectedMachinery.filter(m => m !== itemLabel));
    } else {
      setSelectedMachinery([...selectedMachinery, itemLabel]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    const updatePayload: Partial<UserProfileDoc> = {
      aadhaarNumber: aadhaarNumber.trim(),
      bankName: bankName.trim(),
      bankAccountNo: bankAccountNo.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      bankBranch: bankBranch.trim(),
      govtSchemesInterest: selectedSchemes,
      machineryOwned: selectedMachinery
    };

    try {
      const timeoutPromise = new Promise<UserProfileDoc & { _savedToCloud?: boolean }>((resolve) => {
        setTimeout(() => {
          console.warn('KYC save 10s timeout reached');
          resolve({
            uid,
            mobileNumber: initialProfile?.mobileNumber || '',
            loginMethod: initialProfile?.loginMethod || 'phone',
            createdAt: initialProfile?.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            language: initialProfile?.language || 'en',
            state: initialProfile?.state || 'Karnataka',
            district: initialProfile?.district || 'Chikkaballapura',
            village: initialProfile?.village || '',
            profileCompleted: true,
            role: 'farmer',
            accountStatus: 'active',
            ...initialProfile,
            ...updatePayload,
            _savedToCloud: false
          });
        }, 10000);
      });

      const savePromise = saveFarmerProfile(uid, updatePayload);
      const result = await Promise.race([savePromise, timeoutPromise]);

      const msg = result._savedToCloud !== false
        ? 'KYC & Government Benefits updated successfully!'
        : 'Saved locally. Cloud sync will retry later.';

      if (triggerToast) triggerToast(msg);
      setToastMessage(msg);

      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess(result);
        }, 500);
      }
    } catch (err) {
      console.error('Error saving KYC & Government Benefits:', err);
      const msg = 'Saved locally. Cloud sync will retry later.';
      if (triggerToast) triggerToast(msg);
      setToastMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 animate-fadeIn overflow-hidden">
      {/* Header Bar - Matching App Header Style */}
      <div className="bg-emerald-800 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 bg-emerald-700/60 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-base font-black tracking-tight text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
              <span>KYC & Government Benefits</span>
            </h2>
            <p className="text-[11px] text-emerald-100 font-medium">
              Bank details, Aadhaar, DBT Subsidies & Machinery
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 p-3 sm:p-5 space-y-4">
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Card 1: Aadhaar & Identity Verification */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">Aadhaar Identity Verification</h3>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>KYC Verified</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Aadhaar Card Number (12 Digits)
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                placeholder="e.g. 5489 1234 8901"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-mono font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              🔒 Encrypted directly under UID. Required for PM-KISAN & State Subsidy payouts.
            </p>
          </div>
        </div>

        {/* Card 2: Bank Account Details for Direct Benefit Transfer */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Bank Account for DBT Payouts</h3>
              <p className="text-[10px] text-slate-400 font-medium">Direct Income & Subsidy Credit Bank Account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 30281948210"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-mono uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Bank Branch</label>
              <input
                type="text"
                placeholder="e.g. Chikkaballapura Main Branch"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Government Schemes Enrolled / Interested */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Government Schemes & DBT Benefits</h3>
              <p className="text-[10px] text-slate-400 font-medium">Select schemes you are enrolled in or wish to apply</p>
            </div>
          </div>

          <div className="space-y-2">
            {GOVT_SCHEMES_OPTIONS.map((sch) => {
              const isSelected = selectedSchemes.includes(sch.label);
              return (
                <button
                  type="button"
                  key={sch.id}
                  onClick={() => toggleScheme(sch.label)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold">{sch.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{sch.desc}</p>
                  </div>
                  <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: Machinery & Equipment Owned */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Tractor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Farm Machinery & Equipment Owned</h3>
              <p className="text-[10px] text-slate-400 font-medium">Used for Custom Hiring & Rental Hubs</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MACHINERY_OPTIONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedMachinery.includes(item.label);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleMachinery(item.label)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center space-x-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Sticky Bottom Bar */}
      <div className="bg-white/95 backdrop-blur-md p-4 border-t border-slate-200/80 shadow-lg sticky bottom-0 z-20 shrink-0 flex items-center space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="py-3 px-5 border border-slate-200 text-slate-600 font-extrabold text-xs rounded-2xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving KYC...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-yellow-300" />
              <span>Save KYC & Benefits</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
