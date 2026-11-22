import React, { useState } from 'react';
import { Printer, Download, RotateCcw, Star, Sparkles, ArrowLeft, Award } from 'lucide-react';
import { CartItemDetailed, TransactionRecord } from '../types/game';
import { formatNumberPlain, formatRupiah } from '../data/defaultData';
import { downloadReceiptPdf, downloadShoppingListPdf } from '../utils/pdfExport';
import { soundFX } from '../utils/sound';

interface ReceiptModalProps {
  transaction: TransactionRecord;
  storeName: string;
  defaultPaperSize?: '58mm' | '80mm' | 'A4';
  onNewTransaction: () => void;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  storeName,
  defaultPaperSize = '80mm',
  onNewTransaction,
  onClose,
}) => {
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm' | 'A4'>(defaultPaperSize);

  const handlePrint = () => {
    soundFX.playPop();
    window.print();
  };

  const handleDownloadPdf = () => {
    soundFX.playPop();
    downloadReceiptPdf(transaction, storeName);
  };

  const widthClass = {
    '58mm': 'max-w-[270px] text-xs',
    '80mm': 'max-w-[340px] text-sm',
    'A4': 'max-w-[540px] text-base',
  }[paperSize];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="toy-card bg-[#FFFBEB] max-w-2xl w-full p-5 md:p-6 my-8 animate-pop">
        {/* Celebration Banner (Hidden on Print) */}
        <div className="no-print text-center mb-5 bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] p-4 rounded-2xl border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] text-white">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-7 h-7 text-[#FFBE0B] animate-bounce" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow">
              YEAY! TRANSAKSI BERHASIL!
            </h2>
            <Sparkles className="w-7 h-7 text-[#FFBE0B] animate-bounce" />
          </div>
          <p className="text-sm font-bold text-emerald-50">
            Hebat sekali Kasir Cerdas {transaction.cashierName}! Pembayaran telah selesai dengan tepat.
          </p>

          {/* Points & Stars Earned */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <div className="bg-[#FFBE0B] text-[#1E293B] px-3.5 py-1.5 rounded-full border-2 border-[#1E293B] font-display font-bold text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              +{transaction.pointsEarned} Poin Kasir Cerdas
            </div>
            <div className="bg-white text-[#1E293B] px-3.5 py-1.5 rounded-full border-2 border-[#1E293B] font-display font-bold text-sm flex items-center gap-1">
              {Array.from({ length: Math.max(1, transaction.starsEarned) }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#FFBE0B] text-[#1E293B]" />
              ))}
              <span className="ml-1">+{transaction.starsEarned} Bintang!</span>
            </div>
          </div>
        </div>

        {/* Paper Size Selector (Hidden on Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-4 bg-white p-2.5 rounded-xl border-2 border-[#1E293B]">
          <span className="text-xs font-extrabold text-[#1E293B]">
            🖨️ Pilih Ukuran Cetak Struk:
          </span>
          <div className="flex items-center gap-1.5">
            {(['58mm', '80mm', 'A4'] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setPaperSize(sz)}
                className={`px-3 py-1 rounded-lg font-bold text-xs border-2 border-[#1E293B] cursor-pointer transition ${
                  paperSize === sz ? 'bg-[#38BDF8] text-[#1E293B]' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {sz === 'A4' ? 'Kertas A4' : `Thermal ${sz}`}
              </button>
            ))}
          </div>
        </div>

        {/* Authentic Thermal Receipt Paper */}
        <div className={`print-area mx-auto w-full ${widthClass} transition-all`}>
          <div className="receipt-zigzag-top no-print" />
          <div className="bg-white px-5 py-6 border-x-2 border-dashed border-slate-300 shadow-md font-receipt text-[#1E293B]">
            <div className="text-center border-b-2 border-dashed border-slate-400 pb-3 mb-3">
              <h3 className="font-bold text-lg tracking-wider">KIDS SMART CASHIER</h3>
              <p className="text-[11px] font-bold text-slate-600">Created by: Widodo Guru SD</p>
              <p className="text-xs font-bold mt-0.5">{storeName}</p>
              <div className="mt-2 inline-block px-3 py-0.5 bg-slate-100 border border-slate-400 rounded font-bold text-xs">
                STRUK PEMBELIAN
              </div>
            </div>

            <div className="text-xs space-y-1 border-b-2 border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between">
                <span>No Struk:</span>
                <span className="font-bold">{transaction.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{transaction.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Nama Kasir:</span>
                <span className="font-bold">{transaction.cashierName}</span>
              </div>
              {transaction.buyerName && (
                <div className="flex justify-between">
                  <span>Pembeli:</span>
                  <span>{transaction.buyerName}</span>
                </div>
              )}
            </div>

            {/* Itemized List */}
            <div className="space-y-2 border-b-2 border-dashed border-slate-400 pb-3 mb-3">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="font-bold">{item.name}</div>
                  <div className="flex justify-between text-slate-700">
                    <span>
                      {item.quantity} x {formatNumberPlain(item.price)}
                    </span>
                    <span className="font-bold">= {formatNumberPlain(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-xs border-b-2 border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between text-sm font-bold">
                <span>TOTAL BELANJA:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uang Diterima:</span>
                <span>{formatRupiah(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-700">
                <span>Uang Kembalian:</span>
                <span>{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs space-y-1 pt-1">
              <p className="font-bold text-sm">TERIMA KASIH</p>
              <p className="font-bold">SELAMAT BERBELANJA!</p>
              <p className="text-[10px] text-slate-500 pt-1">
                Simulasi Kasir Cerdas Anak SD
              </p>
            </div>
          </div>
          <div className="receipt-zigzag-bottom no-print" />
        </div>

        {/* Action Buttons */}
        <div className="no-print mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handlePrint}
            className="toy-btn bg-[#38BDF8] text-[#1E293B] py-3 px-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            CETAK STRUK
          </button>
          <button
            onClick={handleDownloadPdf}
            className="toy-btn bg-[#FFBE0B] text-[#1E293B] py-3 px-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            DOWNLOAD PDF
          </button>
          <button
            onClick={() => {
              soundFX.playPop();
              onNewTransaction();
            }}
            className="toy-btn bg-[#10B981] text-white py-3 px-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            TRANSAKSI BARU
          </button>
        </div>

        <div className="no-print mt-3 text-center">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
          >
            Tutup Jendela Struk
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShoppingListModalProps {
  items: CartItemDetailed[];
  initialBuyerName?: string;
  onClose: () => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  items,
  initialBuyerName = '',
  onClose,
}) => {
  const [buyerName, setBuyerName] = useState(initialBuyerName || 'Anak Cerdas');
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const totalEstimation = items.reduce((sum, entry) => sum + entry.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="toy-card bg-white max-w-2xl w-full p-6 my-8 animate-pop">
        {/* Editable Buyer Name Input (No-Print) */}
        <div className="no-print mb-4 p-3 rounded-xl bg-sky-50 border-2 border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-extrabold text-[#1E293B]">
            ✏️ Nama Pembeli pada Daftar Belanja:
          </label>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Ketik nama pembeli..."
            className="px-3 py-1.5 rounded-lg border-2 border-[#1E293B] bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
        </div>

        {/* Printable Shopping List Area */}
        <div className="print-area p-5 rounded-2xl border-3 border-[#1E293B] bg-[#FFFBEB]">
          <div className="text-center border-b-3 border-[#1E293B] pb-3 mb-4">
            <h2 className="font-display text-2xl font-extrabold text-[#1E293B]">
              KIDS SMART CASHIER
            </h2>
            <p className="text-xs font-bold text-slate-600">Created by: Widodo Guru SD</p>
            <div className="mt-2 inline-block bg-[#FFBE0B] px-4 py-1 rounded-full border-2 border-[#1E293B] font-display font-bold text-sm">
              DAFTAR BELANJA PEMBELI
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 text-sm font-bold mb-4">
            <div>
              Nama pembeli: <span className="underline">{buyerName || '__________________'}</span>
            </div>
            <div>
              Tanggal: <span className="underline">{todayStr}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-[#1E293B] bg-white text-sm">
              <thead>
                <tr className="bg-[#38BDF8] text-[#1E293B] font-display">
                  <th className="border-2 border-[#1E293B] px-3 py-2 text-center w-12">No</th>
                  <th className="border-2 border-[#1E293B] px-3 py-2 text-left">Nama Barang</th>
                  <th className="border-2 border-[#1E293B] px-3 py-2 text-center w-20">Jumlah</th>
                  <th className="border-2 border-[#1E293B] px-3 py-2 text-right">Harga</th>
                  <th className="border-2 border-[#1E293B] px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 font-bold">
                      Belum ada barang dalam daftar belanja.
                    </td>
                  </tr>
                ) : (
                  items.map((entry, idx) => (
                    <tr key={entry.product.id} className="font-bold">
                      <td className="border-2 border-[#1E293B] px-3 py-2 text-center">{idx + 1}</td>
                      <td className="border-2 border-[#1E293B] px-3 py-2">{entry.product.name}</td>
                      <td className="border-2 border-[#1E293B] px-3 py-2 text-center">{entry.quantity}</td>
                      <td className="border-2 border-[#1E293B] px-3 py-2 text-right font-receipt">
                        {formatRupiah(entry.product.price)}
                      </td>
                      <td className="border-2 border-[#1E293B] px-3 py-2 text-right font-receipt">
                        {formatRupiah(entry.subtotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="bg-[#10B981] text-white px-5 py-2.5 rounded-xl border-2 border-[#1E293B] font-display font-bold text-lg">
              TOTAL ESTIMASI: <span className="font-receipt">{formatRupiah(totalEstimation)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              soundFX.playPop();
              window.print();
            }}
            className="toy-btn bg-[#38BDF8] text-[#1E293B] py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            CETAK DAFTAR BELANJA
          </button>
          <button
            onClick={() => {
              soundFX.playPop();
              downloadShoppingListPdf(buyerName, todayStr, items);
            }}
            className="toy-btn bg-[#FFBE0B] text-[#1E293B] py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            DOWNLOAD PDF
          </button>
          <button
            onClick={() => {
              soundFX.playPop();
              onClose();
            }}
            className="toy-btn bg-[#FB8500] text-white py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            KEMBALI KE KASIR
          </button>
        </div>
      </div>
    </div>
  );
};
