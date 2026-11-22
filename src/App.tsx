import { useEffect, useMemo, useState, type FormEvent } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  ShoppingCart,
  ShoppingBag,
  Package,
  QrCode,
  Printer,
  History,
  Settings,
  Home,
  Volume2,
  VolumeX,
  Star,
  Award,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import {
  ActivePage,
  BuyerShoppingList,
  CartItem,
  CartItemDetailed,
  ChallengeMission,
  GameMode,
  GameSettings,
  PlayerProfile,
  ProductItem,
  TransactionRecord,
} from './types/game';
import {
  CHALLENGE_MISSIONS,
  DEFAULT_SETTINGS,
  INITIAL_PLAYERS,
  INITIAL_PRODUCTS,
} from './data/defaultData';

import { CashierView } from './components/CashierView';
import { BuyerModeView } from './components/BuyerModeView';
import { QrGeneratorView } from './components/QrGeneratorView';
import { ManageItemsAndTeacherView } from './components/ManageItemsAndTeacherView';
import {
  AwardsAndCertificateView,
  GameSettingsView,
  ModeSelectionView,
  TransactionHistoryView,
} from './components/SecondaryViews';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal, ShoppingListModal } from './components/ReceiptAndListModal';
import { soundFX } from './utils/sound';

const LS_KEYS = {
  PRODUCTS: 'ksc_products_v1',
  TRANSACTIONS: 'ksc_transactions_v1',
  PLAYERS: 'ksc_players_v1',
  ACTIVE_PLAYER: 'ksc_active_player_v1',
  SETTINGS: 'ksc_settings_v1',
};

