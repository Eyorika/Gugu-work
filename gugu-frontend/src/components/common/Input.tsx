import { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`rounded-md border p-2 ${className}`}
      {...props}
    />
  )
);