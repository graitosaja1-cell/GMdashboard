export interface SalesTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  sales: string;
  produk: string;
  qty: number;
  harga_beli: number;
  nominal: number;
  bayar: "Cash" | "Tempo" | string;
  month: string; // YYYY-MM
  createdAt?: number;
}

export interface PemasukanRekap {
  id: string;
  tanggal: string; // DD-MM
  piutangCash: number;
  piutangTransfer: number;
  penjualanCash: number;
  penjualanTransfer: number;
  totalCash: number;
  totalTransfer: number;
  grandTotal: number;
  month: string; // YYYY-MM
  createdAt?: number;
}

export interface KasData {
  id: string; // e.g., month
  month: string; // YYYY-MM
  saldoAwalBcaOp: number;
  saldoAwalBcaEscrow: number;
  saldoAwalBcaLama: number;
  saldoAwalBrankas: number;
  saldoAkhirBcaOp: number;
  saldoAkhirBcaEscrow: number;
  saldoAkhirBcaLama: number;
  saldoAkhirBrankas: number;
  totalPengeluaranManual: number;
}
