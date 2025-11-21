'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  className = '' 
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 pl-12 rounded-2xl
          bg-white/10 backdrop-blur-xl
          border-2 border-white/20
          text-white placeholder-white/50
          focus:border-emerald-400 focus:outline-none
          transition-colors duration-200
        "
        style={{ minHeight: '48px' }} // iPad Air touch target
      />
      
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">
        🔍
      </div>
      
      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange('')}
          className="
            absolute right-4 top-1/2 -translate-y-1/2 
            text-white/50 hover:text-white
            w-6 h-6 flex items-center justify-center
            rounded-full hover:bg-white/10
            transition-colors duration-200
          "
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}