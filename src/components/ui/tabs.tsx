"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tabsListVariants = cva(
  "relative flex items-center rounded-lg bg-muted p-1 text-muted-foreground",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
)

const tabsTabVariants = cva(
  "relative z-10 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        active: "text-foreground",
        inactive: "hover:text-foreground/70",
      },
    },
    defaultVariants: {
      state: "inactive",
    },
  },
)

/* Root */
function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/* List */
function TabsList({
  className,
  orientation,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ orientation }), className)}
      {...props}
    />
  )
}

/* Tab trigger */
function TabsTrigger({
  className,
  children,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        "data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
        "text-muted-foreground hover:text-foreground/80",
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Tab>
  )
}

/* Panel */
function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("focus-visible:outline-none", className)}
      {...props}
    />
  )
}

/* Animated indicator (optional) */
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute rounded-md bg-background shadow-sm transition-all duration-200",
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator, tabsTabVariants }
