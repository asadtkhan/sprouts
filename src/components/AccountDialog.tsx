import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import { createAccount, signUpWithPhone, signInWithGoogle, signInWithApple } from "@/lib/store";
import { toast } from "sonner";

type Mode = "choices" | "email" | "phone";

export function AccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("choices");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setMode("choices");
    setEmail("");
    setPhone("");
    setPw("");
    setLoading(false);
  }

  function close(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function withLoading(fn: () => Promise<void>) {
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function submitEmail() {
    if (!email.includes("@") || pw.length < 6) {
      toast.error("Enter a valid email and 6+ char password");
      return;
    }
    await withLoading(async () => {
      await createAccount(email, pw);
      toast.success("Account created. Your progress is safe!");
      close(false);
    });
  }

  async function submitPhone() {
    if (phone.replace(/\D/g, "").length < 10 || pw.length < 6) {
      toast.error("Enter a valid phone number and 6+ char password");
      return;
    }
    await withLoading(async () => {
      await signUpWithPhone(phone, pw);
      toast.success("Account created. Your progress is safe!");
      close(false);
    });
  }

  // Google and Apple redirect the whole page away, so there's no close()
  // here — the AccountDialog just unmounts, and store.ts's auth listener
  // picks the session back up once Supabase redirects to /profile.
  async function google() {
    await withLoading(signInWithGoogle);
  }

  async function apple() {
    await withLoading(signInWithApple);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass-strong max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Save your progress</DialogTitle>
          <DialogDescription>
            You've grown your first sprout. Create an account so it never withers, even if you switch phones.
          </DialogDescription>
        </DialogHeader>

        {mode === "choices" && (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-3 bg-white/60"
              onClick={google}
              disabled={loading}
            >
              <GoogleIcon className="w-4 h-4" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-3 bg-white/60"
              onClick={apple}
              disabled={loading}
            >
              <AppleIcon className="w-4 h-4" />
              Continue with Apple
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-3 bg-white/60"
              onClick={() => setMode("phone")}
              disabled={loading}
            >
              <Phone className="w-4 h-4" />
              Continue with phone number
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button className="w-full rounded-xl" onClick={() => setMode("email")} disabled={loading}>
              Continue with email
            </Button>
          </div>
        )}

        {mode === "email" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-white/60" />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className="bg-white/60" />
            </div>
            <Button onClick={submitEmail} className="w-full rounded-xl" disabled={loading}>
              Create account
            </Button>
            <button
              onClick={() => setMode("choices")}
              className="w-full text-center text-xs text-muted-foreground pt-1"
            >
              Back
            </button>
          </div>
        )}

        {mode === "phone" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Phone number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="+91 98765 43210"
                className="bg-white/60"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className="bg-white/60" />
            </div>
            <Button onClick={submitPhone} className="w-full rounded-xl" disabled={loading}>
              Create account
            </Button>
            <button
              onClick={() => setMode("choices")}
              className="w-full text-center text-xs text-muted-foreground pt-1"
            >
              Back
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.05-.85.9-2.05 1.6-3.24 1.5-.14-1.16.44-2.32 1.22-3.11.86-.87 2.34-1.5 3.26-1.44zM20.7 17.06c-.5 1.15-.74 1.66-1.38 2.68-.9 1.43-2.16 3.22-3.73 3.23-1.4.02-1.76-.92-3.65-.9-1.9.01-2.3.92-3.7.9-1.57-.02-2.76-1.63-3.66-3.06-2.5-3.98-2.77-8.66-1.22-11.15 1.1-1.77 2.85-2.81 4.5-2.81 1.68 0 2.73 1.03 4.12 1.03 1.34 0 2.16-1.03 4.11-1.03 1.47 0 3.02.8 4.13 2.18-3.63 1.99-3.04 7.16.48 8.93z" />
    </svg>
  );
}