import React from 'react';

// Keypad Component
interface KeypadProps {
  onInput: (n: number) => void;
  onDelete: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({ onInput, onDelete }) => (
  <div className="grid grid-cols-3 gap-2 w-[220px] mt-2">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
      <button 
        key={n} 
        className="bg-white/10 border border-white/20 text-white p-3 rounded-xl font-bold text-xl active:bg-white/30 active:scale-95 transition touch-manipulation"
        onPointerDown={(e) => { e.preventDefault(); onInput(n); }}
      >
        {n}
      </button>
    ))}
    <button 
      className="bg-red-500/30 border border-red-500/50 text-white p-3 rounded-xl font-bold text-xl col-span-2 active:bg-red-500/50 active:scale-95 transition touch-manipulation"
      onPointerDown={(e) => { e.preventDefault(); onDelete(); }}
    >
      ⬅
    </button>
  </div>
);

// ChoicePad Component
interface ChoicePadProps {
  options: number[];
  onSelect: (n: number) => void;
  colorClass: string;
}

export const ChoicePad: React.FC<ChoicePadProps> = ({ options, onSelect, colorClass }) => (
  <div className="grid grid-cols-2 gap-3 w-full max-w-[400px] px-4">
    {options.map((opt) => (
      <button 
        key={opt} 
        className={`choice-btn ${colorClass} text-white py-4 rounded-xl font-bold text-2xl border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition touch-manipulation`}
        onPointerDown={(e) => { e.preventDefault(); onSelect(opt); }}
      >
        {opt}
      </button>
    ))}
  </div>
);

// Feedback Overlay Component
interface FeedbackProps {
  type: 'correct' | 'wrong';
}

export const FeedbackOverlay: React.FC<FeedbackProps> = ({ type }) => (
  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
    <div className="animate-pop-in bg-white rounded-full p-6 shadow-2xl border-4 border-gray-200">
      <span className="text-6xl filter drop-shadow-md">
        {type === 'correct' ? '✅' : '❌'}
      </span>
    </div>
  </div>
);