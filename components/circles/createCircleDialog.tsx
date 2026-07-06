"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";


import { CircleFormData } from "@/types/onboarding";
import { CreateCircleCard } from "./circleCard";
import { createCircleAction } from "@/lib/actions/circle";

interface CreateCircleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCircleDialog({
  open,
  onOpenChange,
}: CreateCircleDialogProps) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleComplete(data: CircleFormData) {
    setError("");

    startTransition(async () => {
      const result = await createCircleAction(data);

      if (!result.success) {
        setError(result.error ?? "Unable to create Circle.");
        toast.error(result.error ?? "Unable to create Circle.");
        return;
      }

      toast.success("Circle created successfully.");

      onOpenChange(false);

      router.refresh();

      // Optional:
      router.push(`/circles/${result.data?.slug}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none">
        <VisuallyHidden>
          <DialogTitle>Create a Circle</DialogTitle>
        </VisuallyHidden>

        <CreateCircleCard
          onComplete={handleComplete}
          onCancel={() => onOpenChange(false)}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}