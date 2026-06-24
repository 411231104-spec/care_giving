# 📋 Daftar Fitur Aplikasi Care_Giving

> **Care_Giving** — *we love, we care*  
> Platform digital koordinasi tim perawatan lansia berbasis mobile (React Native / Expo)

---

## 🔐 Autentikasi & Keamanan

| Fitur | Keterangan |
|-------|-----------|
| **Login** | Masuk menggunakan email dan kata sandi |
| **Register** | Pendaftaran akun baru dengan pilihan role (Admin / Keluarga) |
| **Logout** | Keluar dari akun dengan konfirmasi dialog |
| **Indikator kekuatan kata sandi** | Menampilkan tingkat keamanan kata sandi saat registrasi (Sangat Lemah – Sangat Kuat) |
| **Show/Hide Password** | Toggle visibilitas kata sandi saat login & registrasi |
| **Ubah Kata Sandi** | Ganti kata sandi dari halaman profil |
| **Sesi otomatis** | Sesi pengguna disimpan secara lokal (AsyncStorage) dan dipulihkan otomatis |

---

## 👥 Sistem Role (Hak Akses)

| Role | Hak Akses |
|------|-----------|
| **Admin** | Lihat semua booking, setujui/tolak booking, kelola data lansia, lihat statistik lengkap (total lansia, total pengguna) |
| **Keluarga** | Buat booking, pantau status booking milik sendiri, lihat data lansia, kelola profil pribadi |

---

## 🏠 Dashboard (Home)

| Fitur | Keterangan |
|-------|-----------|
| **Sapaan dinamis** | Menampilkan salam sesuai waktu (Selamat Pagi/Siang/Sore/Malam) |
| **Kartu statistik** | Menampilkan jumlah Total Lansia Aktif, Booking Pending, dan Jadwal Hari Ini |
| **Daftar booking hari ini** | Menampilkan maksimal 5 booking hari ini secara real-time |
| **Indikator Live** | Tanda visual bahwa data booking diperbarui secara real-time |
| **Badge role pengguna** | Menampilkan role (Administrator / Keluarga) di header |
| **Pull-to-refresh** | Tarik ke bawah untuk memuat ulang data |
| **Realtime update** | Data dashboard diperbarui otomatis saat ada perubahan booking (Supabase Realtime) |

---

## 👴 Manajemen Data Lansia

| Fitur | Keterangan |
|-------|-----------|
| **Lihat daftar lansia** | Menampilkan semua data lansia dalam format kartu |
| **Tambah lansia** | Form untuk menambahkan data lansia baru |
| **Edit lansia** | Ubah informasi lansia yang sudah ada |
| **Hapus lansia** | Hapus data lansia dengan konfirmasi dialog |
| **Upload foto lansia** *(opsional)* | Memilih foto dari galeri HP untuk ditampilkan di kartu lansia |
| **Hapus foto** | Menghapus foto lansia yang sudah dipilih |
| **Avatar inisial** | Jika tidak ada foto, menampilkan inisial nama secara otomatis |
| **Data gender** | Pilihan Laki-laki / Perempuan dengan ikon visual (👴 / 👵) |
| **Status aktif/tidak aktif** | Toggle status lansia (Aktif / Tidak Aktif) dengan indikator warna |
| **Catatan medis** | Field untuk mencatat kondisi, alergi, dan obat-obatan |
| **Alamat** | Menyimpan alamat lengkap lansia |
| **Pencarian** | Cari lansia berdasarkan nama, alamat, atau catatan medis |
| **Hapus pencarian** | Tombol X untuk menghapus teks pencarian dengan cepat |
| **Pull-to-refresh** | Tarik ke bawah untuk memuat ulang data |
| **Empty state** | Tampilan khusus saat data kosong atau pencarian tidak ditemukan |

---

## 📋 Pemesanan (Booking)

| Fitur | Keterangan |
|-------|-----------|
| **Daftar booking** | Melihat semua riwayat pemesanan layanan perawatan |
| **Filter booking by role** | Admin melihat semua booking; Keluarga hanya melihat booking miliknya |
| **Buat booking baru** | Form pemesanan multi-langkah (4 step wizard) |
| **Step 1 – Pilih Lansia** | Memilih lansia yang akan mendapatkan layanan |
| **Step 2 – Pilih Layanan** | Memilih jenis layanan perawatan (5 pilihan) |
| **Step 3 – Tentukan Jadwal** | Mengisi tanggal, waktu mulai, waktu selesai, dan catatan |
| **Step 4 – Konfirmasi** | Pratinjau lengkap sebelum mengirim pemesanan |
| **Validasi form** | Validasi setiap langkah sebelum melanjutkan ke step berikutnya |
| **Indikator step** | Progress bar visual menampilkan posisi langkah saat ini |
| **Jenis layanan tersedia** | Perawatan Umum, Terapi Fisik, Pendampingan Medis, Perawatan Malam, Konsultasi |
| **Status booking** | Menunggu / Disetujui / Ditolak / Dibatalkan |
| **Setujui booking** *(Admin)* | Admin dapat menyetujui booking yang berstatus Menunggu |
| **Tolak booking** *(Admin)* | Admin dapat menolak booking yang berstatus Menunggu |
| **Batalkan booking** | Pengguna dapat membatalkan booking yang masih Menunggu |
| **Hapus booking** | Menghapus riwayat booking dengan konfirmasi |
| **Realtime update** | Status booking diperbarui otomatis via Supabase Realtime |
| **Pull-to-refresh** | Tarik ke bawah untuk memuat ulang data |

