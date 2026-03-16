export default function ScoreBadge({ tier, score, size = 'sm' }) {
  const tierColors = {
    Mighty: 'bg-green-500 text-white',
    Strong: 'bg-blue-500 text-white',
    Fair: 'bg-yellow-400 text-gray-900',
    Weak: 'bg-red-500 text-white',
  };

  const color = tierColors[tier] || 'bg-gray-600 text-white';
  const sizeClass = size === 'lg' ? 'text-2xl font-bold px-4 py-2 rounded-xl' : 'text-xs font-bold px-2 py-0.5 rounded-lg';

  if (!score && score !== 0) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${color} ${sizeClass}`}>
      {score !== null && score !== undefined ? Math.round(score) : '?'}
      {tier && size === 'lg' && <span className="text-sm font-normal ml-1">{tier}</span>}
    </span>
  );
}
