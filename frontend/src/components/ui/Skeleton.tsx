// Skeleton components for admin panel loading states

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-4 w-24 mb-2" />
          <div className="skeleton h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-20 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} className="skeleton h-4 flex-1" style={{ width: colIdx === 0 ? '30%' : '20%' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="skeleton h-5 w-32 mb-4" />
      <div className="skeleton w-full rounded-lg" style={{ height }} />
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-4 w-32 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-4">
      <div>
        <div className="skeleton h-4 w-20 mb-2" />
        <div className="skeleton h-10 w-full rounded-lg" />
      </div>
      <div>
        <div className="skeleton h-4 w-24 mb-2" />
        <div className="skeleton h-10 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="skeleton h-4 w-16 mb-2" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
        <div>
          <div className="skeleton h-4 w-16 mb-2" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
