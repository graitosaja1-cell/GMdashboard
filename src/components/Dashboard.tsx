import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { SalesTransaction } from "../types";
import { 
  Upload, 
  Download, 
  FileJson, 
  Calendar, 
  User, 
  Package, 
  CreditCard, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Coins,
  DollarSign,
  AlertCircle
} from "lucide-react";

interface DashboardProps {
  transactions: SalesTransaction[];
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  onAddTransactions: (txs: Omit<SalesTransaction, "id">[]) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onEditTransaction: (tx: SalesTransaction) => Promise<void>;
}

export default function Dashboard({
  transactions,
  activeMonth,
  setActiveMonth,
  onAddTransactions,
  onDeleteTransaction,
  onEditTransaction,
}: DashboardProps) {
  // Filter States
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterSales, setFilterSales] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  // Search apply state
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedSales, setAppliedSales] = useState("");
  const [appliedProduct, setAppliedProduct] = useState("");
  const [appliedPayment, setAppliedPayment] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Editing State
  const [editingTx, setEditingTx] = useState<SalesTransaction | null>(null);

  // File import state
  const [uploadLoading, setUploadLoading] = useState(false);

  // Available months (static list for selection)
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

  const calculateProfit = (tx: SalesTransaction) => {
    return (tx.nominal || 0) - ((tx.qty || 0) * (tx.harga_beli || 0));
  };

  // 1. Month-level statistics (unfiltered for this month)
  const stats = useMemo(() => {
    let totalOmset = 0;
    let cashOmset = 0;
    let cashProfit = 0;
    let tempoOmset = 0;
    let tempoProfit = 0;

    transactions.forEach((tx) => {
      const profit = calculateProfit(tx);
      totalOmset += tx.nominal || 0;
      if (tx.bayar === "Cash") {
        cashOmset += tx.nominal || 0;
        cashProfit += profit;
      } else {
        tempoOmset += tx.nominal || 0;
        tempoProfit += profit;
      }
    });

    return { totalOmset, cashOmset, cashProfit, tempoOmset, tempoProfit };
  }, [transactions]);

  // Unique options for filter dropdowns based on all items in active month
  const filterOptions = useMemo(() => {
    const salesSet = new Set<string>();
    const productsSet = new Set<string>();

    transactions.forEach((tx) => {
      if (tx.sales) salesSet.add(tx.sales);
      if (tx.produk) productsSet.add(tx.produk);
    });

    return {
      sales: Array.from(salesSet).sort(),
      products: Array.from(productsSet).sort(),
    };
  }, [transactions]);

  // 2. Filtered data list
  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      if (appliedStartDate && tx.tanggal < appliedStartDate) return false;
      if (appliedEndDate && tx.tanggal > appliedEndDate) return false;
      if (appliedSales && tx.sales !== appliedSales) return false;
      if (appliedProduct && tx.produk !== appliedProduct) return false;
      if (appliedPayment && tx.bayar !== appliedPayment) return false;
      return true;
    });
  }, [transactions, appliedStartDate, appliedEndDate, appliedSales, appliedProduct, appliedPayment]);

  // Filter apply handlers
  const handleApplyFilter = () => {
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
    setAppliedSales(filterSales);
    setAppliedProduct(filterProduct);
    setAppliedPayment(filterPayment);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterSales("");
    setFilterProduct("");
    setFilterPayment("");

    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedSales("");
    setAppliedProduct("");
    setAppliedPayment("");
    setCurrentPage(1);
  };

  // Stats for filtered data
  const filteredStats = useMemo(() => {
    let totalNominal = 0;
    let totalProfit = 0;
    filteredData.forEach((tx) => {
      totalNominal += tx.nominal || 0;
      totalProfit += calculateProfit(tx);
    });
    return { totalNominal, totalProfit, count: filteredData.length };
  }, [filteredData]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

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
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(firstSheet);
        
        if (json.length === 0) {
          alert("File excel kosong!");
          setUploadLoading(false);
          return;
        }

        const headers = Object.keys(json[0]);
        const findColumn = (keywords: string[]) => {
          for (let kw of keywords) {
            const found = headers.find(h => h.toLowerCase().trim() === kw.toLowerCase().trim());
            if (found) return found;
          }
          for (let kw of keywords) {
            const found = headers.find(h => h.toLowerCase().includes(kw.toLowerCase()));
            if (found) return found;
          }
          return null;
        };

        const colTanggal = findColumn(["tanggal", "tgl", "date"]);
        const colSales = findColumn(["sales", "nama sales", "salesman"]);
        const colProduk = findColumn(["produk", "item", "barang"]);
        const colQty = findColumn(["qty", "quantity", "jumlah"]);
        const colHargaBeli = findColumn(["harga beli", "hb", "cost", "modal"]);
        const colNominal = findColumn(["total nominal", "nominal", "total", "omset"]);
        const colBayar = findColumn(["bayar", "metode", "pembayaran"]);

        const missing = [];
        if (!colTanggal) missing.push("Tanggal");
        if (!colSales) missing.push("Sales");
        if (!colProduk) missing.push("Produk");
        if (!colQty) missing.push("QTY");
        if (!colHargaBeli) missing.push("Harga Beli");
        if (!colNominal) missing.push("Nominal");
        if (!colBayar) missing.push("Bayar");

        if (missing.length > 0) {
          alert("Format kolom tidak sesuai. Kolom hilang: " + missing.join(", "));
          setUploadLoading(false);
          return;
        }

        const parsedTxs = json.map((row) => {
          const getVal = (col: string | null) => col ? row[col] : undefined;
          let tanggalVal = getVal(colTanggal);
          let tanggalStr = "";
          
          if (tanggalVal) {
            if (typeof tanggalVal === "number") {
              // Excel Date Serial
              const d = new Date((tanggalVal - 25569) * 86400 * 1000);
              if (!isNaN(d.getTime())) {
                tanggalStr = d.toISOString().slice(0, 10);
              }
            } else {
              let str = String(tanggalVal).trim();
              if (str.includes(" ")) str = str.split(" ")[0];
              const d = new Date(str);
              if (!isNaN(d.getTime())) {
                tanggalStr = d.toISOString().slice(0, 10);
              } else if (str.length >= 10 && str[4] === "-" && str[7] === "-") {
                tanggalStr = str.slice(0, 10);
              } else {
                tanggalStr = str;
              }
            }
          }

          const sales = getVal(colSales) ? String(getVal(colSales)).trim() : "";
          const produk = getVal(colProduk) ? String(getVal(colProduk)).trim() : "";
          const qty = parseFloat(String(getVal(colQty)).replace(/,/g, "")) || 0;
          const harga_beli = parseFloat(String(getVal(colHargaBeli)).replace(/,/g, "")) || 0;
          const nominal = parseFloat(String(getVal(colNominal)).replace(/,/g, "")) || 0;
          const bayar = getVal(colBayar) ? String(getVal(colBayar)).trim() : "Cash";

          return {
            tanggal: tanggalStr,
            sales,
            produk,
            qty,
            harga_beli,
            nominal,
            bayar: bayar.toLowerCase().includes("tempo") ? "Tempo" : "Cash",
            month: activeMonth,
          };
        });

        // Filter valid data
        const validTxs = parsedTxs.filter(item => item.sales || item.produk || item.nominal !== 0);
        if (validTxs.length === 0) {
          alert("Data transaksi tidak valid!");
          setUploadLoading(false);
          return;
        }

        if (confirm(`Apakah Anda yakin ingin menambahkan ${validTxs.length} transaksi baru untuk bulan ${activeMonth}?`)) {
          await onAddTransactions(validTxs);
          alert(`Berhasil menambahkan ${validTxs.length} transaksi!`);
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

  // Export JSON file
  const handleExportJson = () => {
    if (transactions.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_gajah_mas_${activeMonth}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save edit changes
  const handleSaveEdit = async () => {
    if (!editingTx) return;
    try {
      await onEditTransaction(editingTx);
      setEditingTx(null);
      alert("Transaksi berhasil diupdate!");
    } catch (e: any) {
      alert("Gagal mengupdate transaksi: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div id="dashboard_header" className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Laporan Penjualan (Sales)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload data penjualan harian, filter, edit transaksi secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pilih Bulan:</span>
            <select
              id="select_active_month"
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

        {/* Upload/Export Area */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-700/60">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Upload className="w-4 h-4" />
              <span>{uploadLoading ? "Mengunggah..." : "Unggah Excel (.xlsx)"}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
                disabled={uploadLoading}
              />
            </label>
            <span className="text-xs text-slate-400">
              Total data: <strong className="text-white">{transactions.length}</strong> transaksi
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn_export_json"
              onClick={handleExportJson}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors border border-slate-600"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Bulan Aktif */}
      <div id="stats_group_month" className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          📊 Ringkasan Keseluruhan ({monthsList.find(m => m.value === activeMonth)?.label})
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Omset</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{formatRp(stats.totalOmset)}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Omset Cash</span>
            <p className="text-lg font-bold text-white mt-1">{formatRp(stats.cashOmset)}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md border-l-4 border-l-emerald-600">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Profit Cash</span>
            <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">{formatRp(stats.cashProfit)}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md border-l-4 border-l-blue-500">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Omset Tempo</span>
            <p className="text-lg font-bold text-white mt-1">{formatRp(stats.tempoOmset)}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md border-l-4 border-l-blue-600">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Profit Tempo</span>
            <p className="text-lg font-bold text-blue-400 mt-1 font-mono">{formatRp(stats.tempoProfit)}</p>
          </div>
        </div>
      </div>

      {/* Ringkasan Filter */}
      <div id="stats_group_filter" className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          🔍 Ringkasan Hasil Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nominal Terfilter</span>
              <p className="text-xl font-extrabold text-white mt-1">{formatRp(filteredStats.totalNominal)}</p>
            </div>
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Profit Terfilter</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{formatRp(filteredStats.totalProfit)}</p>
            </div>
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Transaksi Cocok</span>
              <p className="text-xl font-extrabold text-white mt-1">{filteredStats.count} Transaksi</p>
            </div>
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div id="filter_panel" className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-700 pb-2.5">
          <Search className="w-4 h-4 text-blue-500" />
          <span>Saring Data Penjualan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Tanggal Mulai */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Mulai Tanggal
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tanggal Akhir */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Sampai Tanggal
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sales Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" /> Nama Sales
            </label>
            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Sales</option>
              {filterOptions.sales.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Produk Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-500" /> Jenis Produk
            </label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Produk</option>
              {filterOptions.products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Pembayaran Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Pembayaran
            </label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua</option>
              <option value="Cash">Cash</option>
              <option value="Tempo">Tempo</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-700/60">
          <button
            onClick={handleResetFilter}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            ↻ Reset Filter
          </button>
          <button
            onClick={handleApplyFilter}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
          >
            ✅ Terapkan Saringan
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div id="sales_table_container" className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4 text-center">QTY</th>
                <th className="py-3 px-4 text-right">Harga Beli</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-right">Profit</th>
                <th className="py-3 px-4 text-center">Bayar</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs text-slate-300">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600 animate-bounce" />
                      <span>Belum ada data untuk ditampilkan. Unggah file Excel atau ubah filter Anda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx, idx) => {
                  const absoluteIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                  const profit = calculateProfit(tx);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{absoluteIdx}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{tx.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-white">{tx.sales}</td>
                      <td className="py-3 px-4">{tx.produk}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-200">{tx.qty}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{formatRp(tx.harga_beli)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-white">{formatRp(tx.nominal)}</td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatRp(profit)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.bayar === "Cash" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {tx.bayar}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            title="Edit"
                            onClick={() => setEditingTx(tx)}
                            className="p-1.5 hover:bg-amber-500/15 hover:text-amber-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/15 hover:text-red-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {filteredData.length > 0 && (
          <div className="p-4 bg-slate-900/60 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Menampilkan <strong className="text-slate-200">{(currentPage - 1) * rowsPerPage + 1}</strong> - <strong className="text-slate-200">{Math.min(currentPage * rowsPerPage, filteredData.length)}</strong> dari <strong className="text-slate-200">{filteredData.length}</strong> transaksi
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

      {/* Edit Modal (Localized) */}
      {editingTx && (
        <div id="edit_modal_backdrop" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div id="edit_modal_box" className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-md">Edit Data Penjualan</h3>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tanggal</label>
                  <input
                    type="date"
                    value={editingTx.tanggal}
                    onChange={(e) => setEditingTx({ ...editingTx, tanggal: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nama Sales</label>
                  <input
                    type="text"
                    value={editingTx.sales}
                    onChange={(e) => setEditingTx({ ...editingTx, sales: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Jenis Produk</label>
                <input
                  type="text"
                  value={editingTx.produk}
                  onChange={(e) => setEditingTx({ ...editingTx, produk: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">QTY</label>
                  <input
                    type="number"
                    value={editingTx.qty}
                    onChange={(e) => setEditingTx({ ...editingTx, qty: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Harga Beli</label>
                  <input
                    type="number"
                    value={editingTx.harga_beli}
                    onChange={(e) => setEditingTx({ ...editingTx, harga_beli: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nominal Jual</label>
                  <input
                    type="number"
                    value={editingTx.nominal}
                    onChange={(e) => setEditingTx({ ...editingTx, nominal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cara Pembayaran</label>
                <select
                  value={editingTx.bayar}
                  onChange={(e) => setEditingTx({ ...editingTx, bayar: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Tempo">Tempo</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/60 text-xs text-slate-400">
                Laba/Profit yang dihitung otomatis: <strong className="text-emerald-400 font-mono text-sm ml-1">{formatRp((editingTx.nominal || 0) - ((editingTx.qty || 0) * (editingTx.harga_beli || 0)))}</strong>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border-t border-slate-700 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingTx(null)}
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
