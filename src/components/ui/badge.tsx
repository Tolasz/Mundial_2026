import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        /** Neutral / default */
        default:
          "bg-primary/10 text-primary ring-primary/20",
        /** 3 pkt — exact score */
        success:
          "bg-[var(--points-exact-bg)] text-[var(--points-exact)] ring-[var(--points-exact)]/30",
        /** 1 pkt — correct result */
        info:
          "bg-[var(--points-result-bg)] text-[var(--points-result)] ring-[var(--points-result)]/30",
        /** 0 pkt or neutral muted */
        muted:
          "bg-muted text-muted-foreground ring-border",
        /** Warning / podium / bonus highlight */
        warning:
          "bg-accent/30 text-accent-foreground ring-accent/50",
        /** Destructive */
        destructive:
          "bg-destructive/10 text-destructive ring-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
