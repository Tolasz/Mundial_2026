"use client"

import { useRef } from "react"
import { Search, ArrowUp, ArrowDown, LayoutList } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FilterState, SortDir, StatusFilter } from "@/lib/predictions/derive"

interface PredictionsToolbarProps {
  availableGroups: string[]
  filter: FilterState
  sortDir: SortDir
  onFilterChange: (f: FilterState) => void
  onSortDirChange: (d: SortDir) => void
}

const STATUS_OPTIONS: { value: "all" | StatusFilter; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "empty", label: "Nietypowane" },
  { value: "saved", label: "Zapisane" },
  { value: "locked", label: "Zablokowane" },
]

export function PredictionsToolbar({
  availableGroups,
  filter,
  sortDir,
  onFilterChange,
  onSortDirChange,
}: PredictionsToolbarProps) {
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      onFilterChange({ ...filter, query: val })
    }, 200)
  }

  return (
    <div className="space-y-3">
      {/* Group filter */}
      {availableGroups.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Grupa</p>
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filtruj po grupie"
          >
            <button
              type="button"
              onClick={() => onFilterChange({ ...filter, group: "all" })}
              aria-pressed={filter.group === "all"}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                filter.group === "all"
                  ? "bg-primary text-primary-foreground border border-transparent"
                  : "bg-background text-foreground border border-border hover:bg-muted",
              )}
            >
              Wszystkie
            </button>
            {availableGroups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onFilterChange({ ...filter, group: g })}
                aria-pressed={filter.group === g}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  filter.group === g
                    ? "bg-primary text-primary-foreground border border-transparent"
                    : "bg-background text-foreground border border-border hover:bg-muted",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status filter + search + sort */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        {/* Status tabs */}
        <Tabs
          value={filter.status}
          onValueChange={(v) =>
            onFilterChange({ ...filter, status: v as "all" | StatusFilter })
          }
          className="min-w-0"
        >
          <TabsList aria-label="Filtruj po statusie typu">
            {STATUS_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-[200px] sm:flex-none">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Szukaj drużyny…"
              defaultValue={filter.query}
              onChange={handleQueryChange}
              className="pl-8"
              aria-label="Wyszukaj drużynę"
            />
          </div>

          {/* Sort toggle — cycles: grouped → asc → desc → grouped */}
          <Button
            variant="outline"
            size="default"
            type="button"
            onClick={() => {
              const next = sortDir === "grouped" ? "asc" : sortDir === "asc" ? "desc" : "grouped"
              onSortDirChange(next)
            }}
            aria-label={
              sortDir === "grouped"
                ? "Sortuj po dacie rosnąco"
                : sortDir === "asc"
                  ? "Sortuj po dacie malejąco"
                  : "Widok grupowy"
            }
            className="shrink-0"
          >
            {sortDir === "grouped" ? (
              <LayoutList className="size-4" aria-hidden />
            ) : sortDir === "asc" ? (
              <ArrowUp className="size-4" aria-hidden />
            ) : (
              <ArrowDown className="size-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Data</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
