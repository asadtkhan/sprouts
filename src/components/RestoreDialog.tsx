import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimBackupCode } from "@/lib/cloud";
import { toast } from "sonner";

export function RestoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function restore() {
    if (!code.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const restored = await claimBackupCode(code);
      onOpenChange(false);
      setCode("");
      toast.success(restored ? "Welcome back! Your world is restored." : "Code accepted, though there wasn't anything saved yet.");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Restore your Sprout</DialogTitle>
          <DialogDescription>Enter the recovery code you saved to bring back your habits and progress.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && restore()}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="bg-white/60 font-display tracking-wider text-center"
            autoCapitalize="characters"
          />
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <Button onClick={restore} disabled={loading || !code.trim()} className="w-full rounded-xl">
            {loading ? "Checking…" : "Restore my Sprout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}