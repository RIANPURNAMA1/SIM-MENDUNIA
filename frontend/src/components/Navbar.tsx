import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronRight, Phone } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#tentang", label: "Tentang" },
    { href: "#program", label: "Program" },
    { href: "#testimoni", label: "Testimoni" },
    { href: "#blog", label: "Blog", to: "/blog" },
    { href: "#faq", label: "FAQ" },
    { href: "#kontak", label: "Kontak" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur shadow-md"
          : "bg-[#0069b0] border-b border-white/20"
      }`}
    >
      {/* Top announcement bar */}
      <div
        className={`text-[10px] sm:text-xs font-medium text-center py-2.5 px-4 transition-all duration-300 ${
          scrolled
            ? "bg-gradient-to-r from-[#0069b0] to-[#0069b0] text-white"
            : "bg-[#0069b0] text-white/80"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Konsultasikan dulu kebutuhanmu bersama tim kami.{" "}
          <a href="#kontak" className="underline underline-offset-4 font-bold hover:text-white transition-colors">
            Hubungi Kami
          </a>
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img
            src={scrolled ? "/logo.png" : "/logo1.png"}
            alt="Mendunia"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const className = `relative px-4 py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:rounded-full after:transition-all after:duration-300 hover:after:w-4 ${
              scrolled
                ? "text-slate-500 hover:text-[#0069b0] after:bg-[#0069b0]"
                : "text-white/70 hover:text-white after:bg-white"
            }`;
            return link.to ? (
              <Link key={link.label} to={link.to} className={className}>
                {link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className={className}>
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className={`text-sm font-semibold transition-colors px-3 py-2 ${
              scrolled
                ? "text-slate-600 hover:text-[#0069b0]"
                : "text-white/70 hover:text-white"
            }`}
          >
            Masuk
          </Link>
          <a
            href="#kontak"
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-sm transition-all active:scale-95 ${
              scrolled
                ? "bg-[#f9b700] hover:bg-[#e0a500] text-black shadow-sm hover:shadow-md"
                : "bg-white hover:bg-white/90 text-[#0069b0] shadow-sm"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Konsultasi
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className={`md:hidden p-2 rounded-sm transition-colors ${
            scrolled
              ? "text-slate-500 hover:bg-slate-100"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className={`md:hidden border-t ${
            scrolled
              ? "bg-white border-slate-100 shadow-lg"
              : "bg-[#0069b0] border-[#0069b0] shadow-lg"
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            {links.map((link) => {
              const className = `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-sm transition-colors ${
                scrolled
                  ? "text-slate-600 hover:text-[#0069b0] hover:bg-slate-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`;
              return link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={className}
                >
                  {link.label}
                  <ChevronRight className={`w-4 h-4 ${scrolled ? "text-slate-300" : "text-white/40"}`} />
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={className}
                >
                  {link.label}
                  <ChevronRight className={`w-4 h-4 ${scrolled ? "text-slate-300" : "text-white/40"}`} />
                </a>
              );
            })}
          </div>
          <div
            className={`px-4 pb-5 pt-3 border-t space-y-3 ${
              scrolled ? "border-slate-100" : "border-[#0069b0]"
            }`}
          >
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-sm transition-colors ${
                scrolled
                  ? "text-slate-600 border border-slate-200 hover:border-[#0069b0]"
                  : "text-white border border-white/30 hover:bg-white/10"
              }`}
            >
              Masuk
            </Link>
            <a
              href="#kontak"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-sm transition-all active:scale-95 ${
                scrolled
                  ? "bg-[#f9b700] hover:bg-[#e0a500] text-black shadow-sm"
                  : "bg-white hover:bg-white/90 text-[#0069b0] shadow-sm"
              }`}
            >
              <Phone className="w-4 h-4" />
              Konsultasi
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
