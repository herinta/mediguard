// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Stethoscope, User } from 'lucide-react';
import { createClient } from '@/utils/client';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'pasien' | 'dokter'>('pasien');
  const router = useRouter();
  
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Sign up pengguna di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Data ini akan diteruskan ke fungsi trigger atau bisa diambil setelahnya
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) {
      alert(authError.message);
      return;
    }

    // 2. Masukkan data ke tabel 'profiles'
    //    Kita harus lakukan ini karena RLS di 'profiles' butuh auth.uid()
    //    Supabase Auth (GoTrue) tidak otomatis mengisi tabel public.
    //    Kita perlu Server Action atau client-side insert SETELAH login
    //    Untuk kesederhanaan, kita asumsikan pengguna akan login setelah ini.
    //    Cara terbaik adalah menggunakan Server Action/Edge Function
    //    yang dipicu 'on user created'.
    
    //    Tapi untuk demo ini, kita akan buat profil setelah sign up
    if (authData.user) {
       const { error: profileError } = await supabase
         .from('profiles')
         .insert({ 
            id: authData.user.id, 
            full_name: fullName, 
            role: role 
          });
          
       if (profileError) {
         alert('Error membuat profil: ' + profileError.message);
         // Hapus user auth jika profil gagal dibuat agar tidak jadi zombie user
         await supabase.auth.admin.deleteUser(authData.user.id);
         return;
       }
    }

    alert('Registrasi berhasil! Silakan login.');
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
          <CardDescription>
            Daftar sebagai Pasien atau Dokter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nama Lengkap</Label>
              <Input
                id="full-name"
                placeholder="Nama Anda"
                required
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="anda@email.com"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Daftar Sebagai</Label>
              <Select onValueChange={(value: any) => setRole(value)} defaultValue="pasien">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih peran Anda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pasien">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Pasien
                    </div>
                  </SelectItem>
                  <SelectItem value="dokter">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Dokter
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
              Daftar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}