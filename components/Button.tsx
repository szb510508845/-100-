import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  pulse = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative font-bold uppercase transition-transform active:scale-95 border-b-4 active:border-b-0 active:translate-y-1 focus:outline-none pixel-art";
  
  const variants = {
    primary: "bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-500",
    secondary: "bg-slate-700 text-gray-200 border-slate-900 hover:bg-slate-600",
    danger: "bg-red-600 text-white border-red-800 hover:bg-red-500",
    success: "bg-green-500 text-black border-green-700 hover:bg-green-400",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-lg w-full",
  };

  const pulseClass = pulse ? "animate-pulse neon-border" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${pulseClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};