<?php

namespace Database\Seeders;

use App\Models\Blog;
use Illuminate\Database\Seeder;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        if (Blog::count() > 0) {
            return;
        }

        $posts = [
            [
                'title' => '8 Cara Efektif Belajar Bahasa Jepang untuk Pemula',
                'excerpt' => 'Menguasai bahasa Jepang tidak harus sulit. Simak strategi belajar yang terbukti membantu ribuan peserta kami lulus JFT A2 Basic.',
                'content' => '<p>Menguasai bahasa Jepang memang terlihat menantang, tetapi dengan strategi yang tepat, siapa pun bisa melakukannya. Berikut beberapa cara yang terbukti efektif untuk pemula.</p><h2>1. Mulai dari Hiragana dan Katakana</h2><p>Kedua aksara dasar ini adalah fondasi utama. Luangkan waktu 1-2 jam setiap hari sampai benar-benar hafal sebelum lanjut ke tahap berikutnya.</p><h2>2. Konsisten Setiap Hari</h2><p>Belajar 30 menit setiap hari jauh lebih efektif daripada 3 jam seminggu sekali.</p><h2>3. Gunakan Metode Immersion</h2><p>Tonton anime, drama, atau dengarkan musik Jepang untuk membiasakan telinga dengan intonasi dan kosakata.</p><h2>4. Bergabung dengan Kelas Terbimbing</h2><p>Pendampingan pengajar berpengalaman membantu mempercepat pemahaman dan menjaga motivasi.</p>',
                'category' => 'Bahasa Jepang',
                'read_time' => 6,
                'status' => 'publish',
            ],
            [
                'title' => 'Tips Lolos EPS-TOPIK untuk Program Kerja ke Korea',
                'excerpt' => 'EPS-TOPIK adalah gerbang menuju bekerja di Korea Selatan. Kenali struktur ujian dan cara mempersiapkan diri dengan benar.',
                'content' => '<p>EPS-TOPIK adalah ujian kemampuan bahasa Korea untuk calon pekerja asing di Korea Selatan. Berikut tips agar kamu berhasil lolos.</p><h2>Pahami Struktur Ujian</h2><p>Ujian terdiri dari reading, listening, dan writing. Pahami bobot masing-masing bagian agar strategi belajarmu tepat sasaran.</p><h2>Perbanyak Latihan Soal</h2><p>Kerjakan soal-soal tahun sebelumnya untuk mengenal pola soal yang sering keluar.</p><h2>Fokus pada Kosakata Pekerjaan</h2><p>Sebagian besar kosakata berhubungan dengan dunia kerja, keselamatan, dan industri manufaktur.</p>',
                'category' => 'Bahasa Korea',
                'read_time' => 8,
                'status' => 'publish',
            ],
            [
                'title' => 'Berapa Lama Proses Berangkat Kerja ke Luar Negeri?',
                'excerpt' => 'Dari pendaftaran hingga tiket pesawat, pelajari alur lengkap proses penempatan kerja ke Jepang dan Korea Selatan.',
                'content' => '<p>Banyak calon pekerja bertanya-tanya berapa lama proses keberangkatan. Jawabannya bervariasi, namun rata-rata 10-12 bulan.</p><h2>Tahapan Proses</h2><p>1. Pendaftaran dan seleksi awal<br>2. Pelatihan bahasa dan budaya<br>3. Ujian sertifikasi<br>4. Proses visa<br>5. Keberangkatan</p><h2>Faktor yang Mempengaruhi Durasi</h2><p>Kecepatan proses dipengaruhi oleh kemampuan bahasa, kelengkapan dokumen, dan kuota pengiriman.</p>',
                'category' => 'Info Karir',
                'read_time' => 5,
                'status' => 'publish',
            ],
            [
                'title' => 'Dana Talangan Keberangkatan: Solusi Biaya Tanpa Ribet',
                'excerpt' => 'Tidak punya biaya penuh untuk berangkat? Kami memiliki skema dana talangan berprinsip syariah untuk meringankan bebanmu.',
                'content' => '<p>Kami membantu menyediakan dana talangan keberangkatan dengan akad syariah, sehingga kamu tidak perlu khawatir soal biaya awal.</p><h2>Apa Itu Dana Talangan?</h2><p>Skema di mana biaya pelatihan dan keberangkatan ditanggung terlebih dahulu, dan bisa dilunasi setelah kamu bekerja.</p><h2>Keuntungannya</h2><p>Dengan prinsip syariah, skema ini transparan dan tanpa biaya tersembunyi.</p>',
                'category' => 'Info Karir',
                'read_time' => 4,
                'status' => 'publish',
            ],
            [
                'title' => 'Perbedaan JFT dan JLPT: Mana yang Tepat Untukmu?',
                'excerpt' => 'JFT Basic dan JLPT adalah dua ujian bahasa Jepang yang sering tertukar. Pahami perbedaannya sebelum mendaftar.',
                'content' => '<p>JFT Basic dan JLPT sama-sama ujian bahasa Jepang, namun memiliki tujuan yang berbeda.</p><h2>JFT Basic</h2><p>Dirancang khusus untuk calon pekerja di Jepang, mengukur kemampuan komunikasi sehari-hari di lingkungan kerja.</p><h2>JLPT</h2><p>Ujian bahasa Jepang umum yang diakui internasional, terbagi dalam level N1 sampai N5.</p><h2>Mana yang Tepat?</h2><p>Untuk tujuan bekerja ke Jepang, JFT Basic lebih relevan dan menjadi syarat sertifikasi.</p>',
                'category' => 'Bahasa Jepang',
                'read_time' => 7,
                'status' => 'publish',
            ],
            [
                'title' => 'Hidup di Jepang: Persiapan Budaya Sebelum Berangkat',
                'excerpt' => 'Selain bahasa, budaya kerja Jepang perlu dipelajari. Berikut hal-hal penting yang wajib kamu tahu sebelum terbang.',
                'content' => '<p>Beradaptasi dengan budaya Jepang adalah kunci sukses bekerja di sana. Berikut beberapa hal yang perlu kamu persiapkan.</p><h2>Etika Kerja</h2><p>Ketepatan waktu adalah harga mati. Budaya kerja Jepang sangat menghargai disiplin dan kerja tim.</p><h2>Kehidupan Sehari-hari</h2><p>Pelajari tata cara membuang sampah, menggunakan transportasi umum, dan interaksi sosial dasar.</p>',
                'category' => 'Tips',
                'read_time' => 6,
                'status' => 'publish',
            ],
        ];

        foreach ($posts as $post) {
            Blog::create($post);
        }
    }
}
