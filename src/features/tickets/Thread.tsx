import { Lock } from "@/components/icons";
import { Avatar } from "@/components/common/Avatar";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ThreadMessage } from "./types";

/** The conversation, oldest first, laid out like an email thread. */
export function Thread({ messages }: { messages: ThreadMessage[] }) {
  if (!messages.length) return <p className="border bg-card px-4 py-6 text-sm text-muted-foreground">No messages yet.</p>;
  return (
    <ol className="space-y-3" aria-label="Conversation">
      {messages.map((m) => (
        <li key={m.id}>
          <article
            className={cn(
              "border bg-card",
              m.senderType === "agent" && !m.isInternal && "border-l-2 border-l-brand",
              // Internal notes read as a different kind of object, never as a reply.
              m.isInternal && "border-dashed border-amber-600/50 bg-amber-500/[0.07]",
            )}
          >
            <header className={cn("flex items-center gap-3 border-b px-4 py-2.5", m.isInternal && "border-dashed border-amber-600/40")}>
              <Avatar name={m.senderName} src={m.senderAvatar} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.senderName}</p>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.06em] text-muted-foreground">
                  {m.isInternal ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
                      <Lock className="h-3 w-3" />
                      Internal note · agents only
                    </span>
                  ) : m.senderType === "agent" ? (
                    "Support"
                  ) : (
                    "Customer"
                  )}
                </p>
              </div>
              <time className="shrink-0 font-mono text-[0.7rem] text-muted-foreground" dateTime={new Date(m.createdAt).toISOString()} title={formatDateTime(m.createdAt)}>
                {formatRelative(m.createdAt)}
              </time>
            </header>
            <div className="whitespace-pre-wrap break-words px-4 py-3 text-[0.94rem] leading-relaxed">{m.message}</div>
          </article>
        </li>
      ))}
    </ol>
  );
}
