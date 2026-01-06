
import React from 'react';
import { Patient, Camp } from '../types';

interface PrintPreviewProps {
  patient: Patient;
  camp: Camp;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ patient, camp, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100 max-w-2xl mx-auto overflow-hidden">
      {/* Header (Not for print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl font-bold text-green-600 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Information Saved Successfully
        </h2>
        <div className="flex gap-2">
            <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
            Ok
            </button>
            <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow flex items-center gap-2"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
            </button>
        </div>
      </div>

      {/* Print Preview Content */}
      <div id="printable-area" className="p-8 border-4 border-double border-gray-300 rounded print:p-0 print:border-0">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-extrabold uppercase text-gray-900">Medical Camp Information Card</h1>
          <p className="text-lg font-bold text-gray-700">{camp.name} - {camp.date}</p>
          <p className="text-sm font-semibold text-gray-500">Patient Serial: {patient.serial}</p>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm md:text-base">
          <div>
            <span className="block text-xs uppercase text-gray-400 font-bold">Patient Name</span>
            <span className="font-bold text-lg">{patient.name}</span>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase text-gray-400 font-bold">Contact Number</span>
            <span className="font-bold text-lg">{patient.phone}</span>
          </div>
          
          <div className="border-t pt-2">
            <span className="block text-xs uppercase text-gray-400 font-bold">Age / Gender</span>
            <span className="font-semibold">{patient.age} Yrs / {patient.gender}</span>
          </div>
          <div className="border-t pt-2 text-right">
            <span className="block text-xs uppercase text-gray-400 font-bold">Previous Illness</span>
            <span className="font-semibold">{patient.previousIllness}</span>
          </div>

          <div className="col-span-2 bg-gray-50 p-4 rounded-lg grid grid-cols-3 gap-2 border">
            <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-gray-500">Height</span>
                <span className="font-bold">{patient.height} cm</span>
            </div>
            <div className="text-center border-x">
                <span className="block text-[10px] uppercase font-bold text-gray-500">Weight</span>
                <span className="font-bold">{patient.weight} kg</span>
            </div>
            <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-gray-500">BMI</span>
                <span className="font-bold">{patient.bmi}</span>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg bg-blue-50">
                  <span className="block text-xs font-bold text-blue-600 uppercase">Blood Pressure</span>
                  <span className="text-xl font-black">{patient.bp} <small className="text-xs font-normal">mmHg</small></span>
              </div>
              <div className="p-3 border rounded-lg bg-orange-50">
                  <span className="block text-xs font-bold text-orange-600 uppercase">Blood Glucose</span>
                  <span className="text-xl font-black">{patient.glucose} <small className="text-xs font-normal">mg%</small></span>
              </div>
          </div>

          <div className="col-span-2 mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <span className="block text-xs font-bold text-yellow-700 uppercase mb-1 underline">Doctor's Remark / सल्ला</span>
              <p className="text-xl font-bold text-gray-800 leading-relaxed">
                  {patient.remark}
              </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dotted flex justify-between items-end">
            <div className="text-xs text-gray-400 italic">
                Generated via Camp Info App on {new Date().toLocaleString()}
            </div>
            <div className="text-center">
                <div className="w-32 border-b border-gray-900 mb-1"></div>
                <span className="text-[10px] font-bold uppercase">Medical Officer Signature</span>
            </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPreview;
