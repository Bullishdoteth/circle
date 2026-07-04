import React, { useState } from 'react';
import { CircleFormData, OnboardingStep } from '@/types/onboarding';
import { Step1CircleDetails } from '@/components/onboarding/step1CircleDetails';
import { Step2InviteMembers } from '@/components/onboarding/step2InviteMembers';
import { motion, AnimatePresence } from 'motion/react';
import { StepIndicator } from './stepIndicator';

interface OnboardingCardProps {
    onComplete: (data: CircleFormData) => Promise<void>;
    onCancel: () => void;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
    onComplete,
    onCancel,
    }) => {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<CircleFormData>({
        name: '',
        slug: '',
        description: '',
        logoUrl: null,
        privacy: 'invite_only',
        members: [],
        targetAmount: 5000,
        monthlyContribution: 250,
        cycleLengthMonths: 10,
    });

    const updateFormData = (data: Partial<CircleFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const isStep1Valid = formData.name.trim().length > 0;

    const handleContinueToStep2 = () => {
        if (isStep1Valid) {
        setCurrentStep(2);
        }
    };

    const handleFinish = async () => {
        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 500));
        setIsLoading(false);
        onComplete(formData);
    };

    const handleSkip = () => {
        handleFinish();
    };

    return (
        <div className="w-full max-w-155 mx-auto px-4 py-8 sm:py-12">
        {/* Onboarding Card */}
        <div className="w-full bg-white rounded-[24px] border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-6 sm:p-10 transition-all">
            {/* Progress Indicator */}
            <StepIndicator
            currentStep={currentStep}
            canNavigateToStep2={isStep1Valid}
            onStepClick={(step) => {
                if (step === 1 || isStep1Valid) {
                setCurrentStep(step);
                }
            }}
            />

            {/* Form Animated Steps */}
            <AnimatePresence mode="wait">
            {currentStep === 1 ? (
                <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                <Step1CircleDetails
                    formData={formData}
                    updateFormData={updateFormData}
                    onContinue={handleContinueToStep2}
                    onCancel={onCancel}
                />
                </motion.div>
            ) : (
                <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                <Step2InviteMembers
                    formData={formData}
                    updateFormData={updateFormData}
                    onBack={() => setCurrentStep(1)}
                    onFinish={handleFinish}
                    onSkip={handleSkip}
                    isLoading={isLoading}
                />
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* Footer reassurance note */}
        <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-[#4AA054]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Encrypted vault & institutional-grade ledger. Protected by Circle protocol.</span>
        </div>
        </div>
    );
};
