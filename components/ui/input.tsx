import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // ScoutDoc 2026 — input sticker: borda grossa, foco azure
                    "flex h-12 w-full rounded-[13px] border-[2.5px] border-cream-300 bg-cream-50 px-4 py-2 text-sm font-medium text-scout-800 outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-azure-500 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
