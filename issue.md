# Bug: Internal Server Error saat Registrasi dengan Nama > 255 Karakter

Dokumen ini menjelaskan tentang bug yang ditemukan pada endpoint registrasi user beserta panduan langkah demi langkah untuk memperbaikinya.

## Deskripsi Bug

Ketika mencoba melakukan registrasi melalui endpoint `POST /api/users/` dengan payload field `name` yang memiliki panjang lebih dari 255 karakter, aplikasi melempar respon HTTP 500 (Internal Server Error).

**Penyebab:**
1. Pada file schema database (`src/db/schema.ts`), kolom `name` di tabel `users` dibatasi menggunakan tipe data `varchar(255)`.
2. Namun, pada level router Elysia (`src/routes/users-route.ts`), tidak ada pembatasan `maxLength` pada skema validasi. Payload hanya diperiksa menggunakan `t.String()`.
3. Akibatnya, input dengan karakter berlebih lolos validasi router namun ditolak keras oleh database (menghasilkan *query error* `Data too long for column 'name'`).

**Ekspektasi:**
Aplikasi seharusnya menolak request payload tersebut secara dini di layer validasi Elysia dan mengembalikan HTTP status code `400 Bad Request` beserta pesan error validasi yang jelas, bukan malah nge-*crash* di database dengan HTTP status code `500`.

---

## File yang Harus Diperbaiki
- `src/routes/users-route.ts`

---

## Tahapan Implementasi Perbaikan

Untuk menyelesaikan bug ini, ikuti langkah-langkah di bawah ini secara teliti:

### 1. Update Skema Validasi di `users-route.ts`
- Buka file `src/routes/users-route.ts`.
- Cari blok kode untuk endpoint registrasi (di bagian `.post("/", ...)`).
- Di bagian paling bawah blok tersebut, terdapat definisi objek `body` untuk validasi parameter menggunakan library Elysia `t`.
- Cari baris kode berikut:
  ```typescript
  name: t.String(),
  ```
- Tambahkan konfigurasi panjang maksimal (maxLength) sebanyak 255 pada skema string tersebut. Ubah baris kodenya menjadi:
  ```typescript
  name: t.String({ maxLength: 255 }),
  ```

### 2. Pengujian (Testing)
Untuk memastikan bug benar-benar telah diselesaikan, jalankan tahap pengetesan berikut:
- Nyalakan server secara lokal (menggunakan command `bun run dev` atau `bun run src/index.ts`).
- Gunakan aplikasi semacam Postman, Bruno, atau curl.
- Lakukan request `POST` ke endpoint `http://localhost:3000/api/users/` menggunakan *body* (JSON) yang field `name`-nya diisi dengan string panjang yang terdiri dari 300 karakter.
- **Kondisi Sukses**: Respons yang didapatkan dari server harus berupa status `400 Bad Request` dari validasi internal Elysia, dan **BUKAN** `500 Internal Server Error`.
- Pastikan juga untuk menguji registrasi user normal dengan nama di bawah 255 karakter, pastikan pendaftaran sukses dan berjalan seperti sedia kala.
