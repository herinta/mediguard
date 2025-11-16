'use server';

// PENTING: Impor createServerClient dari /server
import { createClient as createServerClient } from '@/utils/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';

// Impor createClient dari '@supabase/supabase-js' untuk Admin Client
// Kita butuh ini untuk menggunakan SERVICE_ROLE_KEY
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fungsi untuk menganalisis gula darah
async function analyzeGlucose(level: number): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Analisis kadar gula darah ${level} mg/dL untuk seorang pasien. 
      Berikan kesimpulan kesehatan dalam satu kata (Misal: Normal, Rendah, Tinggi, Sangat Tinggi) 
      diikuti dengan satu kalimat saran praktis. 
      Contoh: "Normal. Pertahankan pola makan sehat Anda."
      Contoh: "Tinggi. Kurangi asupan gula dan karbohidrat sederhana hari ini."`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error Analisis Gemini:', error);
    return 'Analisis tidak tersedia saat ini.';
  }
}

// Tipe untuk state form
export type FormState = {
  message: string;
  success: boolean;
};

// --- SERVER ACTION 1: SUBMIT GULA DARAH (UNTUK PASIEN) ---
export async function submitGlucose(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  // --- INI CARA BARU (TANPA MIDDLEWARE) ---

  // 1. Ambil token dari form rahasia yang dikirim dari client
  const accessToken = formData.get('access_token') as string;
  const refreshToken = formData.get('refresh_token') as string;

  if (!accessToken || !refreshToken) {
    return { message: 'Gagal: Token autentikasi tidak ditemukan.', success: false };
  }

  // Buat server client (menggunakan createServerClient)
  const supabase = await createServerClient(); // Ini perbaikan dari error sebelumnya
  
  // 2. Autentikasi Supabase client secara manual dengan token
  const { error: authError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (authError) {
    return { message: `Gagal autentikasi sesi: ${authError.message}`, success: false };
  }

  // 3. Cek sesi pengguna (SEKARANG BARU AKAN BERHASIL)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Gagal: Sesi Anda tidak valid. Silakan login ulang.', success: false };
  }
  
  // --- Akhir Cara Baru ---

  // 4. Ambil data form
  const glucoseLevel = formData.get('glucose_level') as string;
  if (!glucoseLevel || isNaN(Number(glucoseLevel))) {
    return { message: 'Gagal: Level gula darah tidak valid', success: false };
  }

  const level = parseInt(glucoseLevel, 10);

  // 5. Panggil Gemini untuk analisis
  const analysisResult = await analyzeGlucose(level);

  // 6. Simpan ke database
  const { error } = await supabase.from('glucose_entries').insert({
    user_id: user.id,
    glucose_level: level,
    analysis_result: analysisResult,
  });

  if (error) {
    return { message: `Gagal menyimpan: ${error.message}`, success: false };
  }

  // 7. Revalidasi path
  revalidatePath('/dashboard-pasien');
  return { message: 'Sukses! Data telah ditambahkan.', success: true };
}

// --- SERVER ACTION 2: BUAT PASIEN BARU (UNTUK DOKTER) ---
export async function createPatient(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  // 1. Ambil data form
  const name = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 2. Ambil token DOKTER (yang sedang login) dari form
  const accessToken = formData.get('access_token') as string;
  const refreshToken = formData.get('refresh_token') as string;

  if (!accessToken || !refreshToken) {
    return { message: 'Gagal: Token autentikasi dokter tidak ditemukan.', success: false };
  }

  // 3. Autentikasi sebagai DOKTER (untuk mendapatkan ID dokter)
  const supabase = await createServerClient(); // Client SSR standar
  const { error: authError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (authError) {
    return { message: `Gagal autentikasi sesi dokter: ${authError.message}`, success: false };
  }

  const { data: { user: doctor } } = await supabase.auth.getUser();
  if (!doctor) {
    return { message: 'Gagal: Sesi dokter tidak valid. Silakan login ulang.', success: false };
  }

  // 4. Buat client ADMIN (Service Role) untuk membuat user baru
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set!');
    return { message: 'Gagal: Konfigurasi server (service role) tidak ditemukan.', success: false };
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 5. Buat user baru di Auth
  const { data: newPatient, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Otomatis konfirmasi email
    user_metadata: { full_name: name }
  });

  if (createError) {
    return { message: `Gagal membuat pasien: ${createError.message}`, success: false };
  }

  // 6. Buat profile baru di tabel 'profiles'
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: newPatient.user.id,
      full_name: name,
      role: 'pasien',
      doctor_id: doctor.id // <-- Menghubungkan pasien ke dokter ini
    });

  if (profileError) {
    // Jika gagal buat profil, hapus user auth yang baru dibuat (rollback)
    await supabaseAdmin.auth.admin.deleteUser(newPatient.user.id);
    return { message: `Gagal menyimpan profil: ${profileError.message}`, success: false };
  }

  // 7. Revalidasi dan sukses
  revalidatePath('/dashboard-dokter/pasien');
  return { message: 'Sukses! Pasien baru telah ditambahkan.', success: true };
}