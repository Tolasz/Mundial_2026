import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      size: {
        sm: "h-7 px-2.5 text-xs",
        default: "h-9 px-3 text-sm",
        lg: "h-11 px-4 text-base",
      },
      variant: {
        default: "border-input",
        ghost: "border-transparent bg-muted/50 hover:bg-muted",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input, inputVariants }
