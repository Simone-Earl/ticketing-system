// src/components/Maintenance.jsx
import { Wrench } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Under Maintenance</h1>
        <p className="text-slate-500 mb-6">
          We are currently upgrading the ticketing system. We'll be back online shortly!
        </p>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Check back soon
        </div>
      </div>
    </div>
  );
}