export type ItemCategory =
  | 'MAKANAN'
  | 'MINUMAN'
  | 'SAYUR_BUAH'
  | 'MAINAN'
  | 'ALAT_SEKOLAH'
  | 'KEBUTUHAN_POKOK';

export interface CategoryInfo {
  id: ItemCategory;
  label: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  borderColor: string;
  emoji: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  qrCode: string; // Format: KSC-ITEM:<SKU>
  name: string;
  category: ItemCategory;
  price: number; // Integer Rupiah
  stock: number;
  iconKey: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartItemDetailed {
  product: ProductItem;
  quantity: number;
  subtotal: number;
}

export type GameMode = 'FREE' | 'CHALLENGE' | 'ROLEPLAY_CASHIER' | 'ROLEPLAY_BUYER';

export interface ChallengeMission {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  hint: string;
  targetItems?: { sku: string; name: string; qty: number }[];
  minItemCount?: number;
  maxItemCount?: number;
  maxBudget?: number;
  exactBudget?: number;
  forcedPaymentAmount?: number; // e.g., pay with Rp50.000 and calculate change
  requireChangeGuess?: boolean;
  rewardStars: number;
  rewardPoints: number;
}

export interface TransactionRecord {
  id: string;
  receiptNo: string;
  timestamp: string;
  cashierName: string;
  playerId?: string;
  playerClass?: string;
  buyerName: string;
  mode: GameMode;
  challengeLevel?: number;
  items: {
    productId: string;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  pointsEarned: number;
  starsEarned: number;
  additionGuessedCorrectly?: boolean | null;
  subtractionGuessedCorrectly?: boolean | null;
  changeGuessedCorrectly?: boolean | null;
}

export interface PlayerProfile {
  id: string;
  name: string;
  className?: string;
  avatar: string;
  points: number;
  stars: number;
  transactionsCount: number;
  itemsScannedCount: number;
  correctMathCount: number;
  completedChallengeIds: string[];
  badges: string[];
}

export interface BuyerShoppingList {
  buyerName: string;
  date: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface GameSettings {
  storeName: string;
  soundEnabled: boolean;
  scanCooldownMs: number;
  defaultDifficulty: 1 | 2 | 3 | 4 | 5;
  requireMathQuizInCashier: boolean;
  defaultReceiptWidth: '58mm' | '80mm' | 'A4';
}

export type ActivePage =
  | 'HOME'
  | 'MODE_SELECT'
  | 'CASHIER'
  | 'BUYER_MODE'
  | 'MANAGE_ITEMS'
  | 'QR_GENERATOR'
  | 'PRICE_LIST'
  | 'HISTORY'
  | 'SETTINGS'
  | 'TEACHER_DASHBOARD'
  | 'AWARDS';
