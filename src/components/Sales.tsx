import { useMemo, useState } from "react";
import { SalesTransaction } from "../types";
import { 
  Users, 
  Award, 
  BadgeCheck, 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Target,
  ArrowUpDown
} from "lucide-react";

interface SalesProps {
  transactions: SalesTransaction[];
  activeMonth: string;
}

interface SalesPerformance {
  name: string;
  transactionCount: number;
  totalQty: number;
  totalOmset: number;
  totalProfit: number;
  avgOrderValue: number;
}

export default function Sales({ transactions, activeMonth }: SalesProps) {
  const [sortBy, setSortBy] = useState<keyof SalesPerformance>("totalOmset");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Format currency
  const formatRp = (amount: number) => {
    return "Rp" + Math.round(amount).toLocaleString("id-ID");
  };

  // Compute performance metrics for each sales representative
  const performances = useMemo(() => {
    const salesMap: Record<string, { qty: number; count: number; omset: number; profit: number }> = {};

    transactions.forEach((tx) => {
      const salesName = tx.sales ? tx.sales.trim() : "Tanpa Nama";
      const profit = (tx.nominal || 0) - ((tx.qty || 0) * (tx.harga_beli || 0));

      if (!salesMap[salesName]) {
        salesMap[salesName] = { qty: 0, count: 0, omset: 0, profit: 0 };
      }

      salesMap[salesName].qty += tx.qty || 0;
      salesMap[salesName].count += 1;
      salesMap[salesName].omset += tx.nominal || 0;
      salesMap[salesName].profit += profit;
    });

    const perfList: SalesPerformance[] = Object.entries(salesMap).map(([name, data]) => ({
      name,
      transactionCount: data.count,
      totalQty: data.qty,
      totalOmset: data.omset,
      totalProfit: data.profit,
      avgOrderValue: data.count > 0 ? data.omset / data.count : 0,
    }));

    // Sort list
    return perfList.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") {
        return sortOrder === "desc" 
          ? (valB as string).localeCompare(valA as string) 
          : (valA as string).localeCompare(valB as string);
      }

      return sortOrder === "desc" 
        ? (valB as number) - (valA as number) 
        : (valA as number) - (valB as number);
    });
  }, [transactions, sortBy, sortOrder]);

  // Overall top sales representative
  const topSales = useMemo(() => {
    if (performances.length === 0) return null;
    // Top salesperson is the one with the maximum totalOmset
    return [...performances].sort((a, b) => b.totalOmset - a.totalOmset)[0];
  }, [performances]);

  // Best product calculation
  const topProducts = useMemo(() => {
    const prodMap: Record<string, { qty: number; omset: number }> = {};
    transactions.forEach((tx) => {
      const name = tx.produk || "Lain-lain";
      if (!prodMap[name]) prodMap[name] = { qty: 0, omset: 0 };
      prodMap[name].qty += tx.qty || 0;
      prodMap[name].omset += tx.nominal || 0;
    });

    return Object.entries(prodMap)
      .map(([name, data]) => ({ name, qty: data.qty, omset: data.omset }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  const toggleSort = (field: keyof SalesPerformance) => {
    if (sortBy === field) {
      setSortOrder(o => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div id="sales_header" className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl pointer-events-none rounded-full" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              🧑‍💼 Dashboard Kinerja Sales ({activeMonth})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Analisis kontribusi omset, rata-rata transaksi, kuantitas produk, dan laba bersih per perwakilan sales.
            </p>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Performer Award Card */}
        {topSales ? (
          <div className="bg-gradient-to-br from-slate-800 to-blue-950 border border-blue-500/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Top Sales representative</span>
              </div>
              
              <div>
                <h4 className="text-2xl font-black text-white flex items-center gap-2">
                  {topSales.name}
                  <BadgeCheck className="w-5 h-5 text-blue-400 fill-blue-950/40" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Meraih omset penjualan tertinggi bulan ini!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Omset Kontribusi</span>
                  <strong className="text-white text-md block font-mono mt-0.5">{formatRp(topSales.totalOmset)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Profit Diperoleh</span>
                  <strong className="text-emerald-400 text-md block font-mono mt-0.5">{formatRp(topSales.totalProfit)}</strong>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-4">
              ⭐ GAJAH MAS SALES CHAMPION
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-slate-500 flex flex-col items-center justify-center">
            <Target className="w-8 h-8 text-slate-600 animate-pulse mb-2" />
            <p className="text-xs">Unggah data transaksi di dashboard untuk melihat peringkat sales.</p>
          </div>
        )}

        {/* Top Products Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm">🔥 Produk Terlaris (Qty)</h3>
            </div>

            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Belum ada data produk.</p>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700/40 last:border-0">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-mono font-bold text-slate-500 w-4 text-center">{idx + 1}</span>
                      <span className="text-white font-medium truncate" title={p.name}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-slate-400 font-mono"><strong className="text-slate-200">{p.qty}</strong> QTY</span>
                      <span className="text-slate-400 font-mono text-right w-20">{formatRp(p.omset)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Analysis Chart Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm">💡 Analisis Kinerja Sales</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Tim Anda beranggotakan <strong className="text-white">{performances.length} sales</strong> yang beroperasi aktif di bulan ini. 
            </p>
            
            <div className="mt-4 p-3.5 bg-slate-900/60 border border-slate-700/60 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Transaksi Tim:</span>
                <strong className="text-white font-mono">{transactions.length} kali</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rerata Omset Per Transaksi:</span>
                <strong className="text-blue-400 font-mono">
                  {formatRp(transactions.length > 0 ? transactions.reduce((acc, curr) => acc + (curr.nominal || 0), 0) / transactions.length : 0)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total QTY Terdistribusi:</span>
                <strong className="text-emerald-400 font-mono">
                  {transactions.reduce((acc, curr) => acc + (curr.qty || 0), 0)} pcs
                </strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sales Performance List Table */}
      <div id="sales_perf_table_container" className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Tabel Peringkat Sales
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">
            Urutan Berdasarkan: <strong className="text-blue-400 uppercase">{String(sortBy)}</strong> ({sortOrder})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
                <th className="py-3 px-6">Nama Sales</th>
                
                <th 
                  onClick={() => toggleSort("transactionCount")}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-700/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Jumlah Transaksi
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>

                <th 
                  onClick={() => toggleSort("totalQty")}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-700/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Total QTY
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>

                <th 
                  onClick={() => toggleSort("totalOmset")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-700/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Omset (Rp)
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>

                <th 
                  onClick={() => toggleSort("totalProfit")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-700/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Profit (Rp)
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>

                <th 
                  onClick={() => toggleSort("avgOrderValue")}
                  className="py-3 px-6 text-right cursor-pointer hover:bg-slate-700/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Rata-rata Order (Rp)
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-xs text-slate-300">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    Belum ada data penjualan tersedia untuk peringkat sales.
                  </td>
                </tr>
              ) : (
                performances.map((sales, idx) => (
                  <tr key={sales.name} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap font-bold text-white flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] w-5 h-5 bg-slate-900 border border-slate-700 text-slate-400 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {sales.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300 font-bold">{sales.transactionCount}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300 font-semibold">{sales.totalQty}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white font-mono">{formatRp(sales.totalOmset)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">{formatRp(sales.totalProfit)}</td>
                    <td className="py-3.5 px-6 text-right font-medium text-slate-400 font-mono">{formatRp(sales.avgOrderValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
