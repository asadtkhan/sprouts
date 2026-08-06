import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAppState, addJournalEntry, deleteJournalEntry } from "@/lib/store";
import { JournalCat } from "@/components/JournalCat";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Sprout" },
      { name: "description", content: "Write about your day. A little kitten keeps you company." },
      { property: "og:title", content: "Journal — Sprout" },
      { property: "og:description", content: "Write about your day. A little kitten keeps you company." },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const s = useAppState();
  const [text, setText] = useState("");
  // The roaming kitten's age mirrors the user's main game stage
  const catStage = s.game?.stage ?? 0;

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto relative">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Today</div>
        <h1 className="font-display text-3xl md:text-4xl">Journal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Write about your day — no game, just a moment to reflect.
        </p>
      </div>

      <div data-tour="journal-editor" className="glass rounded-3xl p-4 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What happened today? How are you feeling?"
          className="w-full min-h-[140px] bg-white/60 rounded-2xl p-3 text-sm outline-none border border-white/50 focus:ring-2 focus:ring-primary resize-y"
        />
        <div className="mt-3 flex justify-end">
          <Button
            className="rounded-xl"
            disabled={!text.trim()}
            onClick={() => {
              addJournalEntry(text);
              setText("");
            }}
          >
            Save entry
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {s.journalEntries.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            Your journal is empty. Write something short — even one line counts.
          </div>
        )}
        {s.journalEntries.map((e) => (
          <div key={e.id} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {new Date(e.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
              <button
                onClick={() => deleteJournalEntry(e.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm whitespace-pre-wrap">{e.text}</div>
          </div>
        ))}
      </div>

      <JournalCat stage={catStage} />
    </div>
  );
}
