import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clock, Tag, ChevronRight, ChevronLeft, Calendar, ArrowLeft, Eye } from "lucide-react";
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
  views: number;
  views_formatted: string | null;
  status: string;
  date_formatted: string | null;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    blogApi
      .show(slug)
      .then((res) => {
        setPost(res.data.data || null);
        setRelated(res.data.related || []);
      })
      .catch(() => {
        setPost(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="force-light min-h-screen bg-[#f5f7fa] text-slate-700">
      <Navbar />

      {loading ? (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 mb-6" />
          <div className="h-8 w-full animate-pulse rounded bg-slate-200 mb-4" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200 mb-8" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200 mb-8" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ) : notFound || !post ? (
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-24 text-center">
          <p className="text-sm font-semibold text-slate-400 mb-2">404</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Artikel tidak ditemukan</h1>
          <p className="text-sm text-slate-500 mb-6">
            Artikel mungkin telah dihapus atau belum dipublikasikan.
          </p>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 rounded-full bg-[#0069b0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00508a] transition-colors"
          >
            <ArrowLeft size={15} /> Kembali ke Blog
          </button>
        </div>
      ) : (
        <>
          {/* SEO */}
          <Seo
            title={post.title}
            description={post.excerpt || `${post.title} — Informasi lengkap dari Mendunia.id`}
            keywords={`${post.category || "artikel"}, Mendunia, kerja Jepang Korea, LPK Mendunia`}
            canonical={`${SITE_URL}/blog/${post.slug}`}
            image={post.image_url || `https://sim.mendunia.id/logo1.png`}
            type="article"
            jsonLd={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              image: post.image_url,
              datePublished: post.date_formatted,
              author: {
                "@type": "Organization",
                name: "Mendunia",
              },
              publisher: {
                "@type": "Organization",
                name: "Mendunia",
                logo: { "@type": "ImageObject", url: "https://sim.mendunia.id/logo1.png" },
              },
              mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
            }}
          />
          {/* Hero */}
          <section className="bg-gradient-to-br from-[#0069b0] to-[#00508a] text-white">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-4">
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold bg-white/10 border border-white/20">
                  <Tag size={11} /> {post.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                  <Calendar size={13} /> {post.date_formatted}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                  <Clock size={13} /> {post.read_time} menit baca
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                  <Eye size={13} /> {post.views_formatted || post.views || 0} dibaca
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-snug mb-4">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl">
                  {post.excerpt}
                </p>
              )}
            </div>
          </section>

          {/* Content */}
          <section className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-14">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full max-h-[420px] object-cover rounded-2xl shadow-sm border border-slate-200 mb-8"
              />
            )}

            <article
              className="blog-content text-slate-700 text-[15px] leading-[1.9]"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />

            <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => navigate("/blog")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0069b0] hover:text-[#00508a] transition-colors"
              >
                <ChevronLeft size={16} /> Semua Artikel
              </button>
            </div>
          </section>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="bg-white border-t border-slate-200">
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6">
                  Artikel Terkait
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to={`/blog/${item.slug}`}
                      className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-[#0069b0]/15 to-[#0069b0]/5 flex items-center justify-center">
                          <Clock size={20} className="text-[#0069b0]" />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#0069b0]/10 text-[#0069b0]">
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400">{item.date_formatted}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#0069b0] transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <span className="mt-auto inline-flex items-center gap-0.5 text-xs font-semibold text-[#0069b0] pt-3">
                          Baca <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}
