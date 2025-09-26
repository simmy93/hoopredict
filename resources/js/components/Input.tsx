import { forwardRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, icon, placeholder, ...props }, ref) => {
        const [focused, setFocused] = useState(false);
        const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

        const handleFocus = () => setFocused(true);
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
        };
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
        };

        return (
            <div className="space-y-2">
                <div className="relative">
                    <input
                        type={type}
                        className={cn(
                            'peer w-full rounded-xl border-2 bg-white/50 px-4 pb-2 pt-6 text-sm font-medium backdrop-blur-sm transition-all duration-200',
                            'focus:border-primary-500 focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-primary-500/20',
                            'dark:bg-gray-800/50 dark:focus:bg-gray-800/80',
                            error
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-300 dark:border-gray-600',
                            icon && 'pl-11',
                            className
                        )}
                        ref={ref}
                        placeholder=" "
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        {...props}
                    />

                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            {icon}
                        </div>
                    )}

                    {label && (
                        <label
                            className={cn(
                                'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600 transition-all duration-200 dark:text-gray-300',
                                icon && 'left-11',
                                (focused || hasValue || placeholder) && 'top-2 translate-y-0 text-xs text-primary-600 dark:text-primary-400',
                                error && (focused || hasValue || placeholder) && 'text-red-500'
                            )}
                        >
                            {label}
                        </label>
                    )}
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };