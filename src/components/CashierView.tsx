import React, { useMemo, useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  QrCode,
  Coins,
  FileText,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  Barcode,
} from 'lucide-react';
import {
  BuyerShoppingList,
  CartItem,
  CartItemDetailed,
  ChallengeMission,
  GameMode,
  ItemCategory,
  ProductItem,
} from '../types/game';
import { CATEGORIES, CHALLENGE_MISSIONS, formatRupiah } from '../data/defaultData';
import { ProductIllustration } from './SvgIcons';
import { QrScannerPanel } from './QrScannerPanel';
import { soundFX } from '../utils/sound';

interface CashierViewProps {
  products: ProductItem[];
  cart: CartItem[];
  gameMode: GameMode;
  activeMission: ChallengeMission | null;
  onSelectMission: (mission: ChallengeMission | null) => void;
  buyerShoppingList: BuyerShoppingList | null;
  onAddToCart: (product: ProductItem, source?: 'MANUAL' | 'QR_CAMERA' | 'QR_SIMULATED') => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onOpenPayment: () => void;
  onOpenShoppingListModal: () => void;
  scanCooldownMs: number;
  lastScannedItem: { product: ProductItem; qtyInCart: number; timestamp: number } | null;
}

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  cart,
  gameMode,
  activeMission,
  onSelectMission,
  buyerShoppingList,
  onAddToCart,
  onUpdateQty,
  onRemoveFromCart,
  onClearCart,
  onOpenPayment,
  onOpenShoppingListModal,
  scanCooldownMs,
  lastScannedItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [skuQuickInput, setSkuQuickInput] = useState<string>('');
  const [missionAlert, setMissionAlert] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.qrCode.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const detailedCart: CartItemDetailed[] = useMemo(() => {
    return cart
      .map((ci) => {
        const product = products.find((p) => p.id === ci.productId);
        if (!product) return null;
        return {
          product,
          quantity: ci.quantity,
          subtotal: product.price * ci.quantity,
        };
      })
      .filter((x): x is CartItemDetailed => x !== null);
  }, [cart, products]);

  const totalItemsCount = useMemo(
    () => detailedCart.reduce((acc, item) => acc + item.quantity, 0),
    [detailedCart]
  );

  const totalBelanja = useMemo(
    () => detailedCart.reduce((acc, item) => acc + item.subtotal, 0),
    [detailedCart]
  );

  // Check if Challenge Mission criteria are met
  const missionCheck = useMemo(() => {
    if (!activeMission) return { passed: true, reason: '' };

    if (activeMission.targetItems && activeMission.targetItems.length > 0) {
      for (const req of activeMission.targetItems) {
        const found = detailedCart.find(
          (c) => c.product.sku === req.sku || c.product.name.toLowerCase() === req.name.toLowerCase()
        );
        if (!found || found.quantity !== req.qty) {
          return {
            passed: false,
            reason: `Misi meminta ${req.qty}x ${req.name}. Yuk cek kembali jumlah barang di keranjang!`,
          };
        }
      }
    }

    if (activeMission.minItemCount && totalItemsCount < activeMission.minItemCount) {
      return {
        passed: false,
        reason: `Misi ini membutuhkan minimal ${activeMission.minItemCount} barang di keranjang (saat ini baru ${totalItemsCount} barang).`,
      };
    }

    if (activeMission.maxBudget && totalBelanja > activeMission.maxBudget) {
      return {
        passed: false,
        reason: `Total belanja (${formatRupiah(totalBelanja)}) melebihi batas anggaran misi (${formatRupiah(
          activeMission.maxBudget
        )}). Yuk kurangi barangnya!`,
      };
    }

    if (activeMission.exactBudget && totalBelanja !== activeMission.exactBudget) {
      return {
        passed: false,
        reason: `Misi meminta total belanja TEPAT ${formatRupiah(
          activeMission.exactBudget
        )} (saat ini ${formatRupiah(totalBelanja)}).`,
      };
    }

    if (totalItemsCount === 0) {
      return {
        passed: false,
        reason: 'Keranjang belanja masih kosong. Yuk pilih atau pindai barang dulu!',
      };
    }

    return { passed: true, reason: 'Semua syarat misi sudah terpenuhi! Klik Bayar Sekarang!' };
  }, [activeMission, detailedCart, totalItemsCount, totalBelanja]);

  const handleQuickSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = skuQuickInput.trim().toLowerCase();
    if (!code) return;
    const found = products.find(
      (p) =>
        p.sku.toLowerCase() === code ||
        p.qrCode.toLowerCase() === code ||
        p.name.toLowerCase() === code
    );
    if (found) {
      onAddToCart(found, 'MANUAL');
      setSkuQuickInput('');
    } else {
      soundFX.playGentleHint();
      setMissionAlert(`Kode SKU "${skuQuickInput}" tidak ditemukan. Coba contoh: SEK-001 atau MAK-001`);
    }
  };

  const handleProceedPayment = () => {
    if (detailedCart.length === 0) {
      soundFX.playGentleHint();
      setMissionAlert('Keranjang belanja masih kosong! Yuk pilih atau scan barang terlebih dahulu 😊');
      return;
    }
    if (activeMission && !missionCheck.passed) {
      soundFX.playGentleHint();
      setMissionAlert(missionCheck.reason);
      return;
    }
    setMissionAlert(null);
    soundFX.playPop();
    onOpenPayment();
  };

  const handleLoadBuyerListIntoCart = () => {
    if (!buyerShoppingList) return;
    soundFX.playScanBeep();
    buyerShoppingList.items.forEach((bi) => {
      const prod = products.find((p) => p.id === bi.productId);
      if (prod) {
        for (let i = 0; i < bi.quantity; i++) {
          onAddToCart(prod, 'MANUAL');
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Challenge Mode Level Bar (if in CHALLENGE mode or active mission) */}
      {(gameMode === 'CHALLENGE' || activeMission) && (
        <div className="toy-card p-4 bg-gradient-to-r from-[#EDE9FE] via-[#FEF3C7] to-[#D1FAE5]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] border-2 border-[#1E293B] text-white flex items-center justify-center shadow-[0_3px_0_#1E293B] shrink-0">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#8B5CF6] text-white">
                    MODE TANTANGAN
                  </span>
                  {activeMission && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFBE0B] border border-[#1E293B]">
                      Hadiah: +{activeMission.rewardPoints} Poin & {activeMission.rewardStars} ⭐
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#1E293B] mt-0.5">
                  {activeMission ? activeMission.title : 'Pilih Level Tantangan Kasir'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-700">
                  {activeMission
                    ? activeMission.description
                    : 'Pilih salah satu level di kanan untuk memulai misi belanja!'}
                </p>
                {activeMission && (
                  <p className="text-xs font-bold text-purple-800 mt-0.5">
                    💡 Petunjuk: {activeMission.hint}
                  </p>
                )}
              </div>
            </div>

            {/* Level Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CHALLENGE_MISSIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundFX.playPop();
                    onSelectMission(m);
                    setMissionAlert(null);
                  }}
                  className={`toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs ${
                    activeMission?.id === m.id
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-white text-[#1E293B]'
                  }`}
                >
                  Lvl {m.level}
                </button>
              ))}
              {activeMission && (
                <button
                  onClick={() => onSelectMission(null)}
                  className="text-xs font-bold text-slate-600 underline ml-1 cursor-pointer"
                >
                  Mode Bebas
                </button>
              )}
            </div>
          </div>

          {activeMission && (
            <div
              className={`mt-3 px-3 py-2 rounded-xl border-2 border-[#1E293B] text-xs font-bold flex items-center gap-2 ${
                missionCheck.passed ? 'bg-[#D1FAE5] text-emerald-950' : 'bg-white text-slate-800'
              }`}
            >
              {missionCheck.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{missionCheck.reason}</span>
            </div>
          )}
        </div>
      )}

      {/* Role-Play Buyer Shopping List Banner (if a Buyer created a shopping list) */}
      {buyerShoppingList && buyerShoppingList.items.length > 0 && (
        <div className="toy-card p-3.5 bg-[#FFEDD5] flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FB8500] text-white">
              MODE ROLE PLAY • PESANAN PEMBELI: {buyerShoppingList.buyerName}
            </span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {buyerShoppingList.items.map((bi) => {
                const prod = products.find((p) => p.id === bi.productId);
                if (!prod) return null;
                return (
                  <span
                    key={bi.productId}
                    className="px-2.5 py-1 rounded-lg bg-white border-2 border-[#1E293B] text-xs font-bold"
                  >
                    {prod.name} × {bi.quantity}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            onClick={handleLoadBuyerListIntoCart}
            className="toy-btn-sm bg-[#10B981] text-white px-3.5 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Pindai Semua Pesanan Pembeli
          </button>
        </div>
      )}

      {/* Friendly Alert Message */}
      {missionAlert && (
        <div className="toy-card-sm p-3 bg-[#FEF3C7] text-[#1E293B] font-bold text-sm flex items-center justify-between gap-2 animate-pop">
          <span>💡 {missionAlert}</span>
          <button
            onClick={() => setMissionAlert(null)}
            className="text-xs font-extrabold underline cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      )}

      {/* MAIN 3-COLUMN CASHIER COUNTER WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================= LEFT COLUMN: KATALOG BARANG & SCAN MANUAL ================= */}
        <div className="lg:col-span-5 toy-card p-4 bg-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="font-display text-lg md:text-xl font-extrabold text-[#1E293B]">
                🛍️ KATALOG BARANG (MANUAL)
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Klik gambar barang untuk langsung memasukkan ke keranjang!
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] border-2 border-[#1E293B] font-display font-bold text-xs">
              {filteredProducts.length} Barang
            </span>
          </div>

          {/* Search by Name & Quick SKU Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3">
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / kode barang..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#1E293B] bg-[#FFFBEB] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>

            <form onSubmit={handleQuickSkuSubmit} className="sm:col-span-5 flex gap-1">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={skuQuickInput}
                  onChange={(e) => setSkuQuickInput(e.target.value)}
                  placeholder="Ketik SKU..."
                  className="w-full pl-8 pr-2 py-2 rounded-xl border-2 border-[#1E293B] bg-white text-xs font-receipt font-bold focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="toy-btn-sm bg-[#FFBE0B] text-[#1E293B] px-2.5 py-2 rounded-xl font-bold text-xs"
              >
                +SKU
              </button>
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
            <button
              onClick={() => {
                soundFX.playPop();
                setSelectedCategory('ALL');
              }}
              className={`toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-[#1E293B] text-white'
                  : 'bg-slate-100 text-[#1E293B]'
              }`}
            >
              🌟 Semua ({products.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedCategory(cat.id);
                }}
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : cat.bgLight,
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#1E293B',
                }}
                className="toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs shrink-0 flex items-center gap-1"
              >
                <span>{cat.emoji}</span>
                <span>{cat.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1 pt-1">
            {filteredProducts.map((item) => {
              const inCartQty = cart.find((c) => c.productId === item.id)?.quantity || 0;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFX.playScanBeep();
                    onAddToCart(item, 'MANUAL');
                  }}
                  className="toy-btn-sm relative group bg-[#FFFBEB] hover:bg-[#E0F2FE] p-2.5 rounded-2xl flex flex-col items-center text-center transition"
                >
                  {inCartQty > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#10B981] text-white border-2 border-[#1E293B] font-display font-bold text-xs flex items-center justify-center shadow">
                      {inCartQty}
                    </span>
                  )}
                  <span className="text-[10px] font-receipt font-bold text-slate-500 self-start">
                    {item.sku}
                  </span>
                  <div className="my-1 group-hover:scale-110 transition-transform">
                    <ProductIllustration iconKey={item.iconKey} className="w-14 h-14" />
                  </div>
                  <p className="font-display font-bold text-xs text-[#1E293B] line-clamp-1">
                    {item.name}
                  </p>
                  <span className="mt-1 px-2.5 py-0.5 rounded-lg bg-[#FFBE0B] border-2 border-[#1E293B] font-receipt font-bold text-xs text-[#1E293B]">
                    {formatRupiah(item.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= CENTER COLUMN: AREA SCANNER QR & MESIN KASIR ================= */}
        <div className="lg:col-span-3 space-y-4">
          <QrScannerPanel
            products={products}
            onScanProduct={(prod, src) => onAddToCart(prod, src)}
            cooldownMs={scanCooldownMs}
            lastScannedItem={lastScannedItem}
          />

          {/* Flat 2D cashier status panel — abstract color shapes, no cartoon machine */}
          <div className="toy-card p-4 bg-[#FFF7E8]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">RINGKASAN KASIR</span>
              <span className="rounded-full border border-slate-700 bg-[#34D399] px-2 py-1 text-[10px] font-bold text-slate-900">AKTIF</span>
            </div>
            <div className="mb-3 flex gap-2" aria-hidden="true">
              <span className="h-3 flex-1 rounded-full bg-[#F87171]" />
              <span className="h-3 flex-1 rounded-full bg-[#FBBF24]" />
              <span className="h-3 flex-1 rounded-full bg-[#60A5FA]" />
              <span className="h-3 flex-1 rounded-full bg-[#F9A8D4]" />
            </div>
            <p className="text-xs font-bold text-slate-500">TOTAL SEMENTARA</p>
            <p className="font-receipt text-2xl font-extrabold text-slate-800">{formatRupiah(totalBelanja)}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{lastScannedItem ? `Terakhir: ${lastScannedItem.product.name}` : 'Silakan pindai barang untuk memulai.'}</p>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: KERANJANG BELANJA & TOTAL ================= */}
        <div className="lg:col-span-4 toy-card p-4 bg-white flex flex-col">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b-3 border-[#1E293B] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8] border-2 border-[#1E293B] flex items-center justify-center text-[#1E293B] shadow-[0_3px_0_#1E293B]">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#1E293B] leading-tight">
                  KERANJANG BELANJA
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  {totalItemsCount} barang dipilih
                </p>
              </div>
            </div>

            {detailedCart.length > 0 && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onClearCart();
                }}
                className="toy-btn-sm bg-[#FEE2E2] text-[#EF4444] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 min-h-[260px] max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {detailedCart.length === 0 ? (
              <div className="h-60 rounded-2xl border-2 border-dashed border-slate-300 bg-[#FFFBEB] flex flex-col items-center justify-center p-6 text-center">
                <ShoppingCart className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-display font-bold text-sm text-slate-600">
                  Keranjang Belanja Masih Kosong
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Pindai QR Code barang di tengah atau klik gambar barang di katalog kiri!
                </p>
              </div>
            ) : (
              detailedCart.map((entry) => (
                <div
                  key={entry.product.id}
                  className="p-2.5 rounded-2xl bg-[#FFFBEB] border-2 border-[#1E293B] flex items-center justify-between gap-2 animate-pop"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                      <ProductIllustration iconKey={entry.product.iconKey} className="w-9 h-9" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-[#1E293B] truncate">
                        {entry.product.name}
                      </p>
                      <p className="font-receipt text-xs font-bold text-slate-600">
                        {entry.product.name} × {entry.quantity} ={' '}
                        <span className="text-emerald-700 font-extrabold">
                          {formatRupiah(entry.subtotal)}
                        </span>
                      </p>
                      <p className="text-[10px] font-receipt text-slate-500">
                        @{formatRupiah(entry.product.price)} / satuan
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        soundFX.playPop();
                        onUpdateQty(entry.product.id, -1);
                      }}
                      className="w-7 h-7 rounded-lg bg-white border-2 border-[#1E293B] flex items-center justify-center hover:bg-amber-100 cursor-pointer"
                      title="Kurangi"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-receipt font-bold text-sm">
                      {entry.quantity}
                    </span>
                    <button
                      onClick={() => {
                        soundFX.playPop();
                        onUpdateQty(entry.product.id, 1);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#38BDF8] border-2 border-[#1E293B] flex items-center justify-center hover:bg-sky-400 cursor-pointer"
                      title="Tambah"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        soundFX.playPop();
                        onRemoveFromCart(entry.product.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#FEE2E2] text-[#EF4444] border-2 border-[#1E293B] flex items-center justify-center ml-0.5 cursor-pointer"
                      title="Hapus Barang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total Calculation Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-[#1E293B] text-white border-3 border-[#1E293B]">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-1">
              <span>JUMLAH BARANG:</span>
              <span className="font-receipt">{totalItemsCount} pcs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-bold text-[#FFBE0B]">
                TOTAL BELANJA:
              </span>
              <span className="font-receipt text-2xl font-bold text-[#4ADE80]">
                {formatRupiah(totalBelanja)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Print Buyer Shopping List & Pay Now */}
          <div className="mt-3 space-y-2.5">
            <button
              onClick={handleProceedPayment}
              className="w-full toy-btn bg-[#10B981] text-white py-3.5 px-4 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2"
            >
              <Coins className="w-6 h-6" />
              BAYAR SEKARANG ({formatRupiah(totalBelanja)})
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                onOpenShoppingListModal();
              }}
              className="w-full toy-btn-sm bg-[#FFBE0B] text-[#1E293B] py-2.5 px-4 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              CETAK DAFTAR BELANJA PEMBELI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
