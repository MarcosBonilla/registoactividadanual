import React, { useEffect } from "react";
import "./Toast.scss";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return <div className={`toast ${type}`}>{message}</div>;
};

export default Toast;
