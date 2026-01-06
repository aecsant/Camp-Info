import React, { useState, useEffect } from 'react';
import { Camp } from '../types';
import { getCamps, saveCamp, getPatients, generateUUID } from '../db';
import { exportToCSV } from '../excelExport';

interface CampRegistrationProps {
  onSelectCamp: (camp: Camp) => void;
}

const CampRegistration: React.FC<CampRegistrationProps> = ({ onSelectCamp }) => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setCamps(getCamps().sort((a, b) => b.serial - a.serial));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    const newCamp: Camp = {
      id: generateUUID(),
      serial: camps.length + 1,
      name: name.substring(0, 80),
      date
    };

    saveCamp(newCamp);
    setCamps([newCamp, ...camps]);
    setName('');
    setSuccessMsg('Camp registered successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDownload = async (e: React.MouseEvent, camp: Camp) => {
    e.stopPropagation();
    const patients = getPatients(camp.id);
    if (patients.length === 0) {
      alert("No patient data available for this camp.");
      return;
    }
    await exportToCSV(camp, patients);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Registration Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-black mb-5 text-gray-800 flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
           </div>
           Camp Registration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Auto Serial</label>
              <input type="text" value={camps.length + 1} disabled className="bg-gray-100 border-none p-3 rounded-xl text-gray-400 font-black text-sm" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Camp Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-gray-50 border-gray-200 border p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Camp Place / Name (Max 80 chars)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter camp name..." maxLength={80} required className="bg-gray-50 border-gray-200 border p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl active:scale-95 transition-all shadow-xl shadow-blue-100 text-xs tracking-widest">
            SUBMIT CAMP
          </button>
        </form>
        {successMsg && <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-lg text-center text-[10px] font-black uppercase tracking-widest">{successMsg}</div>}
      </div>

      {/* List Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Camps List</h3>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-4">
          {camps.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-12 flex flex-col items-center justify-center">
               <p className="text-gray-400 text-xs italic">No camps registered yet.</p>
            </div>
          ) : (
            camps.map((camp) => (
              <div 
                key={camp.id}
                onClick={() => onSelectCamp(camp)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.98] active:bg-blue-50 transition-all border-l-4 border-l-blue-600 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Download button BEFORE name as requested */}
                  <button 
                    onClick={(e) => handleDownload(e, camp)}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-50 text-green-600 rounded-xl active:scale-125 transition-transform"
                    title="Download Excel/CSV"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                  <div className="min-w-0 overflow-hidden">
                    <h4 className="font-black text-gray-800 text-sm truncate">{camp.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold">{camp.date} • #{camp.serial}</p>
                  </div>
                </div>
                {/* Right Arrow Button as requested */}
                <div className="ml-2 text-blue-600 bg-blue-50 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CampRegistration;