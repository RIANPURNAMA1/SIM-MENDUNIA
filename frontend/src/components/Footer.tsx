import Reveal from "./Reveal";
import VisitorCounter from "../pages/landing/VisitorCounter";

function TiktokIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V2h3.5a5.5 5.5 0 0 0 5.5 5.5v3.5a9 9 0 0 1-5.5-2v6a4 4 0 1 1-7.5-2z" />
    </svg>
  );
}

function InstagramIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

interface FooterProps {
  phone?: string;
}

export default function Footer({ phone = "0895 3916 85825" }: FooterProps) {
  return (
    <footer className="bg-slate-900">
      <Reveal direction="up" threshold={0.05}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="border-t border-slate-800 mb-10" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white mb-4">Ikuti Sosial Media Kami</h3>
              <div className="flex items-center justify-start gap-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                  <InstagramIcon size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="TikTok">
                  <TiktokIcon size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                  <FacebookIcon size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="YouTube">
                  <YoutubeIcon size={20} />
                </a>
              </div>
              <div className="flex items-center justify-start gap-6 mt-6">
                <img
                  src="https://mendunia.id/wp-content/uploads/2025/08/LOGO-MENDUNIA-JEPANG_11zon-1024x1024.png"
                  alt="Logo Jepang"
                  className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <img
                  src="https://mendunia.id/wp-content/uploads/2025/08/logo-korea-2-1024x1024.png"
                  alt="Logo Korea"
                  className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="text-left">
              <h3 className="text-sm font-semibold text-white mb-4">Navigasi</h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <a href="#beranda" className="text-slate-400 hover:text-white transition-colors">Home</a>
                <a href="/program" className="text-slate-400 hover:text-white transition-colors">Program</a>
                <a href="#pendaftaran" className="text-slate-400 hover:text-white transition-colors">Daftar</a>
                <a href="/tentang" className="text-slate-400 hover:text-white transition-colors">Tentang Kami</a>
                <a href="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</a>
              </div>
            </div>

            <div className="text-left">
              <h3 className="text-sm font-semibold text-white mb-4">Informasi</h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <a href="/testimoni" className="text-slate-400 hover:text-white transition-colors">Testimoni</a>
                <p className="text-slate-400">Admin - Mendunia</p>
                <p className="text-slate-400">WhatsApp : {phone}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Copyright © Mendunia.id</p>
            <p className="text-xs text-slate-600">PT Indonesia Sukses Mendunia</p>
          </div>

          <div className="flex justify-start pt-6">
            <VisitorCounter />
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
