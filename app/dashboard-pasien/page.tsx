import { redirect } from 'next/navigation';
import { User } from 'lucide-react';
import { createClient } from '@/utils/server';
import { GlucoseDisplay } from '@/components/glucose-display';
import { GlucoseForm } from '@/components/glucose-form';

export default async function PasienDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  
  // 2. Ambil data profil (termasuk nama)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // 3. Ambil data gula darah (Server Component)
  const { data: glucoseEntries, error } = await supabase
    .from('glucose_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }); // Data terbaru di atas

  if (error) {
    console.error('Error fetching glucose data:', error);
  }

  const entries = glucoseEntries || [];

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <User className="text-violet-600" />
          Dashboard Pasien
        </h1>
        <p className="text-lg text-gray-600">
          Selamat datang, {profile?.full_name || 'Pasien'}!
        </p>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Riwayat & Grafik */}
        <div className="lg:col-span-2">
          {/* Komponen ini harus 'use client' karena ada hook 'recharts' */}
          <GlucoseDisplay data={entries} />
        </div>

        {/* Kolom Kanan: Form Input */}
        <div className="lg:col-span-1">
          {/* Komponen ini 'use client' karena ada hook 'useFormState' */}
          <GlucoseForm />
        </div>
      </main>
    </div>
  );
}