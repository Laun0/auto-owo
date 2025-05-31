# 🤖 Auto OwO Grind Self-Bot (Advanced) 🦊✨

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-16.x+-green?style=for-the-badge&logo=node.js" alt="Node.js Version">
  <img src="https://img.shields.io/badge/discord.js--selfbot--v13-Active-blue?style=for-the-badge&logo=discord" alt="discord.js-selfbot-v13">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License: MIT">
</p>

Bot Discord _self-user_ (self-bot) canggih untuk otomatisasi grinding di **OwO Bot**, ditulis dalam Node.js. Didesain dengan konfigurasi ekstensif melalui file YAML dan berbagai fitur untuk mencoba mensimulasikan perilaku manusia demi mengurangi risiko.

> [!WARNING]
> **PELANGGARAN BERAT TERHADAP TOS DISCORD & OWO BOT!**
> Penggunaan _self-bot_ adalah pelanggaran serius. Akun Anda **SANGAT BERISIKO TINGGI** 🚫 untuk diblokir secara permanen. 
> Token pengguna Anda adalah seperti kata sandi 🔑. Jangan pernah membagikannya. 
> Proyek ini disediakan **HANYA UNTUK TUJUAN EDUKASI DAN DEMONSTRASI**. Penulis tidak bertanggung jawab atas konsekuensi apa pun.
> 🔥 **GUNAKAN DENGAN RISIKO SEPENUHNYA DITANGGUNG SENDIRI.** Anda telah diperingatkan. 🔥

---

## ✨ Fitur Utama

*   ⚙️ **Otomatisasi Grinding**: `hunt`, `battle`, dan `owo` otomatis.
*   🎮 **Kontrol Manual**: Mulai (`▶️`) dan hentikan (`⏹️`) grinding via perintah Discord.
*   📝 **Konfigurasi Ekstensif**: Semua pengaturan utama di file `config.yaml`.
*   🔑 **Prefix Terpisah**: Untuk perintah ke OwO Bot dan kontrol self-bot.
*   🚶‍♂️ **Perilaku Lebih "Manusiawi"**: Interval acak, istirahat panjang (`🛌`), "check actions" opsional.
*   ⏱️ **Manajemen Cooldown**: Deteksi dasar cooldown dari OwO Bot.
*   🛡️ **Penanganan Captcha**: Deteksi, penghentian sementara, notifikasi, jeda panjang, dan perintah `captchadone`.
*   💰 **Auto Sell**: Penjualan item otomatis periodik.
*   🗓️ **Perintah Tambahan**: Jadwal otomatis untuk `pray`, `daily`, `curse` (opsional).
*   📊 **Logging Cantik**: Menggunakan `signale` untuk output log yang jelas.
*   🔒 **Keamanan Token**: Token Discord disimpan di file `.env`.

---

## 🛠️ Prasyarat

