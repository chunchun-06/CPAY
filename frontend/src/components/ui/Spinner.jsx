const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
  xl: 'h-16 w-16 border-4',
};

export default function Spinner({ size = 'md', color = 'emerald', className = '' }) {
  const colorClass =
    color === 'white' ? 'border-white/20 border-t-white' : 'border-emerald-500/20 border-t-emerald-500';

  return (
    <div
      className={[
        'rounded-full animate-spin',
        sizeMap[size] || sizeMap.md,
        colorClass,
        className,
      ].join(' ')}
      role="status"
      aria-label="Loading..."
    />
  );
}
