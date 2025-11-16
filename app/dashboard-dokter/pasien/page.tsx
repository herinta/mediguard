import { createClient } from '@/utils/server';
import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddPasienDialog } from '@/components/add-pasien'; // <-- Impor Dialog
import Link from 'next/link'; // <-- Impor Link

// Fungsi helper untuk status
const getStatus = (level: number | null): { text: string; variant: "default" | "destructive" | "secondary" | "outline" } => {
  if (level === null) return { text: 'Belum Ada Data', variant: 'secondary' };
  if (level < 70) return { text: 'Rendah', variant: 'destructive' };
  if (level > 180) return { text: 'Tinggi', variant: 'destructive' };
  return { text: 'Normal', variant: 'default' };
};

export default async function PasienListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Ambil semua pasien (bukan hanya yang terhubung)
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
    .eq('role', 'pasien') // Hanya ambil yang role-nya 'pasien'
    .order('created_at', { referencedTable: 'glucose_entries', ascending: false });

  if (error) {
    return <p>Gagal memuat data pasien: {error.message}</p>;
  }

  // Proses data untuk tabel
  const dataTabel = patients.map(p => {
    if (!p.glucose_entries || p.glucose_entries.length === 0) {
      return {
        id: p.id,
        nama: p.full_name,
        levelTerbaru: null,
        jumlahCatatan: 0,
        status: getStatus(null),
      };
    }
    
    const levelTerbaru = p.glucose_entries[0].glucose_level;
    return {
      id: p.id,
      nama: p.full_name,
      levelTerbaru: levelTerbaru,
      jumlahCatatan: p.glucose_entries.length,
      status: getStatus(levelTerbaru),
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daftar Pasien</CardTitle>
          <CardDescription>
            Berikut adalah daftar semua pasien yang terdaftar di sistem.
          </CardDescription>
        </div>
        {/* --- TOMBOL TAMBAH PASIEN ADA DI SINI --- */}
        <AddPasienDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pasien</TableHead>
              <TableHead>Glukosa Terakhir (mg/dL)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jumlah Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataTabel.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Belum ada pasien terdaftar.
                </TableCell>
              </TableRow>
            )}
            {dataTabel.map((pasien) => (
              <TableRow key={pasien.id}>
                <TableCell className="font-medium">
                  {/* --- Link ke Halaman Detail --- */}
                  <Link
                    href={`/dashboard-dokter/pasien/${pasien.id}`}
                    className="text-violet-600 hover:text-violet-800 hover:underline"
                  >
                    {pasien.nama}
                  </Link>
                </TableCell>
                <TableCell>{pasien.levelTerbaru ?? 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={pasien.status.variant}>
                    {pasien.status.text}
                  </Badge>
                </TableCell>
                <TableCell>{pasien.jumlahCatatan}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}