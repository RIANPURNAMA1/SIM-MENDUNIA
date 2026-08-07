import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Tag, ChevronRight, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const posts = [
  {
    id: 1,
    title: "8 Cara Efektif Belajar Bahasa Jepang untuk Pemula",
    excerpt:
      "Menguasai bahasa Jepang tidak harus sulit. Simak strategi belajar yang terbukti membantu ribuan peserta kami lulus JFT A2 Basic.",
    category: "Bahasa Jepang",
    date: "5 Agustus 2026",
    readTime: "6 menit",
    accent: "from-[#0069b0]/15 to-[#0069b0]/5",
  },
  {
    id: 2,
    title: "Tips Lolos EPS-TOPIK untuk Program Kerja ke Korea",
    excerpt:
      "EPS-TOPIK adalah gerbang menuju bekerja di Korea Selatan. Kenali struktur ujian dan cara mempersiapkan diri dengan benar.",
    category: "Bahasa Korea",
    date: "28 Juli 2026",
    readTime: "8 menit",
    accent: "from-[#0069b0]/15 to-[#0069b0]/5",
  },
  {
    id: 3,
    title: "Berapa Lama Proses Berangkat Kerja ke Luar Negeri?",
    excerpt:
      "Dari pendaftaran hingga tiket pesawat, pelajari alur lengkap proses penempatan kerja ke Jepang dan Korea Selatan.",
    category: "Info Karir",
    date: "19 Juli 2026",
    readTime: "5 menit",
    accent: "from-[#0069b0]/15 to-[#0069b0]/5",
  },
  {
    id: 4,
    title: "Dana Talangan Keberangkatan: Solusi Biaya Tanpa Ribet",
    excerpt:
      "Tidak punya biaya penuh untuk berangkat? Kami memiliki skema dana talangan berprinsip syariah untuk meringankan bebanmu.",
    category: "Info Karir",
    date: "10 Juli 2026",
    readTime: "4 menit",
    accent: "from-[#0069b0]/15 to-[#0069b0]/5",
  },
  {
    id: 5,
    title: "Perbedaan JFT dan JLPT: Mana yang Tepat Untukmu?",
    excerpt:
      "JFT Basic dan JLPT adalah dua ujian bahasa Jepang yang sering tertukar. Pahami perbedaannya sebelum mendaftar.",
    category: "Bahasa Jepang",
    date: "2 Juli 2026",
    readTime: "7 menit",
    accent: "from-[#0069b0]/15 to-[#0069b0]/5",
  },
  {
    id: 6,
    title: "Hidup di Jepang: Persiapan Budaya Sebelum Berangkat",
    excerpt:
      "Selain bahasa, budaya kerja Jepang perlu dipelajari. Berikut hal-hal penting yang wajib kamu tahu sebelum terbang.",
    category: "Tips",
    date: "24 Juni 2026",
    readTime: "6 menit",
    accent: "from-[#0069b0]/15 to-[#0069b0]/5",
  },
];

const categories = ["Semua", "Bahasa Jepang", "Bahasa Korea", "Info Karir", "Tips"];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = posts.filter((post) => {
    const matchCategory = activeCategory === "Semua" || post.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const featured = posts[0];

  return (
    <div className="force-light min-h-screen bg-[#f5f7fa] text-slate-700">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0069b0] to-[#00508a] text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20 text-center">
          <p className="inline-flex items-center rounded-full px-4 py-1.5 bg-white/10 border border-white/20 text-xs font-semibold mb-4 backdrop-blur-sm">
            Wawasan & Tips dari Mendunia
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Blog Mendunia
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Berbagi informasi seputar bahasa, budaya, dan persiapan kerja ke Jepang serta Korea
            Selatan untuk membantumu meraih kesempatan bekerja di luar negeri.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="sticky top-[100px] z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-[#0069b0] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari artikel..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0069b0] focus:ring-1 focus:ring-[#0069b0]"
            />
          </div>
        </div>
      </section>

      {/* Featured post */}
      {filtered.length > 0 && activeCategory === "Semua" && !search && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-10">
          <Link to="/blog/1" className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="grid md:grid-cols-2">
              <div className={`min-h-[220px] md:min-h-full bg-gradient-to-br ${featured.accent} flex items-center justify-center`}>
                <div className="w-20 h-20 rounded-2xl bg-white/70 border border-slate-200 shadow-sm flex items-center justify-center">
                  <Clock size={32} className="text-[#0069b0]" />
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold bg-[#0069b0]/10 text-[#0069b0]">
                    <Tag size={11} />
                    {featured.category}
                  </span>
                  <span className="text-xs text-slate-400">{featured.date}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-[#0069b0] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{featured.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={13} /> {featured.readTime} baca
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#0069b0]">
                    Baca Selengkapnya <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Posts grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Search size={24} />
            </div>
            <p className="text-sm font-medium text-slate-600">Tidak ada artikel yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba kata kunci atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-36 bg-gradient-to-br ${post.accent} flex items-center justify-center`}>
                  <div className="w-12 h-12 rounded-xl bg-white/70 border border-slate-200 shadow-sm flex items-center justify-center">
                    <Clock size={20} className="text-[#0069b0]" />
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#0069b0]/10 text-[#0069b0]">
                      {post.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{post.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#0069b0] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} /> {post.readTime}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0069b0]">
                      Baca <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
