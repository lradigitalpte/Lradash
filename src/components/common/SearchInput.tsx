"use client"

import { Search, X } from "lucide-react"
import { useCallback, useState } from "react"

import { useDebounce } from "@/hooks/useDebounce"
import { cn } from "@/lib/utils"

import { Input } from "../ui/input"

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeStyles = {
  sm: "h-8 text-sm",
  md: "h-10",
  lg: "h-12 text-lg"
}

export function SearchInput({
  placeholder = "Search...",
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  className,
  size = "md"
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState("")
  const value = controlledValue ?? internalValue
  const debouncedValue = useDebounce(value, debounceMs)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      if (onChange) {
        onChange(newValue)
      } else {
        setInternalValue(newValue)
      }
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    if (onChange) {
      onChange("")
    } else {
      setInternalValue("")
    }
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(value)
      }
    },
    [onSearch, value]
  )

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn("pl-9 pr-9", sizeStyles[size])}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
