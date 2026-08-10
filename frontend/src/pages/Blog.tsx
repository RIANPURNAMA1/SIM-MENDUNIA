import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Tag, ChevronRight, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { blogApi } from "../services/api";
import Seo, { SITE_URL } from "../components/Seo";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image: string | null;
  image_url: string | null;
  read_time: number | null;
  status: string;
  date_formatted: string | null;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    blogApi
      .list({ category: activeCategory, search })
      .then((res) => {
        setPosts(res.data.data || []);
        setCategories(res.data.categories || ["Semua"]);
      })
      .catch(() => {
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const featured = posts[0];

  const Thumbnail = ({
    post,
    className,
    iconSize = 20,
  }: {
    post: BlogPost;
    className?: string;
    iconSize?: number;
  }) => {
    if (post.image_url) {
      return (
        <div className={className}>
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#0069b0]/15 to-[#0069b0]/5 flex items-center justify-center`}
      >
        <div
          className={`rounded-2xl bg-white/70 border border-slate-200 shadow-sm flex items-center justify-center`}
          style={{ width: iconSize * 2, height: iconSize * 2 }}
        >
          <Clock size={iconSize} className="text-[#0069b0]" />
        </div>
      </div>
    );
  };

  return (
    <div className="force-light min-h-screen bg-[#f5f7fa] text-slate-700">
      <Seo
        title="Blog — Tips Kerja Jepang & Korea Selatan"
        description="Artikel dan tips dari Mendunia tentang bahasa Jepang, bahasa Korea, persiapan JFT A2 Basic, EPS-TOPIK, dan informasi bekerja di Jepang & Korea Selatan."
        keywords="blog kerja Jepang, belajar bahasa Jepang pemula, EPS-TOPIK, tips kerja Korea, artikel Mendunia"
        canonical={`${SITE_URL}/blog`}
      />
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
      {!loading && featured && activeCategory === "Semua" && !search && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-10">
          <Link to={`/blog/${featured.slug}`} className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="grid md:grid-cols-2">
              <Thumbnail post={featured} className="min-h-[220px] md:min-h-full" iconSize={32} />
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold bg-[#0069b0]/10 text-[#0069b0]">
                    <Tag size={11} />
                    {featured.category}
                  </span>
                  <span className="text-xs text-slate-400">{featured.date_formatted}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-[#0069b0] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{featured.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={13} /> {featured.read_time} menit baca
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-36 animate-pulse bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Search size={24} />
            </div>
            <p className="text-sm font-medium text-slate-600">Tidak ada artikel yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba kata kunci atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <Thumbnail post={post} className="h-36" iconSize={20} />
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#0069b0]/10 text-[#0069b0]">
                      {post.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{post.date_formatted}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#0069b0] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} /> {post.read_time} menit
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
