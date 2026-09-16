import React from 'react';

interface UCULogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textColor?: 'dark' | 'light';
  orientation?: 'vertical' | 'horizontal';
}

export const UCULogo: React.FC<UCULogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textColor = 'dark',
  orientation = 'horizontal',
}) => {
  // Dimension mapping
  const sizeMap: Record<string, { width: number; height: number; emblemSize: number }> = {
    xs: { width: 24, height: 28, emblemSize: 24 },
    sm: { width: 34, height: 40, emblemSize: 34 },
    md: { width: 44, height: 50, emblemSize: 44 },
    lg: { width: 64, height: 72, emblemSize: 64 },
    xl: { width: 96, height: 110, emblemSize: 96 },
  };

  const currentSize =
    typeof size === 'number'
      ? { width: size, height: Math.round(size * 1.15), emblemSize: size }
      : sizeMap[size] || sizeMap.md;

  const emblemSvg = (
    <svg
      viewBox="0 0 240 230"
      width={currentSize.emblemSize}
      height={Math.round(currentSize.emblemSize * 0.96)}
      className="shrink-0 drop-shadow-sm"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Royal Blue Gradient for Shield Border */}
        <linearGradient id="shieldBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B57C2" />
          <stop offset="50%" stopColor="#0047AB" />
          <stop offset="100%" stopColor="#082963" />
        </linearGradient>

        {/* Episcopal Magenta Field (UCU Bishop's Amaranth) */}
        <linearGradient id="shieldMagentaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E6007E" />
          <stop offset="50%" stopColor="#D80072" />
          <stop offset="100%" stopColor="#BE0061" />
        </linearGradient>

        {/* Golden Yellow for Cross & Alpha/Omega */}
        <linearGradient id="crossGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="40%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#E5A600" />
        </linearGradient>

        {/* Emerald Green for Ribbon */}
        <linearGradient id="ribbonGreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00883E" />
          <stop offset="50%" stopColor="#00A852" />
          <stop offset="100%" stopColor="#006D31" />
        </linearGradient>
      </defs>

      {/* 1. HERALDIC SHIELD: OUTER ROYAL BLUE BORDER */}
      <path
        d="M 120 16
           C 145 16, 168 10, 185 8
           C 183 23, 186 34, 196 41
           C 182 51, 178 69, 180 94
           C 182 124, 172 154, 148 184
           C 134 201, 120 215, 120 215
           C 120 215, 106 201, 92 184
           C 68 154, 58 124, 60 94
           C 62 69, 58 51, 44 41
           C 54 34, 57 23, 55 8
           C 72 10, 95 16, 120 16 Z"
        fill="url(#shieldBlueGrad)"
        stroke="#FFCC00"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 2. INNER SHIELD: EPISCOPAL MAGENTA / FUCHSIA FIELD */}
      <path
        d="M 120 23
           C 143 23, 163 18, 177 16
           C 175 27, 177 36, 186 43
           C 173 52, 170 67, 172 91
           C 174 119, 164 147, 142 175
           C 130 190, 120 202, 120 202
           C 120 202, 110 190, 98 175
           C 76 147, 66 119, 68 91
           C 70 67, 67 52, 54 43
           C 63 36, 65 27, 63 16
           C 77 18, 97 23, 120 23 Z"
        fill="url(#shieldMagentaGrad)"
        stroke="#FFD700"
        strokeWidth="1.6"
      />

      {/* 3. CENTRAL GOLDEN LATIN CROSS (Double line core) */}
      {/* Vertical Cross Beam */}
      <rect x="115" y="23" width="10" height="176" fill="url(#crossGoldGrad)" />
      <rect x="117.5" y="23" width="5" height="176" fill="#FFFDE0" />
      <line x1="115" y1="23" x2="115" y2="199" stroke="#B38600" strokeWidth="0.8" />
      <line x1="125" y1="23" x2="125" y2="199" stroke="#B38600" strokeWidth="0.8" />

      {/* Horizontal Cross Beam */}
      <rect x="66" y="85" width="108" height="10" fill="url(#crossGoldGrad)" />
      <rect x="66" y="87.5" width="108" height="5" fill="#FFFDE0" />
      <line x1="66" y1="85" x2="174" y2="85" stroke="#B38600" strokeWidth="0.8" />
      <line x1="66" y1="95" x2="174" y2="95" stroke="#B38600" strokeWidth="0.8" />

      {/* 4. TOP-LEFT: GREEK LETTER ALPHA (A) */}
      <text
        x="91"
        y="75"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        fontSize="34"
        fill="#FFEA00"
        stroke="#A67C00"
        strokeWidth="0.6"
      >
        A
      </text>

      {/* 5. TOP-RIGHT: GREEK LETTER OMEGA (Ω) */}
      <text
        x="149"
        y="75"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        fontSize="33"
        fill="#FFEA00"
        stroke="#A67C00"
        strokeWidth="0.6"
      >
        Ω
      </text>

      {/* 6. BOTTOM-LEFT: OPEN HOLY BIBLE */}
      <g transform="translate(73, 116)">
        <path
          d="M 1 9 C -2 5, -8 3, -16 5 L -16 21 C -8 19, -2 21, 1 25 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="0.8"
        />
        <path
          d="M 1 9 C 4 5, 10 3, 18 5 L 18 21 C 10 19, 4 21, 1 25 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="0.8"
        />
        <line x1="1" y1="8" x2="1" y2="25" stroke="#64748B" strokeWidth="1.2" />
        <line x1="-13" y1="9" x2="-4" y2="8" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="-13" y1="12" x2="-4" y2="11" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="-13" y1="15" x2="-4" y2="14" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="-13" y1="18" x2="-5" y2="17" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="6" y1="8" x2="15" y2="9" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="6" y1="11" x2="15" y2="12" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="6" y1="14" x2="15" y2="15" stroke="#1E293B" strokeWidth="0.9" />
        <line x1="6" y1="17" x2="14" y2="18" stroke="#1E293B" strokeWidth="0.9" />
        <path d="M 0 24 L 3 31 L 0 29 L -3 31 Z" fill="#FFCC00" />
      </g>

      {/* 7. BOTTOM-RIGHT: HOLY SPIRIT WHITE DOVE */}
      <g transform="translate(148, 124)">
        <path
          d="M -12 2
             C -10 -2, -6 -6, -1 -6
             C 2 -9, 8 -15, 12 -19
             C 13 -18, 10 -11, 7 -6
             C 11 -8, 15 -10, 18 -10
             C 17 -7, 13 -3, 8 1
             C 12 3, 17 6, 19 10
             C 15 9, 10 7, 5 5
             C 2 7, -2 9, -7 8
             C -12 7, -15 4, -18 1
             C -17 0, -15 3, -12 2 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="0.7"
        />
        <circle cx="-16" cy="1" r="2.8" fill="#FFFFFF" />
        <path d="M -18 1 L -23 -0.5 L -18 2 Z" fill="#FFCC00" />
        <path d="M 0 -5 C 4 -9, 8 -13, 11 -16" stroke="#CBD5E1" strokeWidth="0.7" fill="none" />
        <path d="M 3 -3 C 7 -6, 11 -8, 15 -8" stroke="#CBD5E1" strokeWidth="0.7" fill="none" />
      </g>

      {/* 8. BASE BANNER / HERALDIC SCROLL */}
      {/* Left Ribbon Green & Magenta */}
      <path
        d="M 50 178 C 40 175, 34 186, 38 196 C 42 205, 52 207, 62 198 C 68 192, 73 186, 75 180 Z"
        fill="url(#ribbonGreenGrad)"
        stroke="#005A28"
        strokeWidth="1"
      />
      <path
        d="M 38 196 C 33 203, 40 213, 48 210 C 55 207, 58 201, 56 195 Z"
        fill="#E6007E"
        stroke="#BE0061"
        strokeWidth="0.8"
      />

      {/* Right Ribbon Green & Magenta */}
      <path
        d="M 190 178 C 200 175, 206 186, 202 196 C 198 205, 188 207, 178 198 C 172 192, 167 186, 165 180 Z"
        fill="url(#ribbonGreenGrad)"
        stroke="#005A28"
        strokeWidth="1"
      />
      <path
        d="M 202 196 C 207 203, 200 213, 192 210 C 185 207, 182 201, 184 195 Z"
        fill="#E6007E"
        stroke="#BE0061"
        strokeWidth="0.8"
      />

      {/* Main Curved Banner in Royal Blue */}
      <path
        d="M 52 185
           C 75 197, 97 204, 120 204
           C 143 204, 165 197, 188 185
           C 180 207, 155 221, 120 221
           C 85 221, 60 207, 52 185 Z"
        fill="url(#shieldBlueGrad)"
        stroke="#FFCC00"
        strokeWidth="1.2"
      />

      {/* Gold dots at base of shield */}
      <circle cx="113" cy="213" r="2.2" fill="#FFD700" stroke="#997A00" strokeWidth="0.5" />
      <circle cx="120" cy="214" r="2.5" fill="#FFD700" stroke="#997A00" strokeWidth="0.5" />
      <circle cx="127" cy="213" r="2.2" fill="#FFD700" stroke="#997A00" strokeWidth="0.5" />

      {/* Motto */}
      <path id="logoMottoPath" d="M 68 198 Q 120 217 172 198" fill="none" />
      <text fontStyle="italic" fontFamily="Georgia, serif" fontSize="9" fontWeight="bold" fill="#FFF275">
        <textPath href="#logoMottoPath" startOffset="50%" textAnchor="middle">
          Alpha and Omega
        </textPath>
      </text>
    </svg>
  );

  if (!showText) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{emblemSvg}</div>;
  }

  const isDark = textColor === 'light';

  return (
    <div
      className={`inline-flex ${
        orientation === 'vertical' ? 'flex-col items-center text-center' : 'items-center gap-3'
      } ${className}`}
    >
      {emblemSvg}
      <div>
        <h1
          className={`font-serif font-black tracking-tight leading-none ${
            isDark ? 'text-white' : 'text-[#091E3A]'
          } ${size === 'lg' || size === 'xl' ? 'text-lg' : 'text-sm'}`}
        >
          UGANDA CHRISTIAN UNIVERSITY
        </h1>
        <p
          className={`text-[10px] font-semibold tracking-wider uppercase mt-0.5 ${
            isDark ? 'text-[#FFD700]' : 'text-[#D80072]'
          }`}
        >
          A Centre of Excellence in the Heart of Africa
        </p>
      </div>
    </div>
  );
};
