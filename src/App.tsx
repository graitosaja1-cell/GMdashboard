import { useState, useEffect } from "react";
import { db } from "./firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  writeBatch, 
  doc, 
  getDocs 
} from "firebase/firestore";
import { SalesTransaction, PemasukanRekap, KasData } from "./types";

// Components
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Pemasukan from "./components/Pemasukan";
import Kas from "./components/Kas";
import Sales from "./components/Sales";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [activeMonth, setActiveMonth] = useState("2026-07");

  // Real-time data states
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [rekapList, setRekapList] = useState<PemasukanRekap[]>([]);
  const [kasData, setKasData] = useState<KasData | null>(null);

  // Auth observer via local storage
  useEffect(() => {
    const savedUserId = localStorage.getItem("gajah_mas_user_id");
    if (savedUserId === "1618") {
      setUser({ uid: "1618", email: "gajahmas_1618@gajahmas.com" });
    }
    setAuthLoading(false);
  }, []);

  // Real-time Firestore synchronizer
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setRekapList([]);
      setKasData(null);
      return;
    }

    const userId = user.uid;

    // 1. Listen to sales transactions
    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", userId),
      where("month", "==", activeMonth)
    );
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const txs: SalesTransaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as SalesTransaction);
      });
      setTransactions(txs);
    }, (error) => {
      console.error("Sales snapshot error:", error);
    });

    // 2. Listen to pemasukan harian
    const pemQuery = query(
      collection(db, "pemasukan"),
      where("userId", "==", userId),
      where("month", "==", activeMonth)
    );
    const unsubPem = onSnapshot(pemQuery, (snapshot) => {
      const list: PemasukanRekap[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PemasukanRekap);
      });
      setRekapList(list);
    }, (error) => {
      console.error("Pemasukan snapshot error:", error);
    });

    // 3. Listen to kas data
    const kasQuery = query(
      collection(db, "kas"),
      where("userId", "==", userId),
      where("month", "==", activeMonth)
    );
    const unsubKas = onSnapshot(kasQuery, (snapshot) => {
      if (!snapshot.empty) {
        const firstDoc = snapshot.docs[0];
        setKasData({ id: firstDoc.id, ...firstDoc.data() } as KasData);
      } else {
        setKasData(null);
      }
    }, (error) => {
      console.error("Kas snapshot error:", error);
    });

    return () => {
      unsubSales();
      unsubPem();
      unsubKas();
    };
  }, [user, activeMonth]);

  // Login handler
  const handleLoginSuccess = (userId: string) => {
    localStorage.setItem("gajah_mas_user_id", userId);
    setUser({ uid: userId, email: "gajahmas_1618@gajahmas.com" });
  };

  // Logout handler
  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("gajah_mas_user_id");
      setUser(null);
      setActivePage("dashboard");
    }
  };

  // Add bulk transactions from Excel (Dashboard)
  const handleAddTransactions = async (txs: Omit<SalesTransaction, "id">[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      txs.forEach((tx) => {
        const newDocRef = doc(collection(db, "sales"));
        batch.set(newDocRef, {
          ...tx,
          userId: user.uid,
          createdAt: Date.now()
        });
      });
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to add transactions:", e);
      throw e;
    }
  };

  // Delete transaction (Dashboard)
  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "sales", id));
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to delete transaction:", e);
      throw e;
    }
  };

  // Edit transaction (Dashboard)
  const handleEditTransaction = async (tx: SalesTransaction) => {
    if (!user) return;
    try {
      const { id, ...data } = tx;
      const batch = writeBatch(db);
      batch.update(doc(db, "sales", id), { ...data });
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to edit transaction:", e);
      throw e;
    }
  };

  // Add daily rekaps (Pemasukan)
  const handleAddRekaps = async (rekaps: Omit<PemasukanRekap, "id">[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      rekaps.forEach((rekap) => {
        // Deterministic ID by date + userId to avoid repeating uploads
        const documentId = `${user.uid}_${rekap.month}_${rekap.tanggal}`;
        const ref = doc(db, "pemasukan", documentId);
        batch.set(ref, {
          ...rekap,
          userId: user.uid,
          createdAt: Date.now()
        }, { merge: true });
      });
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to save rekaps:", e);
      throw e;
    }
  };

  // Delete rekap (Pemasukan)
  const handleDeleteRekap = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "pemasukan", id));
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to delete rekap:", e);
      throw e;
    }
  };

  // Edit rekap (Pemasukan)
  const handleEditRekap = async (rekap: PemasukanRekap) => {
    if (!user) return;
    try {
      const { id, ...data } = rekap;
      const batch = writeBatch(db);
      batch.update(doc(db, "pemasukan", id), { ...data });
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to edit rekap:", e);
      throw e;
    }
  };

  // Save Kas (Kas)
  const handleSaveKas = async (data: Omit<KasData, "id" | "month">) => {
    if (!user) return;
    try {
      const documentId = `${user.uid}_${activeMonth}`;
      const ref = doc(db, "kas", documentId);
      const batch = writeBatch(db);
      batch.set(ref, {
        ...data,
        userId: user.uid,
        month: activeMonth
      }, { merge: true });
      await batch.commit();
    } catch (e: any) {
      console.error("Failed to save kas:", e);
      throw e;
    }
  };

  // Delete all data for the active month (Sidebar action)
  const handleDeleteAllData = async () => {
    if (!user) return;
    const confirmText = `Apakah Anda benar-benar yakin ingin menghapus SEMUA data Penjualan, Pemasukan, dan Kas untuk bulan ${activeMonth}?\n\nTindakan ini akan menghapus data di cloud secara permanen. Pengguna lain di perangkat lain tidak akan melihat data ini lagi!`;
    
    if (!confirm(confirmText)) return;

    try {
      const batch = writeBatch(db);

      // Fetch all sales for this month
      const salesQ = query(
        collection(db, "sales"),
        where("userId", "==", user.uid),
        where("month", "==", activeMonth)
      );
      const salesSnap = await getDocs(salesQ);
      salesSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Fetch all pemasukan for this month
      const pemQ = query(
        collection(db, "pemasukan"),
        where("userId", "==", user.uid),
        where("month", "==", activeMonth)
      );
      const pemSnap = await getDocs(pemQ);
      pemSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete kas document
      const kasDocumentId = `${user.uid}_${activeMonth}`;
      batch.delete(doc(db, "kas", kasDocumentId));

      await batch.commit();
      alert(`Berhasil menghapus seluruh data bulan ${activeMonth} secara permanen!`);
    } catch (e: any) {
      alert("Gagal menghapus semua data: " + e.message);
    }
  };

  // Helper calculating total pemasukan from rekap list
  const totalPemasukan = rekapList.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);

  // Authentication loading indicator
  if (authLoading) {
    return (
      <div id="loader_screen" className="min-height-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-300">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Menghubungkan Database...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> show Login card
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app_frame" className="flex min-h-screen bg-slate-900 text-slate-300">
      {/* Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        onPageChange={setActivePage} 
        userEmail={user.email || "User Anonim"} 
        onLogout={handleLogout}
        onDeleteAllData={handleDeleteAllData}
      />

      {/* Main Content Area */}
      <main id="main_content_area" className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activePage === "dashboard" && (
          <Dashboard 
            transactions={transactions}
            activeMonth={activeMonth}
            setActiveMonth={setActiveMonth}
            onAddTransactions={handleAddTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activePage === "pemasukan" && (
          <Pemasukan 
            rekapList={rekapList}
            activeMonth={activeMonth}
            setActiveMonth={setActiveMonth}
            onAddRekaps={handleAddRekaps}
            onDeleteRekap={handleDeleteRekap}
            onEditRekap={handleEditRekap}
          />
        )}

        {activePage === "kas" && (
          <Kas 
            kasData={kasData}
            totalPemasukan={totalPemasukan}
            activeMonth={activeMonth}
            onSaveKas={handleSaveKas}
          />
        )}

        {activePage === "sales" && (
          <Sales 
            transactions={transactions}
            activeMonth={activeMonth}
          />
        )}
      </main>
    </div>
  );
}
