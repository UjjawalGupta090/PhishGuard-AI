import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { RiskLevel, ChannelGuess } from '../types/contract';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  channelGuess?: ChannelGuess;
  seenBefore: boolean;
}

export function RiskGauge({ score, level, seenBefore }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // SVG circular gauge geometry aligned to Fibonacci 144 proportions
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  // Smooth animated count-up and stroke fill from 0 to score
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1800; // 1.8s smooth, stately count-up
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quartic curve for cinematic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Math.round(easeOut * score));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    setAnimatedScore(0);
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getTheme = () => {
    switch (level) {
      case 'high':
        return {
          stroke: '#f43f5e', // rose-500
          text: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60',
          badgeBg: 'bg-rose-600 text-white shadow-rose-600/30',
          glow: 'bg-rose-500/25 dark:bg-rose-500/20',
          label: 'HIGH RISK',
          sublabel: 'Confirmed Phishing / Malicious Threat',
          icon: <ShieldAlert className="w-4 h-4 text-white" />,
        };
      case 'medium':
        return {
          stroke: '#f59e0b', // amber-500
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60',
          badgeBg: 'bg-amber-500 text-white shadow-amber-500/30',
          glow: 'bg-amber-500/25 dark:bg-amber-500/20',
          label: 'MEDIUM RISK',
          sublabel: 'Suspicious Anomalies Detected — Exercise Caution',
          icon: <AlertTriangle className="w-4 h-4 text-white" />,
        };
      case 'low':
      default:
        return {
          stroke: '#10b981', // emerald-500
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60',
          badgeBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
          glow: 'bg-emerald-500/25 dark:bg-emerald-500/20',
          label: 'LOW RISK',
          sublabel: 'No Severe Phishing Indicators Found',
          icon: <ShieldCheck className="w-4 h-4 text-white" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border ${theme.bg} material-elevation-2 transition-all duration-500 animate-material-fade`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Gauge Centerpiece with Ambient Glow & Animated Counter */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Ambient soft pulsing glow behind circle matching severity */}
          <div
            className={`absolute w-32 h-32 rounded-full blur-xl pointer-events-none transition-all duration-1000 ${theme.glow} animate-pulse`}
          />

          <svg className="w-[144px] h-[144px] transform -rotate-90 drop-shadow-xs transition-transform duration-500 hover:scale-105" viewBox="0 0 144 144">
            {/* Background Track */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth="11"
              fill="transparent"
              className="text-slate-200/80 dark:text-slate-800/80"
            />
            {/* Animated Dynamic Value Fill */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={theme.stroke}
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-75 ease-out"
            />
          </svg>

          {/* Centered Animated Score Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-[44px] sm:text-[48px] font-black tracking-tight leading-none ${theme.text} transition-transform duration-300`}>
              {animatedScore}
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mt-1">
              / 100
            </span>
          </div>
        </div>

        {/* Verdict & Meta Details */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {/* High/Medium/Low Badge with Icon + Color + Text */}
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide shadow-md transition-transform duration-300 hover:scale-105 ${theme.badgeBg}`}
            >
              {theme.icon}
              <span>{theme.label}</span>
            </span>

            {/* Seen Before Badge */}
            {seenBefore && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <RefreshCw className="w-3 h-3" />
                <span>Analyzed before</span>
              </span>
            )}
          </div>

          <h3 className="text-[18px] sm:text-[21px] font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {theme.sublabel}
          </h3>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            Multi-signal assessment computed via deterministic rule patterns fused with Google Gemini contextual reasoning.
          </p>
        </div>
      </div>
    </div>
  );
}
