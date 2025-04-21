// components/ui/button.tsx
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
    >
      {children}
    </button>
  );
};