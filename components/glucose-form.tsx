// components/GlucoseForm.tsx
'use client';

// Impor yang baru:
import { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitGlucose, type FormState } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import { createClient } from '@/utils/client';

// Tombol Submit tidak berubah
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-violet-600 hover:bg-violet-700"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Menganalisis...' : 'Simpan Catatan'}
    </Button>
  );
}

export function GlucoseForm() {
  const initialState: FormState = { message: '', success: false };
  const [state, formAction] = useActionState(submitGlucose, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  
  // --- TAMBAHAN BARU: State untuk menyimpan sesi ---
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ambil sesi login di sisi client
  useEffect(() => {
    const supabase = createClient();
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSession();
  }, []);
  // --- Akhir Tambahan ---

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  // Tampilkan loading jika sesi belum didapat
  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          <span className="ml-2">Memuat form...</span>
        </CardContent>
      </Card>
    );
  }

  // Jika tidak login
  if (!session) {
     return (
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <p className="text-red-600 text-center">
            Sesi Anda tidak ditemukan. Silakan logout dan login kembali.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Catat Gula Darah Harian</CardTitle>
        <CardDescription>
          Masukkan hasil pengecekan Anda hari ini (mg/dL).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          
          {/* --- INPUT RAHASIA UNTUK TOKEN --- */}
          <input 
            type="hidden" 
            name="access_token" 
            value={session.access_token} 
          />
          <input 
            type="hidden" 
            name="refresh_token" 
            value={session.refresh_token} 
          />
          {/* --- Akhir Input Rahasia --- */}

          <div className="space-y-2">
            <Label htmlFor="glucose-level">Level Gula Darah (mg/dL)</Label>
            <Input
              id="glucose-level"
              name="glucose_level"
              type="number"
              placeholder="Contoh: 110"
              required
            />
          </div>
          <SubmitButton />
          {state.message && (
            <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
              {state.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}