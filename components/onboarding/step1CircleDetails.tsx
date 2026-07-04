import React, { useState, useRef, useEffect } from 'react';
import { CircleFormValues } from '@/components/forms/schema/circleFormSchema';
import { generateSlug } from '@/lib//utils/slugify';
import { LOGO_PRESETS } from '@/lib/utils/presets';
import { circleStep1Schema } from '@/components/forms/schema/circleFormSchema';
import {
    Globe,
    Upload,
    CheckCircle2,
    Lock,
    UserCheck,
    X,
    Copy,
    Check,
    AlertCircle
} from 'lucide-react';

interface Step1Props {
    formData: CircleFormValues;
    updateFormData: (data: Partial<CircleFormValues>) => void;
    onContinue: () => void;
    onCancel: () => void;
    zodErrors?: Record<string, string>;
}

export const Step1CircleDetails: React.FC<Step1Props> = ({
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
        <div className="space-y-6">
        {/* Step Header */}
        <header className="mb-6">
            <h1 className="text-[28px] sm:text-[32px] font-bold text-[#111827] leading-tight mb-2 tracking-[-0.03em]">
            Create your first Circle
            </h1>
            <p className="text-[#6B7280] text-base sm:text-lg">
            Set up your savings community in less than a minute.
            </p>
        </header>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Circle Name Input */}
            <section>
            <label htmlFor="circle-name" className="block text-sm font-medium text-[#111827] mb-2">
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
                className={`w-full px-4 py-3 rounded-xl border transition-all text-[#111827] placeholder-[#9CA3AF] outline-none focus:ring-2 ${
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
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {nameErrorMessage || 'Please enter a valid name for your savings Circle.'}
                </p>
            )}

            {/* Live Slug Preview Container */}
            <div className="mt-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#F3F4F6] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                <span className="text-[13px] font-medium text-[#6B7280]">Your Circle link:</span>
                <span className={`text-[13px] font-semibold truncate ${slug ? 'text-[#111827]' : 'text-[#9CA3AF] font-normal'}`}>
                    circle.app/c/{slug || 'friends-savings-club'}
                </span>
                </div>
                {slug && (
                <button
                    type="button"
                    onClick={copySlugToClipboard}
                    className="flex items-center gap-1 text-[12px] font-medium text-[#4AA054] hover:text-[#3E8D47] transition-colors ml-auto"
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
            </section>

            {/* Description & Logo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            <div className="sm:col-span-8">
                <div className="flex items-center justify-between mb-2">
                <label htmlFor="circle-description" className="block text-sm font-medium text-[#111827]">
                    Description
                </label>
                </div>
                <textarea
                id="circle-description"
                rows={3}
                value={formData.description}
                onChange={handleDescriptionChange}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                placeholder="Tell members what this Circle is about..."
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#4AA054]/20 focus:border-[#4AA054] outline-none transition-all text-[#111827] placeholder-[#9CA3AF] resize-none text-sm ${
                    touched.description && zodDescriptionError ? 'border-rose-300' : 'border-[#E5E7EB]'
                }`}
                />
                {touched.description && zodDescriptionError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {zodDescriptionError}
                </p>
                )}
                <div className="mt-1.5 text-right text-[11px] text-[#9CA3AF] font-medium">
                {formData.description.length} / 250 characters
                </div>
            </div>

            <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-[#111827] mb-2">Logo</label>
                <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-[#F9FAFB] border-2 border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#4AA054]/50 transition-colors group relative overflow-hidden"
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
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-rose-600 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                    </>
                ) : (
                    <>
                    <Upload className="w-6 h-6 text-[#9CA3AF] group-hover:text-[#4AA054] mb-1 transition-colors" />
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Upload</span>
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

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mt-2">
                {LOGO_PRESETS.slice(0, 4).map((preset) => (
                    <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium border transition-all ${
                        selectedPresetId === preset.id
                        ? 'border-[#4AA054] bg-[#4AA054]/10 text-[#4AA054]'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                    }`}
                    >
                    {preset.emoji}
                    </button>
                ))}
                </div>
            </div>
            </div>

            {/* Privacy Section */}
            <section>
            <label className="block text-sm font-medium text-[#111827] mb-3">Privacy</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Invite Only Option */}
                <div
                onClick={() => updateFormData({ privacy: 'invite_only' })}
                className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                    formData.privacy === 'invite_only'
                    ? 'border-2 border-[#4AA054] bg-[#4AA054]/2'
                    : 'border border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
                >
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#111827] text-[15px] flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-[#4AA054]" />
                    Invite Only
                    </span>
                    {formData.privacy === 'invite_only' && (
                    <div className="w-5 h-5 rounded-full bg-[#4AA054] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-3" />
                    </div>
                    )}
                </div>
                <p className="text-[#6B7280] text-[13px] leading-relaxed">
                    Only people you invite can join your Circle.
                </p>
                </div>

                {/* Private Option */}
                <div
                onClick={() => updateFormData({ privacy: 'private' })}
                className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                    formData.privacy === 'private'
                    ? 'border-2 border-[#4AA054] bg-[#4AA054]/2'
                    : 'border border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
                >
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#111827] text-[15px] flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-[#4AA054]" />
                    Private
                    </span>
                    {formData.privacy === 'private' && (
                    <div className="w-5 h-5 rounded-full bg-[#4AA054] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-3" />
                    </div>
                    )}
                </div>
                <p className="text-[#6B7280] text-[13px] leading-relaxed">
                    Hidden from everyone except members.
                </p>
                </div>
            </div>
            </section>

            {/* Bottom Actions Bar */}
            <div className="px-6 sm:px-10 py-5 sm:py-6 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 rounded-b-[24px] mt-8">
            <button
                type="button"
                onClick={onCancel}
                className="text-[15px] font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
            >
                Cancel
            </button>

            <button
                type="button"
                disabled={!zodValidation.success}
                onClick={onContinue}
                className={`px-8 py-3 rounded-xl font-bold text-[15px] transition-all flex items-center gap-2 ${
                zodValidation.success
                    ? 'bg-[#4AA054] text-white shadow-[0_4px_12px_rgba(74,160,84,0.25)] hover:bg-[#3E8D47] active:scale-[0.99] cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
            >
                <span>Continue</span>
                <span className="text-base">→</span>
            </button>
            </div>
        </form>
        </div>
    );
};
