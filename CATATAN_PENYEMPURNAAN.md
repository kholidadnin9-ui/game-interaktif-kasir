# Penyempurnaan KIDS SMART CASHIER

## Perubahan pada versi ini

1. **Identitas siswa sebelum bermain**
   - Tombol mulai bermain membuka formulir Nama Siswa dan Kelas.
   - Kedua kolom wajib diisi.
   - Profil siswa disimpan di browser dan digunakan kembali bila nama serta kelas sama.
   - Setiap transaksi baru menyimpan ID pemain dan kelas untuk kebutuhan laporan.

2. **Dashboard Guru/Admin dilindungi password**
   - Password awal: `1234`.
   - Dashboard Guru/Admin menampilkan halaman masuk sebelum data dibuka.
   - Setelah masuk, guru dapat mengganti password melalui tombol Ubah Password.
   - Password tersimpan pada LocalStorage browser.

3. **Laporan kemampuan berhitung dan aktivitas**
   - Tabel rekap menampilkan nama, kelas, poin, bintang, jumlah transaksi, barang dipindai, jawaban kembalian tepat, dan evaluasi.
   - Riwayat aktivitas per siswa memuat waktu, mode permainan, total belanja, uang kembalian, hasil latihan, dan daftar barang.
   - Status latihan dibedakan menjadi Tepat, Belum tepat, dan Tidak diuji agar siswa yang tidak mengikuti kuis tidak dianggap sudah dinilai.
   - Tombol Cetak / Print Laporan membuka dialog cetak browser. Tata letak cetak diarahkan ke A4 landscape.

4. **Tampilan 2D Whimsical**
   - Palet warna pastel: merah, kuning, hijau, pink, biru, ungu, dan turquoise.
   - Ilustrasi produk diganti bidang warna sederhana.
   - Ilustrasi mesin kasir dan banner karakter diganti bentuk geometris abstrak.
   - Kartu dan tombol memakai gaya 2D dengan bayangan datar.

## Catatan penting

- Password `1234` adalah pengunci antarmuka pada aplikasi browser, bukan sistem keamanan tingkat server. Karena aplikasi berjalan di sisi klien, pengguna yang memahami developer tools atau mengubah data LocalStorage dapat melewati pengunci ini. Untuk penggunaan kelas biasa, password ini berguna sebagai pembatas akses kasual; untuk data sensitif dibutuhkan autentikasi server.
- Data siswa, transaksi, dan password disimpan lokal di browser/perangkat yang digunakan. Data tidak otomatis tersinkron ke perangkat lain. Lakukan pencadangan browser/data secara berkala.
- Laporan menilai ketepatan menghitung uang kembalian pada transaksi yang memang mengaktifkan latihan berhitung. Total penjumlahan belanja belum dinilai sebagai indikator terpisah karena versi sebelumnya belum menyimpan jawaban/hasil kuis total belanja.
- Build produksi belum dapat diverifikasi di lingkungan ini karena executable Vite tidak tersedia/berjalan. Setelah mengunduh, jalankan `npm install` lalu `npm run build` di komputer pengembang.


## Tambahan V3 — Analisis numerasi terpisah

- **Penjumlahan:** siswa menjumlahkan subtotal setiap barang. Ketika latihan penjumlahan aktif, total belanja disembunyikan sampai siswa memasukkan jawaban yang tepat.
- **Pengurangan:** siswa menghitung uang diterima dikurangi total belanja untuk mendapatkan uang kembalian.
- Kedua latihan memiliki pilihan aktif/nonaktif yang terpisah. Pengaturan wajib latihan berhitung mengaktifkan keduanya secara default.
- Hasil setiap kompetensi disimpan terpisah pada transaksi: `additionGuessedCorrectly` dan `subtractionGuessedCorrectly`. Field lama `changeGuessedCorrectly` tetap dipertahankan untuk kompatibilitas data.
- Dashboard guru menampilkan jumlah jawaban benar dan jumlah percobaan yang dinilai untuk penjumlahan dan pengurangan secara terpisah. Riwayat aktivitas juga menampilkan hasil kedua latihan.
- Poin +20 diberikan jika penjumlahan benar, dan +30 jika pengurangan/kembalian benar. Jawaban yang tidak diuji tidak dihitung sebagai benar maupun salah.
