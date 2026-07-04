'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from "sonner"
import { OnboardingStep } from '@/types/onboarding';
import {
    circleFormSchema,
    circleStep1Schema,
    CircleFormValues,
} from '@/components/forms/schema/circleFormSchema';

import { createCircleAction } from '@/lib/actions/circle';

import { StepIndicator } from '@/components/onboarding/stepIndicator';
import { Step1CircleDetails } from '@/components/onboarding/step1CircleDetails';
import { Step2InviteMembers } from '@/components/onboarding/step2InviteMembers';

export interface CircleFormProps {
    onComplete: (data: CircleFormValues) => void;
    onCancel: () => void;
    initialValues?: Partial<CircleFormValues>;
}

export const CircleForm: React.FC<CircleFormProps> = ({
    onComplete,
    onCancel,
    initialValues,
    }) => {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<CircleFormValues>({
        name: initialValues?.name ?? '',
        slug: initialValues?.slug ?? '',
        description: initialValues?.description ?? '',
        logoUrl: initialValues?.logoUrl ?? null,
        privacy: initialValues?.privacy ?? 'invite_only',
        members: initialValues?.members ?? [],
    });

    const [zodErrors, setZodErrors] = useState<Record<string, string>>({});

    const updateFormData = (data: Partial<CircleFormValues>) => {
        setFormData((prev) => ({
        ...prev,
        ...data,
        }));
    };

    const step1Validation = circleStep1Schema.safeParse(formData);

    const validateStep1 = () => {
        const result = circleStep1Schema.safeParse(formData);

        if (result.success) {
        setZodErrors({});
        return true;
        }

        const formatted = result.error.format();

        setZodErrors({
        name: formatted.name?._errors[0] ?? '',
        description: formatted.description?._errors[0] ?? '',
        });

        return false;
    };

    const handleContinueToStep2 = () => {
        if (validateStep1()) {
        setCurrentStep(2);
        }
    };

    const handleFinish = async () => {
        const validation = circleFormSchema.safeParse(formData);

        if (!validation.success) {
        console.error(validation.error.flatten());
        toast.error('Please complete all required fields.');
        return;
        }

        setIsLoading(true);

        try {
        const values = validation.data;

        const response = await createCircleAction({
            name: values.name,
            slug: values.slug ?? '',
            description: values.description,
            logoUrl: values.logoUrl ?? null,
            privacy: values.privacy,
            currency: 'NGN',
        });

        if (!response.success || !response.data) {
            throw new Error(response.error ?? 'Unable to create circle.');
        }

        toast.success("Circle created successfully!");

        /**
         * Next step:
         * Create invitations here using:
         *
         * response.data.id
         * values.members
         */

        onComplete({
            name: values.name,
            slug: values.slug ?? '',
            description: values.description,
            logoUrl: values.logoUrl ?? null,
            privacy: values.privacy,
            members: values.members,
        });
        } catch (error) {
        console.error('Create Circle Error:', error);
        toast.error(
            error instanceof Error
                ? error.message
                : "Something went wrong while creating your Circle."
            );
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-155 px-4 py-8 sm:py-12">
        <div className="overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all sm:p-10">
            <StepIndicator
            currentStep={currentStep}
            canNavigateToStep2={step1Validation.success}
            onStepClick={(step) => {
                if (step === 1 || step1Validation.success) {
                setCurrentStep(step);
                }
            }}
            />

            <AnimatePresence mode="wait">
            {currentStep === 1 ? (
                <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                }}
                >
                <Step1CircleDetails
                    formData={formData}
                    updateFormData={updateFormData}
                    onContinue={handleContinueToStep2}
                    onCancel={onCancel}
                    zodErrors={zodErrors}
                />
                </motion.div>
            ) : (
                <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                }}
                >
                <Step2InviteMembers
                    formData={formData}
                    updateFormData={updateFormData}
                    onBack={() => setCurrentStep(1)}
                    onFinish={handleFinish}
                    onSkip={handleFinish}
                    isLoading={isLoading}
                />
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-gray-500">
            <svg
            className="h-3.5 w-3.5 text-[#4AA054]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
            </svg>

            <span>
            Validated with Zod • Secured by Clerk • Powered by Neon.
            </span>
        </div>
        </div>
    );
};