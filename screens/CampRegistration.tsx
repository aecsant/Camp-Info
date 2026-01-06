
import React, { useState, useEffect } from 'react';
import { Camp } from '../types';
import { getCamps, saveCamp, getPatients } from '../db';
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
      id: crypto.randomUUID(),
      serial: camps.length + 1,
      name: name.substring(0, 80),
      date
    };

    saveCamp(newCamp);
    const updated = [newCamp, ...camps];
    setCamps(updated);
    setName('');
    setSuccessMsg('Camp registered successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDownload = (e: React.MouseEvent, camp: Camp) => {
    e.stopPropagation();
    const patients = getPatients(camp.id);
    exportToCSV(camp, patients);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">New Camp Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Serial Number (Auto)</label>
            <input 
              type="text" 
              value={camps.length + 1} 
              disabled 
              className="bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-500 font-bold"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Camp Place / Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter camp location name..."
              maxLength={80}
              required
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Organized Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md"
          >
            Register Camp
          </button>
        </form>

        {successMsg && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-center font-medium animate-pulse">
            {successMsg}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          Recent Camps
        </h3>
        <div className="space-y-3">
          {camps.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No camps registered yet.</p>
          ) : (
            camps.map((camp) => (
              <div 
                key={camp.id}
                onClick={() => onSelectCamp(camp)}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 flex items-center justify-center rounded-full text-sm">
                    {camp.serial}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{camp.name}</h4>
                    <p className="text-xs text-gray-500">{camp.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDownload(e, camp)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors flex items-center gap-1 text-sm font-semibold"
                    title="Download Excel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                  <button className="p-2 text-blue-600 group-hover:translate-x-1 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
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
