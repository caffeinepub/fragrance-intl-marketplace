import { Clock } from "lucide-react";
import React, { useState, useEffect } from "react";

interface AuctionCountdownProps {
  endTime: number; // Unix ms timestamp
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

function calcTimeLeft(endTime: number): TimeLeft {
  const diff = endTime - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, ended: false };
}

export default function AuctionCountdown({
  endTime,
  className = "",
  compact = false,
}: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calcTimeLeft(endTime),
  );

  useEffect(() => {
    setTimeLeft(calcTimeLeft(endTime));
    const interval = setInterval(() => {
      const tl = calcTimeLeft(endTime);
      setTimeLeft(tl);
      if (tl.ended) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft.ended) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-muted-foreground font-sans text-sm ${className}`}
      >
        <Clock className="w-3.5 h-3.5" />
        Ended
      </span>
    );
  }

  if (compact) {
    const parts: string[] = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    parts.push(`${String(timeLeft.hours).padStart(2, "0")}h`);
    parts.push(`${String(timeLeft.minutes).padStart(2, "0")}m`);
    parts.push(`${String(timeLeft.seconds).padStart(2, "0")}s`);
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-sm text-amber-600 dark:text-amber-400 ${className}`}
      >
        <Clock className="w-3.5 h-3.5" />
        {parts.join(" ")}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="font-mono text-lg font-bold text-foreground leading-none">
              {timeLeft.days}
            </div>
            <div className="font-sans text-xs text-muted-foreground">d</div>
          </div>
        )}
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-foreground leading-none">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <div className="font-sans text-xs text-muted-foreground">h</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-foreground leading-none">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <div className="font-sans text-xs text-muted-foreground">m</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-amber-500 leading-none">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <div className="font-sans text-xs text-muted-foreground">s</div>
        </div>
      </div>
    </div>
  );
}
