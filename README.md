# Watchestrader CRM (wacrm)

> Sistem CRM (Customer Relationship Management) internal yang dirancang khusus untuk **Watches Traders**. Sistem ini mengintegrasikan platform perpesanan WhatsApp® dengan fitur shared inbox, pengelolaan kontak, pipelines penjualan (Kanban), siaran pesan (broadcasts), serta otomatisasi alur kerja tanpa kode (*no-code automations*).

Aplikasi ini telah dimigrasi dari arsitektur *Supabase Serverless* menjadi arsitektur modern **Decoupled Full-stack** dengan memisahkan Frontend dan Backend secara terstruktur.

---

## 🛠️ Stack Teknologi & Arsitektur Baru

Sistem ini terbagi menjadi dua bagian utama untuk memaksimalkan performa, keamanan, dan fleksibilitas pengembangan:

### 1. Frontend (Next.js)
* **Framework:** Next.js (App Router) & React
* **Bahasa:** TypeScript
* **Styling:** Tailwind CSS dengan kustomisasi tema dinamis (*Light* & *Dark* mode) yang premium.
* **Fungsi:** Menangani interaksi pengguna, rendering UI dashboard, manajemen state visual, dan visualisasi data pipa penjualan (Kanban).

### 2. Backend (Laravel API)
* **Framework:** Laravel (PHP)
* **Autentikasi:** Laravel Sanctum (Token-based API Authentication)
* **Database & ORM:** Eloquent ORM dengan dukungan UUID di semua model.
* **Migrasi Database:** Dikelola penuh oleh Laravel Migrations (MySQL/PostgreSQL).
* **Fungsi:** Mengelola data inti CRM, menangani webhook Meta WhatsApp API, eksekusi otomatisasi backend, serta enkripsi token sensitif.

---

## 📁 Struktur Folder Project

* **`/src`** — Berisi kode sumber frontend Next.js (Halaman, Komponen Visual, React Hooks, Global State).
* **`/api`** — Berisi backend utama berbasis Laravel (Controllers, Models, Database Migrations, API Routes).
* **`/public`** — Aset publik seperti logo Watches Traders dan gambar banner dashboard.
* **`/supabase`** — **[Legacy Folder]** Berisi skema database dan migrasi lama dari era Supabase.

---

## ⚠️ Informasi Penting Terkait Folder `/supabase`

Sebagai bagian dari proses transisi arsitektur dari Supabase ke Laravel backend:
* **Penghapusan API Routes Lama:** Semua file API internal Next.js di folder `src/app/api/...` **telah dihapus** secara permanen. Hal ini dilakukan guna mencegah duplikasi logika backend dan memastikan seluruh request data diarahkan langsung ke Laravel backend.
* **Fungsi Folder `/supabase/migrations` Saat Ini:** Folder `/supabase/migrations` berisi file-file SQL lama yang berfungsi **hanya sebagai referensi sejarah / cetak biru (*blueprint*)** dari struktur tabel awal. Folder ini berguna jika Anda ingin mencocokkan tipe data kolom atau relasi tabel lama dengan migrasi Laravel yang baru.

### 📅 Kapan Folder `/supabase` Bisa Dihapus?
> [!IMPORTANT]  
> Anda dapat menghapus seluruh folder `/supabase` secara aman dan permanen dari repository Anda ketika:
> 1. Sistem backend baru berbasis **Laravel API** sudah dideploy secara sukses dan stabil di server production.
> 2. Database production (MySQL/PostgreSQL) sudah berjalan lancar menggunakan Laravel Migrations.
> 3. Anda telah memverifikasi secara menyeluruh bahwa tidak ada lagi dependensi atau kode yang mengarah ke endpoint Supabase lama.

---

## 🚀 Cara Menjalankan Project Secara Lokal

### 1. Menjalankan Backend (Laravel)
Pastikan Anda memiliki PHP (>= 8.2) dan MySQL/PostgreSQL yang berjalan (misalnya lewat Laragon atau XAMPP).
```bash
cd api
composer install
cp .env.example .env # Sesuaikan kredensial database Anda
php artisan key:generate
php artisan migrate # Membuat tabel-tabel database CRM
php artisan serve
```
Backend API Anda akan berjalan di `http://127.0.0.1:8000`.

### 2. Menjalankan Frontend (Next.js)
```bash
# Kembali ke root folder project
npm install
cp .env.local.example .env.local # Sesuaikan NEXT_PUBLIC_API_URL ke backend Laravel Anda
npm run dev
```
Buka browser Anda dan akses `http://localhost:3000`.

---

## 📄 Lisensi
Hak Cipta Internal © **Watches Traders**. Penggunaan, penyalinan, atau modifikasi perangkat lunak ini secara tidak sah di luar izin Watches Traders sangat dilarang.
