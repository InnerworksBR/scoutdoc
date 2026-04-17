import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-scout-700"
)

// Simplified Label without Radix for now if not installed, but standard is Radix.
// I'll use simple span to avoid install dependency hell if Radix is not used.
// But to be proper, I will just use a standard label element wrapped.

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
    />
))
Label.displayName = "Label" // LabelPrimitive.Root.displayName

export { Label }
