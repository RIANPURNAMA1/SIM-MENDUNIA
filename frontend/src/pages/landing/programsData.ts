import { PenLine, Layers3, Target } from "lucide-react";

export interface ProgramData {
  slug: string;
  country: string;
  title: string;
  tagline: string;
  duration: string;
  schedule: string;
  mode: string;
  exam: string;
  certificate: string;
  image: string;
  overview: string;
  curriculumTitle: string;
  curriculum: { title: string; items: string[] }[];
  levels: { level: string; desc: string; tag: string; icon: any; image?: string }[];
  benefits: string[];
  requirements: string[];
  process: { title: string; desc: string }[];
}

export const programs: ProgramData[] = [
  {
    slug: "program-bahasa-jepang",
    country: "Jepang",
    title: "Program Bahasa Jepang",
    tagline: "Program bahasa & budaya Jepang, persiapan JFT A2 Basic sampai siap kerja di Jepang.",
    duration: "6 - 8 Bulan",
    schedule: "Senin - Jumat",
    mode: "Offline & Online",
    exam: "JFT Basic A2",
    certificate: "Sertifikat Mendunia",
    image: "https://mendunia.id/wp-content/uploads/2025/08/Untitled-design-10.png",
    overview:
      "Program Bahasa Jepang dirancang untuk membekalimu kemampuan bahasa dan budaya Jepang secara menyeluruh. Mulai dari pengenalan Hiragana & Katakana, kosakata kerja, hingga budaya kerja yang berlaku di Jepang, semua dipersiapkan agar kamu siap menghadapi ujian JFT A2 Basic dan kehidupan kerja di Negeri Sakura.",
    curriculumTitle: "Materi yang Akan Dipelajari",
    curriculum: [
      {
        title: "Dasar Bahasa Jepang",
        items: [
          "Hiragana & Katakana sampai lancar",
          "Kanji dasar yang sering dipakai di tempat kerja",
          "Tata bahasa N5 - N4",
          "Percakapan sehari-hari & perkenalan",
        ],
      },
      {
        title: "Persiapan JFT Basic",
        items: [
          "Simulasi & latihan soal JFT A2",
          "Strategi menjawab soal listening & reading",
          "Pemantapan kosakata kerja",
          "Tes berkala untuk evaluasi progres",
        ],
      },
      {
        title: "Budaya Kerja Jepang",
        items: [
          "Etika kerja & tata krama perusahaan Jepang",
          "Istilah teknis industri manufaktur",
          "Adaptasi kehidupan sehari-hari di Jepang",
          "Persiapan wawancara kerja (interview)",
        ],
      },
    ],
    levels: [
      { level: "Level 1", desc: "Pengenalan dasar, Hiragana & Katakana, perkenalan diri.", tag: "Fondasi", icon: PenLine },
      { level: "Level 2", desc: "Tata bahasa dasar, kosakata harian & kerja.", tag: "Pembentukan", icon: Layers3 },
      { level: "Level 3", desc: "Persiapan intensif ujian JFT A2 Basic.", tag: "Sertifikasi", icon: Target },
    ],
    benefits: [
      "Pengajar berpengalaman & bersertifikat",
      "Kelas kecil agar fokus belajar",
      "Modul & latihan soal terbaru",
      "Pendampingan hingga lulus ujian",
      "Konsultasi karier kerja ke Jepang",
      "Dukungan proses pemberangkatan",
    ],
    requirements: [
      "Usia 18 - 35 tahun",
      "Pria & Wanita",
      "Lulusan minimal SMA / SMK sederajat",
      "Sehat jasmani & rohani",
      "Bersedia mengikuti pelatihan intensif",
    ],
    process: [
      { title: "Pendaftaran", desc: "Isi formulir dan konsultasi bersama tim kami." },
      { title: "Pelatihan Bahasa", desc: "Belajar bahasa & budaya Jepang secara intensif." },
      { title: "Ujian JFT Basic", desc: "Ikuti ujian sertifikasi dengan pendampingan." },
      { title: "Pemberangkatan", desc: "Proses visa & keberangkatan ke Jepang." },
    ],
  },
  {
    slug: "program-bahasa-korea",
    country: "Korea Selatan",
    title: "Program Bahasa Korea",
    tagline: "Program intensif persiapan EPS-TOPIK dan pendampingan kerja ke Korea Selatan.",
    duration: "3 - 4 Bulan",
    schedule: "Senin - Jumat",
    mode: "Offline & Online",
    exam: "EPS-TOPIK",
    certificate: "Sertifikat Mendunia",
    image: "https://mendunia.id/wp-content/uploads/2025/08/Untitled-design-12.png",
    overview:
      "Program Bahasa Korea dipersiapkan khusus bagi calon pekerja yang ingin bekerja di Korea Selatan melalui jalur resmi. Dengan kurikulum intensif 3 bulan plus 1 bulan pemantapan, kamu akan dibimbing untuk menguasai bahasa Korea dan lulus ujian EPS-TOPIK sebagai syarat utama bekerja di Korea.",
    curriculumTitle: "Materi yang Akan Dipelajari",
    curriculum: [
      {
        title: "Dasar Bahasa Korea",
        items: [
          "Hangul & pelafalan yang benar",
          "Tata bahasa EPS-TOPIK (dasar - menengah)",
          "Kosakata pekerjaan manufaktur & konstruksi",
          "Percakapan & perkenalan kerja",
        ],
      },
      {
        title: "Persiapan EPS-TOPIK",
        items: [
          "Latihan soal reading, listening & writing",
          "Strategi mengerjakan soal ujian",
          "Simulasi ujian berkala",
          "Prediksi soal yang sering keluar",
        ],
      },
      {
        title: "Budaya & Dunia Kerja Korea",
        items: [
          "Etika kerja perusahaan Korea",
          "Kehidupan asrama & keseharian di Korea",
          "Keselamatan kerja (K3)",
          "Persiapan interview pemberi kerja",
        ],
      },
    ],
    levels: [
      { level: "Level 1", desc: "Hangul, pelafalan dan kosakata dasar.", tag: "Fondasi", icon: PenLine, image: "https://belajarbahasakoreayuk.wordpress.com/wp-content/uploads/2015/01/hangulchart.png" },
      { level: "Level 2", desc: "Tata bahasa & kosakata pekerjaan EPS-TOPIK.", tag: "Pembentukan", icon: Layers3 },
      { level: "Level 3", desc: "Pemantapan intensif menjelang ujian.", tag: "Sertifikasi", icon: Target },
    ],
    benefits: [
      "Kurikulum sesuai standar HRD Korea",
      "Pengajar bersertifikat bahasa Korea",
      "Bank soal EPS-TOPIK terlengkap",
      "Simulasi ujian berkala & evaluasi",
      "Pendampingan pendaftaran ujian",
      "Konsultasi pemberangkatan kerja",
    ],
    requirements: [
      "Usia 18 - 39 tahun",
      "Pria & Wanita",
      "Lulusan minimal SMA / SMK sederajat",
      "Sehat jasmani & rohani",
      "Bersedia mengikuti pelatihan intensif",
    ],
    process: [
      { title: "Pendaftaran", desc: "Isi formulir dan konsultasi bersama tim kami." },
      { title: "Pelatihan Bahasa", desc: "Belajar bahasa Korea secara intensif." },
      { title: "Ujian EPS-TOPIK", desc: "Ikuti ujian dengan pendampingan resmi." },
      { title: "Pemberangkatan", desc: "Penempatan & keberangkatan ke Korea." },
    ],
  },
];