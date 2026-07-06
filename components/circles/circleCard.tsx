import React, { useState } from 'react';
import { CircleFormData, CreateCircleStep } from '@/types/circles';

import { motion, AnimatePresence } from 'motion/react';
import { CreateCircleStepIndicator } from './createCircleStepIndicator';
import { Step1CreateCircleDetails } from './createCircle';
import { Step2CreateCircleInviteMembers } from './createCircleInviteMember';

interface CreateCircleCardProps {
    onComplete: (data: CircleFormData) => Promise<void>;
    onCancel: () => void;
    error?: string;
}

export const CreateCircleCard: React.FC<CreateCircleCardProps> = ({
    onComplete,
    onCancel,
    error,
    }) => {
    const [currentStep, setCurrentStep] = useState<CreateCircleStep>(1);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<CircleFormData>({
        name: '',
        slug: '',
        description: '',
        logoUrl: null,
        privacy: 'invite_only',
        members: [],
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
        try {
            await onComplete(formData);
        } catch (err) {
            console.error('Error during onboarding submission:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        handleFinish();
    };

    return (
        <div className="">
            <div className="w-full bg-white rounded-[24px] border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-6 sm:p-10 transition-all">
                {/* Progress Indicator */}
                <CreateCircleStepIndicator
                    currentStep={currentStep}
                    canNavigateToStep2={isStep1Valid}
                    onStepClick={(step) => {
                        if (step === 1 || isStep1Valid) {
                        setCurrentStep(step);
                        }
                    }}
                />

                {/* Error Banner */}
                {error && (
                    <div className="mt-4 mb-2 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600 backdrop-blur-sm">
                        <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

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
                    <Step1CreateCircleDetails
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
                    <Step2CreateCircleInviteMembers
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
