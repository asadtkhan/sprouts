import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HABIT_PRESETS, GAMES } from "@/lib/presets";
import { addHabit, type Frequency, type GameKind, type HabitKind } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sparkles, Wand2, Leaf, CalendarDays, Bell, BellOff, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultKind?: HabitKind;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-pop rounded-3xl p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

export function AddHabitDialog({ open, onOpenChange, defaultKind = "daily" }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [kind, setKind] = useState<HabitKind>(defaultKind);
  const [freqType, setFreqType] = useState<"daily" | "weekly">("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [gameKind, setGameKind] = useState<GameKind>("tree");
  const [remindOn, setRemindOn] = useState(false);
  const [remindAt, setRemindAt] = useState("08:00");

  useEffect(() => {
    if (open) setKind(defaultKind);
  }, [open, defaultKind]);

  function reset() {
    setName("");
    setEmoji("✨");
    setSelectedPresets([]);
    setFreqType("daily");
    setWeekdays([1, 3, 5]);
    setGameKind("tree");
    setRemindOn(false);
    setRemindAt("08:00");
  }

  function togglePreset(presetName: string) {
    setSelectedPresets((cur) =>
      cur.includes(presetName) ? cur.filter((n) => n !== presetName) : [...cur, presetName],
    );
  }

  function submit() {
    const frequency: Frequency =
      freqType === "daily" ? { type: "daily" } : { type: "weekly", weekdays };
    const common = {
      kind,
      frequency,
      gameKind: kind === "individual" ? gameKind : undefined,
      reminderTime: kind === "daily" && remindOn ? remindAt : null,
    };

    const toAdd: { name: string; emoji: string }[] = HABIT_PRESETS.filter((p) =>
      selectedPresets.includes(p.name),
    );
    if (name.trim()) toAdd.push({ name: name.trim(), emoji });
    if (toAdd.length === 0) return;

    toAdd.forEach((a) => addHabit({ name: a.name, emoji: a.emoji, ...common }));
    reset();
    onOpenChange(false);
  }

  const totalToAdd = selectedPresets.length + (name.trim() ? 1 : 0);
  const noun = kind === "daily" ? "ritual" : "activity";
  const submitLabel =
    totalToAdd > 1 ? `Add ${totalToAdd} ${kind === "daily" ? "rituals" : "activities"}` : `Add ${noun}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/70 max-w-md rounded-[28px] p-0 overflow-hidden max-h-[88vh] flex flex-col gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <DialogHeader className="text-left space-y-1">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> New activity
            </div>
            <DialogTitle className="font-display text-2xl leading-tight">
              {kind === "daily" ? "New daily ritual" : "New personal activity"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {kind === "daily"
                ? "Something you commit to on a schedule. It grows your main world."
                : "Something you do whenever you like. Each log grows its own little world."}
            </DialogDescription>
          </DialogHeader>

          <div className="glass-soft rounded-2xl p-1 grid grid-cols-2 gap-1 mt-4">
            {([
              { k: "daily" as const, label: "Daily", Icon: Leaf },
              { k: "individual" as const, label: "Personal", Icon: Wand2 },
            ]).map(({ k, label, Icon }) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition",
                  kind === k
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-5 pb-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <Section icon={<Sparkles className="w-3 h-3" />} title="Name it">
            <div className="flex gap-2">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                aria-label="Emoji"
                className="w-14 h-11 text-center text-lg rounded-2xl bg-white/70 border border-white/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meditate for 10 minutes"
                className="flex-1 h-11 px-3 rounded-2xl bg-white/70 border border-white/60 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 mb-1.5">
              Tap as many as you like, or type your own above
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_PRESETS.map((p) => {
                const active = selectedPresets.includes(p.name);
                return (
                  <button
                    key={p.name}
                    onClick={() => togglePreset(p.name)}
                    className={cn(
                      "glass-soft rounded-full px-2.5 py-1 text-xs transition hover:scale-105 border-2",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent",
                    )}
                  >
                    <span className="mr-1">{p.emoji}</span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </Section>

          {kind === "daily" && (
            <>
              <Section icon={<CalendarDays className="w-3 h-3" />} title="Frequency">
                <div className="glass-soft rounded-2xl p-1 grid grid-cols-2 gap-1 mb-3">
                  {([
                    { v: "daily" as const, label: "Every day" },
                    { v: "weekly" as const, label: "Specific days" },
                  ]).map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setFreqType(v)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                        freqType === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {freqType === "weekly" && (
                  <div className="flex gap-1.5 justify-between">
                    {DAYS.map((d, i) => {
                      const active = weekdays.includes(i);
                      return (
                        <button
                          key={i}
                          onClick={() =>
                            setWeekdays((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))
                          }
                          className={cn(
                            "w-9 h-9 rounded-full text-xs font-medium transition",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "glass-soft text-foreground hover:bg-white/60",
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Section>

              <Section icon={<Bell className="w-3 h-3" />} title="Remind me">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRemindOn((v) => !v)}
                    className={cn(
                      "flex-1 h-11 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition",
                      remindOn
                        ? "bg-primary/15 text-primary ring-2 ring-primary"
                        : "glass-soft text-muted-foreground",
                    )}
                  >
                    {remindOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    {remindOn ? "Reminder on" : "No reminder"}
                  </button>
                  <input
                    type="time"
                    value={remindAt}
                    disabled={!remindOn}
                    onChange={(e) => setRemindAt(e.target.value)}
                    aria-label="Reminder time"
                    className="w-32 h-11 px-3 rounded-2xl bg-white/70 border border-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  A gentle nudge at your chosen time, plus the 11 PM tally reminder.
                </p>
              </Section>
            </>
          )}

          {kind === "individual" && (
            <Section icon={<Wand2 className="w-3 h-3" />} title="Choose a world">
              <div className="grid grid-cols-4 gap-2">
                {GAMES.map((g) => {
                  const active = gameKind === g.kind;
                  return (
                    <button
                      key={g.kind}
                      onClick={() => setGameKind(g.kind)}
                      className={cn(
                        "relative rounded-2xl p-2 flex flex-col items-center gap-1 transition",
                        active
                          ? "bg-primary/10 ring-2 ring-primary shadow-sm"
                          : "glass-soft hover:bg-white/70",
                      )}
                    >
                      <div className="w-full aspect-[3/4] rounded-t-full rounded-b-xl bg-gradient-to-b from-white/80 to-white/40 flex items-center justify-center text-2xl">
                        {g.emoji}
                      </div>
                      <div className="text-[10px] font-medium leading-tight text-center">{g.title}</div>
                      {active && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Personal worlds only ever move forward. Every log is one step of thirty.
              </p>
            </Section>
          )}
        </div>

        {/* Sticky actions — always visible */}
        <div className="shrink-0 px-5 py-4 border-t border-white/50 bg-white/40 backdrop-blur-md flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="h-11 px-4 rounded-2xl glass-soft text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={totalToAdd === 0}
            className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-medium transition hover:opacity-90 disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}