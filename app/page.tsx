import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  HeartPulse,
  LineChart,
  ClipboardPenLine,
  Sparkles,
  Stethoscope,
  MoveRight,
} from 'lucide-react';

// Komponen untuk satu kartu fitur
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center p-6 text-center bg-white rounded-lg shadow-lg transition-transform transform hover:-translate-y-2">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-violet-100">
        <Icon className="w-8 h-8 text-violet-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* --- Header / Navigasi --- */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-violet-600" />
            <span className="text-xl font-bold text-gray-800">GlucoTrack</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-violet-600 hover:text-violet-700">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-violet-600 rounded-full hover:bg-violet-700">
              <Link href="/register">Daftar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <main className="flex-1">
        <section className="py-20 text-center bg-white md:py-32">
          <div className="container px-4 mx-auto md:px-6">
            <LineChart className="w-24 h-24 mx-auto mb-6 text-violet-500" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Pantau Gula Darah Anda,{' '}
              <span className="text-violet-600">Setiap Hari.</span>
            </h1>
            <p className="max-w-2xl mx-auto mt-6 text-lg text-gray-600">
              Catat riwayat gula darah harian Anda, dapatkan analisis instan
              berbasis AI, dan terhubung langsung dengan dokter Anda.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <Button asChild size="lg" className="px-8 py-3 text-lg bg-violet-600 rounded-full hover:bg-violet-700">
                <Link href="/login">
                  Login Sekarang <MoveRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* --- Features Section --- */}
        <section className="py-20 bg-violet-50/50 md:py-24">
          <div className="container px-4 mx-auto md:px-6">
            <h2 className="mb-12 text-3xl font-bold text-center text-gray-900">
              Fitur Utama Kami
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FeatureCard
                icon={ClipboardPenLine}
                title="Pencatatan Harian"
                description="Catat level gula darah Anda dengan mudah kapan saja, di mana saja."
              />
              <FeatureCard
                icon={Sparkles}
                title="Analisis AI Cerdas"
                description="Dapatkan umpan balik instan dari Gemini AI untuk memahami kondisi Anda."
              />
              <FeatureCard
                icon={Stethoscope}
                title="Terhubung dengan Dokter"
                description="Dokter Anda dapat memantau riwayat kesehatan Anda secara real-time."
              />
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="py-6 text-center bg-gray-100 border-t">
        <div className="container px-4 mx-auto md:px-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} GlucoTrack. Dibuat untuk pemantauan kesehatan.
          </p>
        </div>
      </footer>
    </div>
  );
}