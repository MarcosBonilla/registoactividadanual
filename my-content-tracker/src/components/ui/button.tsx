// components/ui/button.tsx
import React from "react";
import './button.css'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  const base = 'app-button';
  const classes = `${base} ${className}`.trim();
  return (
    <button
      {...props}
      className={classes}
    >
      {children}
    </button>
  );
};