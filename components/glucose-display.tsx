// components/GlucoseDisplay.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { HeartPulse } from 'lucide-react';

// Tipe data dari Supabase (sesuaikan dengan tabel Anda)
type GlucoseEntry = {
  id: number;
  created_at: string;
  glucose_level: number;
  analysis_result: string | null;
};

// Fungsi helper untuk format tanggal
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function GlucoseDisplay({ data }: { data: GlucoseEntry[] }) {
  // Format data untuk grafik
  const chartData = data
    .map((entry) => ({
      name: new Date(entry.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      }),
      level: entry.glucose_level,
    }))
    .reverse(); // Balik agar data terbaru di kanan

  return (
    <div className="space-y-6">
      {/* 1. Grafik Gula Darah */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="text-violet-500" />
            Grafik Gula Darah
          </CardTitle>
          <CardDescription>Tren gula darah Anda dari waktu ke waktu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#8b5cf6" // Warna ungu
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Riwayat Gula Darah */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Riwayat Catatan Gula Darah</CardTitle>
          <CardDescription>
            Analisis dibantu oleh Gemini AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Level (mg/dL)</TableHead>
                <TableHead>Analisis Gemini</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              )}
              {data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.created_at)}</TableCell>
                  <TableCell className="font-medium">
                    {entry.glucose_level}
                  </TableCell>
                  <TableCell>{entry.analysis_result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}