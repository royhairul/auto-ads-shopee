# Auto Ads Shopee - Website

Landing page untuk mengunduh ekstensi Auto Ads Shopee.

## 🚀 Setup GitHub Pages

### Langkah 1: Push website ke branch `gh-pages`

```bash
# Dari root directory project
git subtree push --prefix website origin gh-pages
```

**Atau** buat branch terpisah secara manual:

```bash
# Clone konten website ke branch baru
git checkout --orphan gh-pages
git rm -rf .
cp -r website/* .
git add .
git commit -m "Deploy website to GitHub Pages"
git push origin gh-pages
```

### Langkah 2: Aktifkan GitHub Pages

1. Buka repository di GitHub: https://github.com/royhairul/auto-ads-shopee
2. Pergi ke **Settings** → **Pages**
3. Di bagian "Source", pilih:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Klik **Save**

### Langkah 3: Akses Website

Setelah beberapa menit, website akan tersedia di:
```
https://royhairul.github.io/auto-ads-shopee/
```

## 📁 Struktur File

```
website/
├── index.html      # Halaman utama
├── styles.css      # Styling (dark theme + Shopee orange)
├── script.js       # Fetch releases dari GitHub API
├── assets/         # Logo dan gambar
│   ├── logo.png
│   ├── logo128.png
│   ├── logo48.png
│   └── logo16.png
└── README.md       # File ini
```

## ✨ Fitur Website

- **Download Otomatis dari GitHub Releases** - Mengambil daftar release secara real-time
- **Release Notes** - Menampilkan catatan rilis dengan format markdown
- **Riwayat Versi** - Dapat mengunduh versi sebelumnya
- **Panduan Instalasi** - Langkah-langkah memasang ekstensi
- **Responsive Design** - Tampilan optimal di semua ukuran layar
- **Dark Theme** - Tema gelap dengan aksen warna Shopee

## 🔧 Development Lokal

Untuk menjalankan website secara lokal:

```bash
# Gunakan live server extension di VS Code
# Atau gunakan Python
python -m http.server 8000 --directory website

# Atau gunakan npx
npx serve website
```

Buka http://localhost:8000 di browser.

## 📝 Membuat Release Baru

Untuk menampilkan versi baru di website:

1. Build extension: `npm run build`
2. Buat file zip dari folder `dist`
3. Buat GitHub Release baru dengan tag (contoh: `v1.0.3`)
4. Upload file `.zip` sebagai release asset
5. Tulis release notes dalam format markdown

Website akan otomatis menampilkan release baru!

## 🎨 Kustomisasi

### Mengubah Warna

Edit variabel CSS di `styles.css`:

```css
:root {
  --primary: #ee4d2d;        /* Warna Shopee orange */
  --primary-light: #ff6b4d;  /* Warna lebih terang */
  --primary-dark: #d73919;   /* Warna lebih gelap */
  /* ... */
}
```

### Mengubah Repository

Edit `script.js`:

```javascript
const GITHUB_REPO = 'username/repo-name';
```
