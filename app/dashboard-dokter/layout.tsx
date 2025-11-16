import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import { createClient } from '@/utils/server';

// Komponen Tombol Logout Sisi Server
async function LogoutButton() {
  'use server';
  
  const logout = async (formData: FormData) => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/login');
  };

  return (
    <form action={logout} className="w-full">
      <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </form>
  );
}

// Komponen Navigasi (Bisa dipisah jika mau)
function NavLink({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <Button variant="ghost" className="w-full justify-start">
        <Icon className="mr-2 h-4 w-4" />
        {children}
      </Button>
    </Link>
  );
}

export default async function DokterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient(); // <--- TAMBAHKAN 'await' DI SINI
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ambil profil untuk nama dokter
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Sidebar --- */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard-dokter" className="flex items-center gap-2 font-semibold">
              <Stethoscope className="h-6 w-6 text-violet-600" />
              <span className="">Hai, Dr. {profile?.full_name?.split(' ')[0] || ''}</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink href="/dashboard-dokter" icon={LayoutDashboard}>
                Dashboard
              </NavLink>
              <NavLink href="/dashboard-dokter/pasien" icon={Users}>
                List Pasien
              </NavLink>
            </nav>
          </div>
          <div className="mt-auto p-4">
             <LogoutButton />
          </div>
        </div>
      </div>
      
      {/* --- Konten Halaman --- */}
      <div className="flex flex-col">
        {/* Disini bisa ditambahkan Header Mobile jika perlu */}
        <main className="flex-1 p-4 lg:p-6 bg-violet-50/50">
          {children} {/* Ini akan merender page.tsx atau pasien/page.tsx */}
        </main>
      </div>
    </div>
  );
}