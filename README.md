This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Detail Tabel

### 1. `profiles`
Tabel ini menyimpan data publik pengguna yang terhubung langsung dengan sistem otentikasi Supabase (`auth.users`).

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `UUID` | Kunci utama, sama dengan `id` di `auth.users`. |
| `username` | `TEXT` | Nama unik pengguna di platform. |
| `full_name` | `TEXT` | Nama lengkap pengguna. |
| `avatar_url` | `TEXT` | URL ke gambar profil pengguna. |
| `wallet_address` | `TEXT` | Alamat *wallet* Polygon untuk menerima royalti. |
| `created_at` | `TIMESTAMP` | Waktu saat profil dibuat. |
| `updated_at` | `TIMESTAMP` | Waktu saat profil terakhir diubah. |

**Tujuan**: Untuk menampilkan informasi kreator di halaman karya dan mengelola data pengguna.

### 2. `creative_works`
Tabel ini adalah inti dari platform, menyimpan semua metadata untuk setiap karya yang diunggah[cite: 55].

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `UUID` | Kunci utama unik untuk setiap karya. |
| `creator_id` | `UUID` | Merujuk ke `id` di tabel `profiles`. Menentukan siapa pemilik karya. |
| `title` | `TEXT` | Judul karya. |
| `description` | `TEXT` | Deskripsi detail tentang karya. |
| `category` | `TEXT` | Kategori karya (misal: Musik, Seni Digital). |
| `file_url` | `TEXT` | URL publik ke file yang disimpan di Supabase Storage[cite: 57]. |
| `file_hash` | `TEXT` | *Hash* SHA-256 dari file untuk verifikasi integritas. |
| `nft_token_id` | `TEXT` | ID token dari NFT yang dicetak sebagai sertifikat kepemilikan. |
| `nft_tx_hash` | `TEXT` | *Hash* transaksi saat NFT dicetak di blockchain. |
| `created_at` | `TIMESTAMP` | Waktu saat karya diunggah. |
| `updated_at` | `TIMESTAMP` | Waktu saat metadata karya terakhir diubah. |

**Tujuan**: Untuk mengelola dan menampilkan semua karya kreatif di *marketplace* dan dasbor kreator.

### 3. `royalty_splits`
Tabel ini mendefinisikan bagaimana pendapatan dari sebuah karya akan didistribusikan[cite: 55].

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `UUID` | Kunci utama unik untuk setiap entri pembagian. |
| `work_id` | `UUID` | Merujuk ke `id` di tabel `creative_works`. |
| `recipient_address` | `TEXT` | Alamat *wallet* penerima royalti. |
| `split_percentage` | `NUMERIC` | Persentase royalti yang akan diterima (contoh: 80.00). |
| `split_contract_address` | `TEXT` | Alamat *smart contract* "Split" dari thirdweb. |
| `created_at` | `TIMESTAMP` | Waktu saat konfigurasi pembagian ini dibuat. |

**Tujuan**: Untuk memastikan transparansi dan otomatisasi pembagian royalti kepada kolaborator.

### 4. `licenses`
Tabel ini berfungsi sebagai buku besar (*ledger*) yang mencatat semua transaksi pembelian lisensi[cite: 55].

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `UUID` | Kunci utama unik untuk setiap transaksi lisensi. |
| `work_id` | `UUID` | Merujuk ke karya yang lisensinya dibeli. |
| `buyer_id` | `UUID` | Merujuk ke pengguna yang membeli lisensi. |
| `license_type` | `TEXT` | Jenis lisensi (contoh: Personal, Commercial, Exclusive)[cite: 160]. |
| `price_usdt` | `NUMERIC` | Harga pembelian dalam mock USDT. |
| `transaction_hash` | `TEXT` | *Hash* transaksi dari mock pembayaran. |
| `purchased_at` | `TIMESTAMP` | Waktu saat pembelian terjadi. |

**Tujuan**: Untuk melacak riwayat pembelian, menghitung pendapatan, dan menampilkan data transaksi.

### 5. `analytics_events`
Tabel ini digunakan untuk mencatat interaksi pengguna dengan karya kreatif untuk ditampilkan di dasbor analitik[cite: 55].

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `BIGINT` | Kunci utama yang bertambah otomatis. |
| `work_id` | `UUID` | Merujuk ke karya yang berinteraksi. |
| `event_type` | `TEXT` | Jenis interaksi (contoh: 'view', 'play', 'download')[cite: 219]. |
| `user_id` | `UUID` | Pengguna yang melakukan interaksi (bisa NULL jika anonim). |
| `created_at` | `TIMESTAMP` | Waktu saat interaksi terjadi. |

**Tujuan**: Untuk memberikan wawasan kepada kreator tentang performa karya mereka.