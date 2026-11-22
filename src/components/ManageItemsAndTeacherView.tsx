import React, { useMemo, useState } from 'react';
import {
  PackagePlus,
  Edit3,
  Trash2,
  Printer,
  Download,
  Search,
  Save,
  RotateCcw,
  BarChart3,
  Users,
  ShoppingBag,
  TrendingUp,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import {
  ItemCategory,
  PlayerProfile,
  ProductItem,
  TransactionRecord,
} from '../types/game';
import { CATEGORIES, formatRupiah } from '../data/defaultData';
import { AVAILABLE_ICON_KEYS, ProductIllustration } from './SvgIcons';
import { downloadPriceListPdf } from '../utils/pdfExport';
import { soundFX } from '../utils/sound';

interface ManageItemsProps {
  products: ProductItem[];
  onAddProduct: (item: ProductItem) => void;
  onUpdateProduct: (item: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onResetDefaultProducts: () => void;
  onGoToQrGenerator: () => void;
  initialTab?: 'CRUD' | 'PRICE_LIST' | 'TEACHER';
  transactions: TransactionRecord[];
  players: PlayerProfile[];
  storeName: string;
  onClearHistory: () => void;
}

export const ManageItemsAndTeacherView: React.FC<ManageItemsProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetDefaultProducts,
  onGoToQrGenerator,
  initialTab = 'CRUD',
  transactions,
  players,
  storeName,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'CRUD' | 'PRICE_LIST' | 'TEACHER'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State for Add / Edit
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ItemCategory>('MAKANAN');
  const [formPrice, setFormPrice] = useState<string>('5000');
  const [formSku, setFormSku] = useState<string>('');
  const [formStock, setFormStock] = useState<string>('50');
  const [formIconKey, setFormIconKey] = useState<string>('roti');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);

  const getAdminPassword = () => {
    try { return localStorage.getItem('ksc_admin_password') || '1234'; }
    catch { return '1234'; }
  };
  const unlockTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === getAdminPassword()) {
      setTeacherUnlocked(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Password salah. Silakan coba lagi.');
    }
  };
  const saveAdminPassword = () => {
    const clean = newAdminPassword.trim();
    if (!/^.{4,32}$/.test(clean)) {
      setPasswordError('Password baru minimal 4 karakter.');
      return;
    }
    try { localStorage.setItem('ksc_admin_password', clean); } catch {}
    setNewAdminPassword('');
    setShowPasswordEditor(false);
    setPasswordError('');
    showToast('Password admin berhasil diubah.');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.qrCode.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, selectedCategory, searchQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openAddModal = () => {
    soundFX.playPop();
    setEditingItem(null);
    setFormName('');
    setFormCategory('MAKANAN');
    setFormPrice('5000');
    const nextNum = String(products.length + 1).padStart(3, '0');
    setFormSku(`BRG-${nextNum}`);
    setFormStock('50');
    setFormIconKey('roti');
    setShowFormModal(true);
  };

  const openEditModal = (item: ProductItem) => {
    soundFX.playPop();
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(String(item.price));
    setFormSku(item.sku);
    setFormStock(String(item.stock));
    setFormIconKey(item.iconKey);
    setShowFormModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanPrice = Math.max(500, parseInt(formPrice.replace(/\D/g, '') || '1000', 10));
    const cleanStock = Math.max(0, parseInt(formStock.replace(/\D/g, '') || '20', 10));
    const cleanSku = (formSku.trim() || `BRG-${Date.now().toString().slice(-3)}`).toUpperCase();

    if (!cleanName) return;

    soundFX.playScanBeep();
    if (editingItem) {
      onUpdateProduct({
        ...editingItem,
        name: cleanName,
        category: formCategory,
        price: cleanPrice,
        sku: cleanSku,
        qrCode: `KSC-ITEM:${cleanSku}`,
        stock: cleanStock,
        iconKey: formIconKey,
      });
      showToast(`Barang "${cleanName}" berhasil diperbarui! QR Code otomatis menggunakan harga terbaru.`);
    } else {
      const newItem: ProductItem = {
        id: `item-${Date.now()}`,
        sku: cleanSku,
        qrCode: `KSC-ITEM:${cleanSku}`,
        name: cleanName,
        category: formCategory,
        price: cleanPrice,
        stock: cleanStock,
        iconKey: formIconKey,
      };
      onAddProduct(newItem);
      showToast(`Barang baru "${cleanName}" berhasil ditambahkan lengkap dengan QR Code unik!`);
    }
    setShowFormModal(false);
  };

  // Teacher Dashboard Analytics
  const analytics = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, tx) => acc + tx.totalAmount, 0);
    const totalItemsSold = transactions.reduce(
      (acc, tx) => acc + tx.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    const itemSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    transactions.forEach((tx) => {
      tx.items.forEach((it) => {
        if (!itemSalesMap[it.sku]) {
          itemSalesMap[it.sku] = { name: it.name, qty: 0, revenue: 0 };
        }
        itemSalesMap[it.sku].qty += it.quantity;
        itemSalesMap[it.sku].revenue += it.subtotal;
      });
    });

    const topProducts = Object.values(itemSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    return {
      totalTransactions: transactions.length,
      totalRevenue,
      totalItemsSold,
      topProducts,
    };
  }, [transactions]);

  return (
    <div className="space-y-5">
      {/* Sub-Navigation Tabs */}
      <div className="no-print toy-card p-3 bg-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('CRUD');
            }}
            className={`toy-btn-sm px-4 py-2 rounded-xl font-display font-bold text-sm flex items-center gap-2 ${
              activeTab === 'CRUD' ? 'bg-[#38BDF8] text-[#1E293B]' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            Kelola Barang & Harga ({products.length})
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('PRICE_LIST');
            }}
            className={`toy-btn-sm px-4 py-2 rounded-xl font-display font-bold text-sm flex items-center gap-2 ${
              activeTab === 'PRICE_LIST'
                ? 'bg-[#FFBE0B] text-[#1E293B]'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Printer className="w-4 h-4" />
            Cetak Daftar Harga
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('TEACHER');
              setTeacherUnlocked(false);
              setPasswordError('');
            }}
            className={`toy-btn-sm px-4 py-2 rounded-xl font-display font-bold text-sm flex items-center gap-2 ${
              activeTab === 'TEACHER'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard Guru / Admin
          </button>
        </div>

        <button
          onClick={onGoToQrGenerator}
          className="toy-btn-sm bg-[#10B981] text-white px-3.5 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          Buka Studio QR Code
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="no-print toy-card-sm p-3 bg-[#D1FAE5] text-emerald-950 font-bold text-sm flex items-center gap-2 animate-pop">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= TAB 1: KELOLA BARANG DAN HARGA ================= */}
      {activeTab === 'CRUD' && (
        <div className="space-y-4">
          <div className="toy-card p-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
                  📦 MANAJEMEN BARANG & DAFTAR HARGA
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Admin/Guru dapat menambah, mengedit harga, atau menghapus barang. Perubahan harga langsung aktif saat QR dipindai!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={openAddModal}
                  className="toy-btn bg-[#10B981] text-white px-4 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center gap-2"
                >
                  <PackagePlus className="w-5 h-5" />
                  + TAMBAH BARANG BARU
                </button>

                <button
                  onClick={() => {
                    soundFX.playPop();
                    onResetDefaultProducts();
                    showToast('Data barang berhasil dikembalikan ke 38 barang bawaan!');
                  }}
                  className="toy-btn-sm bg-amber-100 text-[#1E293B] px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset 38 Barang Awal
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs ${
                    selectedCategory === 'ALL' ? 'bg-[#1E293B] text-white' : 'bg-slate-100'
                  }`}
                >
                  🌟 Semua ({products.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      backgroundColor: selectedCategory === cat.id ? cat.color : cat.bgLight,
                      color: selectedCategory === cat.id ? '#FFFFFF' : '#1E293B',
                    }}
                    className="toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs"
                  >
                    {cat.emoji} {cat.shortLabel}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau SKU..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#1E293B] bg-[#FFFBEB] text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Items Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((item) => {
                const cat = CATEGORIES.find((c) => c.id === item.category);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#FFFBEB] border-2 border-[#1E293B] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                        <ProductIllustration iconKey={item.iconKey} className="w-11 h-11" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: cat?.color }}
                            className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full"
                          >
                            {cat?.shortLabel}
                          </span>
                          <span className="font-receipt text-[10px] font-bold text-slate-500">
                            {item.sku}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-[#1E293B] truncate mt-0.5">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-receipt font-bold text-sm text-emerald-700">
                            {formatRupiah(item.price)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            • Stok: {item.stock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditModal(item)}
                        className="toy-btn-sm bg-[#FFBE0B] text-[#1E293B] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          soundFX.playPop();
                          onDeleteProduct(item.id);
                          showToast(`Barang "${item.name}" telah dihapus.`);
                        }}
                        className="toy-btn-sm bg-[#FEE2E2] text-[#EF4444] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CETAK DAFTAR HARGA ================= */}
      {activeTab === 'PRICE_LIST' && (
        <div className="toy-card p-5 bg-white">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-slate-200">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
                🖨️ CETAK DAFTAR HARGA BARANG MINIMARKET
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Cetak katalog daftar harga ini untuk ditempel di meja kasir atau dibagikan kepada pembeli!
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  soundFX.playPop();
                  window.print();
                }}
                className="toy-btn bg-[#38BDF8] text-[#1E293B] px-4 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                CETAK DAFTAR HARGA
              </button>
              <button
                onClick={() => {
                  soundFX.playPop();
                  downloadPriceListPdf(products, storeName);
                }}
                className="toy-btn bg-[#FFBE0B] text-[#1E293B] px-4 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                DOWNLOAD PDF
              </button>
            </div>
          </div>

          {/* Printable Price List Area */}
          <div className="print-area space-y-6">
            <div className="text-center border-b-3 border-[#1E293B] pb-3">
              <h1 className="font-display text-2xl font-extrabold text-[#1E293B]">
                KIDS SMART CASHIER – DAFTAR HARGA RESMI
              </h1>
              <p className="text-xs font-bold text-slate-600">
                Created by: Widodo Guru SD • {storeName}
              </p>
            </div>

            {CATEGORIES.map((cat) => {
              const catItems = products.filter((p) => p.category === cat.id);
              if (catItems.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-2">
                  <div
                    style={{ backgroundColor: cat.color }}
                    className="px-4 py-1.5 rounded-xl border-2 border-[#1E293B] text-white font-display font-bold text-sm flex items-center justify-between"
                  >
                    <span>
                      {cat.emoji} KATEGORI: {cat.label.toUpperCase()}
                    </span>
                    <span>{catItems.length} Barang</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border-2 border-[#1E293B] bg-[#FFFBEB] flex items-center gap-2.5"
                      >
                        <ProductIllustration iconKey={item.iconKey} className="w-10 h-10 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-receipt text-[10px] font-bold text-slate-500 block">
                            {item.sku}
                          </span>
                          <p className="font-display font-bold text-xs text-[#1E293B] truncate">
                            {item.name}
                          </p>
                          <p className="font-receipt font-extrabold text-xs text-emerald-700">
                            {formatRupiah(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DASHBOARD GURU / ADMIN ================= */}
      {activeTab === 'TEACHER' && !teacherUnlocked && (
        <div className="mx-auto max-w-md rounded-[28px] border-2 border-slate-800 bg-[#FFF7E8] p-6 shadow-[6px_6px_0_#334155]">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl border-2 border-slate-800 bg-[#A7F3D0]" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Area Guru / Admin</h2>
              <p className="text-sm text-slate-600">Masukkan password untuk membuka dashboard.</p>
            </div>
          </div>
          <form onSubmit={unlockTeacher} className="space-y-3">
            <input autoFocus type="password" value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password guru/admin" aria-label="Password guru/admin"
              className="w-full rounded-xl border-2 border-slate-700 bg-white px-4 py-3 text-base" />
            {passwordError && <p className="text-sm font-bold text-rose-700">{passwordError}</p>}
            <button type="submit" className="w-full rounded-xl border-2 border-slate-800 bg-[#FBBF24] px-4 py-3 font-bold text-slate-900">Masuk Dashboard</button>
            <p className="text-xs text-slate-500">Password awal: 1234. Setelah masuk, password dapat diubah.</p>
          </form>
        </div>
      )}

      {activeTab === 'TEACHER' && teacherUnlocked && (
        <div className="space-y-5">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-slate-800 bg-white p-4">
            <div>
              <h2 className="font-bold text-slate-800">Laporan Perkembangan Siswa</h2>
              <p className="text-xs text-slate-500">Laporan kemampuan berhitung dan aktivitas bermain per siswa.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => window.print()} className="rounded-xl border-2 border-slate-800 bg-[#60A5FA] px-4 py-2 font-bold text-slate-900">Cetak / Print Laporan</button>
              <button onClick={() => { setShowPasswordEditor((v) => !v); setPasswordError(''); }} className="rounded-xl border-2 border-slate-800 bg-[#F9A8D4] px-4 py-2 font-bold text-slate-900">Ubah Password</button>
            </div>
          </div>
          {showPasswordEditor && (
            <div className="no-print rounded-2xl border-2 border-slate-800 bg-[#FDF2F8] p-4">
              <label className="mb-2 block text-sm font-bold">Password baru (minimal 4 karakter)</label>
              <div className="flex flex-wrap gap-2">
                <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="min-w-[220px] flex-1 rounded-xl border-2 border-slate-700 bg-white px-3 py-2" placeholder="Masukkan password baru" />
                <button onClick={saveAdminPassword} className="rounded-xl border-2 border-slate-800 bg-[#34D399] px-4 py-2 font-bold">Simpan Password</button>
              </div>
              {passwordError && <p className="mt-2 text-sm font-bold text-rose-700">{passwordError}</p>}
            </div>
          )}
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="toy-card p-4 bg-[#E0F2FE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-sky-900">
                  Total Transaksi
                </span>
                <ShoppingBag className="w-5 h-5 text-sky-700" />
              </div>
              <p className="font-display text-3xl font-extrabold text-[#1E293B] mt-1">
                {analytics.totalTransactions}
              </p>
              <p className="text-xs font-bold text-sky-800 mt-0.5">Struk pembelian tercatat</p>
            </div>

            <div className="toy-card p-4 bg-[#D1FAE5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-emerald-900">
                  Total Nilai Transaksi
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
              <p className="font-receipt text-2xl font-extrabold text-[#1E293B] mt-1">
                {formatRupiah(analytics.totalRevenue)}
              </p>
              <p className="text-xs font-bold text-emerald-800 mt-0.5">Akumulasi uang belanja</p>
            </div>

            <div className="toy-card p-4 bg-[#FEF3C7]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-amber-900">
                  Barang Terjual
                </span>
                <BarChart3 className="w-5 h-5 text-amber-700" />
              </div>
              <p className="font-display text-3xl font-extrabold text-[#1E293B] mt-1">
                {analytics.totalItemsSold} pcs
              </p>
              <p className="text-xs font-bold text-amber-800 mt-0.5">Total barang dipindai</p>
            </div>

            <div className="toy-card p-4 bg-[#EDE9FE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-purple-900">
                  Siswa Terdaftar
                </span>
                <Users className="w-5 h-5 text-purple-700" />
              </div>
              <p className="font-display text-3xl font-extrabold text-[#1E293B] mt-1">
                {players.length} Anak
              </p>
              <p className="text-xs font-bold text-purple-800 mt-0.5">Aktif bermain simulasi</p>
            </div>
          </div>

          {/* Student Math & Cashier Competency Table */}
          <div className="toy-card p-5 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display text-lg font-extrabold text-[#1E293B]">
                  👩‍🏫 LAPORAN KEMAMPUAN BERHITUNG & AKTIVITAS ANAK (EVALUASI GURU)
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  Memantau perkembangan setiap siswa dalam memindai barang, menghitung total, dan menghitung uang kembalian.
                </p>
              </div>
              {transactions.length > 0 && (
                <button
                  onClick={() => {
                    soundFX.playPop();
                    onClearHistory();
                    showToast('Riwayat transaksi telah direset oleh Guru.');
                  }}
                  className="toy-btn-sm bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl font-bold text-xs"
                >
                  Hapus Riwayat Transaksi
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-[#1E293B] text-sm">
                <thead>
                  <tr className="bg-[#38BDF8] text-[#1E293B] font-display">
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-left">Nama Anak</th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-left">Kelas</th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-center">Poin</th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-center">Bintang</th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-center">
                      Transaksi Selesai
                    </th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-center">
                      Barang Dipindai
                    </th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-center">Penjumlahan Tepat</th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-center">Pengurangan Tepat</th>
                    <th className="border-2 border-[#1E293B] px-3 py-2 text-left">
                      Evaluasi Kemampuan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((pl) => {
                    const studentTransactions = transactions.filter((tx) =>
                      tx.playerId ? tx.playerId === pl.id : tx.cashierName === pl.name
                    );
                    const additionAssessed = studentTransactions.filter((tx) => typeof tx.additionGuessedCorrectly === 'boolean');
                    const subtractionAssessed = studentTransactions.filter((tx) => typeof (tx.subtractionGuessedCorrectly ?? tx.changeGuessedCorrectly) === 'boolean');
                    const additionRate = additionAssessed.length
                      ? additionAssessed.filter((tx) => tx.additionGuessedCorrectly === true).length / additionAssessed.length
                      : null;
                    const subtractionRate = subtractionAssessed.length
                      ? subtractionAssessed.filter((tx) => (tx.subtractionGuessedCorrectly ?? tx.changeGuessedCorrectly) === true).length / subtractionAssessed.length
                      : null;
                    const levelText = additionRate === null && subtractionRate === null
                      ? 'Belum ada data penilaian'
                      : additionRate !== null && subtractionRate !== null && additionRate >= 0.8 && subtractionRate >= 0.8
                      ? 'Sangat baik dalam penjumlahan dan pengurangan'
                      : 'Kemampuan sedang berkembang';
                    return (
                      <tr key={pl.id} className="font-bold hover:bg-amber-50">
                        <td className="border-2 border-[#1E293B] px-3 py-2">{pl.name}</td>
                        <td className="border-2 border-[#1E293B] px-3 py-2">{pl.className || '-'}</td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-center font-receipt text-purple-700">
                          {pl.points}
                        </td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-center">
                          ⭐ {pl.stars}
                        </td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-center font-receipt">
                          {pl.transactionsCount}x
                        </td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-center font-receipt">
                          {pl.itemsScannedCount} pcs
                        </td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-center font-receipt text-emerald-700">
                          {additionAssessed.filter((tx) => tx.additionGuessedCorrectly === true).length}/{additionAssessed.length}
                        </td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-center font-receipt text-emerald-700">
                          {subtractionAssessed.filter((tx) => (tx.subtractionGuessedCorrectly ?? tx.changeGuessedCorrectly) === true).length}/{subtractionAssessed.length}
                        </td>
                        <td className="border-2 border-[#1E293B] px-3 py-2 text-xs">
                          {levelText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-5 space-y-3">
              <h3 className="font-bold text-slate-800">Riwayat Aktivitas Siswa</h3>
              {players.map((pl) => {
                const records = transactions.filter((tx) => tx.playerId ? tx.playerId === pl.id : tx.cashierName === pl.name);
                return (
                  <section key={`activity-${pl.id}`} className="break-inside-avoid rounded-xl border border-slate-400 p-3">
                    <div className="mb-2 flex flex-wrap justify-between gap-2">
                      <strong>{pl.name} — {pl.className || 'Kelas belum diisi'}</strong>
                      <span className="text-xs text-slate-600">{records.length} aktivitas transaksi</span>
                    </div>
                    {records.length === 0 ? <p className="text-xs text-slate-500">Belum ada transaksi yang diselesaikan.</p> : (
                      <table className="w-full border-collapse text-xs">
                        <thead><tr className="bg-slate-100"><th className="border px-2 py-1 text-left">Waktu</th><th className="border px-2 py-1">Mode</th><th className="border px-2 py-1">Total Belanja</th><th className="border px-2 py-1">Kembalian</th><th className="border px-2 py-1">Penjumlahan</th><th className="border px-2 py-1">Pengurangan</th><th className="border px-2 py-1 text-left">Aktivitas</th></tr></thead>
                        <tbody>{records.map((tx) => <tr key={tx.id}>
                          <td className="border px-2 py-1">{tx.timestamp}</td>
                          <td className="border px-2 py-1 text-center">{tx.mode}</td>
                          <td className="border px-2 py-1 text-right">{formatRupiah(tx.totalAmount)}</td>
                          <td className="border px-2 py-1 text-right">{formatRupiah(tx.changeAmount)}</td>
                          <td className="border px-2 py-1 text-center">{tx.additionGuessedCorrectly === true ? 'Tepat' : tx.additionGuessedCorrectly === false ? 'Belum tepat' : 'Tidak diuji'}</td>
                          <td className="border px-2 py-1 text-center">{(tx.subtractionGuessedCorrectly ?? tx.changeGuessedCorrectly) === true ? 'Tepat' : (tx.subtractionGuessedCorrectly ?? tx.changeGuessedCorrectly) === false ? 'Belum tepat' : 'Tidak diuji'}</td>
                          <td className="border px-2 py-1">{tx.items.map((it) => `${it.name} ×${it.quantity}`).join(', ')}</td>
                        </tr>)}</tbody>
                      </table>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Product */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="toy-card bg-[#FFFBEB] max-w-lg w-full p-5 animate-pop">
            <h3 className="font-display text-xl font-extrabold text-[#1E293B] mb-3">
              {editingItem ? `✏️ Edit Barang: ${editingItem.name}` : '➕ Tambah Barang Baru'}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
                  Nama Barang:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Susu Cokelat"
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
                    Kategori:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-bold text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
                    Harga Satuan (Rupiah):
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="500"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-receipt font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
                    Kode Barang / SKU:
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-receipt font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
                    Stok Barang:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-receipt font-bold text-sm"
                  />
                </div>
              </div>

              {/* SVG Icon Picker */}
              <div>
                <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
                  Pilih Ilustrasi SVG Barang:
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-white border-2 border-[#1E293B]">
                  {AVAILABLE_ICON_KEYS.map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setFormIconKey(key)}
                      className={`p-1 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                        formIconKey === key
                          ? 'bg-[#FFBE0B] border-[#1E293B]'
                          : 'border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <ProductIllustration iconKey={key} className="w-8 h-8" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="toy-btn-sm bg-slate-200 text-[#1E293B] px-4 py-2 rounded-xl font-bold text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="toy-btn bg-[#10B981] text-white px-5 py-2 rounded-xl font-display font-bold text-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
