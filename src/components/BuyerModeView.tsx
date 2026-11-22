import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Printer,
  Download,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  BuyerShoppingList,
  CartItemDetailed,
  ItemCategory,
  ProductItem,
} from '../types/game';
import { CATEGORIES, formatRupiah } from '../data/defaultData';
import { ProductIllustration } from './SvgIcons';
import { downloadShoppingListPdf } from '../utils/pdfExport';
import { soundFX } from '../utils/sound';

interface BuyerModeViewProps {
  products: ProductItem[];
  defaultBuyerName: string;
  onSaveBuyerListAndGoToCashier: (list: BuyerShoppingList, autoLoadToCart: boolean) => void;
}

export const BuyerModeView: React.FC<BuyerModeViewProps> = ({
  products,
  defaultBuyerName,
  onSaveBuyerListAndGoToCashier,
}) => {
  const [buyerName, setBuyerName] = useState<string>(defaultBuyerName || 'Pembeli Cilik');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'ALL'>('ALL');
  const [walletBudget, setWalletBudget] = useState<number>(30000);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: 'item-1', quantity: 2 },
    { productId: 'item-2', quantity: 3 },
    { productId: 'item-3', quantity: 1 },
  ]);

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => selectedCategory === 'ALL' || p.category === selectedCategory);
  }, [products, selectedCategory]);

  const detailedList: CartItemDetailed[] = useMemo(() => {
    return items
      .map((it) => {
        const product = products.find((p) => p.id === it.productId);
        if (!product) return null;
        return {
          product,
          quantity: it.quantity,
          subtotal: product.price * it.quantity,
        };
      })
      .filter((x): x is CartItemDetailed => x !== null);
  }, [items, products]);

  const totalEstimation = useMemo(
    () => detailedList.reduce((acc, item) => acc + item.subtotal, 0),
    [detailedList]
  );

  const addItem = (productId: string) => {
    soundFX.playPop();
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    soundFX.playPop();
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleGoToCashier = (autoLoad: boolean) => {
    soundFX.playCashRegisterSuccess();
    onSaveBuyerListAndGoToCashier(
      {
        buyerName: buyerName || 'Pembeli Cilik',
        date: todayStr,
        items,
      },
      autoLoad
    );
  };

  return (
    <div className="space-y-5">
      {/* Role Play Header */}
      <div className="toy-card p-5 bg-gradient-to-r from-[#FFEDD5] via-[#FEF3C7] to-[#E0F2FE]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FB8500] border-3 border-[#1E293B] text-white flex items-center justify-center shadow-[0_4px_0_#1E293B]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FB8500] text-white">
                MODE ROLE PLAY • PERAN PEMBELI
              </span>
              <h2 className="font-display text-2xl font-extrabold text-[#1E293B] mt-0.5">
                SUSUN DAFTAR BELANJA PEMBELI
              </h2>
              <p className="text-xs md:text-sm font-bold text-slate-700">
                Pilih barang yang ingin kamu beli, cetak catatan belanjamu, lalu serahkan ke petugas kasir!
              </p>
            </div>
          </div>

          {/* Buyer Name & Budget */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border-2 border-[#1E293B]">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500">
                Nama Pembeli:
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="font-display font-bold text-sm text-[#1E293B] border-b-2 border-[#38BDF8] focus:outline-none"
              />
            </div>
            <div className="border-l-2 border-slate-200 pl-3">
              <label className="block text-[10px] font-extrabold uppercase text-slate-500">
                Uang Saku Pembeli:
              </label>
              <div className="flex items-center gap-1">
                <span className="font-receipt font-bold text-sm text-emerald-700">Rp</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="500"
                  value={walletBudget}
                  onChange={(e) => setWalletBudget(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 font-receipt font-bold text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="Uang saku pembeli"
                  placeholder="30000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Supermarket Shelf (Left) & Printable Buyer List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Supermarket Shelf */}
        <div className="lg:col-span-6 toy-card p-4 bg-white no-print">
          <h3 className="font-display text-lg font-extrabold text-[#1E293B] mb-2">
            🛒 Rak Barang Minimarket (Klik untuk Masuk Daftar Belanja)
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs shrink-0 ${
                selectedCategory === 'ALL' ? 'bg-[#1E293B] text-white' : 'bg-slate-100'
              }`}
            >
              🌟 Semua
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : cat.bgLight,
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#1E293B',
                }}
                className="toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs shrink-0"
              >
                {cat.emoji} {cat.shortLabel}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredProducts.map((item) => {
              const qty = items.find((i) => i.productId === item.id)?.quantity || 0;
              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item.id)}
                  className="toy-btn-sm relative bg-[#FFFBEB] hover:bg-amber-100 p-2.5 rounded-2xl flex flex-col items-center text-center"
                >
                  {qty > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FB8500] text-white border-2 border-[#1E293B] font-display font-bold text-xs flex items-center justify-center">
                      {qty}
                    </span>
                  )}
                  <ProductIllustration iconKey={item.iconKey} className="w-12 h-12 my-1" />
                  <p className="font-display font-bold text-xs text-[#1E293B] line-clamp-1">
                    {item.name}
                  </p>
                  <span className="mt-1 px-2 py-0.5 rounded-lg bg-[#FFBE0B] border border-[#1E293B] font-receipt font-bold text-xs">
                    {formatRupiah(item.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Formatted Daftar Belanja Pembeli */}
        <div className="lg:col-span-6 toy-card p-5 bg-white">
          <div className="print-area p-4 rounded-2xl border-3 border-[#1E293B] bg-[#FFFBEB]">
            <div className="text-center border-b-3 border-[#1E293B] pb-3 mb-3">
              <h3 className="font-display text-2xl font-extrabold text-[#1E293B]">
                KIDS SMART CASHIER
              </h3>
              <p className="text-xs font-bold text-slate-600">Created by: Widodo Guru SD</p>
              <div className="mt-1.5 inline-block bg-[#FFBE0B] px-4 py-1 rounded-full border-2 border-[#1E293B] font-display font-bold text-xs">
                DAFTAR BELANJA PEMBELI
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-xs md:text-sm font-bold mb-3">
              <div>
                Nama pembeli: <span className="underline">{buyerName || '______________'}</span>
              </div>
              <div>
                Tanggal: <span className="underline">{todayStr}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-[#1E293B] bg-white text-xs md:text-sm">
                <thead>
                  <tr className="bg-[#38BDF8] text-[#1E293B] font-display">
                    <th className="border-2 border-[#1E293B] px-2 py-2 text-center w-10">No</th>
                    <th className="border-2 border-[#1E293B] px-2.5 py-2 text-left">Nama Barang</th>
                    <th className="border-2 border-[#1E293B] px-2 py-2 text-center w-24">Jumlah</th>
                    <th className="border-2 border-[#1E293B] px-2.5 py-2 text-right">Harga</th>
                    <th className="border-2 border-[#1E293B] px-2.5 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 font-bold">
                        Klik barang di rak sebelah kiri untuk mengisi daftar belanja!
                      </td>
                    </tr>
                  ) : (
                    detailedList.map((entry, idx) => (
                      <tr key={entry.product.id} className="font-bold">
                        <td className="border-2 border-[#1E293B] px-2 py-2 text-center">
                          {idx + 1}
                        </td>
                        <td className="border-2 border-[#1E293B] px-2.5 py-2">
                          {entry.product.name}
                        </td>
                        <td className="border-2 border-[#1E293B] px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateQty(entry.product.id, -1)}
                              className="no-print w-5 h-5 rounded bg-slate-200 flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-receipt px-1">{entry.quantity}</span>
                            <button
                              onClick={() => updateQty(entry.product.id, 1)}
                              className="no-print w-5 h-5 rounded bg-sky-300 flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="border-2 border-[#1E293B] px-2.5 py-2 text-right font-receipt">
                          {formatRupiah(entry.product.price)}
                        </td>
                        <td className="border-2 border-[#1E293B] px-2.5 py-2 text-right font-receipt">
                          {formatRupiah(entry.subtotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="no-print">
                {items.length > 0 && (
                  <button
                    onClick={() => setItems([])}
                    className="text-xs font-bold text-rose-600 flex items-center gap-1 underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan Daftar
                  </button>
                )}
              </div>

              <div
                className={`px-4 py-2 rounded-xl border-2 border-[#1E293B] font-display font-bold text-base ${
                  totalEstimation <= walletBudget
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#EF4444] text-white'
                }`}
              >
                TOTAL ESTIMASI: <span className="font-receipt">{formatRupiah(totalEstimation)}</span>
              </div>
            </div>

            {totalEstimation > walletBudget && (
              <p className="no-print mt-2 text-xs font-bold text-rose-700 bg-rose-100 p-2 rounded-lg border border-rose-400">
                💡 Total estimasi melebihi uang saku ({formatRupiah(walletBudget)}). Kamu bisa menambah uang saku di atas atau mengurangi barang!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundFX.playPop();
                window.print();
              }}
              className="toy-btn bg-[#38BDF8] text-[#1E293B] py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              CETAK DAFTAR BELANJA
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                downloadShoppingListPdf(buyerName, todayStr, detailedList);
              }}
              className="toy-btn bg-[#FFBE0B] text-[#1E293B] py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD PDF
            </button>

            <button
              onClick={() => handleGoToCashier(false)}
              className="toy-btn bg-[#8B5CF6] text-white py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              SERAHKAN KE KASIR (SCAN MANUAL)
            </button>

            <button
              onClick={() => handleGoToCashier(true)}
              className="toy-btn bg-[#10B981] text-white py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              LANGSUNG MASUK KERANJANG KASIR
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
