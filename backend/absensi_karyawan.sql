-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 02 Jul 2026 pada 03.13
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `absensi_karyawan`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `absensis`
--

CREATE TABLE `absensis` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `cabang_id` bigint(20) UNSIGNED DEFAULT NULL,
  `izin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_keluar` time DEFAULT NULL,
  `lat_masuk` decimal(10,8) DEFAULT NULL,
  `long_masuk` decimal(11,8) DEFAULT NULL,
  `lat_pulang` decimal(10,8) DEFAULT NULL,
  `long_pulang` decimal(11,8) DEFAULT NULL,
  `status` enum('HADIR','TERLAMBAT','IZIN','ALPA','PULANG LEBIH AWAL','TIDAK ABSEN PULANG','LIBUR','BELUM ABSEN') DEFAULT 'BELUM ABSEN',
  `foto_masuk` varchar(255) DEFAULT NULL,
  `foto_pulang` varchar(255) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `absensis`
--

INSERT INTO `absensis` (`id`, `user_id`, `shift_id`, `cabang_id`, `izin_id`, `tanggal`, `jam_masuk`, `jam_keluar`, `lat_masuk`, `long_masuk`, `lat_pulang`, `long_pulang`, `status`, `foto_masuk`, `foto_pulang`, `keterangan`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, NULL, '2026-05-29', '06:15:55', NULL, 47.58380300, 4.66324200, 83.11626600, -46.41740300, 'TIDAK ABSEN PULANG', NULL, 'https://via.placeholder.com/640x480.png/002266?text=quisquam', 'Ut et quam explicabo unde odit facere.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(2, 1, NULL, NULL, NULL, '2026-05-28', '15:41:06', NULL, -67.59701100, 164.57205800, -8.92770700, -68.22562300, 'PULANG LEBIH AWAL', 'https://via.placeholder.com/640x480.png/00bb88?text=ut', 'https://via.placeholder.com/640x480.png/007744?text=eos', 'Consequatur amet et rem voluptatum aut amet.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(3, 1, NULL, NULL, NULL, '2026-05-30', '18:47:33', '08:23:12', -34.41270600, -72.87466200, 49.95069600, 173.42783500, 'TERLAMBAT', NULL, NULL, 'Ea sapiente dolor quam ut molestiae eaque.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(4, 1, NULL, NULL, NULL, '2026-05-27', '08:52:54', NULL, -42.23937300, -28.61314900, -21.50149800, 102.70581500, 'TERLAMBAT', NULL, 'https://via.placeholder.com/640x480.png/002266?text=voluptates', 'Repellendus debitis dolorum odit porro similique voluptas sapiente.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(5, 1, NULL, NULL, NULL, '2026-06-01', NULL, '16:28:58', -62.98588800, 120.11708800, -14.90660400, 41.53453200, 'HADIR', NULL, NULL, 'Minus modi incidunt odio.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(6, 1, NULL, NULL, NULL, '2026-06-04', '17:17:18', '12:10:35', 45.36901200, 39.76700800, 42.56535700, 152.56757200, 'LIBUR', 'https://via.placeholder.com/640x480.png/00bb22?text=sit', NULL, 'Ut blanditiis ex voluptas est.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(7, 1, NULL, NULL, NULL, '2026-05-20', NULL, NULL, -19.87816800, 73.45474200, 54.78898200, 154.22305900, 'PULANG LEBIH AWAL', 'https://via.placeholder.com/640x480.png/007766?text=consequatur', NULL, 'Aperiam repellat eum illo aut.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(8, 1, NULL, NULL, NULL, '2026-05-17', NULL, '10:39:02', 42.23369000, -69.17019600, 53.77291800, 35.03995900, 'LIBUR', 'https://via.placeholder.com/640x480.png/005577?text=laborum', NULL, 'Rerum aut possimus soluta sint eum aut.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(9, 1, NULL, NULL, NULL, '2026-05-24', '07:08:46', NULL, -62.12009100, -118.04981600, -14.57350200, -133.52262000, 'PULANG LEBIH AWAL', NULL, 'https://via.placeholder.com/640x480.png/0099bb?text=ex', 'Placeat iste nostrum animi reiciendis aut vel animi totam.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(10, 1, NULL, NULL, NULL, '2026-06-03', '19:20:35', '14:51:41', -24.27815000, -76.05706200, 35.21357200, -148.24277700, 'TERLAMBAT', NULL, 'https://via.placeholder.com/640x480.png/00eedd?text=voluptatem', 'Omnis natus reiciendis et consequatur et earum eum facilis.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(11, 1, NULL, NULL, NULL, '2026-05-08', '18:02:30', '07:43:15', -38.96628600, -98.06308900, -36.88227500, -80.02714600, 'TERLAMBAT', 'https://via.placeholder.com/640x480.png/007722?text=fugiat', NULL, 'Inventore ipsam ad sit.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(12, 1, NULL, NULL, NULL, '2026-05-23', '22:49:57', '16:50:37', 7.05804900, 104.45130800, 6.45537300, -100.86539600, 'ALPA', 'https://via.placeholder.com/640x480.png/008800?text=suscipit', 'https://via.placeholder.com/640x480.png/001111?text=quaerat', 'Aut praesentium suscipit perspiciatis nisi eos eligendi iste est.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(13, 1, NULL, NULL, NULL, '2026-05-31', '09:36:30', NULL, 85.46330500, 40.34536300, 86.36345900, -142.24659800, 'TIDAK ABSEN PULANG', NULL, 'https://via.placeholder.com/640x480.png/00aadd?text=delectus', 'Voluptatibus et est enim modi.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(14, 1, NULL, NULL, NULL, '2026-05-10', NULL, NULL, 79.46175000, 82.96585200, 75.61921000, 115.69744100, 'PULANG LEBIH AWAL', 'https://via.placeholder.com/640x480.png/004499?text=omnis', 'https://via.placeholder.com/640x480.png/00ee22?text=veritatis', 'Quasi hic atque fugiat impedit nesciunt earum qui.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(15, 1, NULL, NULL, NULL, '2026-05-25', NULL, NULL, -39.41427700, 108.59146500, -8.81402200, -132.69137400, 'LIBUR', NULL, NULL, 'Commodi nisi ipsam omnis.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(16, 1, NULL, NULL, NULL, '2026-05-21', NULL, NULL, 62.12349900, 85.16072500, -18.07704700, 51.92184200, 'TIDAK ABSEN PULANG', 'https://via.placeholder.com/640x480.png/007799?text=aut', NULL, 'Deserunt minus qui delectus aut suscipit rerum.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(17, 1, NULL, NULL, NULL, '2026-05-07', '13:25:53', NULL, -65.75297300, -14.68981600, 33.07466400, -81.87311100, 'ALPA', NULL, 'https://via.placeholder.com/640x480.png/00ee00?text=sed', 'Repellendus quo a est.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(18, 1, NULL, NULL, NULL, '2026-05-26', '13:34:23', '02:30:18', 48.43501400, 32.75692600, -18.40008900, -174.19455200, 'IZIN', NULL, NULL, 'Laudantium fugiat neque debitis ipsum quis quisquam.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(19, 1, NULL, NULL, NULL, '2026-05-11', '01:16:44', NULL, 71.87893600, 163.00532100, 1.99177400, -55.58298400, 'IZIN', NULL, NULL, 'Et earum autem quas id sit.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(20, 1, NULL, NULL, NULL, '2026-05-15', NULL, NULL, -6.62439200, 49.62505700, 31.34931200, 122.45395700, 'HADIR', NULL, NULL, 'Veniam deserunt reiciendis ad provident.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(21, 1, NULL, NULL, NULL, '2026-05-16', NULL, '18:15:20', -61.35505700, -148.67702400, -23.65201100, 108.71524100, 'HADIR', 'https://via.placeholder.com/640x480.png/00bbbb?text=aut', NULL, 'Ipsam sit voluptas eos voluptatum ut eos veritatis.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(22, 1, NULL, NULL, NULL, '2026-06-05', '03:02:06', '20:14:18', -17.48423200, -4.21167700, 43.62607900, -35.05613300, 'TERLAMBAT', 'https://via.placeholder.com/640x480.png/001188?text=rerum', 'https://via.placeholder.com/640x480.png/00ee66?text=totam', 'Architecto laudantium dolores facilis.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(23, 1, NULL, NULL, NULL, '2026-05-19', '08:02:12', '16:54:01', 30.70217500, 126.62894000, 77.42315300, -3.01695700, 'ALPA', 'https://via.placeholder.com/640x480.png/00dddd?text=est', NULL, 'Ea excepturi qui pariatur velit nam.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(24, 1, NULL, NULL, NULL, '2026-05-06', NULL, '14:16:47', 61.79637900, 37.34435800, -3.86490900, -68.47764900, 'ALPA', 'https://via.placeholder.com/640x480.png/00cc44?text=id', NULL, 'Exercitationem enim facilis voluptatum aut aspernatur.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(25, 1, NULL, NULL, NULL, '2026-05-14', NULL, '08:20:18', -46.93074400, -9.02250200, -25.63563900, -90.86156700, 'ALPA', NULL, 'https://via.placeholder.com/640x480.png/003322?text=et', 'Ut voluptatum et dolorum nesciunt fugit.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(26, 1, NULL, NULL, NULL, '2026-05-22', '14:53:00', '05:36:38', 17.07097700, -39.06581500, -32.67801900, 47.83625900, 'LIBUR', NULL, NULL, 'Iure quia inventore odio culpa molestiae accusamus officiis quia.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(27, 1, NULL, NULL, NULL, '2026-05-12', NULL, NULL, -80.53208700, -31.66677200, -24.01561900, -15.76908400, 'IZIN', 'https://via.placeholder.com/640x480.png/001199?text=quia', NULL, 'Est voluptatibus vel reprehenderit dolores et.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(28, 1, NULL, NULL, NULL, '2026-06-02', '15:38:12', NULL, 32.58918800, -63.91717100, -17.17622300, -90.31738800, 'IZIN', NULL, NULL, 'Maxime distinctio eligendi quaerat ea ut.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(29, 1, NULL, NULL, NULL, '2026-05-09', NULL, '14:33:25', -44.53220000, -146.97906000, -54.55002500, -130.64986800, 'PULANG LEBIH AWAL', NULL, 'https://via.placeholder.com/640x480.png/002233?text=quia', 'Molestiae et qui ut assumenda et a.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(30, 1, NULL, NULL, NULL, '2026-05-13', '06:21:23', NULL, -61.14629400, -126.68691200, -69.13821200, 126.19462600, 'IZIN', 'https://via.placeholder.com/640x480.png/00cc99?text=voluptatem', 'https://via.placeholder.com/640x480.png/002244?text=voluptatum', 'Vel impedit reiciendis saepe quas ut veritatis ea.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(31, 1, NULL, NULL, NULL, '2026-05-18', NULL, NULL, 21.70985600, -77.96243900, -36.12330000, -134.24589800, 'ALPA', NULL, 'https://via.placeholder.com/640x480.png/0066bb?text=labore', 'Occaecati explicabo magni qui iste ratione eligendi rerum.', '2026-06-05 01:22:26', '2026-06-05 01:22:26'),
(32, 2, NULL, NULL, NULL, '2026-06-12', NULL, NULL, NULL, NULL, NULL, NULL, 'IZIN', NULL, NULL, 'sakit merianga sagat sakit', '2026-06-12 06:44:23', '2026-06-12 06:44:23'),
(33, 2, NULL, NULL, NULL, '2026-06-13', NULL, NULL, NULL, NULL, NULL, NULL, 'IZIN', NULL, NULL, 'sakit merianga sagat sakit', '2026-06-12 06:44:23', '2026-06-12 06:44:23'),
(34, 2, NULL, NULL, NULL, '2026-06-14', NULL, NULL, NULL, NULL, NULL, NULL, 'IZIN', NULL, NULL, 'sakit merianga sagat sakit', '2026-06-12 06:44:23', '2026-06-12 06:44:23'),
(35, 2, NULL, NULL, NULL, '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, 'IZIN', NULL, NULL, 'sakit merianga sagat sakit', '2026-06-12 06:44:23', '2026-06-12 06:44:23'),
(36, 2, NULL, NULL, NULL, '2026-06-16', NULL, NULL, NULL, NULL, NULL, NULL, 'IZIN', NULL, NULL, 'sakit merianga sagat sakit', '2026-06-12 06:44:23', '2026-06-12 06:44:23'),
(37, 98, 1, 1, NULL, '2026-07-01', '11:19:49', NULL, -6.83180000, 107.17111200, NULL, NULL, 'TERLAMBAT', 'absensi/absen_manual_6a449565d9f0c.jpg', NULL, NULL, '2026-07-01 04:19:49', '2026-07-01 04:19:49');

-- --------------------------------------------------------

--
-- Struktur dari tabel `absensi_khusus`
--

CREATE TABLE `absensi_khusus` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` datetime NOT NULL,
  `jam_keluar` datetime DEFAULT NULL,
  `total_detik` int(11) NOT NULL DEFAULT 0,
  `status` enum('BERJALAN','DITUNDA','SELESAI') NOT NULL DEFAULT 'BERJALAN',
  `foto_masuk` varchar(255) DEFAULT NULL,
  `foto_keluar` varchar(255) DEFAULT NULL,
  `latitude_masuk` varchar(255) DEFAULT NULL,
  `longitude_masuk` varchar(255) DEFAULT NULL,
  `latitude_keluar` varchar(255) DEFAULT NULL,
  `longitude_keluar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `absensi_sensei`
--

CREATE TABLE `absensi_sensei` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kelas_sensei_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_keluar` time DEFAULT NULL,
  `status` enum('HADIR','TERLAMBAT','PULANG LEBIH AWAL','TIDAK ABSEN PULANG','ALPA','LIBUR') NOT NULL DEFAULT 'HADIR',
  `catatan` text DEFAULT NULL,
  `foto_masuk` varchar(255) DEFAULT NULL,
  `foto_pulang` varchar(255) DEFAULT NULL,
  `lat_masuk` decimal(10,8) DEFAULT NULL,
  `long_masuk` decimal(11,8) DEFAULT NULL,
  `lat_pulang` decimal(10,8) DEFAULT NULL,
  `long_pulang` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `absensi_sensei`
--

INSERT INTO `absensi_sensei` (`id`, `kelas_sensei_id`, `user_id`, `tanggal`, `jam_masuk`, `jam_keluar`, `status`, `catatan`, `foto_masuk`, `foto_pulang`, `lat_masuk`, `long_masuk`, `lat_pulang`, `long_pulang`, `created_at`, `updated_at`) VALUES
(1, 4, 97, '2026-07-01', '10:54:52', NULL, 'TERLAMBAT', NULL, 'absensi_sensei/masuk_6a448f8c37538.jpg', NULL, -6.83180000, 107.17111200, NULL, NULL, '2026-07-01 03:54:56', '2026-07-01 03:54:56'),
(2, 5, 2, '2026-07-01', '10:59:46', NULL, 'TERLAMBAT', NULL, 'absensi_sensei/masuk_6a4490b283c10.jpg', NULL, -6.83180000, 107.17111200, NULL, NULL, '2026-07-01 03:59:46', '2026-07-01 03:59:46');

-- --------------------------------------------------------

--
-- Struktur dari tabel `absensi_siswas`
--

CREATE TABLE `absensi_siswas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `siswa_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_keluar` time DEFAULT NULL,
  `status` enum('HADIR','TERLAMBAT','IZIN','SAKIT','ALPA','LIBUR') NOT NULL DEFAULT 'HADIR',
  `keterangan` text DEFAULT NULL,
  `foto_masuk` varchar(255) DEFAULT NULL,
  `foto_pulang` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `cabang_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `absensi_siswas`
--

INSERT INTO `absensi_siswas` (`id`, `siswa_id`, `tanggal`, `jam_masuk`, `jam_keluar`, `status`, `keterangan`, `foto_masuk`, `foto_pulang`, `created_at`, `updated_at`, `cabang_id`) VALUES
(1, 52, '2026-06-29', NULL, NULL, 'ALPA', NULL, NULL, NULL, '2026-07-01 06:34:54', '2026-07-01 06:43:16', NULL),
(2, 51, '2026-06-29', NULL, NULL, 'ALPA', NULL, NULL, NULL, '2026-07-01 06:34:57', '2026-07-01 06:43:12', NULL),
(3, 51, '2026-06-30', NULL, NULL, 'ALPA', NULL, NULL, NULL, '2026-07-01 06:38:38', '2026-07-01 06:43:15', NULL),
(4, 51, '2026-07-01', NULL, NULL, 'ALPA', NULL, NULL, NULL, '2026-07-01 06:47:07', '2026-07-01 06:47:07', NULL),
(5, 51, '2026-07-02', NULL, NULL, 'ALPA', NULL, NULL, NULL, '2026-07-01 06:47:10', '2026-07-01 06:47:10', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `agendas`
--

CREATE TABLE `agendas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `judul` varchar(255) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jam_mulai` time DEFAULT NULL,
  `jam_selesai` time DEFAULT NULL,
  `jam_absen_masuk` time DEFAULT NULL,
  `jam_absen_keluar` time DEFAULT NULL,
  `status` enum('terjadwal','selesai','dibatalkan') NOT NULL DEFAULT 'terjadwal',
  `status_absen` enum('terjadwal','hadir','selesai') NOT NULL DEFAULT 'terjadwal',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `assessment_categories`
--

CREATE TABLE `assessment_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `level` varchar(255) NOT NULL,
  `nama_kategori` varchar(255) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `assessment_categories`
--

INSERT INTO `assessment_categories` (`id`, `level`, `nama_kategori`, `urutan`, `created_at`, `updated_at`) VALUES
(1, '1', 'HIRAGANA KATAKANA', 1, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(2, '1', 'LEVEL 1', 2, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(5, '2', 'LEVEL 2', 1, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(6, '3', 'LEVEL 3', 1, '2026-07-01 09:46:47', '2026-07-01 09:46:47'),
(7, '4', 'LEVEL 4', 1, '2026-07-01 10:12:46', '2026-07-01 10:12:46');

-- --------------------------------------------------------

--
-- Struktur dari tabel `assessment_components`
--

CREATE TABLE `assessment_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `sub_komponen` varchar(255) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `assessment_components`
--

INSERT INTO `assessment_components` (`id`, `category_id`, `sub_komponen`, `urutan`, `created_at`, `updated_at`) VALUES
(1, 1, 'Menulis', 1, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(2, 1, 'Membaca', 2, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(3, 2, 'PR', 1, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(4, 2, 'Hafalan', 2, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(5, 2, 'Kanji', 3, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(6, 2, 'Ulangan', 4, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(7, 2, 'Shoukai', 5, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(8, 2, 'Translate', 6, '2026-07-01 07:51:39', '2026-07-01 07:51:39'),
(17, 5, 'PR', 1, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(18, 5, 'Hafalan', 2, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(19, 5, 'Kanji', 3, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(20, 5, 'Ulangan', 4, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(21, 5, 'Shoukai', 5, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(22, 5, 'Translate', 6, '2026-07-01 09:10:30', '2026-07-01 09:10:30'),
(23, 6, 'Kotoba', 1, '2026-07-01 09:46:47', '2026-07-01 09:46:47'),
(24, 6, 'Kanji', 2, '2026-07-01 09:46:47', '2026-07-01 09:46:47'),
(25, 6, 'Shoukai', 3, '2026-07-01 09:46:47', '2026-07-01 09:46:47'),
(26, 6, 'Translate', 4, '2026-07-01 09:46:47', '2026-07-01 09:46:47'),
(27, 7, 'Kotoba', 1, '2026-07-01 10:12:46', '2026-07-01 10:12:46'),
(28, 7, 'Jikoshoukai', 2, '2026-07-01 10:12:46', '2026-07-01 10:12:46'),
(29, 7, 'Simulasi 1', 3, '2026-07-01 10:12:46', '2026-07-01 10:12:46'),
(30, 7, 'Translate', 4, '2026-07-01 10:12:46', '2026-07-01 10:12:46');

-- --------------------------------------------------------

--
-- Struktur dari tabel `batches`
--

CREATE TABLE `batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_batch` varchar(100) NOT NULL,
  `status` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `batches`
--

INSERT INTO `batches` (`id`, `nama_batch`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Batch 12', 'AKTIF', '2026-06-30 07:54:12', '2026-06-30 07:54:12'),
(2, 'Batch 13', 'AKTIF', '2026-06-30 09:26:11', '2026-06-30 09:26:11');

-- --------------------------------------------------------

--
-- Struktur dari tabel `cabangs`
--

CREATE TABLE `cabangs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_cabang` varchar(255) NOT NULL,
  `status_pusat` enum('PUSAT','CABANG') NOT NULL DEFAULT 'CABANG',
  `alamat` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius` int(11) NOT NULL DEFAULT 100,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `kode_cabang` varchar(255) DEFAULT NULL,
  `barcode` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `cabangs`
--

INSERT INTO `cabangs` (`id`, `nama_cabang`, `status_pusat`, `alamat`, `latitude`, `longitude`, `radius`, `created_at`, `updated_at`, `kode_cabang`, `barcode`) VALUES
(1, 'Cianjur Selatan', 'CABANG', NULL, -6.83175127, 107.17113368, 100, '2026-06-05 01:24:44', '2026-06-05 01:24:44', 'CSL', NULL),
(2, 'Kantor Pusat', 'PUSAT', 'Cianjur sindang kasih', -6.83180000, 107.17111200, 100, '2026-06-30 07:48:00', '2026-06-30 07:48:00', 'PST', 'CAB-0C6ADB3FA7');

-- --------------------------------------------------------

--
-- Struktur dari tabel `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `divisis`
--

CREATE TABLE `divisis` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_divisi` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `kode_divisi` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `divisis`
--

INSERT INTO `divisis` (`id`, `nama_divisi`, `created_at`, `updated_at`, `kode_divisi`) VALUES
(1, 'IT', '2026-06-05 01:24:22', '2026-06-05 01:24:22', 'IT10');

-- --------------------------------------------------------

--
-- Struktur dari tabel `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `gurus`
--

CREATE TABLE `gurus` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `nip` varchar(255) DEFAULT NULL,
  `mata_pelajaran` varchar(255) DEFAULT NULL,
  `no_hp` varchar(255) DEFAULT NULL,
  `status` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `gurus`
--

INSERT INTO `gurus` (`id`, `user_id`, `nama`, `nip`, `mata_pelajaran`, `no_hp`, `status`, `created_at`, `updated_at`) VALUES
(2, 97, 'yusup', '20260002', NULL, '082118364415', 'AKTIF', '2026-07-01 03:53:46', '2026-07-01 03:53:46'),
(3, 2, 'Rian Purnama', '20260001', NULL, '082118364415', 'AKTIF', '2026-07-01 03:58:32', '2026-07-01 03:58:32'),
(4, 99, 'Andi', '19900002', NULL, '082118364415', 'AKTIF', '2026-07-01 09:49:55', '2026-07-01 09:49:55'),
(5, 98, 'Mark Noble', '19900001', NULL, '082118364415', 'AKTIF', '2026-07-01 10:17:37', '2026-07-01 10:17:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `hari_liburs`
--

CREATE TABLE `hari_liburs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `keterangan` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `izins`
--

CREATE TABLE `izins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `jenis_izin` enum('SAKIT','CUTI','IZIN') NOT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `alasan` text DEFAULT NULL,
  `lampiran` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `izins`
--

INSERT INTO `izins` (`id`, `user_id`, `jenis_izin`, `tgl_mulai`, `tgl_selesai`, `alasan`, `lampiran`, `status`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 2, 'SAKIT', '2026-06-12', '2026-06-16', 'sakit merianga sagat sakit', NULL, 'APPROVED', NULL, NULL, '2026-06-12 06:43:10', '2026-06-12 06:44:23'),
(2, 14, 'SAKIT', '2026-07-01', '2026-07-01', 'sakit parahh', NULL, 'REJECTED', NULL, NULL, '2026-07-01 06:07:12', '2026-07-01 08:08:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `izin_approvals`
--

CREATE TABLE `izin_approvals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `izin_id` bigint(20) UNSIGNED NOT NULL,
  `approved_by` bigint(20) UNSIGNED NOT NULL,
  `status` enum('APPROVED','REJECTED') NOT NULL,
  `catatan` text DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `izin_approvals`
--

INSERT INTO `izin_approvals` (`id`, `izin_id`, `approved_by`, `status`, `catatan`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'APPROVED', NULL, '2026-06-12 06:44:23', '2026-06-12 06:44:23', '2026-06-12 06:44:23'),
(2, 2, 1, 'REJECTED', 'NUB', '2026-07-01 08:08:14', '2026-07-01 08:08:14', '2026-07-01 08:08:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jadwal_kerjas`
--

CREATE TABLE `jadwal_kerjas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `karyawan_id` bigint(20) UNSIGNED NOT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
  `jam_masuk` time NOT NULL,
  `jam_keluar` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `karyawan`
--

CREATE TABLE `karyawan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `divisi_id` bigint(20) UNSIGNED NOT NULL,
  `nip` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `jabatan` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `no_hp` varchar(255) NOT NULL,
  `alamat` text DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `tanggal_masuk` date NOT NULL,
  `status_kerja` enum('TETAP','KONTRAK','MAGANG') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `kelas`
--

CREATE TABLE `kelas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_kelas` varchar(255) NOT NULL,
  `status` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kelas`
--

INSERT INTO `kelas` (`id`, `nama_kelas`, `status`, `created_at`, `updated_at`) VALUES
(1, 'HIROSE', 'AKTIF', '2026-06-30 07:36:49', '2026-06-30 07:36:49'),
(2, 'KELAS LARAVEL', 'AKTIF', '2026-06-30 09:14:25', '2026-06-30 09:14:25'),
(3, 'KELAS MYSQL', 'AKTIF', '2026-07-01 03:54:34', '2026-07-01 03:54:34'),
(4, 'KELASREACT JS', 'AKTIF', '2026-07-01 09:50:51', '2026-07-01 09:50:51'),
(5, 'KELAS GOLANG', 'AKTIF', '2026-07-01 10:18:39', '2026-07-01 10:18:39');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kelas_sensei`
--

CREATE TABLE `kelas_sensei` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_kelas` varchar(255) NOT NULL,
  `level` enum('1','2','3','4') NOT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `catatan` text DEFAULT NULL,
  `status` enum('aktif','selesai','dibatalkan') NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `batch_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kelas_sensei`
--

INSERT INTO `kelas_sensei` (`id`, `user_id`, `nama_kelas`, `level`, `tanggal_mulai`, `tanggal_selesai`, `catatan`, `status`, `created_at`, `updated_at`, `batch_id`) VALUES
(4, 97, 'KELAS MYSQL', '1', '2026-07-01', '2026-07-04', NULL, 'aktif', '2026-07-01 03:54:34', '2026-07-01 03:54:34', 2),
(5, 2, 'KELAS LARAVEL', '2', '2026-07-01', '2026-07-17', NULL, 'aktif', '2026-07-01 03:59:28', '2026-07-01 03:59:28', 1),
(6, 99, 'KELASREACT JS', '3', '2026-07-01', '2026-07-16', NULL, 'aktif', '2026-07-01 09:50:51', '2026-07-01 09:50:51', 2),
(7, 98, 'KELAS GOLANG', '4', '2026-07-01', '2026-07-10', NULL, 'aktif', '2026-07-01 10:18:39', '2026-07-01 10:18:39', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `lemburs`
--

CREATE TABLE `lemburs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `jam_masuk` datetime DEFAULT NULL,
  `jam_keluar` datetime DEFAULT NULL,
  `keterangan` text NOT NULL,
  `foto` varchar(255) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_12_15_095109_create_karyawans_table', 1),
(5, '2025_12_16_064752_create_divisis_table', 1),
(6, '2025_12_16_101254_create_jadwal_kerjas_table', 1),
(7, '2025_12_25_151149_create_shifts_table', 1),
(8, '2025_12_25_170018_create_cabangs_table', 1),
(9, '2026_01_23_105055_create_izins_table', 1),
(10, '2026_01_23_160456_create_izin_approvals_table', 1),
(11, '2026_01_23_164447_absensis', 1),
(12, '2026_01_28_110649_create_hari_liburs_table', 1),
(13, '2026_01_28_131500_add_remember_token_to_users_table', 1),
(14, '2026_02_14_174600_add_code_and_status_to_cabangs_table', 1),
(15, '2026_02_14_175046_add_kode_divisi_to_divisis_table', 1),
(16, '2026_02_14_180824_add_pegawai_fields_to_users_table', 1),
(17, '2026_02_16_134132_create_lemburs_table', 1),
(18, '2026_02_16_140854_add_hours_to_lemburs_table', 1),
(19, '2026_02_16_152943_create_tasks_table', 1),
(20, '2026_02_16_162809_change_cabang_id_to_json_in_users_table', 1),
(21, '2026_02_17_102453_create_projects_table', 1),
(22, '2026_02_17_102601_create_project_lists_table', 1),
(23, '2026_02_17_102704_create_task_assignments_table', 1),
(24, '2026_02_17_102734_create_project_activities_table', 1),
(25, '2026_02_18_091850_create_personal_access_tokens_table', 1),
(26, '2026_02_18_131021_add_belum_absen_to_status_in_absensis_table', 1),
(27, '2026_04_13_100000_create_kelas_sensei_table', 1),
(28, '2026_04_13_100001_create_absensi_sensei_table', 1),
(29, '2026_04_13_100002_add_lat_long_to_absensi_sensei_table', 1),
(30, '2026_04_13_100003_add_foto_to_absensi_sensei_table', 1),
(31, '2026_04_13_100004_add_status_alpha_libur_to_absensi_sensei_table', 1),
(32, '2026_04_17_000001_create_agendas_table', 1),
(33, '2026_04_23_111917_add_shift_ids_to_users_table', 1),
(34, '2026_04_23_120000_create_shift_jadwal_table', 1),
(35, '2026_04_29_000000_create_notification_settings_table', 1),
(36, '2026_05_11_054056_update_unique_constraint_absensis', 1),
(37, '2026_05_11_060000_update_unique_shift_jadwal', 1),
(38, '2026_05_11_155006_create_absensi_khusus_table', 1),
(39, '2026_05_11_165148_add_can_access_khusus_to_users_table', 1),
(40, '2026_05_14_000000_add_hari_libur_mingguan_to_users_table', 1),
(41, '2026_05_14_010000_add_is_libur_to_shift_jadwal_table', 1),
(42, '2026_05_25_000001_create_penilaian_settings_table', 1),
(43, '2026_05_25_000002_create_penilaians_table', 1),
(44, '2026_06_05_044849_create_pengaturan_shifts_table', 2),
(45, '2026_06_12_000001_create_wa_izin_approvals_table', 3),
(46, '2026_06_26_000001_create_siswas_table', 4),
(47, '2026_06_26_000002_create_absensi_siswas_table', 4),
(48, '2026_06_26_000002_drop_nis_from_siswas_table', 4),
(49, '2026_06_26_000003_add_siswa_role_to_users_table', 4),
(50, '2026_06_29_184838_add_shift_id_to_siswas_table', 4),
(51, '2026_06_29_195738_add_barcode_to_cabangs_table', 4),
(52, '2026_06_29_195738_add_cabang_id_to_absensi_siswas_table', 4),
(53, '2026_06_30_091836_create_kelas_table', 4),
(54, '2026_06_30_091838_add_kelas_id_to_siswas_table', 4),
(55, '2026_06_30_100000_create_gurus_table', 4),
(56, '2026_06_30_110000_add_guru_role_to_users_table', 4),
(57, '2026_06_30_132808_add_batch_to_siswas_table', 5),
(58, '2026_06_30_134845_add_level_to_siswas_table', 6),
(59, '2026_06_30_144802_create_batches_table', 7),
(60, '2026_06_30_144900_add_batch_id_to_siswas_table', 7),
(61, '2026_06_30_152611_add_batch_id_to_kelas_sensei_table', 8),
(62, '2026_07_01_143721_create_assessment_categories_table', 9),
(63, '2026_07_01_143722_create_assessment_components_table', 9),
(64, '2026_07_01_143722_create_student_assessments_table', 9),
(65, '2026_07_01_144833_update_assessment_tables_for_date', 10);

-- --------------------------------------------------------

--
-- Struktur dari tabel `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(255) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `notification_settings`
--

INSERT INTO `notification_settings` (`id`, `key`, `is_enabled`, `description`, `created_at`, `updated_at`) VALUES
(1, 'wa_hadir', 1, 'Notifikasi WA untuk status HADIR', '2026-06-05 01:18:09', '2026-06-05 01:18:09'),
(2, 'wa_terlambat', 1, 'Notifikasi WA untuk status TERLAMBAT', '2026-06-05 01:18:09', '2026-06-05 01:18:09'),
(3, 'wa_pulang_lebih_awal', 1, 'Notifikasi WA untuk status PULANG LEBIH AWAL', '2026-06-05 01:18:09', '2026-06-05 01:18:09'),
(4, 'wa_tidak_absen_pulang', 1, 'Notifikasi WA untuk status TIDAK ABSEN PULANG', '2026-06-05 01:18:09', '2026-06-05 01:18:09'),
(5, 'wa_alpa', 1, 'Notifikasi WA untuk status ALPA', '2026-06-05 01:18:09', '2026-06-05 01:18:09'),
(6, 'wa_reminder_belum_absen', 1, 'Notifikasi reminder belum absen (30 menit sebelum jam masuk)', '2026-06-05 01:18:09', '2026-06-05 01:18:09');

-- --------------------------------------------------------

--
-- Struktur dari tabel `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengaturan_shifts`
--

CREATE TABLE `pengaturan_shifts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `pengaturan_shifts`
--

INSERT INTO `pengaturan_shifts` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1, 'shift_mode', 'jadwal', '2026-06-05 02:50:43', '2026-06-05 02:53:03');

-- --------------------------------------------------------

--
-- Struktur dari tabel `penilaians`
--

CREATE TABLE `penilaians` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_siswa` varchar(255) NOT NULL,
  `kelas` varchar(255) DEFAULT NULL,
  `mata_pelajaran` varchar(255) DEFAULT NULL,
  `nilai` decimal(5,2) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `tanggal_penilaian` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `penilaian_settings`
--

CREATE TABLE `penilaian_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `divisi_id` bigint(20) UNSIGNED NOT NULL,
  `penilaian_aktif` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_proyek` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_deadline` date DEFAULT NULL,
  `status` enum('PERENCANAAN','BERJALAN','SELESAI','DITUNDA') NOT NULL DEFAULT 'PERENCANAAN',
  `manager_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `project_activities`
--

CREATE TABLE `project_activities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `jenis_aktivitas` varchar(255) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `project_lists`
--

CREATE TABLE `project_lists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `nama_list` varchar(255) NOT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('9ITbd2VCPa7zfknfxj8qRD6Fb0UwnJvG1DrmlxBs', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiNUMyT25PclBxTklOZml0c2Z5Y2dGWXN0ZzdMVTJwQ3pGeVVKR3V3NSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjY6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9ndXJ1IjtzOjU6InJvdXRlIjtzOjEwOiJndXJ1LmluZGV4Ijt9czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTt9', 1782901059),
('jeP6GBaMO4m5JHg0K5rpBBS5EaayfKEuCLIJ2iwJ', NULL, '127.0.0.1', 'curl/8.17.0', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoia2M0dTFRME1YbnBOcDJjbWtpOWN3N29HYXVDOEJNZWtsTkxJWmJDQiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1782892674),
('njPrwWgk0ksG5gND40KXsinh0mzAFpeAIoQJ0rhL', 98, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiRG1EUXdKa29tMzk3NWRwQWgzM1FDTTRZQjQ2azRzN2FhbzJpYmNjWiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NTY6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hYnNlbnNpL3Npc3dhL3BlbmlsYWlhbi10ZW1wbGF0ZS83IjtzOjU6InJvdXRlIjtzOjMyOiJhYnNlbnNpLnNpc3dhLnBlbmlsYWlhbi50ZW1wbGF0ZSI7fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjk4O30=', 1782901154);

-- --------------------------------------------------------

--
-- Struktur dari tabel `shifts`
--

CREATE TABLE `shifts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_shift` varchar(255) NOT NULL,
  `kode_shift` varchar(255) DEFAULT NULL,
  `jam_masuk` time NOT NULL,
  `jam_pulang` time NOT NULL,
  `total_jam` int(11) DEFAULT NULL,
  `toleransi` int(11) NOT NULL DEFAULT 15,
  `status` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `shifts`
--

INSERT INTO `shifts` (`id`, `nama_shift`, `kode_shift`, `jam_masuk`, `jam_pulang`, `total_jam`, `toleransi`, `status`, `keterangan`, `created_at`, `updated_at`) VALUES
(1, 'Dateng Pagi', 'DP-02', '08:25:00', '11:28:00', NULL, 15, 'AKTIF', NULL, '2026-06-05 01:25:09', '2026-06-05 01:25:09');

-- --------------------------------------------------------

--
-- Struktur dari tabel `shift_jadwal`
--

CREATE TABLE `shift_jadwal` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tanggal` date NOT NULL,
  `keterangan` text DEFAULT NULL,
  `is_libur` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `shift_jadwal`
--

INSERT INTO `shift_jadwal` (`id`, `user_id`, `shift_id`, `tanggal`, `keterangan`, `is_libur`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '2026-06-01', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(2, 2, 1, '2026-06-02', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(3, 2, 1, '2026-06-03', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(4, 2, 1, '2026-06-04', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(5, 2, 1, '2026-06-05', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(6, 2, 1, '2026-06-08', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(7, 2, 1, '2026-06-09', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(8, 2, 1, '2026-06-10', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(9, 2, 1, '2026-06-11', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(10, 2, 1, '2026-06-12', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(11, 2, 1, '2026-06-15', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(12, 2, 1, '2026-06-16', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(13, 2, 1, '2026-06-17', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(14, 2, 1, '2026-06-18', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(15, 2, 1, '2026-06-19', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(16, 2, 1, '2026-06-22', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(17, 2, 1, '2026-06-23', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(18, 2, 1, '2026-06-24', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(19, 2, 1, '2026-06-25', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(20, 2, 1, '2026-06-26', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(21, 2, 1, '2026-06-29', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14'),
(22, 2, 1, '2026-06-30', NULL, 0, '2026-06-05 01:27:14', '2026-06-05 01:27:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `siswas`
--

CREATE TABLE `siswas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  `kelas` varchar(255) NOT NULL,
  `batch` varchar(50) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `tempat_lahir` varchar(255) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `agama` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `no_hp` varchar(255) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `status` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `kelas_id` bigint(20) UNSIGNED DEFAULT NULL,
  `batch_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `siswas`
--

INSERT INTO `siswas` (`id`, `user_id`, `nama`, `kelas`, `batch`, `level`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `agama`, `alamat`, `no_hp`, `foto`, `status`, `created_at`, `updated_at`, `shift_id`, `kelas_id`, `batch_id`) VALUES
(40, 68, 'Agnia Nurjamil', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:32', '2026-06-30 10:03:19', 1, NULL, 1),
(41, 69, 'Alfarezy', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:32', '2026-06-30 10:03:19', 1, NULL, 1),
(42, 70, 'Doni Radja Muharom', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:32', '2026-06-30 10:03:19', 1, NULL, 1),
(43, 71, 'Fathul Arifin', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:32', '2026-06-30 10:03:19', 1, NULL, 1),
(44, 72, 'Firda Firdaus Safutri', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:33', '2026-06-30 10:03:19', 1, NULL, 1),
(45, 73, 'Galih Yudha Pratama', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:33', '2026-06-30 10:03:19', 1, NULL, 1),
(46, 74, 'Lutfi Nauval Ramadhan', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:33', '2026-06-30 10:03:19', 1, NULL, 1),
(47, 75, 'Muhammad As\'ad Nuropick', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:34', '2026-06-30 10:03:19', 1, NULL, 1),
(48, 76, 'Muhammad Zaidan Jamil', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:34', '2026-06-30 10:03:19', 1, NULL, 1),
(49, 77, 'Rima Mustika', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:34', '2026-06-30 10:03:19', 1, NULL, 1),
(50, 78, 'Sahrul Maulana', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:34', '2026-06-30 10:03:19', 1, NULL, 1),
(51, 79, 'Vinca Marsella Putri', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:35', '2026-06-30 10:03:19', 1, NULL, 1),
(52, 80, 'Yulia Andriani', '-', 'Batch 12', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 08:00:35', '2026-06-30 10:03:19', 1, NULL, 1),
(53, 81, 'Andi Suryana', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:52', '2026-06-30 10:03:19', 1, NULL, 2),
(54, 82, 'Fathur Nurrojab Suherman', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:53', '2026-06-30 10:03:19', 1, NULL, 2),
(55, 83, 'Hairun Nisak', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:53', '2026-06-30 10:03:19', 1, NULL, 2),
(56, 84, 'Jamilah', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:53', '2026-06-30 10:03:19', 1, NULL, 2),
(57, 85, 'Lidya Martianty', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:54', '2026-06-30 10:03:19', 1, NULL, 2),
(58, 86, 'M Faiz Al Azat', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:54', '2026-06-30 10:03:19', 1, NULL, 2),
(59, 87, 'Muhammad Ilyas Hardiansyah', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:54', '2026-06-30 10:03:19', 1, NULL, 2),
(60, 88, 'Radja Al Bazili Dahibatur Aries', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:54', '2026-06-30 10:03:19', 1, NULL, 2),
(61, 89, 'Rasyid Ridla Alkaramy', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:55', '2026-06-30 10:03:19', 1, NULL, 2),
(62, 90, 'Rifa Fauziah', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:55', '2026-06-30 10:03:19', 1, NULL, 2),
(63, 91, 'Rifki', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:55', '2026-06-30 10:03:19', 1, NULL, 2),
(64, 92, 'Sani Febriani', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:55', '2026-06-30 10:03:19', 1, NULL, 2),
(65, 93, 'Sasti Listiana', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:56', '2026-06-30 10:03:19', 1, NULL, 2),
(66, 94, 'Seftira Nurul Ramahani', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:56', '2026-06-30 10:03:19', 1, NULL, 2),
(67, 95, 'Siti Saodah', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:56', '2026-06-30 10:03:19', 1, NULL, 2),
(68, 96, 'Supian Nussauri', '-', 'Batch 13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AKTIF', '2026-06-30 09:26:57', '2026-06-30 10:03:19', 1, NULL, 2);

-- --------------------------------------------------------

--
-- Struktur dari tabel `student_assessments`
--

CREATE TABLE `student_assessments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `siswa_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `nilai` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `student_assessments`
--

INSERT INTO `student_assessments` (`id`, `component_id`, `siswa_id`, `batch_id`, `user_id`, `tanggal`, `nilai`, `created_at`, `updated_at`) VALUES
(1, 1, 53, 2, 2, '2026-06-29', 33.00, '2026-07-01 08:03:41', '2026-07-01 08:03:41'),
(2, 2, 53, 2, 2, '2026-06-29', 33.00, '2026-07-01 08:03:41', '2026-07-01 08:03:41'),
(3, 3, 53, 2, 2, '2026-06-29', 44.00, '2026-07-01 08:04:00', '2026-07-01 08:04:00'),
(4, 4, 53, 2, 2, '2026-06-29', 44.00, '2026-07-01 08:04:00', '2026-07-01 08:04:00'),
(5, 5, 53, 2, 2, '2026-06-29', 44.00, '2026-07-01 08:04:00', '2026-07-01 08:04:00'),
(6, 6, 53, 2, 2, '2026-06-29', 55.00, '2026-07-01 08:04:00', '2026-07-01 08:04:00'),
(7, 7, 53, 2, 2, '2026-06-29', 55.00, '2026-07-01 08:04:00', '2026-07-01 08:04:00'),
(8, 8, 53, 2, 2, '2026-06-29', 55.00, '2026-07-01 08:04:00', '2026-07-01 08:04:00'),
(9, 1, 53, 2, 2, '2026-06-30', 66.00, '2026-07-01 08:24:22', '2026-07-01 08:24:22'),
(10, 2, 53, 2, 2, '2026-06-30', 66.00, '2026-07-01 08:24:22', '2026-07-01 08:24:22'),
(11, 3, 53, 2, 2, '2026-06-30', 99.00, '2026-07-01 08:24:38', '2026-07-01 08:24:38'),
(12, 4, 53, 2, 2, '2026-06-30', 99.00, '2026-07-01 08:24:38', '2026-07-01 08:24:38'),
(13, 5, 53, 2, 2, '2026-06-30', 99.00, '2026-07-01 08:24:38', '2026-07-01 08:24:38'),
(14, 6, 53, 2, 2, '2026-06-30', 99.00, '2026-07-01 08:24:38', '2026-07-01 08:24:38'),
(15, 7, 53, 2, 2, '2026-06-30', 99.00, '2026-07-01 08:24:38', '2026-07-01 08:24:38'),
(16, 8, 53, 2, 2, '2026-06-30', 99.00, '2026-07-01 08:24:38', '2026-07-01 08:24:38'),
(17, 17, 40, 1, 2, '2026-06-29', 22.00, '2026-07-01 09:12:39', '2026-07-01 09:12:39'),
(18, 18, 40, 1, 2, '2026-06-29', 22.00, '2026-07-01 09:12:39', '2026-07-01 09:12:39'),
(19, 19, 40, 1, 2, '2026-06-29', 22.00, '2026-07-01 09:12:39', '2026-07-01 09:12:39'),
(20, 20, 40, 1, 2, '2026-06-29', 22.00, '2026-07-01 09:12:39', '2026-07-01 09:12:39'),
(21, 21, 40, 1, 2, '2026-06-29', 22.00, '2026-07-01 09:12:39', '2026-07-01 09:12:39'),
(22, 22, 40, 1, 2, '2026-06-29', 22.00, '2026-07-01 09:12:39', '2026-07-01 09:12:39'),
(23, 17, 40, 1, 2, '2026-06-30', 88.00, '2026-07-01 09:44:28', '2026-07-01 09:44:28'),
(24, 18, 40, 1, 2, '2026-06-30', 88.00, '2026-07-01 09:44:28', '2026-07-01 09:44:28'),
(25, 19, 40, 1, 2, '2026-06-30', 88.00, '2026-07-01 09:44:28', '2026-07-01 09:44:28'),
(26, 20, 40, 1, 2, '2026-06-30', 88.00, '2026-07-01 09:44:28', '2026-07-01 09:44:28'),
(27, 21, 40, 1, 2, '2026-06-30', 88.00, '2026-07-01 09:44:28', '2026-07-01 09:44:28'),
(28, 22, 40, 1, 2, '2026-06-30', 88.00, '2026-07-01 09:44:28', '2026-07-01 09:44:28');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tasks`
--

CREATE TABLE `tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_list_id` bigint(20) UNSIGNED NOT NULL,
  `judul_tugas` varchar(255) NOT NULL,
  `deskripsi_tugas` text DEFAULT NULL,
  `prioritas` enum('RENDAH','SEDANG','TINGGI','DARURAT') NOT NULL DEFAULT 'SEDANG',
  `tgl_mulai_tugas` date DEFAULT NULL,
  `tgl_selesai_tugas` date DEFAULT NULL,
  `urutan_kartu` int(11) NOT NULL DEFAULT 0,
  `is_selesai` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `task_assignments`
--

CREATE TABLE `task_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `pendidikan_terakhir` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `role` enum('HR','MANAGER','KARYAWAN','SISWA','GURU') NOT NULL DEFAULT 'KARYAWAN',
  `status` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  `can_access_khusus` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `divisi_id` bigint(20) UNSIGNED DEFAULT NULL,
  `cabang_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cabang_ids`)),
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shift_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`shift_ids`)),
  `hari_libur_mingguan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`hari_libur_mingguan`)),
  `nip` varchar(255) DEFAULT NULL,
  `jabatan` varchar(255) DEFAULT NULL,
  `no_hp` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `tanggal_masuk` date DEFAULT NULL,
  `status_kerja` enum('TETAP','KONTRAK','MAGANG') DEFAULT NULL,
  `face_embedding` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`face_embedding`)),
  `foto_ktp` varchar(255) DEFAULT NULL,
  `foto_ijazah` varchar(255) DEFAULT NULL,
  `foto_kk` varchar(255) DEFAULT NULL,
  `cv_file` varchar(255) DEFAULT NULL,
  `sertifikat_file` varchar(255) DEFAULT NULL,
  `tempat_lahir` varchar(255) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `agama` enum('ISLAM','KRISTEN','KATOLIK','HINDU','BUDDHA','KONGHUCU') DEFAULT NULL,
  `status_pernikahan` enum('BELUM MENIKAH','MENIKAH','CERAI') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `nik` varchar(16) DEFAULT NULL COMMENT 'Nomor KTP'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `pendidikan_terakhir`, `password`, `remember_token`, `role`, `status`, `can_access_khusus`, `last_login`, `divisi_id`, `cabang_ids`, `shift_id`, `shift_ids`, `hari_libur_mingguan`, `nip`, `jabatan`, `no_hp`, `alamat`, `foto_profil`, `tanggal_masuk`, `status_kerja`, `face_embedding`, `foto_ktp`, `foto_ijazah`, `foto_kk`, `cv_file`, `sertifikat_file`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `status_pernikahan`, `created_at`, `updated_at`, `nik`) VALUES
(1, 'Manager Utama', 'manager@mendunia.com', NULL, '$2y$12$R/d.FGaas/oaIKZPjyZanesGHWr6BwJ8ekOoTgDuzU6VDdFSnhOeO', 'lmn0C79r9f99aAVSVATuth7Ex9vgLAfLiTFCSkdTCnyuirWvm0MaucLDLfG3', 'MANAGER', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-05 01:22:25', '2026-06-05 01:22:25', NULL),
(2, 'Rian Purnama', 'rianprnma7@gmail.com', 'D3', '$2y$12$pVvu.yY0IyX/4KY2XPjdzeTQn.N.gyHhv8y3B4lJWNihpPxrEoOra', '4q62I5RkrvXvJqHyuSWwnwPX6xb1kYSQVDJdzY9zydeZnl5qdE9t1ZCdJ3zp', 'GURU', 'AKTIF', 0, NULL, 1, '[\"1\"]', NULL, '[\"1\"]', NULL, '20260001', 'Manager Cabang', '082118364415', 'kp.Tegal gombong', NULL, '2026-06-10', 'TETAP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'L', 'KRISTEN', NULL, '2026-06-05 01:26:34', '2026-06-30 05:07:01', '3203190607060003'),
(3, 'Agnia Nurjamil', 'agnianurjamil@mendunia.id', NULL, '$2y$12$SwsoZ5K/pkqKzJKWB1AKQemsrGVQAnTPMROXJPdPV0gdm9un25SHe', 'ew5Qv0S0yupYoSkic6Jink9EMoMn9M2xIPIvUDHncsxhSpdQ6byBrwYgeu1b', 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:22', '2026-06-30 06:22:22', NULL),
(4, 'Alfarezy', 'alfarezy@mendunia.id', NULL, '$2y$12$jutiDmn2BPADYDvyroZqQeaBqrVd.X4w73jyf3TGq72Rbek.feQBa', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:22', '2026-06-30 06:22:22', NULL),
(5, 'Doni Radja Muharom', 'doniradjamuharom@mendunia.id', NULL, '$2y$12$032M6D2Mqwn7wJiqKs1GK.Bc.pJ/8f3fij6Cbwjfde35V1QLKMgFe', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:22', '2026-06-30 06:22:22', NULL),
(6, 'Fathul Arifin', 'fathularifin@mendunia.id', NULL, '$2y$12$qW5ijZAFY6U8xfd.P/gTM.zQb4XE9P81bvGk63oB9P2RIkU1HYNem', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:23', '2026-06-30 06:22:23', NULL),
(7, 'Firda Firdaus Safutri', 'firdafirdaussafutri@mendunia.id', NULL, '$2y$12$2cP.lHdkd62joSMsjb//aOkPbm.qe2rP8lN0.R9JjqLxmKlbH2zI.', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:23', '2026-06-30 06:22:23', NULL),
(8, 'Galih Yudha Pratama', 'galihyudhapratama@mendunia.id', NULL, '$2y$12$Qt/grMrQppeBv/8/qhvHBO6jq4zJlgPLR1V68Vn6QAGmca9OPwBlC', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:23', '2026-06-30 06:22:23', NULL),
(9, 'Lutfi Nauval Ramadhan', 'lutfinauvalramadhan@mendunia.id', NULL, '$2y$12$do2NEhTqLErbofm7gkalI.qiVXdy9D8p/cD1KPfk1fJgIaBXCacmG', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:24', '2026-06-30 06:22:24', NULL),
(10, 'Muhammad As\'ad Nuropick', 'muhammadasadnuropick@mendunia.id', NULL, '$2y$12$tbImNcUvLIP5nUTEawxic.gv8hAHXeQuUK0Twtdb6JnkMpdTk0QyC', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:24', '2026-06-30 06:22:24', NULL),
(11, 'Muhammad Zaidan Jamil', 'muhammadzaidanjamil@mendunia.id', NULL, '$2y$12$5rAIuG.C7bvZQoSc0VYQw./gvrIdx6qAL5XgEHG.IQ74E1xk3VizS', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:24', '2026-06-30 06:22:24', NULL),
(12, 'Rima Mustika', 'rimamustika@mendunia.id', NULL, '$2y$12$vGZfpp9rrVZda.F/kK415.zcZypZjpn8lalg53Bwanrhq7vG99gtW', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:24', '2026-06-30 06:22:24', NULL),
(13, 'Sahrul Maulana', 'sahrulmaulana@mendunia.id', NULL, '$2y$12$NTsnwFWYBqQEwoUk57QWTeEH9NtDsxZtIlRPOJv3Z4GHKtYeU4TPq', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:25', '2026-06-30 06:22:25', NULL),
(14, 'Vinca Marsella Putri', 'vincamarsellaputri@mendunia.id', NULL, '$2y$12$9XRhq4lkOxGcoZEj3XAaWu7IcQSg4nxmuRiXVxT5ULgAQ3aYTf9LW', 'gQ7kK1uH3St7098IFfCEqSIoAmmpZ7AAY1M07kAnH8JcVxtUctt211Q9h2LV', 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:25', '2026-06-30 06:22:25', NULL),
(15, 'Yulia Andriani', 'yuliaandriani@mendunia.id', NULL, '$2y$12$CDfgtsj6va11xYSsrPU0Y.95biD8pWpWpp1Wkka.81aArcvrFsBcO', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:22:25', '2026-06-30 06:22:25', NULL),
(16, 'Agnia Nurjamil', '1-agnianurjamil@mendunia.id', NULL, '$2y$12$w7jA5n.pRR3/2S1J.0Oh0.2RhkMkav7L6L/SBddOijzbby9a7TG3i', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:09', '2026-06-30 06:23:09', NULL),
(17, 'Alfarezy', '1-alfarezy@mendunia.id', NULL, '$2y$12$x1dBgrO0fw5RdCTsEMQrNeUX2mtcdLLxIHz2ceBmIq1oanvTs2J/G', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:09', '2026-06-30 06:23:09', NULL),
(18, 'Doni Radja Muharom', '1-doniradjamuharom@mendunia.id', NULL, '$2y$12$FCVo61wCi9H0lrbJ0Cndcee2Ml4XdA2jtya/UxGJnWX2d.i2KHXCm', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:10', '2026-06-30 06:23:10', NULL),
(19, 'Fathul Arifin', '1-fathularifin@mendunia.id', NULL, '$2y$12$qaardJOD0TxhBtqIgYA2lueFG3bj2zTATROfvmAqr0Xa70UFSA3wm', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:10', '2026-06-30 06:23:10', NULL),
(20, 'Firda Firdaus Safutri', '1-firdafirdaussafutri@mendunia.id', NULL, '$2y$12$9k6xqi2Jb2MeW391OKVzMO1Ffzyi/nLqmw/.EbJlnHcrn0juYbdSe', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:10', '2026-06-30 06:23:10', NULL),
(21, 'Galih Yudha Pratama', '1-galihyudhapratama@mendunia.id', NULL, '$2y$12$b9nR8i/wyf3ZEOt51QaQfO8de2X/GGNFXd8QDf0LdiTNJk1QlE6gW', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:10', '2026-06-30 06:23:10', NULL),
(22, 'Lutfi Nauval Ramadhan', '1-lutfinauvalramadhan@mendunia.id', NULL, '$2y$12$zsFRvEHhB6rNoOYJ3tR0yuRfC9p1RSSBwzvEn5zoIWXAXXSf4/dd6', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:11', '2026-06-30 06:23:11', NULL),
(23, 'Muhammad As\'ad Nuropick', '1-muhammadasadnuropick@mendunia.id', NULL, '$2y$12$EHKfPGAkdsuRFRE4o1neIOV/gbPibFUnpOu7hdRgfQD4Tv/EVG9Pm', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:11', '2026-06-30 06:23:11', NULL),
(24, 'Muhammad Zaidan Jamil', '1-muhammadzaidanjamil@mendunia.id', NULL, '$2y$12$Sx9Ka13hVkluZ8eC0K6UEe3GM3YNz1esl7SQx7b8GbF1BIOy2Eawq', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:11', '2026-06-30 06:23:11', NULL),
(25, 'Rima Mustika', '1-rimamustika@mendunia.id', NULL, '$2y$12$vTQ6oRHLunf23r3XFH4cq.e.pog6ahl/7vsE5bO.1fA3kyBMVw.iS', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:12', '2026-06-30 06:23:12', NULL),
(26, 'Sahrul Maulana', '1-sahrulmaulana@mendunia.id', NULL, '$2y$12$Mb5mUrpveQey7SJ8qegox.OI8UZPEySDQlXnzAiV2CpMow38tsiEK', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:12', '2026-06-30 06:23:12', NULL),
(27, 'Vinca Marsella Putri', '1-vincamarsellaputri@mendunia.id', NULL, '$2y$12$3zDM59vI4rQFLjTC9/VJF.PPcnkEplyTSuOI75jkcvUOZpisV1zXi', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:12', '2026-06-30 06:23:12', NULL),
(28, 'Yulia Andriani', '1-yuliaandriani@mendunia.id', NULL, '$2y$12$PZNWKa/Q4OVYqqdHemHrG.jP4wisH4uBoZrTavVAJ3mqDPxr6rJL6', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:23:12', '2026-06-30 06:23:12', NULL),
(29, 'Agnia Nurjamil', '2-agnianurjamil@mendunia.id', NULL, '$2y$12$ThkXvL4YgyQ5Hsh85BB5e.ZrzPXZXZjf/N2X4farRq0lHry.E.bT2', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:36', '2026-06-30 06:26:36', NULL),
(30, 'Alfarezy', '2-alfarezy@mendunia.id', NULL, '$2y$12$lO6gkxFv6Sq8v9E/oxc.1unHgxNNTmnBo/KXW40HWG5OmaGGnHEzS', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:37', '2026-06-30 06:26:37', NULL),
(31, 'Doni Radja Muharom', '2-doniradjamuharom@mendunia.id', NULL, '$2y$12$1k4OJKRSx5uKtrX/H4AZp.iyWv3wBsLgVozbsY0l5vxdxfBRrOAje', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:37', '2026-06-30 06:26:37', NULL),
(32, 'Fathul Arifin', '2-fathularifin@mendunia.id', NULL, '$2y$12$/4XFdQ4Ieuc0/KrQitXzquIpHwiXY9x2Goc9BSezjyIe5z8bSp9Q2', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:37', '2026-06-30 06:26:37', NULL),
(33, 'Firda Firdaus Safutri', '2-firdafirdaussafutri@mendunia.id', NULL, '$2y$12$Iul8u53cfuLQUmsVksj5hO0A1b95kSB3Xx8nk5Yit/fynE2XN/NRa', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:38', '2026-06-30 06:26:38', NULL),
(34, 'Galih Yudha Pratama', '2-galihyudhapratama@mendunia.id', NULL, '$2y$12$QbmpYn.s0H/eIo2gaWPWCuFFUsKSlHmuivsD0n4N28q251fPJ0GKu', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:38', '2026-06-30 06:26:38', NULL),
(35, 'Lutfi Nauval Ramadhan', '2-lutfinauvalramadhan@mendunia.id', NULL, '$2y$12$b3024ES5zKy7136ZlbUKcu1Q.tfFzLugWJRrAI254/Gy/LiARnOVq', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:38', '2026-06-30 06:26:38', NULL),
(36, 'Muhammad As\'ad Nuropick', '2-muhammadasadnuropick@mendunia.id', NULL, '$2y$12$vr5crk6b.ZJwIzBlW.4x0O3AeFNZVK6V9AwKJunOcvgjsNrXs2uS.', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:38', '2026-06-30 06:26:38', NULL),
(37, 'Muhammad Zaidan Jamil', '2-muhammadzaidanjamil@mendunia.id', NULL, '$2y$12$lqpBMN3hnkaKiBTxfXY5X.PirrTr.TNriPFv2TWyfEZ6uXQzWG/zi', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:39', '2026-06-30 06:26:39', NULL),
(38, 'Rima Mustika', '2-rimamustika@mendunia.id', NULL, '$2y$12$H3o4J8QgysbwFZq6y4ZMO./BvIplQDY9DP99vffDjlAqV/1XsToUu', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:39', '2026-06-30 06:26:39', NULL),
(39, 'Sahrul Maulana', '2-sahrulmaulana@mendunia.id', NULL, '$2y$12$Z0CWuuYUcif3SnAq9yfWLeXlCuLzN95.m7jD0HdcAjf2CRxkEL6eu', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:39', '2026-06-30 06:26:39', NULL),
(40, 'Vinca Marsella Putri', '2-vincamarsellaputri@mendunia.id', NULL, '$2y$12$aYj/UYoWwfJc0WbzF.xS6u/00zz5tSpubZ1Hz5cJSVQgrM7wXJ1d.', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:40', '2026-06-30 06:26:40', NULL),
(41, 'Yulia Andriani', '2-yuliaandriani@mendunia.id', NULL, '$2y$12$iQGN8iBq/qTJPJeNFHOxL.jp7CCncLdJl33tnrVI9mFqEoPXfmNnK', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:26:40', '2026-06-30 06:26:40', NULL),
(53, 'Vinca Marsella Putri', '3-vincamarsellaputri@mendunia.id', NULL, '$2y$12$mwOcEJU.oy9Rvlc2dlEl5eXlGDaG5HB8w1qALRaeIvshUFgbundCi', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 06:34:43', '2026-06-30 06:34:43', NULL),
(68, 'Agnia Nurjamil', '3-agnianurjamil@mendunia.id', NULL, '$2y$12$FqW3LP/sdbddc1hFeoesSu2aXfE6QXuZcIx9kC0FAnovvNYAX/Lqe', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:32', '2026-06-30 08:00:32', NULL),
(69, 'Alfarezy', '3-alfarezy@mendunia.id', NULL, '$2y$12$Lq5bZ6dr4pKofKFYHUyWLOfmY2keBfaZXAqhhmba1zIGqQYA9HLHi', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:32', '2026-06-30 08:00:32', NULL),
(70, 'Doni Radja Muharom', '3-doniradjamuharom@mendunia.id', NULL, '$2y$12$hFe/.cpcUMC52llY5TkaQunZtNcK4LiMNO2ac/3NcsL1T8IACj5YO', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:32', '2026-06-30 08:00:32', NULL),
(71, 'Fathul Arifin', '3-fathularifin@mendunia.id', NULL, '$2y$12$f4MQ3RDWECyCAMJCMZWd/ObKnEqOIj761.ksLDRS7/8bUMQSGvj7u', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:32', '2026-06-30 08:00:32', NULL),
(72, 'Firda Firdaus Safutri', '3-firdafirdaussafutri@mendunia.id', NULL, '$2y$12$w1Q2P/M2PxfuIEwSJ6qCOuzg8eF6dtNBCCUBnUaT/UimDvNrIxQWW', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:33', '2026-06-30 08:00:33', NULL),
(73, 'Galih Yudha Pratama', '3-galihyudhapratama@mendunia.id', NULL, '$2y$12$3pz9ui/1dhXfAJi65fPt5.PsFwCRCF2YO3MAKvxbxlcKJOGvMF.4O', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:33', '2026-06-30 08:00:33', NULL),
(74, 'Lutfi Nauval Ramadhan', '3-lutfinauvalramadhan@mendunia.id', NULL, '$2y$12$HtpjP2hezn0sii8B5v5NGeMfoGwFgUi1mwlkcm1Y9ELFcZT.SyWci', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:33', '2026-06-30 08:00:33', NULL),
(75, 'Muhammad As\'ad Nuropick', '3-muhammadasadnuropick@mendunia.id', NULL, '$2y$12$dEmr091UzvCDsTSUPCPcW.5XhW2SLZivEre.oYAGXkCTWmRtm6opC', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:34', '2026-06-30 08:00:34', NULL),
(76, 'Muhammad Zaidan Jamil', '3-muhammadzaidanjamil@mendunia.id', NULL, '$2y$12$9QPl4wq8x4kuv2K79yaJkOHLbSzeEvy3LjE6tpT0IHwmZZE9g0NXW', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:34', '2026-06-30 08:00:34', NULL),
(77, 'Rima Mustika', '3-rimamustika@mendunia.id', NULL, '$2y$12$5W7V.mVCA3YWKCYWh1xC/uGfx8QGocsKevihsV.pKubkAH8u6O8nW', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:34', '2026-06-30 08:00:34', NULL),
(78, 'Sahrul Maulana', '3-sahrulmaulana@mendunia.id', NULL, '$2y$12$EMC60GjwXhQSBpkJ/cTNlOHVntsrg.3IgEfsVO00.CazF2ZhNvrMG', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:34', '2026-06-30 08:00:34', NULL),
(79, 'Vinca Marsella Putri', '4-vincamarsellaputri@mendunia.id', NULL, '$2y$12$IQ1Wet5jAQIfItEUXHVE4.xrxo6dUH7zWQjzTOq9wS7Gtbc3KWCsK', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:35', '2026-06-30 08:00:35', NULL),
(80, 'Yulia Andriani', '3-yuliaandriani@mendunia.id', NULL, '$2y$12$OH6CINjDtlAm45qTalZrYu.AWtSiFb3/odzvro4RfLVxYFa1nDpd6', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 08:00:35', '2026-06-30 08:00:35', NULL),
(81, 'Andi Suryana', 'andisuryana@mendunia.id', NULL, '$2y$12$fniOWNrZfIcb3BOiT72ub.25uw3jmXIyy99RbQIb.0KEzNnGOBvR2', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:52', '2026-06-30 09:26:52', NULL),
(82, 'Fathur Nurrojab Suherman', 'fathurnurrojabsuherman@mendunia.id', NULL, '$2y$12$59/QuGIWBrHD7SXenXXJCOjSXc8RkaIAC/ds7Tjqh8US/qiCB85ju', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:53', '2026-06-30 09:26:53', NULL),
(83, 'Hairun Nisak', 'hairunnisak@mendunia.id', NULL, '$2y$12$haeP.Qfcv5Rn.cpw3kHyt.bCeUmAVZ6UJPAFZh1I8yfV.7wSC21fG', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:53', '2026-06-30 09:26:53', NULL),
(84, 'Jamilah', 'jamilah@mendunia.id', NULL, '$2y$12$mBPD8A11tjHTXV/bl3dN8egaVjbgbfL0YH0dKFF.rybqT/o1.JiZ2', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:53', '2026-06-30 09:26:53', NULL),
(85, 'Lidya Martianty', 'lidyamartianty@mendunia.id', NULL, '$2y$12$uniCJWZEA.KGlIpTWu4r0uNhCGxTGGgUtVkifkO2J.JXeORlsnJGe', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:53', '2026-06-30 09:26:53', NULL),
(86, 'M Faiz Al Azat', 'mfaizalazat@mendunia.id', NULL, '$2y$12$o3s2sd6TG5ZW4nrBbIQT2ew2/aP/otzIjmzBFm.gKPHJmLeB5JPx.', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:54', '2026-06-30 09:26:54', NULL),
(87, 'Muhammad Ilyas Hardiansyah', 'muhammadilyashardiansyah@mendunia.id', NULL, '$2y$12$16yponcISWOqNTvAPeAq9OeEGH22q10FVNtL9UR67gV2P4BbiRgV.', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:54', '2026-06-30 09:26:54', NULL),
(88, 'Radja Al Bazili Dahibatur Aries', 'radjaalbazilidahibaturaries@mendunia.id', NULL, '$2y$12$x05SX3WtJcae2PAH787zeu7ixblBHoCzyqfIonUUoPiSogxK9TyzW', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:54', '2026-06-30 09:26:54', NULL),
(89, 'Rasyid Ridla Alkaramy', 'rasyidridlaalkaramy@mendunia.id', NULL, '$2y$12$s55EUEXyXFw8M/ThBdmdZuD8Ob2FGRJ2EIu08NaJM5RGvTAP9UJ7e', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:55', '2026-06-30 09:26:55', NULL),
(90, 'Rifa Fauziah', 'rifafauziah@mendunia.id', NULL, '$2y$12$oe8AfmCznWdCtZBaWsqhlukgAiF.vpvtX4/ByuoDAHPsTrdW/RZj6', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:55', '2026-06-30 09:26:55', NULL),
(91, 'Rifki', 'rifki@mendunia.id', NULL, '$2y$12$S0sVRU8UCYcZTMNE4AGFT.eFB486.lFiHw1jTGPREei6EvHSL5ulG', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:55', '2026-06-30 09:26:55', NULL),
(92, 'Sani Febriani', 'sanifebriani@mendunia.id', NULL, '$2y$12$6JD0HFBOJV1qrmqShFv/weT27RGHNdY.dZSaIRpFAQrqqMiGK3eUS', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:55', '2026-06-30 09:26:55', NULL),
(93, 'Sasti Listiana', 'sastilistiana@mendunia.id', NULL, '$2y$12$q.48TH/p9psQxEwikAThYONhCLPlpQOYN6rvPeV1CL1eoaX7SxKaO', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:56', '2026-06-30 09:26:56', NULL),
(94, 'Seftira Nurul Ramahani', 'seftiranurulramahani@mendunia.id', NULL, '$2y$12$WeKx5SVKou2nAVFmVq3cxu4nmHci0IfzfhI8sJiU9wjvSnWs0L4aS', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:56', '2026-06-30 09:26:56', NULL),
(95, 'Siti Saodah', 'sitisaodah@mendunia.id', NULL, '$2y$12$LePu8TqMId.GfCJC6dorxuzGosa/baNKtbnjpdPS6xW2UNXMOx9l2', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:56', '2026-06-30 09:26:56', NULL),
(96, 'Supian Nussauri', 'supiannussauri@mendunia.id', NULL, '$2y$12$hLOJW7ioVkWIaRQ4PqZKZ.ppPjPV3J0eThz2PYYnCW.YUykqFL.I2', NULL, 'SISWA', 'AKTIF', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 09:26:57', '2026-06-30 09:26:57', NULL),
(97, 'yusup', 'yusup@gmail.com', 'SMP/MTS', '$2y$12$ci5Lf3Q1MlJapS8Q3yTS7uVQldX0EdnALK0KHWeonguzEjuU8f7fS', 'mLirv5cuhjScsFLOuxmpp7DPIcQ9YgRvwvJjXHH4kd40QVFA0AGcswPYJOPE', 'GURU', 'AKTIF', 0, NULL, 1, '[\"2\"]', NULL, '[\"1\"]', NULL, '20260002', 'IT STAFF', '082118364415', NULL, NULL, '2026-04-15', 'TETAP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'L', 'KRISTEN', NULL, '2026-07-01 03:42:39', '2026-07-01 03:53:46', '3203190695969993'),
(98, 'Mark Noble', 'mark@gmail.com', 'S2', '$2y$12$dx9D1241W4YDIuLy5riC3.Zn036zXMQBOhcyp2agbfDnmFHnMFDhe', 'm1qWoJtiAFYrydIdSFGjY1ekTkzAzd8XHgQJerel4K7sc48DCrmBygkksZh1', 'GURU', 'AKTIF', 0, NULL, 1, '[\"1\"]', NULL, '[\"1\"]', NULL, '19900001', 'MARKETING', '082118364415', 'Quis natus exercitat', NULL, '1990-08-20', 'KONTRAK', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'L', 'KATOLIK', NULL, '2026-07-01 04:09:20', '2026-07-01 10:17:37', '2222222222222222'),
(99, 'Andi', 'andi@gmail.com', 'SD/MI', '$2y$12$sRMxuezQIVLG5UAlJrsOV.VlaKj7dPzRIlWqGF2BCBdtFqvMKcyfG', 'ZyJBXKxHPpugoMbxCqNbcPodQx3qMGfuLb5ERUTFnHK31oTBOVwu4dEjrpzq', 'GURU', 'AKTIF', 0, NULL, 1, '[\"2\"]', NULL, '[\"1\"]', NULL, '19900002', 'MARKETING', '082118364415', NULL, NULL, '1990-08-20', 'TETAP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'L', 'ISLAM', NULL, '2026-07-01 09:49:33', '2026-07-01 09:49:55', '2222222222222223');

-- --------------------------------------------------------

--
-- Struktur dari tabel `wa_izin_approvals`
--

CREATE TABLE `wa_izin_approvals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `izin_id` bigint(20) UNSIGNED NOT NULL,
  `manager_phone` varchar(20) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `wa_izin_approvals`
--

INSERT INTO `wa_izin_approvals` (`id`, `izin_id`, `manager_phone`, `status`, `replied_at`, `created_at`, `updated_at`) VALUES
(1, 2, '6285773141623', 'PENDING', NULL, '2026-07-01 06:07:12', '2026-07-01 06:07:12');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `absensis`
--
ALTER TABLE `absensis`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `absensis_user_id_tanggal_shift_id_unique` (`user_id`,`tanggal`,`shift_id`),
  ADD KEY `absensis_shift_id_foreign` (`shift_id`),
  ADD KEY `absensis_cabang_id_foreign` (`cabang_id`),
  ADD KEY `absensis_izin_id_foreign` (`izin_id`),
  ADD KEY `absensis_user_id_index` (`user_id`);

--
-- Indeks untuk tabel `absensi_khusus`
--
ALTER TABLE `absensi_khusus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `absensi_khusus_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `absensi_sensei`
--
ALTER TABLE `absensi_sensei`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_absensi_sensei` (`kelas_sensei_id`,`user_id`,`tanggal`),
  ADD KEY `absensi_sensei_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `absensi_siswas`
--
ALTER TABLE `absensi_siswas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `absensi_siswas_siswa_id_tanggal_unique` (`siswa_id`,`tanggal`),
  ADD KEY `absensi_siswas_cabang_id_foreign` (`cabang_id`);

--
-- Indeks untuk tabel `agendas`
--
ALTER TABLE `agendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agendas_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `assessment_categories`
--
ALTER TABLE `assessment_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `assessment_components`
--
ALTER TABLE `assessment_components`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assessment_components_category_id_foreign` (`category_id`);

--
-- Indeks untuk tabel `batches`
--
ALTER TABLE `batches`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `cabangs`
--
ALTER TABLE `cabangs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cabangs_barcode_unique` (`barcode`);

--
-- Indeks untuk tabel `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indeks untuk tabel `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indeks untuk tabel `divisis`
--
ALTER TABLE `divisis`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indeks untuk tabel `gurus`
--
ALTER TABLE `gurus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gurus_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `hari_liburs`
--
ALTER TABLE `hari_liburs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hari_liburs_tanggal_unique` (`tanggal`);

--
-- Indeks untuk tabel `izins`
--
ALTER TABLE `izins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `izins_user_id_foreign` (`user_id`),
  ADD KEY `izins_approved_by_foreign` (`approved_by`);

--
-- Indeks untuk tabel `izin_approvals`
--
ALTER TABLE `izin_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `izin_approvals_izin_id_foreign` (`izin_id`),
  ADD KEY `izin_approvals_approved_by_foreign` (`approved_by`);

--
-- Indeks untuk tabel `jadwal_kerjas`
--
ALTER TABLE `jadwal_kerjas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `jadwal_kerjas_karyawan_id_hari_unique` (`karyawan_id`,`hari`);

--
-- Indeks untuk tabel `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indeks untuk tabel `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `karyawan`
--
ALTER TABLE `karyawan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `karyawan_nip_unique` (`nip`),
  ADD UNIQUE KEY `karyawan_email_unique` (`email`);

--
-- Indeks untuk tabel `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `kelas_sensei`
--
ALTER TABLE `kelas_sensei`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kelas_sensei_user_id_foreign` (`user_id`),
  ADD KEY `kelas_sensei_batch_id_foreign` (`batch_id`);

--
-- Indeks untuk tabel `lemburs`
--
ALTER TABLE `lemburs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lemburs_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notification_settings_key_unique` (`key`);

--
-- Indeks untuk tabel `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indeks untuk tabel `pengaturan_shifts`
--
ALTER TABLE `pengaturan_shifts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pengaturan_shifts_key_unique` (`key`);

--
-- Indeks untuk tabel `penilaians`
--
ALTER TABLE `penilaians`
  ADD PRIMARY KEY (`id`),
  ADD KEY `penilaians_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `penilaian_settings`
--
ALTER TABLE `penilaian_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `penilaian_settings_divisi_id_foreign` (`divisi_id`);

--
-- Indeks untuk tabel `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indeks untuk tabel `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projects_manager_id_foreign` (`manager_id`);

--
-- Indeks untuk tabel `project_activities`
--
ALTER TABLE `project_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_activities_project_id_foreign` (`project_id`),
  ADD KEY `project_activities_user_id_foreign` (`user_id`),
  ADD KEY `project_activities_task_id_foreign` (`task_id`);

--
-- Indeks untuk tabel `project_lists`
--
ALTER TABLE `project_lists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_lists_project_id_foreign` (`project_id`);

--
-- Indeks untuk tabel `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indeks untuk tabel `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shifts_kode_shift_unique` (`kode_shift`);

--
-- Indeks untuk tabel `shift_jadwal`
--
ALTER TABLE `shift_jadwal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_tanggal_shift` (`user_id`,`tanggal`,`shift_id`),
  ADD KEY `shift_jadwal_user_id_index` (`user_id`),
  ADD KEY `shift_jadwal_shift_id_foreign` (`shift_id`);

--
-- Indeks untuk tabel `siswas`
--
ALTER TABLE `siswas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `siswas_user_id_foreign` (`user_id`),
  ADD KEY `siswas_shift_id_foreign` (`shift_id`),
  ADD KEY `siswas_kelas_id_foreign` (`kelas_id`),
  ADD KEY `siswas_batch_id_foreign` (`batch_id`);

--
-- Indeks untuk tabel `student_assessments`
--
ALTER TABLE `student_assessments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `assessment_unique` (`component_id`,`siswa_id`,`batch_id`,`tanggal`),
  ADD KEY `student_assessments_siswa_id_foreign` (`siswa_id`),
  ADD KEY `student_assessments_batch_id_foreign` (`batch_id`),
  ADD KEY `student_assessments_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_assignments_task_id_foreign` (`task_id`),
  ADD KEY `task_assignments_user_id_foreign` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_nip_unique` (`nip`);

--
-- Indeks untuk tabel `wa_izin_approvals`
--
ALTER TABLE `wa_izin_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wa_izin_approvals_izin_id_foreign` (`izin_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `absensis`
--
ALTER TABLE `absensis`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT untuk tabel `absensi_khusus`
--
ALTER TABLE `absensi_khusus`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `absensi_sensei`
--
ALTER TABLE `absensi_sensei`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `absensi_siswas`
--
ALTER TABLE `absensi_siswas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `agendas`
--
ALTER TABLE `agendas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `assessment_categories`
--
ALTER TABLE `assessment_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `assessment_components`
--
ALTER TABLE `assessment_components`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT untuk tabel `batches`
--
ALTER TABLE `batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `cabangs`
--
ALTER TABLE `cabangs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `divisis`
--
ALTER TABLE `divisis`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `gurus`
--
ALTER TABLE `gurus`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `hari_liburs`
--
ALTER TABLE `hari_liburs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `izins`
--
ALTER TABLE `izins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `izin_approvals`
--
ALTER TABLE `izin_approvals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `jadwal_kerjas`
--
ALTER TABLE `jadwal_kerjas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `karyawan`
--
ALTER TABLE `karyawan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `kelas_sensei`
--
ALTER TABLE `kelas_sensei`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `lemburs`
--
ALTER TABLE `lemburs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT untuk tabel `notification_settings`
--
ALTER TABLE `notification_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `pengaturan_shifts`
--
ALTER TABLE `pengaturan_shifts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `penilaians`
--
ALTER TABLE `penilaians`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `penilaian_settings`
--
ALTER TABLE `penilaian_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `project_activities`
--
ALTER TABLE `project_activities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `project_lists`
--
ALTER TABLE `project_lists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `shift_jadwal`
--
ALTER TABLE `shift_jadwal`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT untuk tabel `siswas`
--
ALTER TABLE `siswas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT untuk tabel `student_assessments`
--
ALTER TABLE `student_assessments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT untuk tabel `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT untuk tabel `wa_izin_approvals`
--
ALTER TABLE `wa_izin_approvals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `absensis`
--
ALTER TABLE `absensis`
  ADD CONSTRAINT `absensis_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabangs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `absensis_izin_id_foreign` FOREIGN KEY (`izin_id`) REFERENCES `izins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `absensis_shift_id_foreign` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `absensis_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `absensi_khusus`
--
ALTER TABLE `absensi_khusus`
  ADD CONSTRAINT `absensi_khusus_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `absensi_sensei`
--
ALTER TABLE `absensi_sensei`
  ADD CONSTRAINT `absensi_sensei_kelas_sensei_id_foreign` FOREIGN KEY (`kelas_sensei_id`) REFERENCES `kelas_sensei` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absensi_sensei_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `absensi_siswas`
--
ALTER TABLE `absensi_siswas`
  ADD CONSTRAINT `absensi_siswas_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabangs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `absensi_siswas_siswa_id_foreign` FOREIGN KEY (`siswa_id`) REFERENCES `siswas` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `agendas`
--
ALTER TABLE `agendas`
  ADD CONSTRAINT `agendas_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `assessment_components`
--
ALTER TABLE `assessment_components`
  ADD CONSTRAINT `assessment_components_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `assessment_categories` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `gurus`
--
ALTER TABLE `gurus`
  ADD CONSTRAINT `gurus_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `izins`
--
ALTER TABLE `izins`
  ADD CONSTRAINT `izins_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `izins_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `izin_approvals`
--
ALTER TABLE `izin_approvals`
  ADD CONSTRAINT `izin_approvals_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `izin_approvals_izin_id_foreign` FOREIGN KEY (`izin_id`) REFERENCES `izins` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `jadwal_kerjas`
--
ALTER TABLE `jadwal_kerjas`
  ADD CONSTRAINT `jadwal_kerjas_karyawan_id_foreign` FOREIGN KEY (`karyawan_id`) REFERENCES `karyawan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kelas_sensei`
--
ALTER TABLE `kelas_sensei`
  ADD CONSTRAINT `kelas_sensei_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `kelas_sensei_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `lemburs`
--
ALTER TABLE `lemburs`
  ADD CONSTRAINT `lemburs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `penilaians`
--
ALTER TABLE `penilaians`
  ADD CONSTRAINT `penilaians_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `penilaian_settings`
--
ALTER TABLE `penilaian_settings`
  ADD CONSTRAINT `penilaian_settings_divisi_id_foreign` FOREIGN KEY (`divisi_id`) REFERENCES `divisis` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `project_activities`
--
ALTER TABLE `project_activities`
  ADD CONSTRAINT `project_activities_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_activities_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `project_activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `project_lists`
--
ALTER TABLE `project_lists`
  ADD CONSTRAINT `project_lists_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `shift_jadwal`
--
ALTER TABLE `shift_jadwal`
  ADD CONSTRAINT `shift_jadwal_shift_id_foreign` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_jadwal_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `siswas`
--
ALTER TABLE `siswas`
  ADD CONSTRAINT `siswas_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `siswas_kelas_id_foreign` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `siswas_shift_id_foreign` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `siswas_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `student_assessments`
--
ALTER TABLE `student_assessments`
  ADD CONSTRAINT `student_assessments_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_assessments_component_id_foreign` FOREIGN KEY (`component_id`) REFERENCES `assessment_components` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_assessments_siswa_id_foreign` FOREIGN KEY (`siswa_id`) REFERENCES `siswas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_assessments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `task_assignments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `wa_izin_approvals`
--
ALTER TABLE `wa_izin_approvals`
  ADD CONSTRAINT `wa_izin_approvals_izin_id_foreign` FOREIGN KEY (`izin_id`) REFERENCES `izins` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
