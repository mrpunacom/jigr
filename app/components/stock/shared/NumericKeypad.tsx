'use client';

interface NumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  className?: string;
}

export function NumericKeypad({ 
  value, 
  onChange, 
  allowDecimals = true, 
  className = '' 
}: NumericKeypadProps) {
  
  const handlePress = (key: string) => {
    const currentStr = value.toString();
    
    if (key === 'C') {
      onChange(0);
    } else if (key === '←') {
      if (currentStr.length <= 1) {
        onChange(0);
      } else {
        const newStr = currentStr.slice(0, -1);
        onChange(parseFloat(newStr) || 0);
      }
    } else if (key === '.') {
      if (allowDecimals && !currentStr.includes('.')) {
        onChange(parseFloat(currentStr + '.0'));
      }
    } else if (key === '00') {
      // Quick double zero
      if (currentStr !== '0') {
        onChange(parseFloat(currentStr + '00'));
      }
    } else {
      // Number key
      if (currentStr === '0') {
        onChange(parseFloat(key));
      } else {
        onChange(parseFloat(currentStr + key));
      }
    }
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'], 
    ['1', '2', '3'],
    [allowDecimals ? '.' : '00', '0', '←']
  ];

  return (
    <div className={`numeric-keypad ${className}`}>
      {/* Number Grid */}
      {keys.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 mb-3">
          {row.map(key => (
            <button
              key={key}
              onClick={() => handlePress(key)}
              disabled={key === '.' && !allowDecimals}
              className="
                h-16 rounded-2xl
                bg-white/10 backdrop-blur-xl
                border-2 border-white/20
                text-white text-2xl font-semibold
                hover:bg-white/20
                active:bg-white/30
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150
                transform active:scale-95
              "
              style={{ 
                minHeight: '64px', // Larger than 44px for better touch
                minWidth: '64px' 
              }}
            >
              {key === '←' ? '⌫' : key}
            </button>
          ))}
        </div>
      ))}
      
      {/* Clear Button */}
      <button
        onClick={() => handlePress('C')}
        className="
          w-full h-16 rounded-2xl mt-3
          bg-red-500/20 border-2 border-red-400/50
          text-white text-xl font-semibold
          hover:bg-red-500/30
          active:bg-red-500/40
          transition-all duration-150
          transform active:scale-95
        "
        style={{ minHeight: '64px' }}
      >
        Clear
      </button>
    </div>
  );
}