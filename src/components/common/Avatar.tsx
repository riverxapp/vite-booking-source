import { useState } from "react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type AvatarProps = { name: string; src?: string | null; className?: string };

/** Square avatar: the image when it loads, otherwise initials on a tint. */
export function Avatar({ name, src, className }: AvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = src && failed !== src;
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border bg-secondary font-mono text-[0.68rem] font-semibold text-secondary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {showImage ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(src)} /> : initials(name) || "?"}
    </span>
  );
}
