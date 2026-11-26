# KEMAS STAR AWARDS 2026 – Royal Fairytale Photobooth

## Kandungan
- `index.html`, `style.css`, `app.js`: aplikasi photobooth asas.
- `assets/`: empat bingkai PNG.
- `manifest.json` dan `sw.js`: sokongan pemasangan PWA dan cache asas.
- `config.js`: tempat URL Google Apps Script (belum disambungkan).

## Penting sebelum digunakan
1. Bingkai PNG dalam pakej ini ialah draf awal yang dipotong daripada imej konsep. Semak kedudukan ruang foto dan ketepatan tulisan/logo sebelum majlis.
2. Aplikasi kamera memerlukan laman HTTPS (GitHub Pages menyediakan HTTPS).
3. Uji dahulu pada telefon sebenar. Kedudukan ruang foto dan zoom mungkin perlu dilaraskan mengikut bingkai akhir.
4. Fungsi muat turun setempat tersedia. Muat naik automatik ke Google Drive belum diaktifkan; `config.js` masih kosong.

## Terbitkan melalui GitHub Pages (telefon Android)
1. Buka github.com dalam Chrome dan log masuk.
2. Tekan `+` > `New repository`.
3. Namakan repository `kemas-royal-fairytale-photobooth`, pilih `Public`, kemudian `Create repository`.
4. Muat naik semua fail dan folder dalam ZIP ini ke repository. Pastikan `index.html` berada di bahagian paling atas (root), bukan dalam folder tambahan.
5. Di repository, buka `Settings` > `Pages`.
6. Pada `Build and deployment`, pilih `Deploy from a branch`; pilih `main` dan `/ (root)`, kemudian `Save`.
7. Tunggu GitHub Pages menerbitkan laman. Pautan akan kelihatan pada halaman Pages.
8. Buka pautan menggunakan Chrome. Benarkan akses kamera.

## Kamera
- Kamera depan digunakan dahulu. Butang `Tukar Kamera` bertukar antara kamera depan dan belakang.
- Butang `Galeri` membolehkan foto sedia ada dipilih.
- Countdown 3 saat disediakan.
- Zum digunakan pada paparan dan komposit foto; uji kesepadanan preview dengan hasil akhir.

## Google Drive
Integrasi Google Drive belum diaktifkan dalam versi asas ini. Jangan masukkan pautan folder Drive sebagai ganti URL Apps Script. Apps Script perlu disediakan dan diuji berasingan sebelum URL `/exec` dimasukkan ke `config.js`.

## Nota
PWA cache ini menyimpan fail aplikasi dan bingkai selepas lawatan pertama. Kamera tetap memerlukan kebenaran pelayar; sambungan internet diperlukan untuk lawatan pertama dan muat naik awan.
