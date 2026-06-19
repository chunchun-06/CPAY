import { getStatusColor, getStatusLabel } from '../../utils/formatters';

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export default function Badge({ status, size = 'sm', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full border',
        getStatusColor(status),
        sizes[size] || sizes.sm,
        className,
      ].join(' ')}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {getStatusLabel(status)}
    </span>
  );
}
