export const messageClass = (msg) => 
  msg.type === 'success'
    ? 'bg-green-100 border-green-400 text-green-700'
    : 'bg-red-100 border-red-400 text-red-700';

export const tabButtonClass = (isActive) =>
  `px-4 py-2 font-semibold transition-colors ${
    isActive
      ? 'text-cyan-600 border-b-2 border-cyan-600'
      : 'text-gray-600 hover:text-gray-900'
  }`;

export const actionButtonClass = (variant = 'default') => {
  const variants = {
    default: 'bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold',
    danger: 'bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold',
    publish: (isPublished) => isPublished
      ? 'bg-gray-600 text-white text-xs py-1 px-2 rounded hover:bg-gray-700 font-semibold'
      : 'bg-yellow-600 text-white text-xs py-1 px-2 rounded hover:bg-yellow-700 font-semibold',
    success: 'bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 font-semibold',
  };
  return variants[variant];
};

export const emptyStateUI = (Icon, message) => ({
  className: 'py-12 text-center text-gray-500',
  icon: Icon,
  message,
});
