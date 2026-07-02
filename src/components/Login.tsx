import React, { useState, useEffect } from "react";
import { Lock, Loader2, Wallet, Delete } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (userId: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  const correctPin = "1618";

  const handleDigit = (digit: string) => {
    if (loading) return;
    setError("");
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setError("");
    pin.length > 0 && setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (loading) return;
    setError("");
    setPin("");
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, loading]);

  // Auto-submit when PIN length is 4
  useEffect(() => {
    if (pin.length === 4) {
      submitPin(pin);
    }
  }, [pin]);

  const submitPin = async (enteredPin: string) => {
    if (enteredPin !== correctPin) {
      setError("PIN salah. Silakan coba lagi.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate a brief loading to make it feel secure and polished
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess("1618");
    }, 600);
  };

  return (
    <div id="login_container" className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      <div id="login_card" className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 relative overflow-hidden flex flex-col items-center">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/15 blur-3xl pointer-events-none rounded-full" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 relative z-10 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">GAJAH MAS</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
            Manajemen Keuangan
          </p>
        </div>

        {/* PIN Prompt */}
        <div className="w-full text-center mb-6 z-10">
          <h2 className="text-sm font-medium text-slate-300">Masukkan PIN Keuangan</h2>
          <p className="text-xs text-slate-500 mt-1">Gunakan PIN 4-digit Anda untuk masuk</p>
        </div>

        {/* PIN Dots Display */}
        <div 
          id="pin_dots_container" 
          className={`flex justify-center gap-5 mb-8 z-10 ${shake ? "animate-shake" : ""}`}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                index < pin.length
                  ? "bg-blue-500 border-blue-500 scale-110 shadow-md shadow-blue-500/50"
                  : "border-slate-700 bg-slate-900"
              }`}
            />
          ))}
        </div>

        {/* Status / Error Message */}
        <div className="h-6 mb-6 text-center z-10">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-400 font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Memverifikasi...
            </div>
          ) : error ? (
            <p className="text-xs text-red-400 font-medium">{error}</p>
          ) : null}
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] z-10 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleDigit(num.toString())}
              className="aspect-square rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/40 hover:border-slate-700 text-lg font-bold text-slate-200 transition-all duration-100 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:scale-105 active:scale-95"
            >
              {num}
            </button>
          ))}
          
          {/* Reset button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleClear}
            className="aspect-square rounded-2xl bg-slate-900/50 hover:bg-slate-800/30 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Reset PIN"
          >
            Reset
          </button>

          {/* 0 digit */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigit("0")}
            className="aspect-square rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/40 hover:border-slate-700 text-lg font-bold text-slate-200 transition-all duration-100 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:scale-105 active:scale-95"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            disabled={loading}
            onClick={handleBackspace}
            className="aspect-square rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/40 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            title="Hapus Angka Terakhir"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Help footer */}
        <div className="text-[10px] text-slate-600 text-center w-full z-10 border-t border-slate-800/60 pt-4">
          Tekan tombol di layar atau gunakan keyboard fisik Anda.
        </div>
      </div>
    </div>
  );
}
