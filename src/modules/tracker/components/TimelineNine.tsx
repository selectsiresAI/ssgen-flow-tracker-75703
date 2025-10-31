export function TimelineNine({ steps }: { steps: { name: string; status: 'done' | 'pending' | 'late' }[] }) {
  const getColor = (s: 'done' | 'pending' | 'late') => {
    if (s === 'done') return 'bg-green-500';
    if (s === 'late') return 'bg-red-500';
    return 'bg-yellow-400';
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${getColor(s.status)}`} title={s.name} />
          {i < steps.length - 1 && <div className="w-6 h-px bg-zenith-navy/30" />}
        </div>
      ))}
    </div>
  );
}
