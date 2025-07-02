import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  className?: string;
  position?: 'top' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, className, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
      top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
      right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  return (
    <span 
      className={`relative inline-block ${className || ''}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
            role="tooltip"
            className={`absolute w-max max-w-sm bg-overlay border border-dark-border text-dark-text-secondary text-xs rounded-md px-2 py-1 shadow-lg z-50 ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </span>
  );
};

export default Tooltip;