---

## 👤 Profil Pengguna

| Fitur | Keterangan |
|-------|-----------|
| **Tampilan profil** | Menampilkan foto avatar inisial, nama, email, dan role |
| **Indikator online** | Titik hijau di avatar menandakan pengguna sedang aktif |
| **Statistik akun** | Menampilkan total booking dan booking yang masih menunggu |
| **Statistik admin** | Admin melihat tambahan data: jumlah Lansia Aktif dan Total Pengguna |
| **Edit nama & nomor telepon** | Mengubah informasi profil nama dan telepon |
| **Ubah kata sandi** | Mengubah kata sandi dengan validasi panjang dan konfirmasi |
| **Toggle visibilitas kata sandi** | Show/hide saat mengubah kata sandi |
| **Tanggal bergabung** | Menampilkan tanggal akun dibuat dalam format Indonesia |
| **Keluar dari akun** | Tombol logout dengan konfirmasi dialog |

---

## 🎨 UI/UX & Desain

| Fitur | Keterangan |
|-------|-----------|
| **Dark mode** | Tema gelap secara default di seluruh aplikasi |
| **Logo resmi** | Logo Care_Giving ditampilkan di halaman Login, Register, dan Loading screen |
| **Splash screen branded** | Loading screen dengan logo dan tagline "we love, we care" |
| **Bottom tab navigation** | Navigasi bawah dengan 4 tab: Dashboard, Lansia, Pemesanan, Profil |
| **Greeting dinamis** | Sapaan berubah sesuai waktu hari |
| **Badge status berwarna** | Warna berbeda untuk setiap status booking (kuning/hijau/merah/abu) |
| **Keyboard avoiding view** | Form tidak tertutup keyboard saat mengisi input |
| **Safe area** | Konten tidak terpotong notch/status bar di semua perangkat |
| **Loading indicator** | Spinner saat memuat data |
| **Empty state** | Tampilan informatif saat data kosong |
| **Pull-to-refresh** | Tersedia di semua halaman list |

---

## 🗄️ Backend & Database (Supabase)

| Fitur | Keterangan |
|-------|-----------|
| **Autentikasi Supabase Auth** | Login, register, logout, dan manajemen sesi |
| **Database PostgreSQL** | Menyimpan data pengguna, lansia, booking, dan jadwal |
| **Realtime subscription** | Data dashboard dan booking diperbarui secara real-time |
| **Row Level Security (RLS)** | Keamanan akses data berdasarkan role pengguna |
| **Persistent session** | Sesi disimpan via AsyncStorage agar tidak perlu login ulang |

---

## 📦 Teknologi yang Digunakan

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React Native | 0.81.5 | Framework mobile |
| Expo | ~54.0.0 | Build & development tools |
| Supabase JS | ^2.45.4 | Backend & database |
| React Navigation | - | Navigasi antar halaman |
| AsyncStorage | - | Penyimpanan sesi lokal |
| expo-image-picker | - | Upload foto dari galeri |
| expo-status-bar | ~3.0.9 | Status bar management |

---

## 📁 Struktur Halaman (Screen)

```
mobile/
└── src/
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js       ← Halaman masuk
    │   │   └── RegisterScreen.js    ← Halaman daftar
    │   └── main/
    │       ├── HomeScreen.js        ← Dashboard utama
    │       ├── LansiaScreen.js      ← Manajemen data lansia
    │       ├── BookingScreen.js     ← Pemesanan layanan
    │       └── ProfileScreen.js     ← Profil pengguna
    ├── navigation/
    │   └── AppNavigator.js          ← Konfigurasi navigasi
    ├── context/
    │   └── AuthContext.js           ← State autentikasi global
    ├── lib/
    │   └── supabase.js              ← Konfigurasi Supabase client
    └── theme/
        └── colors.js                ← Design system (warna, spacing, dll)
```

---

*Dibuat untuk: Care_Giving App v1.0.0 — Platform Koordinasi Perawatan Lansia*
