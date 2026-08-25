import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", onChange, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        onChange={(e) => {
          if (onChange) onChange(e);
          if (onCheckedChange) onCheckedChange(e.target.checked);
        }}
        className={`h-4 w-4 rounded border-zinc-300 text-[#2b7fff] focus:ring-[#2b7fff] cursor-pointer ${className}`}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
