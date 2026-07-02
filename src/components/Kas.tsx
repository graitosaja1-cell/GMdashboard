import { useState, useEffect } from "react";
import { KasData } from "../types";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  Save, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface KasProps {
  kasData: KasData | null;
  totalPemasukan: number;
  activeMonth: string;
  onSaveKas: (data: Omit<KasData, "id" | "month">) => Promise<void>;
}

export default function Kas({
  kasData,
  totalPemasukan,
  activeMonth,
  onSaveKas,
}: KasProps) {
  // Input states mirroring KasData
  const [bcaOpAwal, setBcaOpAwal] = useState(0);
  const [bcaEscrowAwal, setBcaEscrowAwal] = useState(0);
  const [bcaLamaAwal, setBcaLamaAwal] = useState(0);
  const [brankasAwal, setBrankasAwal] = useState(0);

  const [bcaOpAkhir, setBcaOpAkhir] = useState(0);
  const [bcaEscrowAkhir, setBcaEscrowAkhir] = useState(0);
  const [bcaLamaAkhir, setBcaLamaAkhir] = useState(0);
  const [brankasAkhir, setBrankasAkhir] = useState(0);

  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  // Sync state with incoming props
  useEffect(() => {
    if (kasData) {
      setBcaOpAwal(kasData.saldoAwalBcaOp || 0);
      setBcaEscrowAwal(kasData.saldoAwalBcaEscrow || 0);
      setBcaLamaAwal(kasData.saldoAwalBcaLama || 0);
      setBrankasAwal(kasData.saldoAwalBrankas || 0);

      setBcaOpAkhir(kasData.saldoAkhirBcaOp || 0);
      setBcaEscrowAkhir(kasData.saldoAkhirBcaEscrow || 0);
      setBcaLamaAkhir(kasData.saldoAkhirBcaLama || 0);
      setBrankasAkhir(kasData.saldoAkhirBrankas || 0);

      setTotalPengeluaran(kasData.totalPengeluaranManual || 0);
    } else {
      // Clear inputs for clean slate
      setBcaOpAwal(0);
      setBcaEscrowAwal(0);
      setBcaLamaAwal(0);
      setBrankasAwal(0);
      setBcaOpAkhir(0);
      setBcaEscrowAkhir(0);
      setBcaLamaAkhir(0);
      setBrankasAkhir(0);
      setTotalPengeluaran(0);
    }
  }, [kasData, activeMonth]);

  // Helper formatting currency
  const formatRp = (amount: number) => {
    return "Rp" + Math.round(amount).toLocaleString("id-ID");
  };

  const totalSaldoAwal = bcaOpAwal + bcaEscrowAwal + bcaLamaAwal + brankasAwal;
  const totalSaldoAkhir = bcaOpAkhir + bcaEscrowAkhir + bcaLamaAkhir + brankasAkhir;
  const saldoFinal = totalSaldoAwal + totalPemasukan - totalPengeluaran;

  // Save handler
  const handleSaveAll = async (section: string) => {
    try {
      await onSaveKas({
        saldoAwalBcaOp: bcaOpAwal,
        saldoAwalBcaEscrow: bcaEscrowAwal,
        saldoAwalBcaLama: bcaLamaAwal,
        saldoAwalBrankas: brankasAwal,
        saldoAkhirBcaOp: bcaOpAkhir,
        saldoAkhirBcaEscrow: bcaEscrowAkhir,
        saldoAkhirBcaLama: bcaLamaAkhir,
        saldoAkhirBrankas: brankasAkhir,
        totalPengeluaranManual: totalPengeluaran,
      });
      alert(`Berhasil menyimpan data ${section}!`);
    } catch (e: any) {
      alert("Gagal menyimpan data Kas: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div id="kas_header" className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl pointer-events-none rounded-full" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Laporan Saldo & Arus Kas ({activeMonth})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Catat saldo awal/akhir rekening operasional, brankas, serta input pengeluaran bulanan.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Saldo Awal & Saldo Akhir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Saldo Awal Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                🏁 Saldo Awal Rekening
              </h3>
              <span className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded-md text-slate-300 font-semibold font-mono">
                {activeMonth}
              </span>
            </div>

            <div className="space-y-4">
              {/* BCA CV Operasional */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">BCA CV Operasional</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={bcaOpAwal || ""}
                    onChange={(e) => setBcaOpAwal(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* BCA CV Escrow */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">BCA CV Escrow</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={bcaEscrowAwal || ""}
                    onChange={(e) => setBcaEscrowAwal(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* BCA Lama */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">BCA Lama</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={bcaLamaAwal || ""}
                    onChange={(e) => setBcaLamaAwal(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Brankas */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">Kas Fisik (Brankas)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={brankasAwal || ""}
                    onChange={(e) => setBrankasAwal(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Saldo Awal:</span>
              <p className="text-md font-bold text-white font-mono mt-0.5">{formatRp(totalSaldoAwal)}</p>
            </div>
            <button
              onClick={() => handleSaveAll("Saldo Awal")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Saldo Awal
            </button>
          </div>
        </div>

        {/* Saldo Akhir Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                🏁 Saldo Akhir Rekening
              </h3>
              <span className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded-md text-slate-300 font-semibold font-mono">
                {activeMonth}
              </span>
            </div>

            <div className="space-y-4">
              {/* BCA CV Operasional */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">BCA CV Operasional</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={bcaOpAkhir || ""}
                    onChange={(e) => setBcaOpAkhir(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* BCA CV Escrow */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">BCA CV Escrow</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={bcaEscrowAkhir || ""}
                    onChange={(e) => setBcaEscrowAkhir(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* BCA Lama */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">BCA Lama</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={bcaLamaAkhir || ""}
                    onChange={(e) => setBcaLamaAkhir(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Brankas */}
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs text-slate-300 font-semibold">Kas Fisik (Brankas)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    value={brankasAkhir || ""}
                    onChange={(e) => setBrankasAkhir(parseFloat(e.target.value) || 0)}
                    className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white text-right focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Saldo Akhir:</span>
              <p className="text-md font-bold text-white font-mono mt-0.5">{formatRp(totalSaldoAkhir)}</p>
            </div>
            <button
              onClick={() => handleSaveAll("Saldo Akhir")}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Saldo Akhir
            </button>
          </div>
        </div>

      </div>

      {/* Grid: Arus Masuk & Keluar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Pemasukan (Read Only) */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Total Pemasukan Bulan Ini
            </span>
            <p className="text-2xl font-black text-white">{formatRp(totalPemasukan)}</p>
            <p className="text-[10px] text-slate-400">
              * Terhitung otomatis dari akumulasi Uang Masuk Harian di halaman Pemasukan.
            </p>
          </div>
        </div>

        {/* Total Pengeluaran (Input Manual) */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4 text-red-500" /> Total Pengeluaran Manual
              </span>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-sm">Rp</span>
                <input
                  type="number"
                  value={totalPengeluaran || ""}
                  onChange={(e) => setTotalPengeluaran(parseFloat(e.target.value) || 0)}
                  className="w-56 pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-md font-mono text-white text-right font-bold focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={() => handleSaveAll("Pengeluaran")}
              className="sm:self-end flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Pengeluaran
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            * Diisi manual sesuai dengan pengeluaran operasional usaha. Klik simpan untuk mensinkronisasi ke database.
          </p>
        </div>

      </div>

      {/* Saldo Final Section */}
      <div className="bg-blue-900/30 border-2 border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />
        
        <h3 className="font-bold text-white text-md flex items-center gap-2 mb-3">
          <Scale className="w-5 h-5 text-blue-400 animate-spin-slow" />
          📊 Kalkulasi Saldo Final
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-y border-blue-500/20 text-xs">
          <div>
            <span className="text-blue-300/80 font-semibold block uppercase tracking-wider">Saldo Awal Terbuku</span>
            <strong className="text-white text-lg font-mono block mt-1">{formatRp(totalSaldoAwal)}</strong>
          </div>
          <div>
            <span className="text-blue-300/80 font-semibold block uppercase tracking-wider">Total Pemasukan (+)</span>
            <strong className="text-emerald-400 text-lg font-mono block mt-1">+{formatRp(totalPemasukan)}</strong>
          </div>
          <div>
            <span className="text-blue-300/80 font-semibold block uppercase tracking-wider">Total Pengeluaran (-)</span>
            <strong className="text-red-400 text-lg font-mono block mt-1">-{formatRp(totalPengeluaran)}</strong>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Rumus: Saldo Awal + Pemasukan – Pengeluaran</span>
            <p className="text-3xl font-black text-blue-400 font-mono mt-1.5">{formatRp(saldoFinal)}</p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-2 max-w-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Saldo Final teoritis di atas sebaiknya sesuai atau mendekati nilai <strong className="text-white font-mono">Total Saldo Akhir ({formatRp(totalSaldoAkhir)})</strong> untuk memastikan tidak ada selisih kas fisik/transfer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
