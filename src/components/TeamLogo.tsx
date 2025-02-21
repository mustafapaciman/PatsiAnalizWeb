import React, { useState } from 'react';
import { TeamMapping } from '../utils/types/team';
import { getTeamLogo } from '../utils/teamLogoLoader';

const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";

interface TeamLogoProps {
  name: string;
  className?: string;
  teamData?: TeamMapping;
  showName?: boolean;
}

export function TeamLogo({ name, className = '', teamData, showName = false }: TeamLogoProps) {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error) {
    // Fallback olarak takım adının ilk harfini gösteren bir div
    return (
      <div className={`${className} bg-gray-700 rounded-full flex items-center justify-center`}>
        <span className="text-white text-lg font-bold">
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  const logoUrl = getTeamLogo(name);
  
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={logoUrl || EMPTY_LOGO}
        alt={`${name} logo`}
        className={`inline-block object-contain ${className}`}
        style={{
          imageRendering: '-webkit-optimize-contrast',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          WebkitFontSmoothing: 'subpixel-antialiased'
        }}
        onError={handleError}
      />
      {showName && (
        <span className="text-xs text-gray-600 text-center max-w-[80px] truncate" title={name}>
          {name}
        </span>
      )}
    </div>
  );
} 