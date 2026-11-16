"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // millisecondes (décalage conseillé : 40ms par élément, max 240ms)
  duration?: number; // millisecondes (250 à 400ms, max 600ms)
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number; // pixels (recommandé 12 à 20px)
  threshold?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 320,
  direction = "up",
  distance = 16,
  threshold = 0.1,
  as: Component = "div",
}: RevealProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Si l'utilisateur a activé reduced motion ou si déjà animé, afficher immédiatement
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const currentEl = ref.current;
    if (!currentEl) return;

    // Utilisation de IntersectionObserver pour animer une seule fois par session
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(currentEl);
    return () => observer.disconnect();
  }, [reducedMotion, hasAnimated, threshold]);

  // Si reduced motion : visibilité directe sans transformation
  if (reducedMotion) {
    const Tag = Component as any;
    return <Tag className={className}>{children}</Tag>;
  }

  // Calcul du vecteur de translation
  let initialTransform = "none";
  if (!isVisible) {
    switch (direction) {
      case "up":
        initialTransform = `translate3d(0, ${distance}px, 0)`;
        break;
      case "down":
        initialTransform = `translate3d(0, -${distance}px, 0)`;
        break;
      case "left":
        initialTransform = `translate3d(${distance}px, 0, 0)`;
        break;
      case "right":
        initialTransform = `translate3d(-${distance}px, 0, 0)`;
        break;
      case "none":
      default:
        initialTransform = "none";
        break;
    }
  }

  const Tag = Component as any;

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-[opacity,transform]",
        isVisible ? "opacity-100 transform-none" : "opacity-0",
        className
      )}
      style={{
        transitionDuration: `${Math.min(Math.max(duration, 120), 600)}ms`,
        transitionDelay: `${Math.min(delay, 400)}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isVisible ? "none" : initialTransform,
        willChange: !hasAnimated ? "opacity, transform" : "auto",
      }}
    >
      {children}
    </Tag>
  );
}
