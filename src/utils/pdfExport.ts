import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { CartItemDetailed, ProductItem, TransactionRecord } from '../types/game';
import { CATEGORIES, formatNumberPlain, formatRupiah } from '../data/defaultData';

export async function generateQrDataUrl(text: string, width = 260): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 1,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR generation error:', err);
    return '';
  }
}

export async function downloadSingleQrLabelPng(
  product: ProductItem,
  size: 'SMALL' | 'MEDIUM' | 'LARGE' = 'MEDIUM'
): Promise<void> {
  const dimensions = {
    SMALL: { w: 320, h: 400 },
    MEDIUM: { w: 420, h: 520 },
    LARGE: { w: 540, h: 660 },
  }[size];

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.w;
  canvas.height = dimensions.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cat = CATEGORIES.find((c) => c.id === product.category);
  const headerColor = cat?.color || '#38BDF8';

  // Card Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Colored Top Header
  ctx.fillStyle = headerColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.16);

  // Border
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Header Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(canvas.width * 0.055)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('KIDS SMART CASHIER', canvas.width / 2, canvas.height * 0.085);
  ctx.font = `bold ${Math.round(canvas.width * 0.035)}px sans-serif`;
  ctx.fillText(`${cat?.label || product.category} • ${product.sku}`, canvas.width / 2, canvas.height * 0.135);

  // Draw QR Code in Center
  const qrSize = Math.round(canvas.width * 0.56);
  const qrUrl = await generateQrDataUrl(product.qrCode, qrSize);
  if (qrUrl) {
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = qrUrl;
    });
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = canvas.height * 0.2;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
  }

  // Product Name
  ctx.fillStyle = '#1E293B';
  ctx.font = `bold ${Math.round(canvas.width * 0.07)}px sans-serif`;
  ctx.fillText(product.name, canvas.width / 2, canvas.height * 0.76);

  // Price Badge
  const pillW = canvas.width * 0.7;
  const pillH = canvas.height * 0.11;
  const pillX = (canvas.width - pillW) / 2;
  const pillY = canvas.height * 0.8;
  ctx.fillStyle = '#FFBE0B';
  ctx.fillRect(pillX, pillY, pillW, pillH);
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  ctx.strokeRect(pillX, pillY, pillW, pillH);

  ctx.fillStyle = '#1E293B';
  ctx.font = `bold ${Math.round(canvas.width * 0.072)}px monospace`;
  ctx.fillText(formatRupiah(product.price), canvas.width / 2, pillY + pillH * 0.68);

  // Footer Attribution
  ctx.fillStyle = '#64748B';
  ctx.font = `${Math.round(canvas.width * 0.032)}px sans-serif`;
  ctx.fillText(`ID: ${product.qrCode} • Widodo Guru SD`, canvas.width / 2, canvas.height * 0.96);

  const link = document.createElement('a');
  link.download = `QR_${product.sku}_${product.name.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadQrLabelsPdf(
  products: ProductItem[],
  size: 'SMALL' | 'MEDIUM' | 'LARGE' = 'MEDIUM'
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 12;

  // Grid config per size
  const gridConfig = {
    SMALL: { cols: 4, rows: 5, boxW: 44, boxH: 50 },
    MEDIUM: { cols: 3, rows: 4, boxW: 58, boxH: 62 },
    LARGE: { cols: 2, rows: 3, boxW: 88, boxH: 82 },
  }[size];

  let col = 0;
  let row = 0;

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('KIDS SMART CASHIER – KARTU LABEL QR CODE BARANG', pageWidth / 2, 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Created by: Widodo Guru SD | Pindai QR Code pada Mode Kasir', pageWidth / 2, 15, { align: 'center' });
  };

  drawPageHeader();

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    if (row >= gridConfig.rows) {
      doc.addPage();
      drawPageHeader();
      row = 0;
      col = 0;
    }

    const gapX = (pageWidth - margin * 2 - gridConfig.cols * gridConfig.boxW) / Math.max(1, gridConfig.cols - 1);
    const x = margin + col * (gridConfig.boxW + gapX);
    const y = 20 + row * (gridConfig.boxH + 4);

    // Card Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, y, gridConfig.boxW, gridConfig.boxH, 3, 3, 'S');

    // Header Bar
    doc.setFillColor(56, 189, 248);
    doc.rect(x + 0.5, y + 0.5, gridConfig.boxW - 1, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${item.sku}`, x + gridConfig.boxW / 2, y + 5, { align: 'center' });

    // QR Code Image
    const qrUrl = await generateQrDataUrl(item.qrCode, 220);
    const qrDim = Math.min(gridConfig.boxW * 0.62, gridConfig.boxH * 0.52);
    if (qrUrl) {
      doc.addImage(qrUrl, 'PNG', x + (gridConfig.boxW - qrDim) / 2, y + 9, qrDim, qrDim);
    }

    // Item Name
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size === 'SMALL' ? 8 : 10);
    const textY = y + 12 + qrDim;
    doc.text(item.name.slice(0, 20), x + gridConfig.boxW / 2, textY, { align: 'center' });

    // Item Price
    doc.setFillColor(255, 190, 11);
    doc.roundedRect(x + 4, textY + 2, gridConfig.boxW - 8, 7, 1.5, 1.5, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(size === 'SMALL' ? 8.5 : 10);
    doc.text(formatRupiah(item.price), x + gridConfig.boxW / 2, textY + 7, { align: 'center' });

    col++;
    if (col >= gridConfig.cols) {
      col = 0;
      row++;
    }
  }

  doc.save(`Label_QR_Kids_Smart_Cashier_${size}.pdf`);
}

