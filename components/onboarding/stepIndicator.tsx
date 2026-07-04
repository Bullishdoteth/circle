import { OnboardingStep } from '@/types/onboarding';

interface StepIndicatorProps {
    currentStep: OnboardingStep;
    onStepClick?: (step: OnboardingStep) => void;
    canNavigateToStep2?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    onStepClick,
    canNavigateToStep2 = false,
    }) => {
    return (
        <div className="w-full mb-6">
        {/* Top Header & Pill Progress Bar */}
        <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Step {currentStep} of 2
            </span>
            <div className="flex gap-1.5">
            <button
                type="button"
                onClick={() => onStepClick && onStepClick(1)}
                aria-label="Go to Step 1"
                className={`w-8 h-1 rounded-full transition-all cursor-pointer ${
                currentStep >= 1 ? 'bg-[#4AA054]' : 'bg-[#E5E7EB]'
                }`}
            />
            <button
                type="button"
                disabled={!canNavigateToStep2 && currentStep === 1}
                onClick={() => canNavigateToStep2 && onStepClick && onStepClick(2)}
                aria-label="Go to Step 2"
                className={`w-8 h-1 rounded-full transition-all ${
                currentStep >= 2
                    ? 'bg-[#4AA054]'
                    : canNavigateToStep2
                    ? 'bg-[#E5E7EB] hover:bg-[#4AA054]/50 cursor-pointer'
                    : 'bg-[#E5E7EB] cursor-not-allowed'
                }`}
            />
            </div>
        </div>
        </div>
    );
};