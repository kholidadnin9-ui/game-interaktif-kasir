import React, { useState } from 'react';
import { Calculator, CheckCircle2, Coins, RotateCcw, Sparkles, X, HelpCircle } from 'lucide-react';
import { ChallengeMission } from '../types/game';
import { formatRupiah } from '../data/defaultData';
import { RupiahNoteSvg } from './SvgIcons';
import { soundFX } from '../utils/sound';

interface PaymentModalProps {
  totalAmount: number;
  itemsForMath: { name: string; subtotal: number }[];
  activeMission?: ChallengeMission | null;
  requireMathQuizDefault?: boolean;
  onConfirmPayment: (paidAmount: number, changeAmount: number, guessedAdditionCorrectly: boolean | null, guessedChangeCorrectly: boolean | null) => void;
  onCancel: () => void;
}

const NOMINALS = [2000, 5000, 10000, 20000, 50000, 100000];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  totalAmount,
  itemsForMath,
  activeMission,
  requireMathQuizDefault = false,
  onConfirmPayment,
  onCancel,
}) => {
  const initialPaid = activeMission?.forcedPaymentAmount || 0;
  const [paidAmount, setPaidAmount] = useState<number>(initialPaid);
  const [manualInput, setManualInput] = useState<string>(initialPaid ? String(initialPaid) : '');
  const [addMode, setAddMode] = useState<boolean>(true); // true = tambah lembar uang, false = pilih langsung
  const [calculated, setCalculated] = useState<boolean>(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Kid math practice for change (+30 points)
  const [additionPracticeMode, setAdditionPracticeMode] = useState<boolean>(
    Boolean(requireMathQuizDefault)
  );
  const [kidAdditionGuess, setKidAdditionGuess] = useState<string>('');
  const [additionFeedback, setAdditionFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [mathPracticeMode, setMathPracticeMode] = useState<boolean>(
    Boolean(activeMission?.requireChangeGuess || requireMathQuizDefault)
  );
  const [kidChangeGuess, setKidChangeGuess] = useState<string>('');
  const [mathFeedback, setMathFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const actualChange = Math.max(0, paidAmount - totalAmount);
  const additionTotal = itemsForMath.reduce((sum, item) => sum + item.subtotal, 0);
  const isEnough = paidAmount >= totalAmount && totalAmount > 0;

  const handleSelectNominal = (nominal: number) => {
    soundFX.playMoneyClick();
    setWarningMsg(null);
    setMathFeedback(null);
    setAdditionFeedback(null);
    const nextVal = addMode ? paidAmount + nominal : nominal;
    setPaidAmount(nextVal);
    setManualInput(String(nextVal));
    setCalculated(false);
  };

  const handleExactMoney = () => {
    soundFX.playMoneyClick();
    setWarningMsg(null);
    setMathFeedback(null);
    setAdditionFeedback(null);
    setPaidAmount(totalAmount);
    setManualInput(String(totalAmount));
    setCalculated(true);
  };

  const handleManualInputChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    setManualInput(digitsOnly);
    const parsed = parseInt(digitsOnly || '0', 10);
    setPaidAmount(parsed);
    setWarningMsg(null);
    setAdditionFeedback(null);
    setCalculated(false);
  };

  const handleCalculateButton = () => {
    if (paidAmount < totalAmount) {
      soundFX.playGentleHint();
      const kurang = totalAmount - paidAmount;
      setWarningMsg(
        `Wah, uang yang diterima masih kurang ${formatRupiah(kurang)} lagi! Yuk tambah uang pembayarannya ya 😊`
      );
      setCalculated(false);
      return;
    }

    if (additionPracticeMode) {
      const additionGuess = parseInt(kidAdditionGuess.replace(/\D/g, '') || '-1', 10);
      if (additionGuess !== additionTotal) {
        soundFX.playGentleHint();
        setAdditionFeedback({
          ok: false,
          msg: 'Belum tepat. Jumlahkan kembali subtotal setiap barang, lalu coba lagi.',
        });
        setCalculated(false);
        return;
      }
      setAdditionFeedback({ ok: true, msg: 'Hebat! Penjumlahan harga barangmu benar.' });
    }

    let guessedRight: boolean | null = null;
    if (mathPracticeMode) {
      const guessNum = parseInt(kidChangeGuess.replace(/\D/g, '') || '-1', 10);
      if (guessNum !== actualChange) {
        soundFX.playGentleHint();
        setMathFeedback({
          ok: false,
          msg: `Hampir tepat! Petunjuk: Hitung ${formatRupiah(paidAmount)} dikurangi ${formatRupiah(
            totalAmount
          )}. Ayo coba hitung sekali lagi, kamu pasti bisa! 🌟`,
        });
        return;
      } else {
        setMathFeedback({
          ok: true,
          msg: `HEBAT SEKALI! Hitungan kembalianmu ${formatRupiah(actualChange)} benar 100%! (+30 Poin)`,
        });
      }
    }

    soundFX.playPop();
    setWarningMsg(null);
    setCalculated(true);
  };

  const handleFinishTransaction = () => {
    if (paidAmount < totalAmount) {
      handleCalculateButton();
      return;
    }

    let guessedAdditionRight: boolean | null = null;
    if (additionPracticeMode) {
      const additionGuess = parseInt(kidAdditionGuess.replace(/\D/g, '') || '-1', 10);
      if (additionGuess !== additionTotal) {
        soundFX.playGentleHint();
        setAdditionFeedback({
          ok: false,
          msg: 'Belum tepat. Jumlahkan kembali subtotal setiap barang, lalu coba lagi.',
        });
        setCalculated(false);
        return;
      }
      guessedAdditionRight = true;
      setAdditionFeedback({ ok: true, msg: 'Hebat! Penjumlahan harga barangmu benar.' });
    }

    let guessedRight: boolean | null = null;
    if (mathPracticeMode) {
      const guessNum = parseInt(kidChangeGuess.replace(/\D/g, '') || '-1', 10);
      if (guessNum !== actualChange) {
        handleCalculateButton();
        return;
      }
      guessedRight = true;
    }

    onConfirmPayment(paidAmount, actualChange, guessedAdditionRight, guessedRight);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-5 overflow-y-auto">
      <div className="toy-card bg-[#FFFBEB] max-w-2xl w-full p-5 md:p-6 my-6 animate-pop">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b-3 border-[#1E293B] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#10B981] border-2 border-[#1E293B] flex items-center justify-center text-white shadow-[0_3px_0_#1E293B]">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold text-[#1E293B]">
                MEJA PEMBAYARAN KASIR
              </h2>
              <p className="text-xs font-bold text-slate-600">
                Pilih uang yang diterima dari pembeli lalu hitung kembaliannya!
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="toy-btn-sm bg-[#EF4444] text-white p-2 rounded-xl"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards: Total Belanja & Uang Diterima */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-2xl bg-[#E0F2FE] border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B]">
            <span className="text-xs font-extrabold uppercase text-sky-900">TOTAL BELANJA</span>
            <p className="font-receipt text-2xl md:text-3xl font-bold text-[#1E293B] mt-0.5">
              {additionPracticeMode && additionFeedback?.ok !== true ? 'Hitung dahulu' : formatRupiah(totalAmount)}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-2xl border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] transition ${
              isEnough ? 'bg-[#D1FAE5]' : 'bg-[#FEF3C7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-800">UANG DITERIMA</span>
              <button
                onClick={() => {
                  soundFX.playPop();
                  setPaidAmount(0);
                  setManualInput('');
                  setCalculated(false);
                  setWarningMsg(null);
                }}
                className="text-xs font-extrabold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Uang
              </button>
            </div>
            <p className="font-receipt text-2xl md:text-3xl font-bold text-[#1E293B] mt-0.5">
              {formatRupiah(paidAmount)}
            </p>
          </div>
        </div>

        {/* Mode Toggle for Clicking Banknotes */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span className="font-display font-bold text-sm text-[#1E293B]">
            💵 Klik Pecahan Uang Rupiah:
          </span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-[#1E293B]">
            <button
              onClick={() => setAddMode(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                addMode ? 'bg-[#38BDF8] text-[#1E293B]' : 'text-slate-600'
              }`}
            >
              + Tambah Lembar Uang
            </button>
            <button
              onClick={() => setAddMode(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                !addMode ? 'bg-[#FFBE0B] text-[#1E293B]' : 'text-slate-600'
              }`}
            >
              1x Pilih Nominal
            </button>
          </div>
        </div>

        {/* Banknotes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {NOMINALS.map((nom) => (
            <button
              key={nom}
              onClick={() => handleSelectNominal(nom)}
              className="toy-btn-sm bg-white p-1.5 rounded-2xl hover:bg-amber-50 active:scale-95 transition"
            >
              <RupiahNoteSvg amount={nom} className="w-full h-14" />
            </button>
          ))}
        </div>

        {/* Manual Input & Exact Money Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-4">
          <div className="sm:col-span-7 flex items-center bg-white rounded-2xl border-3 border-[#1E293B] px-3 py-2">
            <span className="font-display font-bold text-sm text-slate-600 mr-2">Input Manual: Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={manualInput}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="Contoh: 20000"
              className="w-full font-receipt font-bold text-lg text-[#1E293B] focus:outline-none"
            />
          </div>

          <button
            onClick={handleExactMoney}
            className="sm:col-span-5 toy-btn bg-[#FFBE0B] text-[#1E293B] py-2.5 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            UANG PAS ({formatRupiah(totalAmount)})
          </button>
        </div>

        {/* Addition assessment: sum each item subtotal */}
        <div className="mb-4 rounded-2xl border-2 border-[#1E293B] bg-[#DBEAFE] p-3.5">
          <label className="flex cursor-pointer items-center gap-2 font-bold text-sm text-blue-950">
            <input type="checkbox" checked={additionPracticeMode}
              onChange={(e) => { setAdditionPracticeMode(e.target.checked); setAdditionFeedback(null); setCalculated(false); }}
              className="h-4 w-4 accent-blue-600" />
            <span>Latihan Penjumlahan Harga Barang</span>
          </label>
          {additionPracticeMode && (
            <div className="mt-2.5">
              <p className="mb-2 text-xs font-bold text-blue-950">Jumlahkan subtotal barang berikut:</p>
              <div className="mb-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {itemsForMath.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs">
                    <span>{item.name}</span><b>{formatRupiah(item.subtotal)}</b>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Rp</span>
                <input type="text" inputMode="numeric" value={kidAdditionGuess}
                  onChange={(e) => { setKidAdditionGuess(e.target.value.replace(/\D/g, '')); setAdditionFeedback(null); setCalculated(false); }}
                  placeholder="Masukkan hasil penjumlahan"
                  className="min-w-0 flex-1 rounded-xl border-2 border-slate-800 bg-white px-3 py-1.5 font-bold" />
              </div>
              {additionFeedback && <p className={`mt-2 rounded-lg p-2 text-xs font-bold ${additionFeedback.ok ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950'}`}>{additionFeedback.msg}</p>}
            </div>
          )}
        </div>

        {/* Optional Kid Change Calculation Exercise (+30 Points) */}
        <div className="mb-4 p-3.5 rounded-2xl bg-purple-100 border-2 border-[#1E293B]">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-display font-bold text-sm text-purple-950">
              <input
                type="checkbox"
                checked={mathPracticeMode}
                onChange={(e) => {
                  setMathPracticeMode(e.target.checked);
                  setMathFeedback(null);
                }}
                className="w-4 h-4 accent-[#8B5CF6] rounded"
              />
              <span>🧠 Tantangan Hitung Sendiri Uang Kembalian (+30 Poin!)</span>
            </label>
            <HelpCircle className="w-4 h-4 text-purple-700 shrink-0" />
          </div>

          {mathPracticeMode && (
            <div className="mt-2.5">
              <p className="text-xs font-bold text-purple-900 mb-1.5">
                Berapa uang kembalian dari <b>{formatRupiah(paidAmount)}</b> dikurangi{' '}
                <b>{formatRupiah(totalAmount)}</b>?
              </p>
              <div className="flex items-center gap-2">
                <span className="font-receipt font-bold text-sm">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={kidChangeGuess}
                  onChange={(e) => setKidChangeGuess(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik jawaban kembalian (angka saja, misal 2500)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border-2 border-[#1E293B] font-receipt font-bold text-base"
                />
              </div>
              {mathFeedback && (
                <div
                  className={`mt-2 p-2 rounded-xl border-2 border-[#1E293B] text-xs font-bold ${
                    mathFeedback.ok ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950'
                  }`}
                >
                  {mathFeedback.msg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Friendly Insufficient Money Warning */}
        {warningMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FEF3C7] border-3 border-[#FB8500] text-[#1E293B] font-bold text-sm flex items-center gap-2.5 animate-pop">
            <span className="text-2xl">🪙</span>
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Automatic Calculation Breakdown Box */}
        {(calculated || ((!mathPracticeMode && !additionPracticeMode) && isEnough)) && (
          <div className="mb-4 p-4 rounded-2xl bg-[#D1FAE5] border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] animate-pop">
            <p className="text-xs font-extrabold uppercase text-emerald-900 mb-1">
              RUMUS HITUNG KASIR CERDAS:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 font-receipt text-sm md:text-base font-bold text-[#1E293B]">
              <span>Uang Diterima ({formatRupiah(paidAmount)})</span>
              <span>-</span>
              <span>Total Belanja ({formatRupiah(totalAmount)})</span>
              <span>=</span>
              <span className="bg-[#FFBE0B] px-3 py-1 rounded-xl border-2 border-[#1E293B] text-lg">
                Kembalian: {formatRupiah(actualChange)}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleCalculateButton}
            className="toy-btn bg-[#38BDF8] text-[#1E293B] py-3.5 px-5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            HITUNG PEMBAYARAN
          </button>

          <button
            onClick={handleFinishTransaction}
            className="toy-btn bg-[#10B981] text-white py-3.5 px-5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            SELESAIKAN TRANSAKSI
          </button>
        </div>
      </div>
    </div>
  );
};
