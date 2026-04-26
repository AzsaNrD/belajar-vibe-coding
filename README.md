# User Management API (Elysia JS)

Aplikasi ini adalah sebuah RESTful API sederhana untuk manajemen pengguna (User Management) yang mencakup fitur Registrasi, Login, Autentikasi Profile (Get Current User), dan Logout. Aplikasi ini dibangun dengan mengedepankan performa tinggi menggunakan Bun runtime dan framework Elysia JS.

---

## 🛠 Technology Stack
- **Runtime:** [Bun](https://bun.sh/)
- **Language:** TypeScript
- **Framework:** [Elysia JS](https://elysiajs.com/)
- **Database:** MySQL

## 📦 Library Utama yang Digunakan
- `elysia`: Framework web utama yang sangat cepat.
- `drizzle-orm` & `drizzle-kit`: ORM (Object-Relational Mapping) ringan namun kuat untuk berinteraksi dengan database dengan *type-safety* dan mengelola skema.
- `mysql2`: Driver koneksi database MySQL.
- `bcrypt`: Library keamanan untuk melakukan *hashing* pada password.
- `dotenv`: Untuk memuat variabel *environment* dari file `.env`.

---

## 📂 Arsitektur dan Struktur Folder

Proyek ini menggunakan struktur folder berlapis (berbasis fitur/komponen) untuk memisahkan *concern* (tanggung jawab) masing-masing kode:

```text
belajar-vibe-coding/
├── src/
│   ├── db/                 # Konfigurasi database dan definisi skema
│   │   ├── index.ts        # Setup koneksi database dan instance Drizzle
│   │   └── schema.ts       # Definisi tabel (users, sessions)
│   ├── routes/             # Layer Routing & Validasi request
│   │   └── users-route.ts  # Endpoint-endpoint terkait entitas user
│   ├── services/           # Layer Business Logic
│   │   └── users-service.ts# Logika registrasi, verifikasi login, dll.
│   ├── app.ts              # Inisialisasi utama aplikasi Elysia (terpisah dari entry point demi kemudahan testing)
│   └── index.ts            # Entry point utama aplikasi (menjalankan server di port 3000)
├── tests/                  # Folder Unit Test
│   └── user.test.ts        # File pengujian (test suite) untuk endpoint user
├── .env                    # (Tidak di-commit) Environment variables
└── package.json            # Daftar dependencies dan script eksekusi
```

---

## 💾 Skema Database

Aplikasi ini menggunakan 2 tabel utama dalam database MySQL:

### 1. Tabel `users`
Tabel ini bertugas untuk menyimpan informasi profil dan kredensial akses pengguna.
- `id` (INT, Serial Primary Key)
- `name` (VARCHAR 255, Not Null)
- `email` (VARCHAR 255, Not Null, Unique)
- `password` (VARCHAR 255, Not Null) - *Disimpan aman dalam format hash bcrypt*
- `created_at` (TIMESTAMP, Default Current Timestamp)

### 2. Tabel `sessions`
Tabel ini digunakan untuk menyimpan sesi aktif dari user yang telah berhasil login.
- `id` (INT, Serial Primary Key)
- `token` (VARCHAR 255, Not Null) - *Token Bearer string yang digenerate acak menggunakan crypto*
- `user_id` (BIGINT, Unsigned, Not Null) - *Foreign Key yang merujuk ke tabel `users` (kolom `id`)*
- `created_at` (TIMESTAMP, Default Current Timestamp)

---

## 🌐 API yang Tersedia

Berikut adalah detail endpoint API yang bisa digunakan. *Base path* untuk fitur user adalah `/api/users`.

| Method | Endpoint | Headers | Body / Payload (JSON) | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/users/` | - | `name`, `email`, `password` | Membuat (registrasi) pengguna baru. |
| **POST** | `/api/users/login` | - | `email`, `password` | Memverifikasi kredensial dan mengembalikan Token Sesi autentikasi. |
| **GET** | `/api/users/current` | `Authorization: Bearer <token>` | - | Mengambil data profil detail dari pengguna yang memiliki token yang valid. |
| **DELETE**| `/api/users/logout` | `Authorization: Bearer <token>` | - | Menghapus token aktif dari tabel sesi database, menandakan pengguna telah *logout*. |

> **Catatan Validasi Payload Elysia:**
> - Parameter `email` wajib memiliki format alamat email yang tepat.
> - Parameter `name`, `email`, dan `password` dibatasi maksimal **255 karakter** agar selaras dengan batasan skema database.
> - Khusus pada tahap registrasi, `password` diwajibkan memiliki panjang minimal **8 karakter**.
> - Kegagalan validasi *payload* akan langsung mengembalikan respon `400 Bad Request`.

---

## 🚀 Cara Setup dan Menjalankan Aplikasi

Ikuti panduan berikut untuk menjalankan proyek ini di perangkat lokal (*development environment*) Anda.

### 1. Prasyarat (Prerequisites)
Pastikan sistem Anda sudah terinstal perangkat lunak berikut:
- **Bun Runtime** - Instal via [bun.sh](https://bun.sh/)
- **MySQL Server** (Atau jalankan MySQL di dalam Docker Container)

### 2. Konfigurasi Environment Variables
Buat sebuah file konfigurasi rahasia baru bernama `.env` di direktori terluar (root) proyek, dan isi dengan data koneksi database Anda:

```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=password_rahasia_anda
DATABASE_NAME=belajar_vibe_coding
DATABASE_PORT=3306
```

### 3. Install Dependencies
Buka Command Prompt atau Terminal di dalam direktori root proyek, lalu eksekusi:
```bash
bun install
```

### 4. Push / Generate Schema Database
Alih-alih melakukan *migration* manual, Anda dapat menginstruksikan Drizzle untuk langsung mendorong (*push*) definisi skema dari kode menjadi tabel-tabel di MySQL dengan perintah:
```bash
bun run db:push
```

### 5. Menjalankan Server
Untuk menyalakan server di mode *development* dengan fitur *hot-reload* bawaan dari Bun:
```bash
bun run dev
```
Bila berhasil, terminal akan menampilkan pesan `🦊 Elysia is running at localhost:3000`.

---

## 🧪 Cara Testing Aplikasi

Kode aplikasi ini telah dilindungi (*test-covered*) menggunakan Unit Test yang ditulis secara khusus untuk memastikan seluruh endpoint API (baik itu jalur *success* maupun *error handling*) berjalan konsisten. Pengujian memanfaatkan standar *test runner* bawaan dari Bun.

Untuk menjalankan *test suite*, cukup eksekusi perintah berikut di terminal:
```bash
bun test
```

> ⚠️ **Perhatian**: Menjalankan tes akan menjalankan skrip *teardown* otomatis (`beforeEach`) yang akan **MENGHAPUS SEMUA DATA** dari dalam tabel `users` maupun `sessions`. Hal ini disengaja agar *state* masing-masing pengujian selalu bersih (*clean*) dan terisolasi. Gunakan database terpisah khusus *testing* jika tidak ingin data *development* Anda terhapus!
