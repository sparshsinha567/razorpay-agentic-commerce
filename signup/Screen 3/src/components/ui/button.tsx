import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "link" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    let variantStyles = "bg-[#2b7fff] text-white hover:bg-blue-600 shadow-sm";
    if (variant === "outline") {
      variantStyles = "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50";
    } else if (variant === "link") {
      variantStyles = "bg-transparent text-[#2b7fff] hover:underline p-0 shadow-none";
    } else if (variant === "ghost") {
      variantStyles = "bg-transparent hover:bg-zinc-100 text-zinc-800 shadow-none";
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2b7fff]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
