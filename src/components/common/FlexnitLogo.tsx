import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const FlexnitLogo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const heights = {
    sm: "h-5",
    md: "h-7",
    lg: "h-10",
  };

  return (
    <div className={`flex items-center select-none cursor-pointer ${heights[size]} ${className}`}>
      <svg
        viewBox="0 0 450 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        <defs>
          <linearGradient id="flexnitRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E50914" />
            <stop offset="100%" stopColor="#B80610" />
          </linearGradient>
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#E50914" floodOpacity="0.3" />
          </filter>
        </defs>
        <text
          x="5"
          y="85"
          fill="url(#flexnitRedGrad)"
          fontFamily="'Arial Black', 'Helvetica Neue', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="88"
          letterSpacing="4"
          filter="url(#subtleGlow)"
          transform="scale(1, 1.05)"
        >
          FLEXNIT
        </text>
      </svg>
    </div>
  );
};