*   🟢 [Node.js](https://nodejs.org/) (Versi 16.x atau lebih tinggi direkomendasikan)
*   📦 npm (biasanya terinstal bersama Node.js)
*   👤 Akun Discord

> [!IMPORTANT]
> Sebelum melanjutkan, pastikan Anda benar-benar memahami risiko yang terlibat dalam penggunaan self-bot.

---

## 🚀 Instalasi & Pengaturan

<details>
<summary>📜 Klik di sini untuk melihat langkah-langkah instalasi dan pengaturan detail</summary>

1.  **Clone atau Unduh Proyek**:
    ```bash
    git clone https://github.com/Laun0/auto-owo.git 
    cd auto-owo
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Dapatkan Token Pengguna Discord Anda**:
    *   Buka Discord di **browser**.
    *   Tekan `Ctrl+Shift+I` (Windows/Linux) atau `Cmd+Opt+I` (Mac) ➡️ Developer Tools.
    *   Tab "Network" (Jaringan) ➡️ Filter `/api` atau `messages`.
    *   Lakukan aksi apa saja di Discord.
    *   Cari request ➡️ Klik ➡️ Headers ➡️ `Authorization`. Nilainya adalah token Anda.

4.  **Konfigurasi Bot**:
    *   **Buat file `.env`**:
        Di root direktori, buat file `.env` dan isi:
        ```env
        DISCORD_TOKEN="TOKEN_PENGGUNA_DISCORD_ANDA_DI_SINI"
        ```
    *   **Edit file `config.yaml`**:
        Salin `config.example.yaml` menjadi `config.yaml` (jika ada) atau buat baru.
        Sesuaikan nilai-nilai penting:
        *   `channelId`: ID channel target. (Aktifkan Developer Mode di Discord: User Settings > Advanced > Developer Mode. Klik kanan channel > Copy ID).
        *   `owoPrefix`: Prefix OwO Bot.
        *   `botControlPrefix`: Prefix untuk kontrol self-bot.
        *   Periksa semua opsi lain seperti interval, perilaku, auto-sell, dll.

</details>

> [!CAUTION]
> > Token Anda bersifat sangat rahasia. Proses ini dilakukan melalui Developer Tools browser dan HARUS dilakukan dengan hati-hati.

---

## ▶️ Menjalankan Bot

Setelah instalasi dan konfigurasi selesai:
```bash
node selfbot.js
```
Anda akan melihat output log dari `signale` di konsol Anda.

<details>
<summary>💡 Menjalankan Bot Secara Terus-Menerus dengan PM2 (Opsional)</summary>

1.  Install PM2 global: `npm install pm2 -g`
2.  Start bot dengan PM2: `pm2 start index.js --name owo-grinder`
3.  Pantau bot: `pm2 list` atau `pm2 monit`
4.  Lihat log: `pm2 logs owo-grinder`
5.  Stop bot: `pm2 stop owo-grinder`
6.  Hapus bot dari PM2: `pm2 delete owo-grinder`

</details>

> [!TIP]
> PM2 membantu menjaga bot Anda tetap berjalan dan akan me-restart otomatis jika terjadi crash. Ini sangat berguna untuk penggunaan jangka panjang.

---

## ⌨️ Perintah Kontrol Bot

Perintah ini dikirimkan oleh **Anda** di channel target yang dikonfigurasi. Gunakan `botControlPrefix` dari `config.yaml`.

*   `[prefix]start`: ▶️ Memulai siklus grinding otomatis.
*   `[prefix]stop`: ⏹️ Menghentikan siklus grinding otomatis.
*   `[prefix]status`: 📊 Menampilkan status bot saat ini.
*   `[prefix]captchadone`: ✅ Dijalankan setelah Anda menyelesaikan captcha/verifikasi manual.

**Contoh (jika `botControlPrefix: "!sb"`):**
*   `// start`
*   `// stop`
*   `// status`
*   `// captchadone`

---

## ⚙️ File Konfigurasi (`config.yaml`)

File `config.yaml` adalah pusat kendali utama.
<details>
<summary>📄 Klik di sini untuk melihat ringkasan opsi konfigurasi</summary>

*   `channelId`: ID channel target.
*   `owoPrefix`: Prefix OwO Bot.
*   `botControlPrefix`: Prefix untuk perintah kontrol bot Anda.
*   `botSpecificSettings`:
    *   `owoBotId`: ID pengguna OwO Bot.
    *   `captchaKeywords`: Kata kunci untuk deteksi captcha.
    *   `checkActionsPool`: Perintah untuk "check action" (bisa string atau array).
*   `intervals`: Pengaturan waktu (dalam milidetik).
    *   `minGrindAction` & `maxGrindAction`: Jeda utama antar "paket" grinding.
    *   `minorActionDelayMin` & `minorActionDelayMax`: Jeda kecil antar `hunt`/`battle`/`owo`.
*   `curse`, `behavior`, `autoSell`, `captcha`, `actions`: Detail pengaturan lain.

</details>

> [!NOTE]
> YAML sangat sensitif terhadap **indentasi**. Pastikan menggunakan spasi (bukan tab) dan format yang benar.

---

## 📉 Tips Mengurangi Risiko

<details>
<summary>🛡️ Klik di sini untuk tips keamanan (INGAT, TIDAK ADA JAMINAN!)</summary>

*   🐢 **Jangan Terlalu Serakah**: Atur interval yang lebih panjang dan acak.
*   🔄 **Variasi**: Manfaatkan "check actions" dan istirahat panjang.
*   👀 **Pantau Aktif**: Awasi log dan respons OwO. Jika sering captcha, itu pertanda buruk. Hentikan atau kurangi intensitasnya.
*   🤫 **Gunakan Channel Sepi**: Hindari grinding di channel ramai atau yang diawasi ketat.
*   🌙 **Jangan Jalankan 24/7**: Bot yang berjalan non-stop sangat mencurigakan.
*   🧠 **Pahami Kodenya**: Ketahui cara kerja bot Anda.

</details>

> [!CAUTION]
> Tips ini mungkin membantu, tetapi tidak menjamin akun Anda aman dari deteksi. Risiko pemblokiran selalu ada saat menggunakan self-bot.

---

## 🤝 Kontribusi

Jika proyek ini adalah open-source dan Anda ingin berkontribusi:
*   Fork repository.
*   Buat branch fitur Anda (`git checkout -b fitur/FiturKeren`).
*   Commit perubahan Anda (`git commit -m 'Tambah FiturKeren'`).
*   Push ke branch (`git push origin fitur/FiturKeren`).
*   Buka Pull Request.

> [!NOTE]
> Untuk isu atau saran fitur, silakan buka Issue di repository GitHub.

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.
Lihat file [LICENSE](LISENCE) untuk detailnya.

---
