import { type ReactNode } from "react";
import {
  Info, AlertTriangle, CheckCircle, Flame, HelpCircle,
  Quote, Bug, Lightbulb, Zap, ListTodo, Pencil, BookOpen,
  XCircle, Shield
} from "lucide-react";

const CALLOUT_CONFIG: Record<string, { icon: typeof Info; color: string; bg: string; border: string }> = {
  info:    { icon: Info,          color: "text-blue-400",   bg: "bg-blue-500/8",   border: "border-blue-500/30" },
  tip:     { icon: Lightbulb,     color: "text-green-400",  bg: "bg-green-500/8",  border: "border-green-500/30" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/8", border: "border-yellow-500/30" },
  danger:  { icon: Zap,           color: "text-red-400",    bg: "bg-red-500/8",    border: "border-red-500/30" },
  error:   { icon: XCircle,       color: "text-red-400",    bg: "bg-red-500/8",    border: "border-red-500/30" },
  success: { icon: CheckCircle,   color: "text-emerald-400",bg: "bg-emerald-500/8",border: "border-emerald-500/30" },
  question:{ icon: HelpCircle,    color: "text-purple-400", bg: "bg-purple-500/8", border: "border-purple-500/30" },
  quote:   { icon: Quote,         color: "text-gray-400",   bg: "bg-gray-500/8",   border: "border-gray-500/30" },
  bug:     { icon: Bug,           color: "text-red-300",    bg: "bg-red-500/8",    border: "border-red-500/30" },
  example: { icon: ListTodo,      color: "text-indigo-400", bg: "bg-indigo-500/8", border: "border-indigo-500/30" },
  note:    { icon: Pencil,        color: "text-cyan-400",   bg: "bg-cyan-500/8",   border: "border-cyan-500/30" },
  abstract:{ icon: BookOpen,      color: "text-teal-400",   bg: "bg-teal-500/8",   border: "border-teal-500/30" },
  important:{ icon: Flame,        color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/30" },
  caution: { icon: Shield,        color: "text-amber-400",  bg: "bg-amber-500/8",  border: "border-amber-500/30" },
};

interface CalloutProps {
  type?: string;
  title?: string;
  children: ReactNode;
}

export default function Callout({ type = "info", title, children }: CalloutProps) {
  const config = CALLOUT_CONFIG[type.toLowerCase()] || CALLOUT_CONFIG.info;
  const Icon = config.icon;
  const displayTitle = title || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className={`my-6 rounded-xl border ${config.border} ${config.bg} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 ${config.color} font-medium text-sm`}>
        <Icon size={16} />
        <span className="font-heading">{displayTitle}</span>
      </div>
      <div className="px-4 pb-4 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </div>
  );
}
