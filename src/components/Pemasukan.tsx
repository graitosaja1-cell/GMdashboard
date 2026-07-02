import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { PemasukanRekap } from "../types";
import { 
  Upload, 
  Download, 
  FileJson, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle,
  TrendingUp,
  Receipt,
  PiggyBank,
  CheckCircle2
} from "lucide-react";

interface PemasukanProps {
  rekapList: PemasukanRekap[];
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  onAddRekaps: (rekaps: Omit<PemasukanRekap, "id">[]) => Promise<void>;
  onDeleteRekap: (id: string) => Promise<void>;
  onEditRekap: (rekap: PemasukanRekap) => Promise<void>;
}

export default function Pemasukan({
  rekapList,
  activeMonth,
  setActiveMonth,
  onAddRekaps,
  onDeleteRekap,
  onEditRekap,
}: PemasukanProps) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Editing State
  const [editingRekap, setEditingRekap] = useState<PemasukanRekap | null>(null);

  // Loading indicator for spreadsheet uploads
  const [uploadLoading, setUploadLoading] = useState(false);

  // Month select options
  const monthsList = [
    { value: "2026-05", label: "Mei 2026" },
    { value: "2026-06", label: "Juni 2026" },
    { value: "2026-07", label: "Juli 2026" },
    { value: "2026-08", label: "Agustus 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-10", label: "Oktober 2026" },
  ];

  // Helper formatting currency
  const formatRp = (amount: number) => {
    return "Rp" + Math.round(amount).toLocaleString("id-ID");
  };

  // Utilities for Excel parsing (mirroring original code logic)
  const ambilAngkaDariCell = (row: any[], kolomIndeks: number): number => {
    const val = row[kolomIndeks];
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      let bersih = val.replace(/\./g, "").replace(",", ".").replace(/[^\d\-.]/g, "");
      if (bersih === "") return 0;
      return parseFloat(bersih) || 0;
    }
    return 0;
  };

  const cariBarisBerisiTeks = (data: any[][], teks: string): number => {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (typeof cell === "string" && cell.toLowerCase().includes(teks.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  };

  const ekstrakTanggalDariSheet = (data: any[][]): string | null => {
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (typeof cell === "string") {
          const match = cell.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (match) {
            return match[1] + "-" + match[2]; // DD-MM format
          }
        }
      }
    }
    return null;
  };

  // Sorting: sort by day ascending
  const sortedData = useMemo(() => {
    return [...rekapList].sort((a, b) => {
      const da = a.tanggal.split("-");
      const db = b.tanggal.split("-");
      const dayA = parseInt(da[0]) || 0;
      const monA = parseInt(da[1]) || 0;
      const dayB = parseInt(db[0]) || 0;
      const monB = parseInt(db[1]) || 0;

      if (monA !== monB) return monA - monB;
      return dayA - dbDayCheck(dayB);
    });

    function dbDayCheck(day: number) { return day; }
  }, [rekapList]);

  // Summaries
  const summaries = useMemo(() => {
    let totalCash = 0;
    let totalTransfer = 0;
    let grandTotal = 0;

    rekapList.forEach((item) => {
      totalCash += item.totalCash || 0;
      totalTransfer += item.totalTransfer || 0;
      grandTotal += item.grandTotal || 0;
    });

    return { totalCash, totalTransfer, grandTotal };
  }, [rekapList]);

  // Paginated Data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage]);

  // Handle excel upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        
        const results: Omit<PemasukanRekap, "id">[] = [];

        sheetNames.forEach((sheetName) => {
          // Exclude sheets containing "sheet2" or "template"
          if (sheetName.toLowerCase().includes("sheet2") || sheetName.toLowerCase().includes("template")) {
            return;
          }

          const sheet = workbook.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          const tanggal = ekstrakTanggalDariSheet(rows);
          if (!tanggal) return;

          let piutangCash = 0;
          let piutangTransfer = 0;
          let idxPiutang = cariBarisBerisiTeks(rows, "UANG MASUK DARI PIUTANG");
          if (idxPiutang !== -1) {
            const row = rows[idxPiutang];
            const cashMinyak = ambilAngkaDariCell(row, 9);
            const transferMinyak = ambilAngkaDariCell(row, 10);
            const cashRupa = ambilAngkaDariCell(row, 11);
            const transferRupa = ambilAngkaDariCell(row, 12);
            piutangCash = cashMinyak + cashRupa;
            piutangTransfer = transferMinyak + transferRupa;
          }

          let penjualanCash = 0;
          let penjualanTransfer = 0;
          let idxPenjualan = cariBarisBerisiTeks(rows, "UANG MASUK PENJUALAN CASH");
          if (idxPenjualan === -1) {
            idxPenjualan = cariBarisBerisiTeks(rows, "UANG MASUK CASH");
          }
          if (idxPenjualan !== -1) {
            const row = rows[idxPenjualan];
            const cashMinyak = ambilAngkaDariCell(row, 9);
            const transferMinyak = ambilAngkaDariCell(row, 10);
            const cashRupa = ambilAngkaDariCell(row, 11);
            const transferRupa = ambilAngkaDariCell(row, 12);
            penjualanCash = cashMinyak + cashRupa;
            penjualanTransfer = transferMinyak + transferRupa;
          }

          results.push({
            tanggal,
            piutangCash,
            piutangTransfer,
            penjualanCash,
            penjualanTransfer,
            totalCash: piutangCash + penjualanCash,
            totalTransfer: piutangTransfer + penjualanTransfer,
            grandTotal: piutangCash + piutangTransfer + penjualanCash + penjualanTransfer,
            month: activeMonth,
          });
        });

        if (results.length === 0) {
          alert("Tidak ada data harian valid yang ditemukan di file excel!");
          setUploadLoading(false);
          return;
        }

        if (confirm(`Apakah Anda yakin ingin menambahkan/memperbarui rekap ${results.length} hari baru untuk bulan ${activeMonth}?`)) {
          await onAddRekaps(results);
          alert(`Berhasil mengimpor rekap harian ${results.length} hari!`);
        }
      } catch (err: any) {
        console.error(err);
        alert("Gagal membaca file excel: " + err.message);
      } finally {
        setUploadLoading(false);
        e.target.value = ""; // reset file input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportJson = () => {
    if (rekapList.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    const blob = new Blob([JSON.stringify(rekapList, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pemasukan_gajah_mas_${activeMonth}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = async () => {
    if (!editingRekap) return;
    try {
      const piutangCash = editingRekap.piutangCash || 0;
      const piutangTransfer = editingRekap.piutangTransfer || 0;
      const penjualanCash = editingRekap.penjualanCash || 0;
      const penjualanTransfer = editingRekap.penjualanTransfer || 0;

      const updated: PemasukanRekap = {
        ...editingRekap,
        totalCash: piutangCash + penjualanCash,
        totalTransfer: piutangTransfer + penjualanTransfer,
        grandTotal: piutangCash + piutangTransfer + penjualanCash + penjualanTransfer,
      };

      await onEditRekap(updated);
      setEditingRekap(null);
      alert("Data rekap berhasil diupdate!");
    } catch (e: any) {
      alert("Gagal mengupdate rekap: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div id="pemasukan_header" className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              Rekap Uang Masuk Harian
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Unggah file Excel Laporan Uang Masuk Harian per sheet per tanggal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pilih Bulan:</span>
            <select
              id="select_pemasukan_month"
              value={activeMonth}
              onChange={(e) => {
                setActiveMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Panel */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-700/60">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Upload className="w-4 h-4" />
              <span>{uploadLoading ? "Membaca Sheet..." : "Unggah Excel Laporan"}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
                disabled={uploadLoading}
              />
            </label>
            <span className="text-xs text-slate-400">
              Total pencatatan: <strong className="text-white">{rekapList.length}</strong> hari
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors border border-slate-600"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div id="pemasukan_cards_group" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cash */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Uang Cash (Fisik)</span>
            <p className="text-2xl font-extrabold text-white mt-1">{formatRp(summaries.totalCash)}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transfer */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transfer (Rekening)</span>
            <p className="text-2xl font-extrabold text-white mt-1">{formatRp(summaries.totalTransfer)}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total Masuk</span>
            <p className="text-2xl font-extrabold text-blue-400 mt-1">{formatRp(summaries.grandTotal)}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div id="pemasukan_table_container" className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
                <th className="py-3 px-4">Tanggal (Hari-Bulan)</th>
                <th className="py-3 px-4 text-right">Piutang Cash</th>
                <th className="py-3 px-4 text-right">Piutang Transfer</th>
                <th className="py-3 px-4 text-right">Penjualan Cash</th>
                <th className="py-3 px-4 text-right">Penjualan Transfer</th>
                <th className="py-3 px-4 text-right">Total Cash</th>
                <th className="py-3 px-4 text-right">Total Transfer</th>
                <th className="py-3 px-4 text-right font-bold text-blue-400">Grand Total</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs text-slate-300">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600 animate-bounce" />
                      <span>Belum ada rekap uang masuk harian. Unggah file excel Anda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-white">{item.tanggal}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">{formatRp(item.piutangCash)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">{formatRp(item.piutangTransfer)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">{formatRp(item.penjualanCash)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">{formatRp(item.penjualanTransfer)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400 font-mono">{formatRp(item.totalCash)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-blue-400 font-mono">{formatRp(item.totalTransfer)}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-white font-mono bg-blue-500/5">{formatRp(item.grandTotal)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          title="Edit"
                          onClick={() => setEditingRekap(item)}
                          className="p-1.5 hover:bg-amber-500/15 hover:text-amber-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          title="Hapus"
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus rekap harian tanggal ${item.tanggal}?`)) {
                              onDeleteRekap(item.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-500/15 hover:text-red-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {sortedData.length > 0 && (
          <div className="p-4 bg-slate-900/60 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Menampilkan <strong className="text-slate-200">{(currentPage - 1) * rowsPerPage + 1}</strong> - <strong className="text-slate-200">{Math.min(currentPage * rowsPerPage, sortedData.length)}</strong> dari <strong className="text-slate-200">{sortedData.length}</strong> hari rekap
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-30 disabled:pointer-events-none border border-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 px-3 font-semibold">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-30 disabled:pointer-events-none border border-slate-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Rekap Modal */}
      {editingRekap && (
        <div id="edit_rekap_modal_backdrop" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div id="edit_rekap_modal_box" className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-md">Edit Data Rekap Uang Masuk</h3>
              <button
                onClick={() => setEditingRekap(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tanggal (Hari-Bulan)</label>
                <input
                  type="text"
                  value={editingRekap.tanggal}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Piutang Cash</label>
                  <input
                    type="number"
                    value={editingRekap.piutangCash}
                    onChange={(e) => setEditingRekap({ ...editingRekap, piutangCash: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Piutang Transfer</label>
                  <input
                    type="number"
                    value={editingRekap.piutangTransfer}
                    onChange={(e) => setEditingRekap({ ...editingRekap, piutangTransfer: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Penjualan Cash</label>
                  <input
                    type="number"
                    value={editingRekap.penjualanCash}
                    onChange={(e) => setEditingRekap({ ...editingRekap, penjualanCash: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Penjualan Transfer</label>
                  <input
                    type="number"
                    value={editingRekap.penjualanTransfer}
                    onChange={(e) => setEditingRekap({ ...editingRekap, penjualanTransfer: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/60 divide-y divide-slate-700/50 text-xs">
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Total Uang Cash:</span>
                  <strong className="text-white font-mono">{formatRp((editingRekap.piutangCash || 0) + (editingRekap.penjualanCash || 0))}</strong>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Total Uang Transfer:</span>
                  <strong className="text-white font-mono">{formatRp((editingRekap.piutangTransfer || 0) + (editingRekap.penjualanTransfer || 0))}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-400 font-bold">Grand Total:</span>
                  <strong className="text-blue-400 font-mono text-sm">{formatRp((editingRekap.piutangCash || 0) + (editingRekap.piutangTransfer || 0) + (editingRekap.penjualanCash || 0) + (editingRekap.penjualanTransfer || 0))}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border-t border-slate-700 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingRekap(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
