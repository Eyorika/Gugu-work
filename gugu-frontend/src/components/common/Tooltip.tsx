import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'right', 
  disabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled) return <>{children}</>;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap ${
            position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-1' :
            position === 'right' ? 'left-full top-1/2 transform -translate-y-1/2 ml-1' :
            position === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' :
            'right-full top-1/2 transform -translate-y-1/2 mr-1'
          }`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
              position === 'right' ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2' :
              position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
              'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};