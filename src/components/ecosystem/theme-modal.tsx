"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeEditor } from "@/components/ecosystem/theme-editor";

type EcosystemRow = {
  id: string;
  slug: string;
  name: string;
  vision: string | null;
  mission: string | null;
  badge_url: string | null;
  theme_primary: string | null;
  theme_supporting: string | null;
  theme_accent: string | null;
};

export function ThemeModal({
  ecosystem,
  open,
  onClose,
}: {
  ecosystem: EcosystemRow;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Theme &amp; Branding</DialogTitle>
        </DialogHeader>
        <ThemeEditor ecosystem={ecosystem} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}