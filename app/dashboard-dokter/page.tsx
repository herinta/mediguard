import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/server';

// Fungsi helper untuk menentukan status bahaya
const isBahaya = (level: number) => level < 70 || level > 180;

export default async function DokterDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Ambil semua pasien yang terhubung dengan dokter ini
  // dan ambil data glukosa terbaru mereka
  const { data: patients, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      glucose_entries (
        glucose_level,
        created_at
      )
    `)
    .eq('doctor_id', user.id)
    .eq('role', 'pasien')
    .order('created_at', { referencedTable: 'glucose_entries', ascending: false });

  if (error) {
    console.error('Error fetching patients:', error);
    return <p>Gagal memuat data pasien: {error.message}</p>;
  }

  const totalPasien = patients.length;
  let totalPasienBahaya = 0;

  patients.forEach(patient => {
    // Cek apakah pasien punya data
    if (patient.glucose_entries && patient.glucose_entries.length > 0) {
      // Ambil data terbaru (paling atas karena sudah di-order)
      const levelTerbaru = patient.glucose_entries[0].glucose_level;
      if (isBahaya(levelTerbaru)) {
        totalPasienBahaya++;
      }
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card Total Pasien */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pasien
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPasien}</div>
            <p className="text-xs text-muted-foreground">
              Total pasien yang terhubung dengan Anda
            </p>
          </CardContent>
        </Card>

        {/* Card Pasien Berbahaya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pasien Berisiko (Data Terbaru)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPasienBahaya}</div>
            <p className="text-xs text-muted-foreground">
              Pasien dengan level glukosa &lt;70 atau &gt;180
            </p>
          </CardContent>
        </Card>

        {/* Tambahkan Card lain di sini jika perlu */}
        
      </div>

      {/* Bisa tambahkan grafik ringkasan di sini */}
    </div>
  );
}