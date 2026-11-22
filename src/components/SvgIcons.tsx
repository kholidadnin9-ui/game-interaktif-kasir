
import React from 'react';

interface ProductSvgProps {
  iconKey: string;
  className?: string;
}

export const AVAILABLE_ICON_KEYS = [
  'roti', 'biskuit', 'cokelat', 'permen', 'mi_instan', 'telur', 'beras', 'snack',
  'air_mineral', 'susu', 'jus_jeruk', 'teh_kemasan',
  'wortel', 'bayam', 'tomat', 'kentang', 'apel', 'pisang', 'jeruk',
  'mobil', 'boneka', 'bola', 'puzzle', 'balok',
  'buku', 'pensil', 'penghapus', 'penggaris', 'pengserut', 'krayon', 'spidol', 'tas',
  'gula', 'minyak', 'tepung', 'garam', 'sabun'
];

// Ikon gambar untuk setiap barang
const PRODUCT_ICONS: Record<string, string> = {
  // Makanan
  roti: '🍞',
  biskuit: '🍪',
  cokelat: '🍫',
  permen: '🍬',
  mi_instan: '🍜',
  telur: '🥚',
  beras: '🍚',
  snack: '🍿',

  // Minuman
  air_mineral: '💧',
  susu: '🥛',
  jus_jeruk: '🧃',
  teh_kemasan: '🧋',

  // Sayuran dan buah
  wortel: '🥕',
  bayam: '🥬',
  tomat: '🍅',
  kentang: '🥔',
  apel: '🍎',
  pisang: '🍌',
  jeruk: '🍊',

  // Mainan
  mobil: '🚗',
  boneka: '🧸',
  bola: '⚽',
  puzzle: '🧩',
  balok: '🧱',

  // Alat sekolah
  buku: '📚',
  pensil: '✏️',
  penghapus: '🧽',
  penggaris: '📏',
  pengserut: '🔪',
  krayon: '🖍️',
  spidol: '🖊️',
  tas: '🎒',

  // Kebutuhan sehari-hari
  gula: '🍚',
  minyak: '🫗',
  tepung: '🌾',
  garam: '🧂',
  sabun: '🧼',
};

export const ProductIllustration: React.FC<ProductSvgProps> = ({
  iconKey,
  className = 'w-16 h-16'
}) => {
  const palette = [
    '#FEE2E2',
    '#FEF3C7',
    '#D1FAE5',
    '#FCE7F3',
    '#DBEAFE',
    '#EDE9FE',
    '#FFEDD5',
    '#CCFBF1'
  ];

  const colorIndex =
    Array.from(iconKey).reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0
    ) % palette.length;

  const icon = PRODUCT_ICONS[iconKey] || '🛍️';

  return (
    <div
      role="img"
      aria-label={iconKey.replace(/_/g, ' ')}
      className={`${className} flex items-center justify-center rounded-2xl border-2 border-slate-200 shadow-sm`}
      style={{
        backgroundColor: palette[colorIndex],
        fontSize: 'clamp(24px, 4vw, 42px)',
        lineHeight: 1
      }}
    >
      <span aria-hidden="true">{icon}</span>
    </div>
  );
};

export const RupiahNoteSvg: React.FC<{
  amount: number;
  className?: string;
}> = ({
  amount,
  className = 'w-full h-16'
}) => {
  const config: Record<
    number,
    { bg: string; accent: string; label: string }
  > = {
    2000: {
      bg: '#94A3B8',
      accent: '#475569',
      label: 'Rp 2.000'
    },
    5000: {
      bg: '#F59E0B',
      accent: '#B45309',
      label: 'Rp 5.000'
    },
    10000: {
      bg: '#A855F7',
      accent: '#6B21A8',
      label: 'Rp 10.000'
    },
    20000: {
      bg: '#10B981',
      accent: '#047857',
      label: 'Rp 20.000'
    },
    50000: {
      bg: '#38BDF8',
      accent: '#0369A1',
      label: 'Rp 50.000'
    },
    100000: {
      bg: '#F43F5E',
      accent: '#BE123C',
      label: 'Rp 100.000'
    },
  };

  const c = config[amount] || {
    bg: '#10B981',
    accent: '#047857',
    label: `Rp ${amount.toLocaleString('id-ID')}`
  };

  return (
    <svg
      viewBox="0 0 180 76"
      className={className}
      fill="none"
    >
      <rect
        x="4"
        y="4"
        width="172"
        height="68"
        rx="10"
        fill={c.bg}
        stroke="#1E293B"
        strokeWidth="3.5"
      />

      <rect
        x="12"
        y="12"
        width="156"
        height="52"
        rx="6"
        fill="#FFFFFF"
        fillOpacity="0.22"
        stroke={c.accent}
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      <circle
        cx="38"
        cy="38"
        r="16"
        fill={c.accent}
        fillOpacity="0.35"
        stroke="#FFFFFF"
        strokeWidth="2"
      />

      <text
        x="38"
        y="42"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="bold"
        fontFamily="Fredoka"
      >
        RI
      </text>

      <text
        x="105"
        y="44"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="18"
        fontWeight="bold"
        fontFamily="Fredoka"
      >
        {c.label}
      </text>
    </svg>
  );
};
