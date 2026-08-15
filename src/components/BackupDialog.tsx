import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { bootstrapBackup, regenerateBackupCode, useCloudBackup } from "@/lib/cloud";
import { toast } from "sonner";

type Phase = "intro" | "loading" | "code" | "error";

export function BackupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { hasBackup } = useCloudBackup();
  const [phase, setPhase] = useState<Phase>("intro");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // While a fresh code is on screen, block every way of dismissing the
  // dialog — backdrop click, Escape, and the built-in close button all
  // funnel through this same handler in Radix, so gating it here covers
  // all three. It's the only time this code will ever be shown.
  function handleOpenChange(next: boolean) {
    if (!next && phase === "code") return;
    if (!next) reset();
    onOpenChange(next);
  }

  function reset() {
    setPhase("intro");
    setCode(null);
    setCopied(false);
    setErrorMsg("");
  }

  async function start() {
    setPhase("loading");
    try {
      if (hasBackup) {
        const newCode = await regenerateBackupCode();
        setCode(newCode);
      } else {
        const { code: newCode } = await bootstrapBackup();
        if (!newCode) {
          // Self-healed onto an existing backup between opening the
          // dialog and clicking the button — nothing new to show.
          onOpenChange(false);
          reset();
          toast.success("You're already backed up");
          return;
        }
        setCode(newCode);
      }
      setPhase("code");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setPhase("error");
    }
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy. Select and copy it manually.");
    }
  }

  function finish() {
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-strong max-w-sm">
        {(phase === "intro" || phase === "loading" || phase === "error") && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {hasBackup ? "Get a new recovery code" : "Save your progress"}
              </DialogTitle>
              <DialogDescription>
                {hasBackup
                  ? "This replaces your current code. The old one stops working right away, so only do this if you've lost it."
                  : "Sprout lives on this device only. If you remove it from your home screen, everything resets. A recovery code lets you bring it all back."}
              </DialogDescription>
            </DialogHeader>
            {phase === "error" && <p className="text-sm text-destructive">{errorMsg}</p>}
            <Button onClick={start} disabled={phase === "loading"} className="w-full rounded-xl">
              {phase === "loading" ? "One moment…" : hasBackup ? "Generate new code" : "Get my recovery code"}
            </Button>
          </>
        )}

        {phase === "code" && code && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Your recovery code</DialogTitle>
              <DialogDescription>
                This is the only time you'll see this. Save it somewhere safe, a notes app, a password manager,
                anywhere you'll find it again.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={copyCode}
              className="w-full glass-soft rounded-2xl px-4 py-4 flex items-center justify-between gap-3 text-left transition hover:bg-white/50"
            >
              <span className="font-display text-lg tracking-wider break-all">{code}</span>
              {copied ? (
                <Check className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
            </button>
            <Button onClick={finish} className="w-full rounded-xl">
              {copied ? "I've saved it, done" : "I've written it down, done"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}