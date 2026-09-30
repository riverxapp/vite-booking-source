import { useState } from "react";
import { Lock, Send } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ReplyBoxProps = {
  /** Resolves true when the message was saved, so the box can clear. */
  onSend: (message: string, internal: boolean) => Promise<boolean>;
  /** Agents get "Add internal note" next to "Send reply". */
  allowInternal?: boolean;
  placeholder?: string;
};

export function ReplyBox({ onSend, allowInternal = false, placeholder = "Write a reply…" }: ReplyBoxProps) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<"reply" | "note" | null>(null);
  const empty = !message.trim();

  async function send(internal: boolean) {
    if (empty || pending) return;
    setPending(internal ? "note" : "reply");
    try {
      if (await onSend(message.trim(), internal)) setMessage("");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="border border-rule-strong bg-card focus-within:border-brand">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        rows={5}
        aria-label="Message"
        className="min-h-28 resize-y rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send(false);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
        <span className="rx-meta hidden sm:inline">⌘/Ctrl + Enter to send</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {allowInternal ? (
            <Button variant="outline" onClick={() => void send(true)} disabled={empty || pending !== null}>
              <Lock />
              {pending === "note" ? "Saving…" : "Add internal note"}
            </Button>
          ) : null}
          <Button onClick={() => void send(false)} disabled={empty || pending !== null}>
            <Send />
            {pending === "reply" ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
