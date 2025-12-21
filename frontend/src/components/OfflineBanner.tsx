import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
}

export default function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-center gap-2 animate-fadeIn">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You're offline</span>
      <span className="text-xs text-slate-400">• Showing cached data</span>
    </div>
  );
}
