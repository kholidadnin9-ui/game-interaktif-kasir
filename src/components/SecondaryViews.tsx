import React, { useState } from 'react';
import {
  Play,
  Target,
  Users,
  Star,
  Award,
  Printer,
  Download,
  FileText,
  Volume2,
  VolumeX,
  RotateCcw,
  UserPlus,
  CheckCircle2,
  Settings,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  ChallengeMission,
  GameMode,
  GameSettings,
  PlayerProfile,
  TransactionRecord,
} from '../types/game';
import {
  BADGE_DEFINITIONS,
  CHALLENGE_MISSIONS,
  formatRupiah,
} from '../data/defaultData';
import { downloadReceiptPdf } from '../utils/pdfExport';
import { soundFX } from '../utils/sound';

/* ============================================================================
 * 1. MODE PERMAINAN SELECTOR (Mode Bebas, Mode Tantangan 5 Level, Role Play)
 * ============================================================================ */
interface ModeSelectProps {
  activePlayer: PlayerProfile;
  onStartMode: (mode: GameMode, mission?: ChallengeMission | null) => void;
}

export const ModeSelectionView: React.FC<ModeSelectProps> = ({
  activePlayer,
  onStartMode,
}) => {
  return (
    <div className="space-y-6">
      <div className="toy-card p-5 bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#8B5CF6] text-white">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold">
          🎮 PILIH MODE PERMAINAN KASIR CERDAS
        </h2>
        <p className="text-sm font-bold text-sky-100 mt-1">
          Halo <b>{activePlayer.name}</b>! Pilih cara bermain yang paling kamu sukai hari ini:
        </p>
      </div>

      {/* 3 Core Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* A. MODE BEBAS */}
        <div className="toy-card p-5 bg-[#E0F2FE] flex flex-col justify-between">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#38BDF8] text-[#1E293B] border-2 border-[#1E293B] font-display font-bold text-xs">
              MODE A • TANPA BATAS WAKTU
            </span>
            <h3 className="font-display text-2xl font-extrabold text-[#1E293B] mt-3">
              🌈 MODE BEBAS
            </h3>
            <p className="text-sm font-bold text-slate-700 mt-2">
              Bebas memilih barang, memindai QR Code, menghitung total belanja, dan mencetak struk sebanyak yang kamu mau!
            </p>
          </div>
          <button
            onClick={() => {
              soundFX.playPop();
              onStartMode('FREE', null);
            }}
            className="mt-5 w-full toy-btn bg-[#10B981] text-white py-3.5 px-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            MAIN MODE BEBAS
          </button>
        </div>

        {/* B. MODE ROLE PLAY */}
        <div className="toy-card p-5 bg-[#FFEDD5] flex flex-col justify-between">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#FB8500] text-white border-2 border-[#1E293B] font-display font-bold text-xs">
              MODE C • BERMAIN PERAN
            </span>
            <h3 className="font-display text-2xl font-extrabold text-[#1E293B] mt-3">
              🎭 MODE ROLE PLAY
            </h3>
            <p className="text-sm font-bold text-slate-700 mt-2">
              Pilih peranmu! Jadilah <b>Pembeli</b> yang membuat daftar belanja, lalu temanmu bertugas sebagai <b>Kasir</b> yang melayani transaksi!
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundFX.playPop();
                onStartMode('ROLEPLAY_BUYER', null);
              }}
              className="toy-btn bg-[#FB8500] text-white py-3 px-3 rounded-2xl font-display font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              JADI PEMBELI
            </button>
            <button
              onClick={() => {
                soundFX.playPop();
                onStartMode('ROLEPLAY_CASHIER', null);
              }}
              className="toy-btn bg-[#38BDF8] text-[#1E293B] py-3 px-3 rounded-2xl font-display font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              JADI KASIR
            </button>
          </div>
        </div>

        {/* C. MODE TANTANGAN SUMMARY */}
        <div className="toy-card p-5 bg-[#EDE9FE] flex flex-col justify-between">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#8B5CF6] text-white border-2 border-[#1E293B] font-display font-bold text-xs">
              MODE B • 5 LEVEL MISI
            </span>
            <h3 className="font-display text-2xl font-extrabold text-[#1E293B] mt-3">
              🏆 MODE TANTANGAN
            </h3>
            <p className="text-sm font-bold text-slate-700 mt-2">
              Selesaikan misi belanja dari Level 1 hingga Level 5 untuk mendapatkan Bintang, Poin Bonus, dan Medali Kasir Cerdas!
            </p>
          </div>
          <button
            onClick={() => {
              soundFX.playPop();
              onStartMode('CHALLENGE', CHALLENGE_MISSIONS[0]);
            }}
            className="mt-5 w-full toy-btn bg-[#8B5CF6] text-white py-3.5 px-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            MULAI LEVEL 1
          </button>
        </div>
      </div>

      {/* 5 Difficulty Levels Breakdown */}
      <div className="toy-card p-5 bg-white">
        <h3 className="font-display text-xl font-extrabold text-[#1E293B] mb-3">
          🎯 DAFTAR MISI MODE TANTANGAN (LEVEL 1 – LEVEL 5)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CHALLENGE_MISSIONS.map((m) => {
            const isDone = activePlayer.completedChallengeIds.includes(m.id);
            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border-3 border-[#1E293B] flex flex-col justify-between ${
                  isDone ? 'bg-[#D1FAE5]' : 'bg-[#FFFBEB]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6] text-white font-display font-bold text-xs">
                      LEVEL {m.level}
                    </span>
                    <span className="font-display font-bold text-xs text-amber-700 flex items-center gap-1">
                      +{m.rewardPoints} Poin • {'⭐'.repeat(m.rewardStars)}
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-base text-[#1E293B]">
                    {m.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-700 mt-1">{m.description}</p>
                </div>

                <button
                  onClick={() => {
                    soundFX.playPop();
                    onStartMode('CHALLENGE', m);
                  }}
                  className="mt-3 w-full toy-btn-sm bg-[#FFBE0B] text-[#1E293B] py-2 px-3 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Mainkan Lagi (Selesai)
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Mainkan Misi Ini
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. RIWAYAT TRANSAKSI VIEW
 * ============================================================================ */
interface HistoryViewProps {
  transactions: TransactionRecord[];
  storeName: string;
  onViewReceipt: (tx: TransactionRecord) => void;
  onGoToAwards: () => void;
}

export const TransactionHistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  storeName,
  onViewReceipt,
  onGoToAwards,
}) => {
  return (
    <div className="space-y-5">
      <div className="toy-card p-5 bg-gradient-to-r from-[#FEF3C7] via-[#E0F2FE] to-[#D1FAE5] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#1E293B]">
            📜 RIWAYAT TRANSAKSI KASIR
          </h2>
          <p className="text-xs md:text-sm font-bold text-slate-700">
            Semua transaksi tersimpan otomatis. Klik tombol <b>Lihat Struk</b> untuk mencetak ulang struk pembelian!
          </p>
        </div>
        <button
          onClick={onGoToAwards}
          className="toy-btn bg-[#FFBE0B] text-[#1E293B] px-4 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center gap-2"
        >
          <Award className="w-5 h-5" />
          Lihat Medali & Sertifikat
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="toy-card p-10 bg-white text-center">
          <FileText className="w-14 h-14 text-slate-300 mx-auto mb-2" />
          <h3 className="font-display text-lg font-extrabold text-slate-700">
            Belum Ada Riwayat Transaksi
          </h3>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Yuk mulai bermain di Mode Kasir untuk mencatat transaksi pertamamu!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="toy-card p-4 bg-white flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-2 mb-2">
                  <div>
                    <span className="font-receipt font-bold text-xs bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#1E293B]">
                      #{tx.receiptNo}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ml-2">
                      {tx.timestamp}
                    </span>
                  </div>
                  <span className="text-xs font-display font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-500">
                    +{tx.pointsEarned} Poin
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-700 mb-2">
                  Kasir: <span className="text-[#1E293B]">{tx.cashierName}</span>
                  {tx.buyerName ? ` • Pembeli: ${tx.buyerName}` : ''}
                </div>

                <div className="space-y-1 bg-[#FFFBEB] p-2.5 rounded-xl border border-slate-300 text-xs font-receipt">
                  {tx.items.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    Total Belanja
                  </span>
                  <span className="font-receipt font-extrabold text-base text-emerald-700">
                    {formatRupiah(tx.totalAmount)}
                  </span>
                  <span className="text-[11px] font-receipt text-slate-500 ml-2">
                    (Bayar: {formatRupiah(tx.paidAmount)} • Kembali: {formatRupiah(tx.changeAmount)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      soundFX.playPop();
                      onViewReceipt(tx);
                    }}
                    className="toy-btn-sm bg-[#38BDF8] text-[#1E293B] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Lihat Struk
                  </button>
                  <button
                    onClick={() => {
                      soundFX.playPop();
                      downloadReceiptPdf(tx, storeName);
                    }}
                    className="toy-btn-sm bg-[#FFBE0B] text-[#1E293B] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. SISTEM POIN, PENGHARGAAN, DAN SERTIFIKAT MINI VIEW
 * ============================================================================ */
interface AwardsViewProps {
  player: PlayerProfile;
}

export const AwardsAndCertificateView: React.FC<AwardsViewProps> = ({ player }) => {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Points Scoring Rules Banner */}
      <div className="no-print toy-card p-5 bg-gradient-to-r from-[#FEF3C7] via-[#FFEDD5] to-[#E0F2FE]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[#1E293B]">
              🏅 SISTEM POIN & PENGHARGAAN KASIR CERDAS
            </h2>
            <p className="text-xs md:text-sm font-bold text-slate-700 mt-0.5">
              Kumpulkan poin dari setiap aktivitas berbelanja dan raih Sertifikat Kasir Cerdas!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-[#FFBE0B] border-2 border-[#1E293B] font-display font-bold text-base">
              🏆 Total Poin: {player.points}
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border-2 border-[#1E293B] font-display font-bold text-base">
              ⭐ {player.stars} Bintang
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div className="p-2.5 rounded-xl bg-white border-2 border-[#1E293B] text-center">
            <span className="font-display font-extrabold text-emerald-600 text-lg">+10 Poin</span>
            <p className="text-xs font-bold text-slate-700">Berhasil Memindai Barang</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border-2 border-[#1E293B] text-center">
            <span className="font-display font-extrabold text-sky-600 text-lg">+20 Poin</span>
            <p className="text-xs font-bold text-slate-700">Menghitung Total Benar</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border-2 border-[#1E293B] text-center">
            <span className="font-display font-extrabold text-purple-600 text-lg">+30 Poin</span>
            <p className="text-xs font-bold text-slate-700">Menghitung Kembalian Benar</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border-2 border-[#1E293B] text-center">
            <span className="font-display font-extrabold text-amber-600 text-lg">+20 Poin</span>
            <p className="text-xs font-bold text-slate-700">Menyelesaikan Transaksi</p>
          </div>
        </div>
      </div>

      {/* Badges & Medals Grid */}
      <div className="no-print toy-card p-5 bg-white">
        <h3 className="font-display text-lg font-extrabold text-[#1E293B] mb-3">
          🎖️ KOLEKSI MEDALI & BADGE ({player.badges.length} / {BADGE_DEFINITIONS.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {BADGE_DEFINITIONS.map((b) => {
            const unlocked = player.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border-2 border-[#1E293B] text-center flex flex-col items-center ${
                  unlocked ? 'bg-[#FFFBEB]' : 'bg-slate-100 opacity-65'
                }`}
              >
                <div
                  style={{ backgroundColor: unlocked ? b.color : '#CBD5E1' }}
                  className="w-14 h-14 rounded-2xl border-2 border-[#1E293B] flex items-center justify-center text-3xl mb-2 shadow"
                >
                  {b.icon}
                </div>
                <h4 className="font-display font-bold text-sm text-[#1E293B]">{b.title}</h4>
                <p className="text-[11px] font-bold text-slate-600 mt-1">{b.desc}</p>
                <span
                  className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    unlocked ? 'bg-[#10B981] text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {unlocked ? 'TERBUKA ✓' : 'BELUM TERBUKA'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printable Mini Certificate */}
      <div className="toy-card p-6 bg-white">
        <div className="no-print flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-extrabold text-[#1E293B]">
            🎓 SERTIFIKAT MINI KASIR CERDAS
          </h3>
          <button
            onClick={() => {
              soundFX.playPop();
              window.print();
            }}
            className="toy-btn bg-[#38BDF8] text-[#1E293B] px-4 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            CETAK SERTIFIKAT
          </button>
        </div>

        <div className="print-area p-6 md:p-8 rounded-3xl border-4 border-[#1E293B] bg-gradient-to-br from-[#FFFBEB] via-[#FFFFFF] to-[#E0F2FE] text-center relative">
          <div className="border-2 border-dashed border-[#FB8500] rounded-2xl p-6">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#FFBE0B] border-2 border-[#1E293B] font-display font-bold text-xs mb-2">
              <Sparkles className="w-4 h-4" /> SERTIFIKAT PENGHARGAAN
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#1E293B]">
              KIDS SMART CASHIER
            </h2>
            <p className="text-xs font-bold text-slate-600">Created by: Widodo Guru SD</p>

            <p className="text-sm font-bold text-slate-700 mt-4">
              Diberikan dengan bangga kepada:
            </p>
            <div className="my-2 inline-block px-8 py-2 rounded-2xl bg-white border-3 border-[#1E293B] font-display text-2xl md:text-3xl font-extrabold text-[#0284C7]">
              {player.name}
            </div>

            <p className="text-xs md:text-sm font-bold text-slate-700 max-w-lg mx-auto mt-2">
              Atas keberhasilan menjadi <b>Petugas Kasir & Pembeli Cerdas</b> dengan perolehan{' '}
              <b>{player.points} Poin</b>, <b>{player.stars} Bintang</b>, dan menyelesaikan{' '}
              <b>{player.transactionsCount} Transaksi</b> dengan jujur dan teliti!
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-700 pt-4 border-t-2 border-slate-200">
              <div>
                <p>Tanggal Diterbitkan:</p>
                <p className="font-extrabold text-[#1E293B] mt-1">{todayStr}</p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#FFBE0B] text-[#1E293B]" />
                ))}
              </div>
              <div>
                <p>Pembimbing / Kreator:</p>
                <p className="font-extrabold text-[#1E293B] mt-1 underline">Widodo Guru SD</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. PENGATURAN GAME VIEW
 * ============================================================================ */
interface SettingsViewProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  players: PlayerProfile[];
  activePlayerId: string;
  onSelectPlayer: (id: string) => void;
  onAddPlayer: (name: string, avatar: string) => void;
  onResetAllGameData: () => void;
}

const AVATAR_OPTIONS = ['#F87171', '#FBBF24', '#34D399', '#F472B6', '#60A5FA', '#A78BFA', '#FB923C', '#2DD4BF'];

export const GameSettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  players,
  activePlayerId,
  onSelectPlayer,
  onAddPlayer,
  onResetAllGameData,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('#60A5FA');
  const [savedBanner, setSavedBanner] = useState(false);

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    soundFX.playScanBeep();
    onAddPlayer(newPlayerName.trim(), newPlayerAvatar);
    setNewPlayerName('');
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="toy-card p-5 bg-gradient-to-r from-[#E0F2FE] to-[#FEF3C7] flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#38BDF8] border-2 border-[#1E293B] flex items-center justify-center">
          <Settings className="w-7 h-7 text-[#1E293B]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#1E293B]">
            ⚙️ PENGATURAN GAME & PEMAIN
          </h2>
          <p className="text-xs md:text-sm font-bold text-slate-700">
            Atur suara, kecepatan scanner, ukuran kertas struk, dan daftar nama anak yang bermain.
          </p>
        </div>
      </div>

      {savedBanner && (
        <div className="toy-card-sm p-3 bg-[#D1FAE5] text-emerald-950 font-bold text-sm">
          ✅ Pengaturan berhasil disimpan!
        </div>
      )}

      {/* Player Profiles Management */}
      <div className="toy-card p-5 bg-white">
        <h3 className="font-display text-lg font-extrabold text-[#1E293B] mb-3">
          👧👦 PILIH ATAU TAMBAH NAMA PEMAIN (SISWA)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                soundFX.playPop();
                onSelectPlayer(p.id);
              }}
              className={`toy-btn-sm p-3 rounded-2xl flex items-center justify-between text-left ${
                p.id === activePlayerId ? 'bg-[#FFBE0B]' : 'bg-[#FFFBEB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full border-2 border-slate-800" style={{ backgroundColor: p.avatar?.startsWith("#") ? p.avatar : "#60A5FA" }} />
                <div>
                  <p className="font-display font-bold text-sm text-[#1E293B]">{p.name}</p>
                  <p className="text-xs font-bold text-slate-600">
                    {p.points} Poin • ⭐ {p.stars}
                  </p>
                </div>
              </div>
              {p.id === activePlayerId && (
                <span className="text-[10px] font-extrabold bg-[#10B981] text-white px-2 py-0.5 rounded-full">
                  AKTIF
                </span>
              )}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleCreatePlayer}
          className="p-3.5 rounded-2xl bg-sky-50 border-2 border-[#1E293B] flex flex-wrap items-center gap-2.5"
        >
          <div className="flex items-center gap-1">
            {AVATAR_OPTIONS.map((av) => (
              <button
                type="button"
                key={av}
                onClick={() => setNewPlayerAvatar(av)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center cursor-pointer ${
                  newPlayerAvatar === av ? 'bg-[#FFBE0B] border-2 border-[#1E293B]' : 'bg-white'
                }`}
              >
                <span className="inline-block h-5 w-5 rounded-full border border-slate-800" style={{ backgroundColor: av }} />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Ketik nama siswa baru..."
            className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-bold text-sm"
          />
          <button
            type="submit"
            className="toy-btn-sm bg-[#10B981] text-white px-4 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pemain
          </button>
        </form>
      </div>

      {/* General Settings */}
      <div className="toy-card p-5 bg-white space-y-4">
        <h3 className="font-display text-lg font-extrabold text-[#1E293B]">
          🎛️ PENGATURAN PERMAINAN & MINIMARKET
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border-2 border-[#1E293B]">
            <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
              Nama Minimarket (Tampil di Struk):
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => {
                onUpdateSettings({ ...settings, storeName: e.target.value });
                setSavedBanner(true);
              }}
              className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-bold text-sm"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border-2 border-[#1E293B] flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-sm text-[#1E293B]">
                Efek Suara Permainan
              </p>
              <p className="text-xs font-bold text-slate-500">
                Suara scanner beep, uang, dan mesin kasir
              </p>
            </div>
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                soundFX.enabled = next;
                onUpdateSettings({ ...settings, soundEnabled: next });
                if (next) soundFX.playPop();
              }}
              className={`toy-btn-sm px-4 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 ${
                settings.soundEnabled ? 'bg-[#10B981] text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" /> Suara ON
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" /> Suara OFF
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border-2 border-[#1E293B]">
            <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
              Ukuran Kertas Struk Bawaan:
            </label>
            <select
              value={settings.defaultReceiptWidth}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  defaultReceiptWidth: e.target.value as '58mm' | '80mm' | 'A4',
                })
              }
              className="w-full px-3 py-2 rounded-xl border-2 border-[#1E293B] bg-white font-bold text-sm"
            >
              <option value="58mm">Thermal 58 mm</option>
              <option value="80mm">Thermal 80 mm</option>
              <option value="A4">Kertas A4</option>
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border-2 border-[#1E293B]">
            <label className="block text-xs font-extrabold text-[#1E293B] mb-1">
              Wajibkan Latihan Hitung Kembalian di Kasir:
            </label>
            <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-xs">
              <input
                type="checkbox"
                checked={settings.requireMathQuizInCashier}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    requireMathQuizInCashier: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#38BDF8]"
              />
              <span>Aktifkan tebak kembalian mandiri pada semua transaksi (+30 Poin)</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-slate-200 flex justify-end">
          <button
            onClick={() => {
              soundFX.playPop();
              onResetAllGameData();
              setSavedBanner(true);
            }}
            className="toy-btn-sm bg-rose-100 text-rose-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Seluruh Data Permainan ke Awal
          </button>
        </div>
      </div>
    </div>
  );
};
