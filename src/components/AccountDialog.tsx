import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAccount } from "@/lib/store";
import { toast } from "sonner";

export function AccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  function submit() {
    if (!email.includes("@") || pw.length < 6) {
      toast.error("Enter a valid email and 6+ char password");
      return;
    }
    createAccount(email);
    toast.success("Account created — your progress is safe!");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Save your progress</DialogTitle>
          <DialogDescription>
            You've been growing your world for 10 days. Create an account so your streaks and progress stay safe.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-white/60" />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className="bg-white/60" />
          </div>
          <Button onClick={submit} className="w-full rounded-xl">
            Create account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
