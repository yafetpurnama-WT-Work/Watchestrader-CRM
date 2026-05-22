"use client"

import * as React from "react"
import { Search, ChevronDown, Check, Loader2, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface SearchableSelectOption {
  value: string | number
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | number
  onChange: (value: any) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  loading?: boolean
  error?: boolean
  className?: string
}

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
  error = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [focusedIndex, setFocusedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Reset search when opening/closing
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setFocusedIndex(-1)
    } else {
      // Small timeout to allow popover to render before focusing
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const query = search.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(query))
  }, [options, search])

  // Reset focus index when options change
  React.useEffect(() => {
    setFocusedIndex(-1)
  }, [filteredOptions])

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value))
  }, [options, value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        onChange(filteredOptions[focusedIndex].value)
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Scroll active item into view
  React.useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[focusedIndex] as HTMLElement
      if (activeEl) {
        const container = listRef.current
        const activeTop = activeEl.offsetTop
        const activeBottom = activeTop + activeEl.offsetHeight
        const containerTop = container.scrollTop
        const containerBottom = containerTop + container.clientHeight

        if (activeTop < containerTop) {
          container.scrollTop = activeTop
        } else if (activeBottom > containerBottom) {
          container.scrollTop = activeBottom - container.clientHeight
        }
      }
    }
  }, [focusedIndex])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled || loading}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm text-theme-text bg-theme-bg text-left transition-all outline-hidden disabled:opacity-50 disabled:cursor-not-allowed select-none",
          error
            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500"
            : "border-theme-border hover:border-theme-text-muted focus-visible:border-violet-500 focus-visible:ring-1 focus-visible:ring-violet-500",
          open && !error && "border-violet-500 ring-1 ring-violet-500",
          className
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-theme-text-muted")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-theme-text-muted shrink-0" />
        ) : (
          <ChevronDown className={cn("h-4 w-4 text-theme-text-muted shrink-0 transition-transform duration-200", open && "rotate-180")} />
        )}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        sideOffset={4}
        align="start"
        // Ensure popover is positioned nicely and inherits correct width
        className="w-(--anchor-width) min-w-[200px] max-w-full p-0 bg-theme-bg-secondary border border-theme-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 border-b border-theme-border px-3 py-2 bg-theme-bg-secondary sticky top-0 z-10 shrink-0">
          <Search className="h-4 w-4 text-theme-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-theme-text placeholder-theme-text-muted outline-hidden border-0 p-0 focus:ring-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-0.5 rounded-full hover:bg-theme-bg text-theme-text-muted hover:text-theme-text transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Options List Container */}
        {/* max-h-[384px] corresponds to exactly 12 items (32px each) or slightly less/more, allowing scroll */}
        <div
          ref={listRef}
          className="p-1 max-h-[384px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-theme-text-muted select-none">
              No data found
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = String(opt.value) === String(value)
              const isFocused = index === focusedIndex

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-theme-text transition-colors text-left select-none cursor-pointer",
                    isSelected && "bg-violet-600/10 text-violet-400 font-medium",
                    isFocused && !isSelected && "bg-theme-bg-hover text-theme-text",
                    !isSelected && !isFocused && "hover:bg-theme-bg-hover"
                  )}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-violet-400 shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
