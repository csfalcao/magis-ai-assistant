import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

// Simple Tabs implementation without Radix UI
const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  const [activeTab, setActiveTab] = React.useState(value || '')

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
    onValueChange?.(tabValue)
  }

  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child: any) => 
        React.cloneElement(child, { 
          activeTab, 
          onTabChange: handleTabChange 
        })
      )}
    </div>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    activeTab?: string
    onTabChange?: (value: string) => void
  }
>(({ className, children, activeTab, onTabChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child: any) => 
      React.cloneElement(child, { activeTab, onTabChange })
    )}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & TabsTriggerProps & {
    activeTab?: string
    onTabChange?: (value: string) => void
  }
>(({ className, value, children, activeTab, onTabChange, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      activeTab === value 
        ? "bg-white text-gray-900 shadow-sm" 
        : "text-gray-500 hover:text-gray-700",
      className
    )}
    onClick={() => onTabChange?.(value)}
    {...props}
  >
    {children}
  </button>
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TabsContentProps & {
    activeTab?: string
  }
>(({ className, value, children, activeTab, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      activeTab !== value && "hidden",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }