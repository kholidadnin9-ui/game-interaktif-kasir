import React, { useEffect, useMemo, useState } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Edit3,
  Check,
  FileDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ItemCategory, ProductItem } from '../types/game';
import { CATEGORIES, formatRupiah } from '../data/defaultData';
import { ProductIllustration } from './SvgIcons';
import {
  downloadQrLabelsPdf,
  downloadSingleQrLabelPng,
  generateQrDataUrl,
} from '../utils/pdfExport';
import { soundFX } from '../utils/sound';

interface QrGeneratorViewProps {
  products: ProductItem[];
  onUpdateProduct: (updated: ProductItem) => void;
}

export const QrGeneratorView: React.FC<QrGeneratorViewProps> = ({
  products,
  onUpdateProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'ALL'>('ALL');
  const [labelSize, setLabelSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => selectedCategory === 'ALL' || p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Generate QR data URLs for all products
  useEffect(() => {
    let active = true;
    const buildAllQr = async () => {
      const nextMap: Record<string, string> = {};
      for (const p of products) {
        nextMap[p.id] = await generateQrDataUrl(p.qrCode, 220);
      }
      if (active) setQrMap(nextMap);
    };
    buildAllQr();
    return () => {
      active = false;
    };
  }, [products]);

  const toggleSelectItem = (id: string) => {
    soundFX.playPop();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    soundFX.playPop();
    const allIds = filteredProducts.map((p) => p.id);
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const startInlineEdit = (product: ProductItem) => {
    soundFX.playPop();
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(String(product.price));
  };

  const saveInlineEdit = (product: ProductItem) => {
    soundFX.playScanBeep();
    const cleanPrice = Math.max(500, parseInt(editPrice.replace(/\D/g, '') || '1000', 10));
    onUpdateProduct({
      ...product,
      name: editName.trim() || product.name,
      price: cleanPrice,
    });
    setEditingId(null);
  };

  const productsToExport = useMemo(() => {
    if (selectedIds.length > 0) {
      return products.filter((p) => selectedIds.includes(p.id));
    }
    return filteredProducts;
  }, [products, filteredProducts, selectedIds]);

  const handleDownloadAllPdf = async () => {
    soundFX.playPop();
    setIsExportingPdf(true);
    try {
      await downloadQrLabelsPdf(productsToExport, labelSize);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const qrImgClass = {
    SMALL: 'w-24 h-24',
    MEDIUM: 'w-32 h-32',
    LARGE: 'w-44 h-44',
  }[labelSize];

  return (
    <div className="qr-generator-root space-y-5">
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }

        @media print {
          html, body, #root {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .qr-generator-root { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .qr-generator-root .no-print { display: none !important; }

          .qr-generator-root .print-only {
            display: block !important;
            visibility: visible !important;
            margin: 0 0 4mm !important;
            padding: 0 !important;
            text-align: center !important;
          }

          .qr-generator-root .print-only h1 {
            margin: 0 !important;
            font-size: 16pt !important;
            line-height: 1.2 !important;
          }

          .qr-generator-root .print-only p {
            margin: 1mm 0 0 !important;
            font-size: 8pt !important;
          }

          .qr-generator-root .print-area {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            grid-auto-rows: 79mm !important;
            grid-auto-flow: row !important;
            align-items: stretch !important;
            gap: 3mm !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .qr-generator-root .qr-print-card {
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 100% !important;
            height: 79mm !important;
            min-height: 79mm !important;
            max-height: 79mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px solid #64748b !important;
            border-radius: 4mm !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          .qr-generator-root .qr-card-header {
            flex: 0 0 auto !important;
            min-height: 9mm !important;
            padding: 2mm 2.5mm !important;
            border-bottom: 1px solid #1e293b !important;
          }

          .qr-generator-root .qr-card-body {
            box-sizing: border-box !important;
            display: flex !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            padding: 2.5mm !important;
          }

          .qr-generator-root .qr-product-info {
            margin-bottom: 1mm !important;
            gap: 2mm !important;
          }

          .qr-generator-root .qr-product-icon {
            width: 11mm !important;
            height: 11mm !important;
            flex: 0 0 11mm !important;
          }

          .qr-generator-root .qr-code-frame {
            box-sizing: border-box !important;
            padding: 1.5mm !important;
            margin: 1mm 0 !important;
            border-radius: 3mm !important;
            box-shadow: none !important;
          }

          .qr-generator-root .qr-code-image {
            display: block !important;
            width: 27mm !important;
            height: 27mm !important;
            max-width: 27mm !important;
            max-height: 27mm !important;
            object-fit: contain !important;
            margin: 0 auto !important;
          }

          .qr-generator-root .qr-print-card h4 {
            margin-top: 1mm !important;
            font-size: 11pt !important;
            line-height: 1.15 !important;
          }

          .qr-generator-root .qr-price {
            margin-top: 1mm !important;
            padding: 1mm 3mm !important;
            font-size: 9pt !important;
            line-height: 1.2 !important;
          }

          .qr-generator-root .qr-credit {
            margin-top: 1mm !important;
            font-size: 7pt !important;
            line-height: 1.1 !important;
          }

          .qr-generator-root .qr-print-card,
          .qr-generator-root .qr-print-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {/* Control Studio Header (Hidden on Print) */}
      <div className="no-print toy-card p-5 bg-gradient-to-r from-[#E0F2FE] via-[#FEF3C7] to-[#EDE9FE]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6] border-3 border-[#1E293B] text-white flex items-center justify-center shadow-[0_4px_0_#1E293B]">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[#1E293B]">
                STUDIO GENERATE & CETAK QR CODE
              </h2>
              <p className="text-xs md:text-sm font-bold text-slate-700">
                Setiap QR Code menyimpan identitas unik barang (<code className="font-receipt bg-white px-1.5 py-0.5 rounded border">KSC-ITEM:SKU</code>). Perubahan harga otomatis terhubung!
              </p>
            </div>
          </div>

          {/* Bulk Export & Print Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadAllPdf}
              disabled={isExportingPdf}
              className="toy-btn bg-[#FFBE0B] text-[#1E293B] px-4 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" />
              {isExportingPdf
                ? 'Membuat PDF...'
                : `DOWNLOAD PDF (${productsToExport.length} Kartu)`}
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                window.print();
              }}
              className="toy-btn bg-[#10B981] text-white px-4 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              CETAK KARTU QR ({productsToExport.length})
            </button>
          </div>
        </div>

        {/* Filter Bar: Category, Label Size (Kecil / Sedang / Besar), Select All */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-[#1E293B]/20">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs ${
                selectedCategory === 'ALL' ? 'bg-[#1E293B] text-white' : 'bg-white'
              }`}
            >
              🌟 Semua Kategori ({products.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : '#FFFFFF',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#1E293B',
                }}
                className="toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs"
              >
                {cat.emoji} {cat.shortLabel}
              </button>
            ))}
          </div>

          {/* Label Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#1E293B]">Ukuran Label:</span>
            {(
              [
                { id: 'SMALL', label: 'Kecil' },
                { id: 'MEDIUM', label: 'Sedang' },
                { id: 'LARGE', label: 'Besar' },
              ] as const
            ).map((sz) => (
              <button
                key={sz.id}
                onClick={() => {
                  soundFX.playPop();
                  setLabelSize(sz.id);
                }}
                className={`toy-btn-sm px-3 py-1.5 rounded-xl font-display font-bold text-xs ${
                  labelSize === sz.id ? 'bg-[#38BDF8] text-[#1E293B]' : 'bg-white text-slate-600'
                }`}
              >
                {sz.label}
              </button>
            ))}

            <button
              onClick={selectAllFiltered}
              className="toy-btn-sm bg-white px-3 py-1.5 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 ml-1"
            >
              {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#10B981]" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {selectedIds.length > 0 ? `${selectedIds.length} Dipilih` : 'Pilih Semua'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Header (Visible on Print) */}
      <div className="hidden print-only text-center mb-4">
        <h1 className="font-display text-2xl font-bold">
          KIDS SMART CASHIER – LABEL QR CODE BARANG
        </h1>
        <p className="text-xs">Created by: Widodo Guru SD • Gunting kartu sesuai garis tepi</p>
      </div>

      {/* QR Code Cards Grid */}
      <div className="print-area grid grid-cols-3 gap-3">
        {productsToExport.map((product) => {
          const cat = CATEGORIES.find((c) => c.id === product.category);
          const isSelected = selectedIds.includes(product.id);
          const isEditing = editingId === product.id;

          return (
            <div
              key={product.id}
              className={`qr-print-card toy-card-sm overflow-hidden bg-white flex flex-col justify-between transition ${
                isSelected ? 'ring-4 ring-[#8B5CF6]' : ''
              }`}
            >
              {/* Colored Top Label Banner */}
              <div
                style={{ backgroundColor: cat?.color || '#38BDF8' }}
                className="qr-card-header px-3 py-2 border-b-2 border-[#1E293B] text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleSelectItem(product.id)}
                    className="no-print cursor-pointer"
                    title="Pilih Kartu"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#FFBE0B]" />
                    ) : (
                      <Square className="w-4 h-4 text-white/90" />
                    )}
                  </button>
                  <span className="font-display font-bold text-xs tracking-wide">
                    KIDS SMART CASHIER
                  </span>
                </div>
                <span className="font-receipt text-[11px] font-bold bg-black/25 px-2 py-0.5 rounded">
                  {product.sku}
                </span>
              </div>

              {/* Card Body: Illustration + QR Code + Name + Price */}
              <div className="qr-card-body p-3.5 flex flex-col items-center text-center flex-1">
                <div className="qr-product-info flex items-center justify-center gap-3 mb-2">
                  <div className="qr-product-icon w-12 h-12 rounded-xl bg-[#FFFBEB] border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                    <ProductIllustration iconKey={product.iconKey} className="w-10 h-10" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                      {cat?.label}
                    </span>
                    <span className="font-receipt text-[11px] font-bold text-purple-700 block">
                      ID: {product.qrCode}
                    </span>
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="qr-code-frame p-2 rounded-2xl bg-white border-2 border-[#1E293B] shadow-xs my-1">
                  {qrMap[product.id] ? (
                    <img
                      src={qrMap[product.id]}
                      alt={`QR ${product.name}`}
                      className={`${qrImgClass} qr-code-image object-contain mx-auto`}
                    />
                  ) : (
                    <div className={`${qrImgClass} qr-code-image flex items-center justify-center text-xs`}>
                      Memuat QR...
                    </div>
                  )}
                </div>

                {/* Editable Name & Price Before Generate */}
                {isEditing ? (
                  <div className="no-print w-full mt-2 space-y-1.5 bg-amber-50 p-2 rounded-xl border-2 border-[#1E293B]">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-[#1E293B] bg-white text-xs font-bold"
                      placeholder="Nama barang..."
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-[#1E293B] bg-white text-xs font-receipt font-bold"
                        placeholder="Harga..."
                      />
                    </div>
                    <button
                      onClick={() => saveInlineEdit(product)}
                      className="w-full toy-btn-sm bg-[#10B981] text-white py-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Simpan & Perbarui QR
                    </button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-display font-extrabold text-base text-[#1E293B] mt-1.5">
                      {product.name}
                    </h4>
                    <div className="qr-price mt-1 px-4 py-1 rounded-xl bg-[#FFBE0B] border-2 border-[#1E293B] font-receipt font-bold text-sm text-[#1E293B]">
                      {formatRupiah(product.price)}
                    </div>
                  </>
                )}

                <p className="qr-credit text-[10px] font-bold text-slate-400 mt-2">
                  Created by: Widodo Guru SD
                </p>
              </div>

              {/* Card Bottom Actions (Hidden on Print) */}
              <div className="no-print px-3 py-2 bg-slate-50 border-t-2 border-[#1E293B] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => startInlineEdit(product)}
                  className="toy-btn-sm bg-white text-[#1E293B] px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                  title="Edit Nama & Harga"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#FB8500]" />
                  Edit
                </button>

                <button
                  onClick={() => {
                    soundFX.playPop();
                    downloadSingleQrLabelPng(product, labelSize);
                  }}
                  className="toy-btn-sm flex-1 bg-[#38BDF8] text-[#1E293B] px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh PNG
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
