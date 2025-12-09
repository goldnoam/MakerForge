import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-maker-accent rounded-full border-t-transparent animate-spin"></div>
    </div>
    <span className="text-slate-400 font-mono text-sm">Generating Guide...</span>
  </div>
);

export default LoadingSpinner;