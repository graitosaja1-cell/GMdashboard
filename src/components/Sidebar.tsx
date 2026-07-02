import { LayoutDashboard, LogIn, LogOut, ReceiptText, WalletCards, Users, Trash2 } from "lucide-react";

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  userEmail: string | null;
  onLogout: () => void;
  onDeleteAllData: () => void;
}

export default function Sidebar({ 
  activePage, 
  onPageChange, 
  userEmail, 
  onLogout,
  onDeleteAllData 
}: SidebarProps) {
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pemasukan", label: "Pemasukan", icon: ReceiptText },
    { id: "kas", label: "Kas", icon: WalletCards },
    { id: "sales", label: "Sales", icon: Users },
  ];

  return (
    <aside id="sidebar" className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between min-h-screen flex-shrink-0 z-30">
      <div className="flex-1 py-6">
        {/* Brand */}
        <div className="px-6 mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/25">
              GM
            </div>
            <div>
              <h1 className="font-bold text-white text-md tracking-tight">GAJAH MAS</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Keuangan App</p>
            </div>
          </div>
        </div>

        {/* User Badge */}
        {userEmail && (
          <div className="mx-4 mb-6 px-4 py-2.5 bg-slate-800/40 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-500 font-medium">Masuk Sebagai:</p>
            <p className="text-xs text-slate-300 truncate font-semibold" title={userEmail}>
              {userEmail.includes("gajahmas_1618") ? "Owner (PIN: 1618)" : (userEmail.includes("anonymous") ? "Demo User" : userEmail)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-medium">Tersinkron Online</span>
            </div>
          </div>
        )}

        {/* Menu Navigation */}
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onDeleteAllData}
          className="w-full bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-500/20 text-red-400 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Hapus Semua Data
        </button>

        <button
          onClick={onLogout}
          className="w-full bg-slate-800/40 hover:bg-slate-800 hover:text-white text-slate-400 border border-slate-800 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar (Sign Out)
        </button>
      </div>
    </aside>
  );
}
