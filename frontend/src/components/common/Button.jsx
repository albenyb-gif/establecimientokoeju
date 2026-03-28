import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled = false, 
    icon: Icon, 
    className = '', 
    ...props 
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
        danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20',
        ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white',
        outline: 'bg-transparent border-2 border-emerald-600 text-emerald-500 hover:bg-emerald-600/10'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon ? (
                <Icon size={size === 'lg' ? 20 : 18} />
            ) : null}
            {children}
        </button>
    );
};

export default Button;
