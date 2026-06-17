import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ScoutDoc 2026 — botões "sticker": borda tinta + sombra hard-offset + efeito de pressionar.
   As variantes com sombra usam o mesmo utilitário (box-shadow) em hover/active para que a
   precedência do Tailwind aplique o efeito de clique corretamente. */
const sticker =
    "border-[2.5px] border-ink rounded-[14px] shadow-[3px_3px_0_#16302b] " +
    "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#16302b] " +
    "active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#16302b]"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap font-display font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-1",
    {
        variants: {
            variant: {
                default: `${sticker} bg-scout-600 text-white hover:bg-scout-700`,
                scout: `${sticker} bg-scout-600 text-white hover:bg-scout-700`,
                azure: `${sticker} bg-azure-500 text-white`,
                gold: `${sticker} bg-gold-500 text-ink`,
                secondary: `${sticker} bg-white text-ink`,
                outline: "rounded-[14px] border-[2.5px] border-ink bg-white text-ink hover:bg-cream-50",
                destructive: `${sticker} bg-destructive text-white`,
                ghost: "rounded-[12px] text-ink hover:bg-cream-100",
                link: "text-royal underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-5 py-2 text-sm",
                sm: "h-9 px-4 text-[13px]",
                lg: "h-14 px-8 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