export function downloadReceiptPdf(tx: TransactionRecord, storeName: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, Math.max(145, 95 + tx.items.length * 10)],
  });

  let y = 10;
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('KIDS SMART CASHIER', 40, y, { align: 'center' });
  y += 4.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('Created by: Widodo Guru SD', 40, y, { align: 'center' });
  y += 4;
  doc.text(storeName, 40, y, { align: 'center' });
  y += 4;
  doc.text('--------------------------------', 40, y, { align: 'center' });
  y += 4.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text('STRUK PEMBELIAN', 40, y, { align: 'center' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`No Struk : ${tx.receiptNo}`, 6, y);
  y += 4;
  doc.text(`Tanggal  : ${tx.timestamp}`, 6, y);
  y += 4;
  doc.text(`Kasir    : ${tx.cashierName}`, 6, y);
  y += 4;
  if (tx.buyerName) {
    doc.text(`Pembeli  : ${tx.buyerName}`, 6, y);
    y += 4;
  }
  doc.text('--------------------------------', 40, y, { align: 'center' });
  y += 5;

  tx.items.forEach((item) => {
    doc.setFont('courier', 'bold');
    doc.text(item.name, 6, y);
    y += 4;
    doc.setFont('courier', 'normal');
    const lineLeft = `  ${item.quantity} x ${formatNumberPlain(item.price)}`;
    const lineRight = formatNumberPlain(item.subtotal);
    doc.text(lineLeft, 6, y);
    doc.text(lineRight, 74, y, { align: 'right' });
    y += 4.5;
  });

  doc.text('--------------------------------', 40, y, { align: 'center' });
  y += 5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL BELANJA', 6, y);
  doc.text(formatRupiah(tx.totalAmount), 74, y, { align: 'right' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.text('UANG DITERIMA', 6, y);
  doc.text(formatRupiah(tx.paidAmount), 74, y, { align: 'right' });
  y += 4.5;

  doc.setFont('courier', 'bold');
  doc.text('UANG KEMBALIAN', 6, y);
  doc.text(formatRupiah(tx.changeAmount), 74, y, { align: 'right' });
  y += 6;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('--------------------------------', 40, y, { align: 'center' });
  y += 5;
  doc.setFont('courier', 'bold');
  doc.text('TERIMA KASIH', 40, y, { align: 'center' });
  y += 4;
  doc.text('SELAMAT BERBELANJA!', 40, y, { align: 'center' });

  doc.save(`Struk_${tx.receiptNo}.pdf`);
}

export function downloadShoppingListPdf(
  buyerName: string,
  dateStr: string,
  items: CartItemDetailed[]
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KIDS SMART CASHIER', 105, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Created by: Widodo Guru SD', 105, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DAFTAR BELANJA PEMBELI', 105, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Pembeli : ${buyerName || '____________________'}`, 20, y);
  doc.text(`Tanggal : ${dateStr}`, 140, y);
  y += 8;

  // Table Header
  doc.setFillColor(56, 189, 248);
  doc.rect(20, y, 170, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('No', 24, y + 6);
  doc.text('Nama Barang', 38, y + 6);
  doc.text('Jumlah', 108, y + 6);
  doc.text('Harga Satuan', 132, y + 6);
  doc.text('Subtotal', 165, y + 6);
  y += 9;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');

  let total = 0;
  items.forEach((entry, idx) => {
    total += entry.subtotal;
    doc.rect(20, y, 170, 8.5, 'S');
    doc.text(String(idx + 1), 24, y + 6);
    doc.text(`${entry.product.name} (${entry.product.sku})`, 38, y + 6);
    doc.text(String(entry.quantity), 112, y + 6);
    doc.text(formatRupiah(entry.product.price), 132, y + 6);
    doc.text(formatRupiah(entry.subtotal), 165, y + 6);
    y += 8.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL ESTIMASI: ${formatRupiah(total)}`, 190, y + 4, { align: 'right' });

  doc.save(`Daftar_Belanja_${(buyerName || 'Pembeli').replace(/\s+/g, '_')}.pdf`);
}

export function downloadPriceListPdf(products: ProductItem[], storeName: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KIDS SMART CASHIER – DAFTAR HARGA BARANG', 105, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Created by: Widodo Guru SD • ${storeName}`, 105, y, { align: 'center' });
  y += 8;

  // Table header
  doc.setFillColor(255, 190, 11);
  doc.rect(16, y, 178, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('No', 20, y + 5.5);
  doc.text('Kode / SKU', 32, y + 5.5);
  doc.text('Nama Barang', 62, y + 5.5);
  doc.text('Kategori', 122, y + 5.5);
  doc.text('Harga Satuan', 162, y + 5.5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  products.forEach((p, idx) => {
    if (y > 272) {
      doc.addPage();
      y = 18;
    }
    const cat = CATEGORIES.find((c) => c.id === p.category)?.label || p.category;
    doc.rect(16, y, 178, 7.5, 'S');
    doc.text(String(idx + 1), 20, y + 5);
    doc.text(p.sku, 32, y + 5);
    doc.text(p.name, 62, y + 5);
    doc.text(cat, 122, y + 5);
    doc.setFont('courier', 'bold');
    doc.text(formatRupiah(p.price), 162, y + 5);
    doc.setFont('helvetica', 'normal');
    y += 7.5;
  });

  doc.save('Daftar_Harga_Kids_Smart_Cashier.pdf');
}
