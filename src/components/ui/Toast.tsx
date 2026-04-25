import { useEffect } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

const Toast = ({ message, show, onClose }: ToastProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-[#5a3e2b] text-white px-6 py-2.5 rounded-full shadow-lg text-sm transition-all duration-300 flex items-center gap-2">
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
