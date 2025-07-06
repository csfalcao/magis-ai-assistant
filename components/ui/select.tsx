import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

// Simple Select implementation without Radix UI
const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || '')

  const handleSelect = (itemValue: string) => {
    setSelectedValue(itemValue)
    onValueChange?.(itemValue)
    setIsOpen(false)
  }

  // Extract SelectTrigger and SelectContent from children
  const selectTrigger = React.Children.toArray(children).find(
    (child: any) => child?.type?.displayName === 'SelectTrigger'
  )
  const selectContent = React.Children.toArray(children).find(
    (child: any) => child?.type?.displayName === 'SelectContent'
  )

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {selectTrigger}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {React.cloneElement(selectContent as React.ReactElement, {
            onSelect: handleSelect,
            selectedValue
          })}
        </div>
      )}
    </div>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </div>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
)

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: (value: string) => void
    selectedValue?: string
  }
>(({ className, children, onSelect, selectedValue, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-1 max-h-60 overflow-auto", className)}
    {...props}
  >
    {React.Children.map(children, (child: any) => 
      React.cloneElement(child, { onSelect, selectedValue })
    )}
  </div>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & SelectItemProps & {
    onSelect?: (value: string) => void
    selectedValue?: string
  }
>(({ className, children, value, onSelect, selectedValue, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
      selectedValue === value && "bg-blue-50 text-blue-600",
      className
    )}
    onClick={() => onSelect?.(value)}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}