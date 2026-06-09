import Image from "next/image"

import { cn } from "@/lib/utils"

interface TeamFlagProps {
  flagUrl: string
  name: string
  size?: "sm" | "md"
}

const sizeMap = {
  sm: { width: 24, height: 16, className: "w-6 h-4" },
  md: { width: 32, height: 22, className: "w-8 h-[22px]" },
} as const

/**
 * Renders a team flag using next/image when flagUrl is a valid http(s) URL,
 * falling back to a 2-letter placeholder derived from the team name.
 */
export function TeamFlag({ flagUrl, name, size = "sm" }: TeamFlagProps) {
  const { width, height, className } = sizeMap[size]

  const isRemoteUrl =
    flagUrl &&
    (flagUrl.startsWith("http://") || flagUrl.startsWith("https://"))

  if (isRemoteUrl) {
    return (
      <Image
        src={flagUrl}
        alt={name}
        width={width}
        height={height}
        className={cn("object-cover rounded-sm shrink-0", className)}
        unoptimized={false}
      />
    )
  }

  // Emoji, empty or unknown — 2-letter placeholder
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-sm bg-muted text-muted-foreground font-bold shrink-0",
        size === "sm" ? "w-6 h-4 text-[10px]" : "w-8 h-[22px] text-xs",
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}
