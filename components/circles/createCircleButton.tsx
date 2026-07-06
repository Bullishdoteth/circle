"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateCircleDialog } from "./createCircleDialog";
import { Plus } from "lucide-react";


export function CreateCircleButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700" onClick={() => setOpen(true)}>
        <Plus size={18} />
        Create New Circle
      </Button>

      <CreateCircleDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}