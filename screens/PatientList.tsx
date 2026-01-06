
import React, { useState, useEffect } from 'react';
import { Camp, Patient } from '../types';
import { getPatients, deletePatient } from '../db';

interface PatientListProps {
  camp: Camp;
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onPrintPatient: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ camp, onAddPatient, onEditPatient, onPrintPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPatients(getPatients(camp.id).sort((a, b) => b.serial - a.serial));
  }, [camp.id]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  );

  const handleDelete = (patient: Patient) => {
    // Explicit confirmation dialog asking for permission
    const isConfirmed = window.confirm(`Are you sure you want to delete the medical information for patient "${patient.name}"? This will permanently remove their record from this mobile device.`);
    
    if (isConfirmed) {
      deletePatient(patient.id);
      // Update local state to reflect deletion immediately on the mobile screen
      setPatients(prev => prev.filter(p => p.id !== patient.id));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <h2 className="text-xl font-black text-gray-800 truncate leading-tight">{camp.name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())}</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{(() => {
                const [y, m, d] = camp.date.split('-');
                return `${d}/${m}/${y}`;
              })()}</p>
            </div>
            <button 
              onClick={onAddPatient}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 text-xs flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              ADD PATIENT
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text"
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Portrait optimized list with independent scrolling */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 px-6 text-center">
            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-sm italic">No records found for this camp.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 active:bg-blue-50 transition-colors">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">#{p.serial}</span>
                    <h4 className="font-bold text-gray-900 truncate text-sm">{p.name}</h4>
                  </div>
                  <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-2">
                    <span>{p.gender}, {p.age}y</span>
                    <span>•</span>
                    <span>{p.phone}</span>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${p.remark.includes('योग्य') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.remark.substring(0, 20)}...
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => onPrintPatient(p)}
                    className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl active:scale-90 transition-all border border-blue-100"
                    title="Print"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
                  <button 
                    onClick={() => onEditPatient(p)}
                    className="w-9 h-9 flex items-center justify-center text-amber-600 bg-amber-50 rounded-xl active:scale-90 transition-all border border-amber-100"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(p)}
                    className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 rounded-xl active:scale-90 transition-all border border-red-100"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
