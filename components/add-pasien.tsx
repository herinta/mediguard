'use client';

import { useEffect, useState, useRef } from 'react';
import { type Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'; // <-- Import useRouter

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/client'; // <-- Pakai client-side

// Tombol Submit tidak perlu diubah
function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className="bg-violet-600 hover:bg-violet-700">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? 'Menyimpan...' : 'Simpan Pasien'}
    </Button>
  );
}

export function AddPasienDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter(); // <-- Untuk refresh halaman
  const supabase = createClient();
  
  // State untuk form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // State untuk UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  // State untuk sesi dokter (PENTING)
  const [doctorSession, setDoctorSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // 1. Ambil sesi DOKTER saat komponen dimuat
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setDoctorSession(data.session);
      setLoadingSession(false);
    };
    getSession();
  }, []);

  // 2. Logika handle submit, persis seperti register/page.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (!doctorSession) {
      setMessage('Sesi dokter tidak ditemukan. Silakan login ulang.');
      setIsSubmitting(false);
      return;
    }

    // Simpan info dokter SEKARANG, sebelum kita logout
    const doctorId = doctorSession.user.id;
    const doctorTokens = {
      access_token: doctorSession.access_token,
      refresh_token: doctorSession.refresh_token,
    };

    // 3. Daftarkan PASIEN BARU (ini akan me-logout dokter)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage(`Gagal mendaftar: ${authError.message}`);
      setIsSubmitting(false);
      return;
    }

    // 4. Masukkan profil PASIEN BARU (seperti di register)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          id: authData.user.id, 
          full_name: fullName, 
          role: 'pasien', // <-- Role di-set otomatis
          doctor_id: doctorId // <-- ID Dokter di-set otomatis
        });
          
      if (profileError) {
        setMessage(`Gagal membuat profil: ${profileError.message}`);
        // Kita tidak bisa hapus user auth di sini tanpa admin key
        // jadi kita biarkan, tapi kita harus login-kan dokter kembali
      } else {
        setMessage('Pasien baru berhasil dibuat!');
      }
    }

    // 5. KEMBALIKAN SESI DOKTER (Paling Penting)
    // Kita "logout" pasien baru dan "login" kan kembali si dokter
    const { error: restoreError } = await supabase.auth.setSession(doctorTokens);
    
    if (restoreError) {
      setMessage('Pasien dibuat, TAPI gagal login ulang. Silakan login manual.');
      router.push('/login'); // Paksa ke login jika gagal
    }

    setIsSubmitting(false);

    if (!profileError && !restoreError) {
      setOpen(false); // Tutup dialog
      router.refresh(); // Refresh halaman list pasien
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pasien
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pasien Baru</DialogTitle>
          <DialogDescription>
            Buat akun baru untuk pasien. Mereka akan bisa login dengan email dan password ini.
          </DialogDescription>
        </DialogHeader>
        {/* --- FORM DIUBAH JADI onSubmit --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {loadingSession && <Loader2 className="animate-spin" />}

          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap Pasien</Label>
            <Input id="full_name" name="full_name" required onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Pasien</Label>
            <Input id="email" name="email" type="email" required onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password Pasien</Label>
            <Input id="password" name="password" type="password" minLength={6} required onChange={(e) => setPassword(e.target.value)} />
          </div>
          
          {message && (
            <p className={`text-sm ${message.includes('Gagal') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Batal</Button>
            <SubmitButton pending={isSubmitting} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}