'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 dark:hover:border-slate-600',
        ghost:
          'bg-transparent border border-transparent focus:bg-slate-100/45 dark:focus:bg-slate-900/40 focus:border-slate-300 dark:focus:border-slate-700/60',
        filled:
          'bg-slate-200/50 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
      },
      inputSize: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3.5',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

/* ------------------------------------------------------------------ */
/*  Base Input                                                         */
/* ------------------------------------------------------------------ */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ variant, inputSize }), className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

/* ------------------------------------------------------------------ */
/*  Search Input                                                       */
/* ------------------------------------------------------------------ */

export interface SearchInputProps extends InputProps {
  /** Callback fired on each keystroke, debounced externally if desired */
  onSearch?: (value: string) => void;
  /** Icon size in pixels */
  iconSize?: number;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      onSearch,
      iconSize = 16,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onSearch?.(e.target.value);
    };

    return (
      <div className="relative">
        <Search
          size={iconSize}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          ref={ref}
          type="search"
          className={cn(
            inputVariants({ variant, inputSize }),
            'pl-9',
            className
          )}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { Input, SearchInput, inputVariants };
