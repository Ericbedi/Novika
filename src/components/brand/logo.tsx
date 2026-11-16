"use client";

import React, { useState } from 'react';
import { brandConfig } from '@/config/brand';

export type LogoVariant = 'full' | 'icon' | 'wordmark';
export type LogoTone = 'auto' | 'dark' | 'light' | 'mono';
export type LogoSize = 24 | 28 | 32 | 40 | 56;

export interface LogoProps {
  variant?: LogoVariant;
  tone?: LogoTone;
  size?: LogoSize;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  tone = 'auto',
  size = 32,
  className = '',
  onClick
}) => {
  const [imgError, setImgError] = useState(false);

  const getLogoPath = () => {
    if (imgError) return brandConfig.paths.fallback;
    
    if (variant === 'icon') {
      return tone === 'mono' ? brandConfig.paths.iconMono : brandConfig.paths.icon;
    }
    
    if (variant === 'wordmark') {
      return tone === 'dark' ? brandConfig.paths.wordmarkDark : brandConfig.paths.wordmarkLight;
    }
    
    return tone === 'dark' ? brandConfig.paths.fullDark : brandConfig.paths.fullLight;
  };

  const minHeight = variant === 'icon' ? '16px' : '20px';
  // Protection proportional padding (reduced to safe compact values)
  const protectionMargin = `${Math.round(size * 0.125)}px`; 

  return (
    <div 
      className={`inline-flex items-center justify-center select-none ${tone === 'auto' ? 'logo-auto-theme' : ''} ${className}`}
      style={{ padding: protectionMargin }}
      onClick={onClick}
    >
      <img
        src={getLogoPath()}
        alt={brandConfig.altText}
        style={{ height: `${size}px`, minHeight }}
        onError={() => setImgError(true)}
        className={`object-contain transition-transform duration-200 ${variant === 'icon' ? 'logo-pulse' : ''}`}
      />
    </div>
  );
};