export function App() {
  // Persistent State via LocalStorage
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [players, setPlayers] = useState<PlayerProfile[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.PLAYERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PLAYERS;
  });

  const [activePlayerId, setActivePlayerId] = useState<string>(() => {
    return localStorage.getItem(LS_KEYS.ACTIVE_PLAYER) || INITIAL_PLAYERS[0].id;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Navigation & Active Session State
  const [activePage, setActivePage] = useState<ActivePage>('HOME');
  const [showStudentEntry, setShowStudentEntry] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentClassInput, setStudentClassInput] = useState('');
  const [studentEntryError, setStudentEntryError] = useState('');
  const [pendingStudentDestination, setPendingStudentDestination] = useState<'MODE_SELECT' | 'CASHIER'>('MODE_SELECT');
  const [manageInitialTab, setManageInitialTab] = useState<'CRUD' | 'PRICE_LIST' | 'TEACHER'>('CRUD');
  const [gameMode, setGameMode] = useState<GameMode>('FREE');
  const [activeMission, setActiveMission] = useState<ChallengeMission | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerShoppingList, setBuyerShoppingList] = useState<BuyerShoppingList | null>(null);
  const [lastScannedItem, setLastScannedItem] = useState<{
    product: ProductItem;
    qtyInCart: number;
    timestamp: number;
  } | null>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);

  // Sync to LocalStorage
  // Storage can be unavailable (private browsing / quota). The game should
  // continue working for the current session even when persistence fails.
  const persist = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Gagal menyimpan ${key} ke penyimpanan lokal.`, error);
    }
  };

  useEffect(() => {
    persist(LS_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    persist(LS_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    persist(LS_KEYS.PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    persist(LS_KEYS.ACTIVE_PLAYER, activePlayerId);
  }, [activePlayerId]);

  useEffect(() => {
    persist(LS_KEYS.SETTINGS, JSON.stringify(settings));
    soundFX.enabled = settings.soundEnabled;
  }, [settings]);

  const activePlayer = useMemo(() => {
    return players.find((p) => p.id === activePlayerId) || players[0] || INITIAL_PLAYERS[0];
  }, [players, activePlayerId]);

  const detailedCart: CartItemDetailed[] = useMemo(() => {
    return cart
      .map((c) => {
        const product = products.find((p) => p.id === c.productId);
        if (!product) return null;
        return {
          product,
          quantity: c.quantity,
          subtotal: product.price * c.quantity,
        };
      })
      .filter((x): x is CartItemDetailed => x !== null);
  }, [cart, products]);

  const totalBelanja = useMemo(
    () => detailedCart.reduce((acc, item) => acc + item.subtotal, 0),
    [detailedCart]
  );

  // Cart Handlers
  const handleAddToCart = (
    product: ProductItem,
    source: 'MANUAL' | 'QR_CAMERA' | 'QR_SIMULATED' = 'MANUAL'
  ) => {
    let nextQty = 1;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        nextQty = existing.quantity + 1;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });

    setLastScannedItem({
      product,
      qtyInCart: nextQty,
      timestamp: Date.now(),
    });

    // QR scan rewards are calculated once when the transaction is completed.
    // This avoids awarding the same item both at scan time and at checkout.
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setLastScannedItem(null);
  };

  // Complete Payment & Generate Receipt
  const handleConfirmPayment = (
    paidAmount: number,
    changeAmount: number,
    guessedAdditionCorrectly: boolean | null,
    guessedChangeCorrectly: boolean | null
  ) => {
    if (detailedCart.length === 0 || !Number.isFinite(paidAmount) ||
        !Number.isFinite(changeAmount) || paidAmount < totalBelanja ||
        changeAmount !== paidAmount - totalBelanja) {
      console.warn('Pembayaran tidak valid; transaksi dibatalkan.');
      return;
    }

    const itemsScanned = detailedCart.reduce((acc, i) => acc + i.quantity, 0);
    // Point calculation as required in Section 11:
    // +10 per item scanned, +20 correct total, +30 correct change, +20 transaction complete
    const scanPoints = itemsScanned * 10;
    const totalPoints = guessedAdditionCorrectly === true ? 20 : 0;
    const changePoints = guessedChangeCorrectly === true ? 30 : 0;
    const finishPoints = 20;
    const missionBonus = activeMission ? activeMission.rewardPoints : 0;
    const earnedPoints = scanPoints + totalPoints + changePoints + finishPoints + missionBonus;
    const earnedStars = activeMission ? activeMission.rewardStars : changeAmount >= 0 ? 2 : 1;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      receiptNo: `KSC-${String(
        transactions.reduce((max, tx) => {
          const match = tx.receiptNo?.match(/(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0) + 1
      ).padStart(4, '0')}`,
      timestamp: `${dateStr} ${timeStr}`,
      cashierName: activePlayer.name,
      playerId: activePlayer.id,
      playerClass: activePlayer.className || '',
      buyerName: buyerShoppingList?.buyerName || 'Pembeli Ceria',
      mode: gameMode,
      challengeLevel: activeMission?.level,
      items: detailedCart.map((c) => ({
        productId: c.product.id,
        sku: c.product.sku,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity,
        subtotal: c.subtotal,
      })),
      totalAmount: totalBelanja,
      paidAmount,
      changeAmount,
      pointsEarned: earnedPoints,
      starsEarned: earnedStars,
      additionGuessedCorrectly: guessedAdditionCorrectly,
      subtractionGuessedCorrectly: guessedChangeCorrectly,
      changeGuessedCorrectly: guessedChangeCorrectly,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update Player Profile & Unlock Badges
    setPlayers((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlayer.id) return pl;
        const nextScanned = pl.itemsScannedCount + itemsScanned;
        const nextTxCount = pl.transactionsCount + 1;
        const nextMathCount = pl.correctMathCount + (guessedChangeCorrectly === true ? 1 : 0);
        const nextBadges = new Set(pl.badges);
        nextBadges.add('kasir_pemula');
        if (nextScanned >= 5) nextBadges.add('scanner_cepat');
        if (guessedChangeCorrectly) nextBadges.add('jago_hitung');
        if (activeMission) nextBadges.add('juara_tantangan');

        const nextCompletedMissions = activeMission
          ? Array.from(new Set([...pl.completedChallengeIds, activeMission.id]))
          : pl.completedChallengeIds;

        return {
          ...pl,
          points: pl.points + earnedPoints,
          stars: pl.stars + earnedStars,
          transactionsCount: nextTxCount,
          itemsScannedCount: nextScanned,
          correctMathCount: nextMathCount,
          completedChallengeIds: nextCompletedMissions,
          badges: Array.from(nextBadges),
        };
      })
    );

    // Play cash register bell & launch confetti celebration!
    soundFX.playCashRegisterSuccess();
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if canvas-confetti fails in headless
    }

    setShowPaymentModal(false);
    setActiveReceipt(newTx);
  };

  // Product CRUD Handlers
  const handleAddProduct = (item: ProductItem) => {
    setProducts((prev) => [item, ...prev]);
  };

  const handleUpdateProduct = (updated: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetDefaultProducts = () => {
    setProducts(INITIAL_PRODUCTS);
  };

  const requestStudentEntry = (destination: 'MODE_SELECT' | 'CASHIER') => {
    setPendingStudentDestination(destination);
    setStudentNameInput(activePlayer?.name && !activePlayer.name.startsWith('Pemain') ? activePlayer.name : '');
    setStudentClassInput(activePlayer?.className || '');
    setStudentEntryError('');
    setShowStudentEntry(true);
  };

  const submitStudentEntry = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = studentNameInput.trim();
    const cleanClass = studentClassInput.trim();
    if (!cleanName || !cleanClass) {
      setStudentEntryError('Nama dan kelas harus diisi sebelum bermain.');
      return;
    }
    const existing = players.find((pl) =>
      pl.name.trim().toLowerCase() === cleanName.toLowerCase() &&
      (pl.className || '').trim().toLowerCase() === cleanClass.toLowerCase()
    );
    let playerId = existing?.id;
    if (existing) {
      setPlayers((prev) => prev.map((pl) => pl.id === existing.id ? { ...pl, name: cleanName, className: cleanClass } : pl));
    } else {
      const newPl: PlayerProfile = {
        id: `player-${Date.now()}`, name: cleanName, className: cleanClass, avatar: '#60A5FA',
        points: 0, stars: 0, transactionsCount: 0, itemsScannedCount: 0,
        correctMathCount: 0, completedChallengeIds: [], badges: [],
      };
      playerId = newPl.id;
      setPlayers((prev) => [...prev, newPl]);
    }
    if (playerId) setActivePlayerId(playerId);
    setShowStudentEntry(false);
    setCart([]);
    setBuyerShoppingList(null);
    navigateTo(pendingStudentDestination);
  };

  const navigateTo = (page: ActivePage) => {
    soundFX.playPop();
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col polka-bg">
      {/* Decorative Supermarket Awning Stripes */}
      <div className="no-print awning-stripes h-4 border-b-3 border-[#1E293B]" />

      {/* Top Navigation & Player Status Bar */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b-3 border-[#1E293B] px-3 md:px-6 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Creator Attribution */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('HOME')}
              className="toy-btn-sm bg-[#FFBE0B] text-[#1E293B] px-3 py-2 rounded-2xl font-display font-bold text-xs md:text-sm flex items-center gap-1.5"
              title="Menu Utama"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">MENU UTAMA</span>
            </button>

            <div
              onClick={() => navigateTo('HOME')}
              className="cursor-pointer"
            >
              <h1 className="font-display text-lg md:text-2xl font-extrabold text-[#1E293B] leading-none tracking-wide">
                KIDS SMART CASHIER
              </h1>
              <p className="text-[11px] md:text-xs font-extrabold text-[#0284C7]">
                Created by: Widodo Guru SD
              </p>
            </div>
          </div>

          {/* Quick Page Shortcuts & Active Student Badge */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Student Selector */}
            <div className="flex items-center gap-1.5 bg-[#FFFBEB] px-3 py-1.5 rounded-2xl border-2 border-[#1E293B]">
              <span className="h-4 w-4 rounded-full border border-slate-800 bg-[#60A5FA]" aria-hidden="true" />
              <select
                value={activePlayer.id}
                onChange={(e) => {
                  soundFX.playPop();
                  setActivePlayerId(e.target.value);
                }}
                aria-label="Pilih Nama Pemain"
                className="font-display font-bold text-xs md:text-sm text-[#1E293B] bg-transparent focus:outline-none cursor-pointer"
              >
                {players.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Points & Stars Pill */}
            <button
              onClick={() => navigateTo('AWARDS')}
              className="toy-btn-sm bg-[#EDE9FE] text-[#1E293B] px-3 py-1.5 rounded-2xl font-display font-bold text-xs flex items-center gap-2"
              title="Lihat Poin, Medali & Sertifikat"
            >
              <span className="flex items-center gap-1 text-purple-800">
                <Award className="w-4 h-4 text-[#8B5CF6]" />
                {activePlayer.points} Poin
              </span>
              <span className="flex items-center gap-0.5 text-amber-700">
                <Star className="w-4 h-4 fill-[#FFBE0B] text-[#1E293B]" />
                {activePlayer.stars}
              </span>
            </button>

            {/* Guru / Admin Quick Button */}
            <button
              onClick={() => {
                setManageInitialTab('TEACHER');
                navigateTo('MANAGE_ITEMS');
              }}
              className="toy-btn-sm bg-[#D1FAE5] text-[#1E293B] px-3 py-1.5 rounded-2xl font-display font-bold text-xs flex items-center gap-1"
              title="Dashboard Guru"
            >
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span className="hidden md:inline">Guru</span>
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                soundFX.enabled = next;
                setSettings((prev) => ({ ...prev, soundEnabled: next }));
                if (next) soundFX.playPop();
              }}
              className={`toy-btn-sm p-2 rounded-xl ${
                settings.soundEnabled ? 'bg-[#10B981] text-white' : 'bg-slate-200 text-slate-600'
              }`}
              title={settings.soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 py-5">
        {/* ==================== DASHBOARD MENU UTAMA ==================== */}
        {activePage === 'HOME' && (
          <div className="space-y-6">
            {/* Hero Banner with Supermarket & Cashier Illustration */}
            <div className="toy-card p-5 md:p-7 bg-gradient-to-br from-[#E0F2FE] via-[#FFFBEB] to-[#FEF3C7] relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFBE0B] border-2 border-[#1E293B] font-display font-bold text-xs shadow-[0_2px_0_#1E293B]">
                    <Sparkles className="w-4 h-4" />
                    GAME EDUKASI SIMULASI KASIR ANAK SD (USIA 7–9 TAHUN)
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] leading-tight">
                    KIDS SMART CASHIER
                  </h2>

                  <div className="inline-block px-4 py-1 rounded-xl bg-white border-2 border-[#1E293B] font-display font-bold text-sm md:text-base text-[#0284C7] shadow-[0_3px_0_#1E293B]">
                    Created by: Widodo Guru SD
                  </div>

                  <p className="text-sm md:text-base font-bold text-slate-700 max-w-xl mx-auto lg:mx-0">
                    Ayo belajar berbelanja, memindai QR Code barang, menghitung uang Rupiah, memberi uang kembalian, dan mencetak struk seperti kasir minimarket sungguhan!
                  </p>

                  {/* Fast Start CTA Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <button
                      onClick={() => requestStudentEntry('MODE_SELECT')}
                      className="toy-btn bg-[#10B981] text-white px-6 py-3.5 rounded-2xl font-display font-bold text-lg flex items-center gap-2"
                    >
                      <Play className="w-6 h-6 fill-white" />
                      MULAI BERMAIN SEKARANG!
                    </button>

                    <button
                      onClick={() => {
                        requestStudentEntry('CASHIER');
                      }}
                      className="toy-btn bg-[#FFBE0B] text-[#1E293B] px-5 py-3.5 rounded-2xl font-display font-bold text-base flex items-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      LANGSUNG KE MEJA KASIR
                    </button>
                  </div>
                </div>

                {/* Abstract 2D color shapes — no character illustrations */}
                <div className="lg:col-span-5 flex items-center justify-center gap-3 py-6" aria-hidden="true">
                  <div className="h-28 w-20 rotate-[-8deg] rounded-[28px] border-2 border-slate-800 bg-[#F87171]" />
                  <div className="h-40 w-24 rotate-[4deg] rounded-[32px] border-2 border-slate-800 bg-[#FBBF24]" />
                  <div className="h-32 w-20 rotate-[10deg] rounded-[28px] border-2 border-slate-800 bg-[#60A5FA]" />
                </div>
              </div>
            </div>

            {/* 8 MAIN MENU BUTTONS GRID (Sesuai Ketentuan Menu Utama) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xl md:text-2xl font-extrabold text-[#1E293B]">
                  🏪 MENU UTAMA MINIMARKET CERDAS
                </h3>
                <span className="text-xs font-extrabold text-slate-600 bg-white px-3 py-1 rounded-full border-2 border-[#1E293B]">
                  {products.length} Barang Siap Dipindai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. MULAI BERMAIN */}
                <button
                  onClick={() => requestStudentEntry('MODE_SELECT')}
                  className="toy-btn bg-[#10B981] text-white p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#10B981] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <Play className="w-7 h-7 fill-current" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-black/20 px-2 py-0.5 rounded-full">
                      3 Mode Seru
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      MULAI BERMAIN
                    </h4>
                    <p className="text-xs font-bold text-emerald-50">
                      Mode Bebas, Tantangan 5 Level & Role Play
                    </p>
                  </div>
                </button>

                {/* 2. MODE KASIR */}
                <button
                  onClick={() => requestStudentEntry('CASHIER')}
                  className="toy-btn bg-[#38BDF8] text-[#1E293B] p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#0284C7] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <ShoppingCart className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-white/60 px-2 py-0.5 rounded-full">
                      Scanner & Pembayaran
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      MODE KASIR
                    </h4>
                    <p className="text-xs font-bold text-slate-800">
                      Meja kasir, scan QR, hitung uang & cetak struk
                    </p>
                  </div>
                </button>

                {/* 3. MODE PEMBELI */}
                <button
                  onClick={() => navigateTo('BUYER_MODE')}
                  className="toy-btn bg-[#FB8500] text-white p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#FB8500] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-black/20 px-2 py-0.5 rounded-full">
                      Role Play Pembeli
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      MODE PEMBELI
                    </h4>
                    <p className="text-xs font-bold text-orange-50">
                      Buat & cetak daftar belanja sebelum ke kasir
                    </p>
                  </div>
                </button>

                {/* 4. KELOLA BARANG DAN HARGA */}
                <button
                  onClick={() => {
                    setManageInitialTab('CRUD');
                    navigateTo('MANAGE_ITEMS');
                  }}
                  className="toy-btn bg-[#FFBE0B] text-[#1E293B] p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#D97706] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <Package className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-white/60 px-2 py-0.5 rounded-full">
                      6 Kategori Lengkap
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      KELOLA BARANG DAN HARGA
                    </h4>
                    <p className="text-xs font-bold text-slate-800">
                      Tambah, edit harga Rupiah, dan hapus barang
                    </p>
                  </div>
                </button>

                {/* 5. GENERATE QR CODE */}
                <button
                  onClick={() => navigateTo('QR_GENERATOR')}
                  className="toy-btn bg-[#8B5CF6] text-white p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-black/20 px-2 py-0.5 rounded-full">
                      PNG, PDF & Cetak Label
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      GENERATE QR CODE
                    </h4>
                    <p className="text-xs font-bold text-purple-100">
                      Buat kartu QR Code unik Kecil, Sedang & Besar
                    </p>
                  </div>
                </button>

                {/* 6. CETAK DAFTAR HARGA */}
                <button
                  onClick={() => {
                    setManageInitialTab('PRICE_LIST');
                    navigateTo('PRICE_LIST');
                  }}
                  className="toy-btn bg-[#EC4899] text-white p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#EC4899] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <Printer className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-black/20 px-2 py-0.5 rounded-full">
                      Katalog Minimarket
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      CETAK DAFTAR HARGA
                    </h4>
                    <p className="text-xs font-bold text-pink-100">
                      Cetak & unduh PDF daftar harga seluruh barang
                    </p>
                  </div>
                </button>

                {/* 7. RIWAYAT TRANSAKSI */}
                <button
                  onClick={() => navigateTo('HISTORY')}
                  className="toy-btn bg-[#06B6D4] text-white p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#0891B2] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <History className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-black/20 px-2 py-0.5 rounded-full">
                      {transactions.length} Transaksi
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      RIWAYAT TRANSAKSI
                    </h4>
                    <p className="text-xs font-bold text-cyan-50">
                      Lihat catatan penjualan & cetak ulang struk
                    </p>
                  </div>
                </button>

                {/* 8. PENGATURAN GAME */}
                <button
                  onClick={() => navigateTo('SETTINGS')}
                  className="toy-btn bg-[#64748B] text-white p-5 rounded-3xl text-left flex flex-col justify-between min-h-[148px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#334155] border-2 border-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#1E293B]">
                    <Settings className="w-7 h-7" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[11px] font-extrabold uppercase bg-black/20 px-2 py-0.5 rounded-full">
                      Suara & Pemain
                    </span>
                    <h4 className="font-display text-xl font-extrabold mt-1">
                      PENGATURAN GAME
                    </h4>
                    <p className="text-xs font-bold text-slate-100">
                      Atur nama anak, efek suara, struk & reset data
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Extra Bottom Cards: Mode Tantangan Cepat & Dashboard Guru */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="toy-card p-5 bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B] border-2 border-[#1E293B] flex items-center justify-center text-2xl">
                    🏅
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-extrabold text-[#1E293B]">
                      MEDALI & SERTIFIKAT KASIR CERDAS
                    </h4>
                    <p className="text-xs font-bold text-slate-600">
                      {activePlayer.name} memiliki {activePlayer.points} Poin & {activePlayer.badges.length} Medali!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigateTo('AWARDS')}
                  className="toy-btn-sm bg-[#FFBE0B] text-[#1E293B] px-4 py-2 rounded-xl font-display font-bold text-xs"
                >
                  Buka Sertifikat
                </button>
              </div>

              <div className="toy-card p-5 bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#10B981] border-2 border-[#1E293B] flex items-center justify-center text-2xl">
                    👩‍🏫
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-extrabold text-[#1E293B]">
                      DASHBOARD GURU / ADMIN
                    </h4>
                    <p className="text-xs font-bold text-slate-600">
                      Pantau kemampuan anak menghitung total & uang kembalian
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setManageInitialTab('TEACHER');
                    navigateTo('MANAGE_ITEMS');
                  }}
                  className="toy-btn-sm bg-[#10B981] text-white px-4 py-2 rounded-xl font-display font-bold text-xs"
                >
                  Buka Dashboard Guru
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PILIH MODE PERMAINAN ==================== */}
        {activePage === 'MODE_SELECT' && (
          <ModeSelectionView
            activePlayer={activePlayer}
            onStartMode={(mode, mission) => {
              setGameMode(mode);
              setActiveMission(mission || null);
              if (mode === 'ROLEPLAY_BUYER') {
                navigateTo('BUYER_MODE');
              } else {
                navigateTo('CASHIER');
              }
            }}
          />
        )}

        {/* ==================== HALAMAN MODE KASIR ==================== */}
        {activePage === 'CASHIER' && (
          <CashierView
            products={products}
            cart={cart}
            gameMode={gameMode}
            activeMission={activeMission}
            onSelectMission={(m) => {
              setActiveMission(m);
              if (m) setGameMode('CHALLENGE');
              else setGameMode('FREE');
            }}
            buyerShoppingList={buyerShoppingList}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onOpenPayment={() => setShowPaymentModal(true)}
            onOpenShoppingListModal={() => setShowShoppingListModal(true)}
            scanCooldownMs={settings.scanCooldownMs}
            lastScannedItem={lastScannedItem}
          />
        )}

        {/* ==================== HALAMAN MODE PEMBELI ==================== */}
        {activePage === 'BUYER_MODE' && (
          <BuyerModeView
            products={products}
            defaultBuyerName={activePlayer.name}
            onSaveBuyerListAndGoToCashier={(list, autoLoad) => {
              setBuyerShoppingList(list);
              // Unlock Pembeli Hebat badge
              setPlayers((prev) =>
                prev.map((pl) =>
                  pl.id === activePlayer.id
                    ? {
                        ...pl,
                        points: pl.points + 20,
                        badges: Array.from(new Set([...pl.badges, 'pembeli_hebat'])),
                      }
                    : pl
                )
              );
              if (autoLoad) {
                setCart(list.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
              } else {
                setCart([]);
              }
              setGameMode('ROLEPLAY_CASHIER');
              navigateTo('CASHIER');
            }}
          />
        )}

        {/* ==================== KELOLA BARANG, DAFTAR HARGA & GURU ==================== */}
        {(activePage === 'MANAGE_ITEMS' || activePage === 'PRICE_LIST') && (
          <ManageItemsAndTeacherView
            key={activePage + manageInitialTab}
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onResetDefaultProducts={handleResetDefaultProducts}
            onGoToQrGenerator={() => navigateTo('QR_GENERATOR')}
            initialTab={activePage === 'PRICE_LIST' ? 'PRICE_LIST' : manageInitialTab}
            transactions={transactions}
            players={players}
            storeName={settings.storeName}
            onClearHistory={() => setTransactions([])}
          />
        )}

        {/* ==================== STUDIO GENERATE QR CODE ==================== */}
        {activePage === 'QR_GENERATOR' && (
          <QrGeneratorView
            products={products}
            onUpdateProduct={handleUpdateProduct}
          />
        )}

        {/* ==================== RIWAYAT TRANSAKSI ==================== */}
        {activePage === 'HISTORY' && (
          <TransactionHistoryView
            transactions={transactions}
            storeName={settings.storeName}
            onViewReceipt={(tx) => setActiveReceipt(tx)}
            onGoToAwards={() => navigateTo('AWARDS')}
          />
        )}

        {/* ==================== PENGHARGAAN & SERTIFIKAT ==================== */}
        {activePage === 'AWARDS' && (
          <AwardsAndCertificateView player={activePlayer} />
        )}

        {/* ==================== PENGATURAN GAME ==================== */}
        {activePage === 'SETTINGS' && (
          <GameSettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            players={players}
            activePlayerId={activePlayer.id}
            onSelectPlayer={setActivePlayerId}
            onAddPlayer={(name, avatar) => {
              const newPl: PlayerProfile = {
                id: `player-${Date.now()}`,
                name,
                avatar,
                points: 0,
                stars: 0,
                transactionsCount: 0,
                itemsScannedCount: 0,
                correctMathCount: 0,
                completedChallengeIds: [],
                badges: [],
              };
              setPlayers((prev) => [...prev, newPl]);
              setActivePlayerId(newPl.id);
            }}
            onResetAllGameData={() => {
              setProducts(INITIAL_PRODUCTS);
              setTransactions([]);
              setPlayers(INITIAL_PLAYERS);
              setActivePlayerId(INITIAL_PLAYERS[0].id);
              setCart([]);
            }}
          />
        )}
      </main>

      {/* Footer Attribution */}
      <footer className="no-print mt-8 border-t-3 border-[#1E293B] bg-white py-4 px-4 text-center">
        <p className="font-display font-bold text-sm text-[#1E293B]">
          KIDS SMART CASHIER – SIMULASI KASIR CERDAS
        </p>
        <p className="text-xs font-extrabold text-[#0284C7] mt-0.5">
          Created by: Widodo Guru SD • Game Edukasi Interaktif Anak Usia 7–9 Tahun
        </p>
      </footer>

      {/* ==================== MODALS ==================== */}
      {showStudentEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/65 p-4">
          <form onSubmit={submitStudentEntry} className="w-full max-w-md rounded-[28px] border-2 border-slate-800 bg-[#FFF8EA] p-6 shadow-[7px_7px_0_#334155]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl border-2 border-slate-800 bg-[#FBBF24]" />
              <div><h2 className="text-xl font-extrabold text-slate-800">Identitas Pemain</h2><p className="text-sm text-slate-600">Isi nama dan kelas sebelum mulai bermain.</p></div>
            </div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Nama siswa</label>
            <input autoFocus value={studentNameInput} onChange={(e) => setStudentNameInput(e.target.value)} placeholder="Contoh: Ahmad" className="mb-4 w-full rounded-xl border-2 border-slate-700 bg-white px-4 py-3" />
            <label className="mb-1 block text-sm font-bold text-slate-700">Kelas</label>
            <input value={studentClassInput} onChange={(e) => setStudentClassInput(e.target.value)} placeholder="Contoh: 2A" className="mb-4 w-full rounded-xl border-2 border-slate-700 bg-white px-4 py-3" />
            {studentEntryError && <p className="mb-3 text-sm font-bold text-rose-700">{studentEntryError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowStudentEntry(false)} className="flex-1 rounded-xl border-2 border-slate-800 bg-white px-3 py-3 font-bold">Batal</button>
              <button type="submit" className="flex-1 rounded-xl border-2 border-slate-800 bg-[#34D399] px-3 py-3 font-bold">Mulai Bermain</button>
            </div>
          </form>
        </div>
      )}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={totalBelanja}
          itemsForMath={detailedCart.map((item) => ({ name: item.product.name, subtotal: item.subtotal }))}
          activeMission={activeMission}
          requireMathQuizDefault={settings.requireMathQuizInCashier}
          onConfirmPayment={handleConfirmPayment}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}

      {showShoppingListModal && (
        <ShoppingListModal
          items={detailedCart}
          initialBuyerName={buyerShoppingList?.buyerName || activePlayer.name}
          onClose={() => setShowShoppingListModal(false)}
        />
      )}

      {activeReceipt && (
        <ReceiptModal
          transaction={activeReceipt}
          storeName={settings.storeName}
          defaultPaperSize={settings.defaultReceiptWidth}
          onNewTransaction={() => {
            setActiveReceipt(null);
            handleClearCart();
            // If in challenge mode and finished mission, offer next mission
            if (activeMission) {
              const idx = CHALLENGE_MISSIONS.findIndex((m) => m.id === activeMission.id);
              if (idx >= 0 && idx + 1 < CHALLENGE_MISSIONS.length) {
                setActiveMission(CHALLENGE_MISSIONS[idx + 1]);
              }
            }
          }}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
}
export default App;
