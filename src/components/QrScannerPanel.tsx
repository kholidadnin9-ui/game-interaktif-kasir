import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, RefreshCw, Sparkles, Upload, CheckCircle2, QrCode, Volume2 } from 'lucide-react';
import { ProductItem } from '../types/game';
import { ProductIllustration } from './SvgIcons';
import { formatRupiah } from '../data/defaultData';
import { soundFX } from '../utils/sound';

interface QrScannerPanelProps {
  products: ProductItem[];
  onScanProduct: (product: ProductItem, source: 'QR_CAMERA' | 'QR_SIMULATED') => void;
  cooldownMs: number;
  lastScannedItem: { product: ProductItem; qtyInCart: number; timestamp: number } | null;
}

export const QrScannerPanel: React.FC<QrScannerPanelProps> = ({
  products,
  onScanProduct,
  cooldownMs,
  lastScannedItem,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanLocked, setScanLocked] = useState(false);
  const [lockedCode, setLockedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Siap memindai QR Code barang!');
  const [showVirtualCards, setShowVirtualCards] = useState(false);
  const [simulatingProduct, setSimulatingProduct] = useState<ProductItem | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const findProductByQrPayload = (rawText: string): ProductItem | undefined => {
    const clean = rawText.trim();
    return products.find(
      (p) =>
        p.qrCode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        `ksc-item:${p.sku.toLowerCase()}` === clean.toLowerCase() ||
        p.id.toLowerCase() === clean.toLowerCase() ||
        p.name.toLowerCase() === clean.toLowerCase()
    );
  };

  const handleDecodedCode = (codeText: string, source: 'QR_CAMERA' | 'QR_SIMULATED') => {
    const now = Date.now();
    // Prevent duplicate rapid reads of the exact same QR code
    if (
      source === 'QR_CAMERA' &&
      (scanLocked || (lastCodeRef.current.code === codeText && now - lastCodeRef.current.time < cooldownMs))
    ) {
      return;
    }

    const matchedProduct = findProductByQrPayload(codeText);
    if (matchedProduct) {
      lastCodeRef.current = { code: codeText, time: now };
      setScanLocked(true);
      setLockedCode(codeText);
      setStatusMessage(`YEAY! ${matchedProduct.name} berhasil dipindai!`);
      soundFX.playScanBeep();
      onScanProduct(matchedProduct, source);
    } else {
      setStatusMessage(`Kode QR "${codeText.slice(0, 20)}" tidak ditemukan di database.`);
      soundFX.playGentleHint();
    }
  };

  const resetForNextScan = () => {
    soundFX.playPop();
    setScanLocked(false);
    setLockedCode(null);
    lastCodeRef.current = { code: '', time: 0 };
    setStatusMessage('Arahkan QR Code barang berikutnya ke kotak scanner!');
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setStatusMessage('Kamera aktif! Arahkan kartu QR Code ke dalam kotak.');
    } catch (err) {
      console.warn('Camera access failed:', err);
      setCameraError(
        'Kamera tidak dapat diakses pada perangkat ini. Gunakan tombol "Simulasi Kartu QR" di bawah atau pilih barang dari katalog di sebelah kiri!'
      );
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch(() => {});

      const tick = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              handleDecodedCode(code.data, 'QR_CAMERA');
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraActive, scanLocked, products]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleSwitchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraActive) {
      startCamera(next);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleDecodedCode(code.data, 'QR_SIMULATED');
        } else {
          setStatusMessage('Gambar tidak mengandung QR Code yang terbaca. Coba kartu QR lain yuk!');
          soundFX.playGentleHint();
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerSimulatedQrScan = (product: ProductItem) => {
    setSimulatingProduct(product);
    setScanLocked(false);
    setTimeout(() => {
      handleDecodedCode(product.qrCode, 'QR_SIMULATED');
      setTimeout(() => setSimulatingProduct(null), 900);
    }, 350);
  };

  return (
    <div className="toy-card p-4 bg-gradient-to-b from-[#E0F2FE] to-[#FFFFFF]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#FB8500] border-2 border-[#1E293B] flex items-center justify-center text-white shadow-[0_3px_0_#1E293B]">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[#1E293B] leading-tight">
              MESIN SCANNER QR
            </h3>
            <p className="text-xs font-bold text-slate-600">
              Otomatis Kamera & Kartu QR Virtual
            </p>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="flex items-center gap-1.5">
          {!cameraActive ? (
            <button
              onClick={() => startCamera()}
              className="toy-btn-sm bg-[#10B981] text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              Aktifkan Kamera
            </button>
          ) : (
            <>
              <button
                onClick={handleSwitchCamera}
                title="Ganti Kamera Depan/Belakang"
                className="toy-btn-sm bg-[#FFBE0B] text-[#1E293B] p-2 rounded-xl font-bold text-xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={stopCamera}
                className="toy-btn-sm bg-[#EF4444] text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <CameraOff className="w-4 h-4" />
                Matikan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Square Scanner Box with Animated Laser */}
      <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-2xl border-4 border-[#1E293B] bg-[#0F172A] overflow-hidden shadow-inner flex items-center justify-center">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="text-center p-4 text-slate-200 flex flex-col items-center">
            {simulatingProduct ? (
              <div className="animate-pop bg-white text-[#1E293B] p-3 rounded-2xl border-3 border-[#FFBE0B] flex flex-col items-center shadow-lg">
                <ProductIllustration iconKey={simulatingProduct.iconKey} className="w-16 h-16" />
                <span className="font-display font-bold text-sm mt-1">{simulatingProduct.name}</span>
                <span className="font-receipt text-xs bg-[#FFBE0B] px-2 py-0.5 rounded font-bold mt-0.5">
                  {simulatingProduct.qrCode}
                </span>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-sky-400 flex items-center justify-center mb-2">
                  <QrCode className="w-9 h-9 text-sky-400 animate-pulse" />
                </div>
                <p className="font-display text-sm text-white font-bold">
                  AREA PEMINDAI BARANG
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Klik <b>&quot;Aktifkan Kamera&quot;</b> untuk scan QR fisik, atau gunakan <b>&quot;Simulasi Kartu QR&quot;</b> di bawah!
                </p>
              </>
            )}
          </div>
        )}

        {/* Corner Target Brackets */}
        <div className="pointer-events-none absolute inset-4">
          <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#FFBE0B] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#FFBE0B] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#FFBE0B] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#FFBE0B] rounded-br-lg" />
        </div>

        {/* Animated Red/Green Laser Beam */}
        {!scanLocked && (
          <div
            className="pointer-events-none absolute left-4 right-4 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#EF4444] to-transparent shadow-[0_0_12px_#EF4444] animate-laser"
          />
        )}

        {/* Scan Lock Overlay to Prevent Duplicate Scans */}
        {scanLocked && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-pop">
            <CheckCircle2 className="w-12 h-12 text-[#4ADE80] mb-1" />
            <p className="font-display text-white text-base font-bold">
              BARANG BERHASIL DIPINDAI!
            </p>
            <p className="text-xs text-emerald-200 mb-3">
              Kode: {lockedCode}
            </p>
            <button
              onClick={resetForNextScan}
              className="toy-btn bg-[#FFBE0B] text-[#1E293B] px-4 py-2.5 rounded-xl font-display font-bold text-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              SCAN BERIKUTNYA
            </button>
          </div>
        )}
      </div>

      {/* Camera Error Notice */}
      {cameraError && (
        <div className="mt-2 p-2.5 rounded-xl bg-amber-100 border-2 border-[#1E293B] text-xs font-bold text-amber-900">
          💡 {cameraError}
        </div>
      )}

      {/* Status Bar */}
      <div className="mt-2.5 px-3 py-2 rounded-xl bg-white border-2 border-[#1E293B] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
          <Volume2 className="w-4 h-4 text-[#FB8500] shrink-0" />
          <span>{statusMessage}</span>
        </div>
        {scanLocked && (
          <button
            onClick={resetForNextScan}
            className="text-xs font-extrabold text-sky-700 underline shrink-0 cursor-pointer"
          >
            Scan Lagi
          </button>
        )}
      </div>

      {/* Last Scanned Item Feedback Card */}
      {lastScannedItem && (
        <div
          key={lastScannedItem.timestamp}
          className="mt-3 p-2.5 rounded-2xl bg-[#D1FAE5] border-2 border-[#1E293B] flex items-center justify-between gap-2 animate-pop"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#1E293B] flex items-center justify-center shrink-0">
              <ProductIllustration iconKey={lastScannedItem.product.iconKey} className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#10B981] text-white">
                  +1 Masuk Keranjang
                </span>
                <span className="text-[10px] font-receipt font-bold text-slate-600">
                  {lastScannedItem.product.sku}
                </span>
              </div>
              <p className="font-display font-bold text-sm text-[#1E293B]">
                {lastScannedItem.product.name}
              </p>
              <p className="font-receipt text-xs font-bold text-emerald-800">
                {formatRupiah(lastScannedItem.product.price)} • Jumlah di Keranjang: {lastScannedItem.qtyInCart}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extra Scanner Tools: Simulated QR Card Tap & Upload QR Image */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => {
            soundFX.playPop();
            setShowVirtualCards(!showVirtualCards);
          }}
          className="toy-btn-sm flex-1 bg-[#8B5CF6] text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          {showVirtualCards ? 'Tutup Kartu QR Virtual' : 'Simulasi Kartu QR'}
        </button>

        <label className="toy-btn-sm bg-white text-[#1E293B] px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
          <Upload className="w-4 h-4 text-[#0284C7]" />
          <span>Unggah PNG QR</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      </div>

      {/* Virtual QR Card Deck for Easy Testing without Camera */}
      {showVirtualCards && (
        <div className="mt-3 p-2.5 rounded-xl bg-purple-50 border-2 border-[#1E293B]">
          <p className="text-xs font-extrabold text-purple-900 mb-2">
            🎯 Klik kartu QR di bawah untuk mensimulasikan pemindaian QR Code ke mesin scanner:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {products.slice(0, 18).map((item) => (
              <button
                key={item.id}
                onClick={() => triggerSimulatedQrScan(item)}
                className="p-1.5 rounded-lg bg-white border-2 border-[#1E293B] hover:bg-yellow-100 text-left flex items-center gap-1.5 transition cursor-pointer"
              >
                <ProductIllustration iconKey={item.iconKey} className="w-7 h-7 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#1E293B] truncate">{item.name}</p>
                  <p className="text-[10px] font-receipt font-bold text-purple-700">{item.sku}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
