"use client"

import { useRef } from "react"
import { Search, ArrowUp, ArrowDown, LayoutList } from "lucide-react"
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

const pill = "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
const pillActive = "bg-primary text-primary-foreground border border-transparent shadow-sm"
const pillInactive = "bg-background text-foreground border border-border hover:bg-muted"

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
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filtruj po grupie"
          >
            <button
              type="button"
              onClick={() => onFilterChange({ ...filter, group: "all" })}
              aria-pressed={filter.group === "all"}
              className={cn(pill, filter.group === "all" ? pillActive : pillInactive)}
            >
              Wszystkie
            </button>
            {availableGroups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onFilterChange({ ...filter, group: g })}
                aria-pressed={filter.group === g}
                className={cn(pill, filter.group === g ? pillActive : pillInactive)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status filter */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtruj po statusie"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange({ ...filter, status: opt.value as "all" | StatusFilter })}
              aria-pressed={filter.status === opt.value}
              className={cn(pill, filter.status === opt.value ? pillActive : pillInactive)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Szukaj drużyny…"
            defaultValue={filter.query}
            onChange={handleQueryChange}
            className="pl-10 rounded-full"
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
          className="shrink-0 rounded-full"
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
  )
}
