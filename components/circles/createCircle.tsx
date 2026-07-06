import React, { useState, useRef, useEffect } from 'react';
import { CircleFormValues, circleStep1Schema } from '@/components/forms/schema/circleFormSchema';
import { generateSlug } from '@/lib//utils/slugify';
import { LOGO_PRESETS } from '@/lib/utils/presets';

import { Globe, Upload, CheckCircle2, Lock, UserCheck, X, Copy, Check, AlertCircle } from 'lucide-react';

interface Step1Props {
    formData: CircleFormValues;
    updateFormData: (data: Partial<CircleFormValues>) => void;
    onContinue: () => void;
    onCancel: () => void;
    zodErrors?: Record<string, string>;
}

export const Step1CreateCircleDetails: React.FC<Step1Props> = ({
    formData,
    updateFormData,
    onContinue,
    onCancel,
    zodErrors,
    }) => {
    const [copiedSlug, setCopiedSlug] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(formData.logoUrl || null);
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [touched, setTouched] = useState({ name: false, description: false });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Live slug generation
    const slug = generateSlug(formData.name);

    // Sync generated slug to form data
    useEffect(() => {
        updateFormData({ slug });
    }, [formData.name]);

    // Zod schema evaluation
    const zodValidation = circleStep1Schema.safeParse(formData);
    const zodNameError = !zodValidation.success ? zodValidation.error.format().name?._errors[0] : undefined;
    const zodDescriptionError = !zodValidation.success ? zodValidation.error.format().description?._errors[0] : undefined;

    const nameErrorMessage = (zodErrors && zodErrors.name) || zodNameError;
    const showNameError = touched.name && Boolean(nameErrorMessage);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFormData({ name: e.target.value });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateFormData({ description: e.target.value });
    };

      const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setSelectedPresetId(null);
      updateFormData({ logoUrl: result });
    };
    reader.readAsDataURL(file);
  };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setLogoPreview(result);
            setSelectedPresetId(null);
            updateFormData({ logoUrl: result });
        };
        reader.readAsDataURL(file);
        }
    };

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      };
    
      const handleDragLeave = () => {
        setIsDragging(false);
      };
    
      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          processFile(file);
        }
      };

    const handleSelectPreset = (preset: typeof LOGO_PRESETS[0]) => {
        // Generate a data URL or preset identifier SVG
        const svgData = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
            <rect width="80" height="80" rx="20" fill="${preset.id === 'piggy' ? '#DCFCE7' : preset.id === 'vault' ? '#DBEAFE' : preset.id === 'coins' ? '#FEF3C7' : preset.id === 'sprout' ? '#DCFCE7' : preset.id === 'star' ? '#F3E8FF' : '#FFE4E6'}" />
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="38">${preset.emoji}</text>
        </svg>
        `);
        const dataUrl = `data:image/svg+xml;utf8,${svgData}`;
        setLogoPreview(dataUrl);
        setSelectedPresetId(preset.id);
        updateFormData({ logoUrl: dataUrl });
    };

    const handleClearLogo = () => {
        setLogoPreview(null);
        setSelectedPresetId(null);
        updateFormData({ logoUrl: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const copySlugToClipboard = () => {
        if (!slug) return;
        const fullUrl = `circle.app/c/${slug}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
    };

    const isNameValid = formData.name.trim().length > 0;
    const nameError = touched.name && !isNameValid;

    return (
      <div className="flex flex-col gap-5 text-left max-w-160">
        {/* Step Header */}
        <header className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Create a Circle</h1>
                    <p className="text-sm text-gray-500">Give your savings community a name.</p>
                </div>
            </div>
        </header>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
            {/* Circle Name Input */}
            <div>
            <label htmlFor="circle-name" className="text-sm font-semibold text-gray-700">
                Circle Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
                <input
                id="circle-name"
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                placeholder="e.g. Friends Savings Club"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#4AA054]/20 focus:border-[#4AA054] transition-all text-gray-900 ${
                    showNameError
                    ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-[#E5E7EB] focus:ring-[#4AA054]/20 focus:border-[#4AA054]'
                }`}
                />
                {formData.name.trim() && !showNameError && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-[#4AA054]" />
                </div>
                )}
            </div>

            {showNameError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-0.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {nameErrorMessage || 'Please enter a valid name for your savings Circle.'}
                </p>
            )}

            {/* Live Slug Preview Container */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg mt-1 h-[40px]">
                <div className="flex items-center gap-2 overflow-hidden">
                <Globe className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                <span className="text-xs text-gray-500 truncate">
                circle.app/c/<span className="text-gray-900 font-medium">{slug || 'your-slug'}</span>
              </span>
                </div>
                {slug && (
                <button
                    type="button"
                    onClick={copySlugToClipboard}
                    className="text-xs font-bold text-[#4AA054] hover:text-[#3E8D47] flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                    {copiedSlug ? (
                    <>
                        <Check className="h-3 w-3" />
                        Copied
                    </>
                    ) : (
                    <>
                        <Copy className="h-3 w-3" />
                        Copy
                    </>
                    )}
                </button>
                )}
            </div>
            </div>

            {/* Description & Logo Grid */}
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Description Textarea */}
              <div className="col-span-12 md:col-span-8 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <span className="text-[11px] text-gray-400">
                    {formData.description?.length || 0}/250 characters
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                  placeholder="What is this Circle about?"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#4AA054]/20 focus:border-[#4AA054] transition-all text-gray-900 resize-none text-sm h-[100px] ${
                    touched.description && zodDescriptionError ? 'border-rose-300' : 'border-gray-200'
                  }`}
                />
                {touched.description && zodDescriptionError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {zodDescriptionError}
                  </p>
                )}
              </div>
    
              {/* Logo uploader & Presets */}
              <div className="col-span-12 md:col-span-4 flex flex-col items-center gap-2">
                <label className="text-sm font-semibold text-gray-700 w-full text-center">Logo</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-[100px] h-[100px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-gray-50 group transition-colors relative overflow-hidden cursor-pointer ${
                    isDragging ? 'border-[#4AA054] bg-[#4AA054]/5' : 'border-gray-200 hover:border-[#4AA054]'
                  }`}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearLogo();
                        }}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#4AA054] transition-colors" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 group-hover:text-[#4AA054]">Upload</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
    
                {/* Quick preset circles */}
                <div className="flex gap-1 justify-center">
                  {LOGO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs border cursor-pointer hover:scale-110 transition-all ${preset.bgClass} ${preset.borderClass} ${
                        selectedPresetId === preset.id ? 'ring-2 ring-[#4AA054]' : ''
                      }`}
                      title={preset.name}
                    >
                      {preset.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              {/* Invite Only Option */}
              <div
                onClick={() => updateFormData({ privacy: 'invite_only' })}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  formData.privacy === 'invite_only'
                    ? 'border-2 border-[#4AA054] bg-green-50/30 ring-1 ring-[#4AA054]/20'
                    : 'border border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  formData.privacy === 'invite_only' ? 'bg-white shadow-sm border border-green-100' : 'bg-gray-50'
                }`}>
                  <UserCheck className={`w-5 h-5 ${formData.privacy === 'invite_only' ? 'text-[#4AA054]' : 'text-gray-400'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Invite Only</span>
                  <p className={`text-[11px] leading-normal ${
                    formData.privacy === 'invite_only' ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    Members must be approved or invited by an admin.
                  </p>
                </div>
              </div>
    
              {/* Private Option */}
              <div
                onClick={() => updateFormData({ privacy: 'private' })}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  formData.privacy === 'private'
                    ? 'border-2 border-[#4AA054] bg-green-50/30 ring-1 ring-[#4AA054]/20'
                    : 'border border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  formData.privacy === 'private' ? 'bg-white shadow-sm border border-green-100' : 'bg-gray-50'
                }`}>
                  <Lock className={`w-5 h-5 ${formData.privacy === 'private' ? 'text-[#4AA054]' : 'text-gray-400'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Private</span>
                  <p className={`text-[11px] leading-normal ${
                    formData.privacy === 'private' ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    Only visible to existing members and invited users.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <footer className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wide cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!zodValidation.success}
                onClick={onContinue}
                className={`px-10 py-3 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] focus:outline-none ${
                  zodValidation.success
                    ? 'bg-[#4AA054] hover:bg-[#3E8D47] shadow-[0_10px_20px_-5px_rgba(74,160,84,0.4)] cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                Continue
              </button>
            </footer>
        </form>
      </div>
    );
};
