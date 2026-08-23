import React, { useState } from 'react';
import logoUrl from '../../../assets/logo.svg';

interface LogoProps {
  /** Rendered size in px (square) */
  size?: number;
  className?: string;
  /** Tailwind border-radius classes */
  rounded?: string;
}

/**
 * Platform-wide SoloFlow logo mark.
 * Renders the brand image with a graceful fallback to the "S" monogram
 * if the asset fails to load.
 */
export const Logo: React.FC<LogoProps> = ({ size = 32, className = '', rounded = 'rounded-[10px]' }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${rounded} flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #2A2320 0%, #4A3E33 100%)',
          boxShadow: '0 4px 12px -4px rgba(42,35,32,0.5)',
        }}
      >
        <span className="text-white font-bold tracking-tight" style={{ fontSize: Math.round(size * 0.42) }}>
          S
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt="SoloFlow logo"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`${rounded} shrink-0 object-cover ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
};