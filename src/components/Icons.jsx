import React from 'react';
import { 
  Activity as LActivity, 
  AlertCircle as LAlertCircle, 
  AlertTriangle as LAlertTriangle, 
  Award as LAward, 
  BarChart2 as LBarChart2, 
  Bell as LBell, 
  CheckCircle as LCheckCircle, 
  Clock as LClock, 
  FolderOpen as LFolderOpen, 
  Layers as LLayers, 
  RefreshCw as LRefreshCw, 
  Search as LSearch, 
  ShieldCheck as LShieldCheck, 
  SlidersHorizontal as LSlidersHorizontal, 
  Sparkles as LSparkles, 
  Target as LTarget, 
  Timer as LTimer, 
  TrendingDown as LTrendingDown, 
  TrendingUp as LTrendingUp, 
  User as LUser, 
  Users as LUsers, 
  Wifi as LWifi, 
  X as LX, 
  Zap as LZap,
  Shield as LShield,
  MessageSquare as LMessageSquare,
  Briefcase as LBriefcase
} from 'lucide-react';

const wrapIcon = (IconComponent, defaultAnimClass) => {
  return function AnimatedIcon({ size = 24, color = "currentColor", style, className = "", animClass, ...props }) {
    const animation = animClass !== undefined ? animClass : defaultAnimClass;
    const combinedClass = animation ? `${animation} ${className}` : className;
    return <IconComponent size={size} color={color} style={style} className={combinedClass.trim()} {...props} />;
  }
}

export const Activity = wrapIcon(LActivity, 'anim-pulse');
export const AlertCircle = wrapIcon(LAlertCircle, 'anim-pulse');
export const AlertTriangle = wrapIcon(LAlertTriangle, 'anim-pulse delay-1');
export const Award = wrapIcon(LAward, 'anim-float');
export const BarChart2 = wrapIcon(LBarChart2, 'anim-pulse origin-bottom');
export const Bell = wrapIcon(LBell, 'anim-swing origin-top');
export const CheckCircle = wrapIcon(LCheckCircle, 'anim-pulse');
export const Clock = wrapIcon(LClock, 'anim-spin');
export const FolderOpen = wrapIcon(LFolderOpen, '');
export const Layers = wrapIcon(LLayers, 'anim-float');
export const RefreshCw = wrapIcon(LRefreshCw, 'anim-spin');
export const Search = wrapIcon(LSearch, 'anim-slide-x');
export const ShieldCheck = wrapIcon(LShieldCheck, 'anim-pulse');
export const SlidersHorizontal = wrapIcon(LSlidersHorizontal, 'anim-slide-x delay-2');
export const Sparkles = wrapIcon(LSparkles, 'anim-pulse');
export const Target = wrapIcon(LTarget, 'anim-pulse delay-2');
export const Timer = wrapIcon(LTimer, 'anim-spin');
export const TrendingDown = wrapIcon(LTrendingDown, 'anim-slide-x');
export const TrendingUp = wrapIcon(LTrendingUp, 'anim-slide-x');
export const User = wrapIcon(LUser, 'anim-fade-wave');
export const Users = wrapIcon(LUsers, 'anim-fade-wave');
export const Wifi = wrapIcon(LWifi, 'anim-pulse origin-bottom');
export const X = wrapIcon(LX, '');
export const Zap = wrapIcon(LZap, 'anim-pulse delay-1');
export const Shield = wrapIcon(LShield, 'anim-pulse');
export const MessageSquare = wrapIcon(LMessageSquare, '');
export const Briefcase = wrapIcon(LBriefcase, '');
