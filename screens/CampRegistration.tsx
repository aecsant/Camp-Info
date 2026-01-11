import React, { useState, useEffect, useRef } from 'react';
import { Camp, Patient } from '../types';
import { getCamps, saveCamp, updateCamp, getPatients, generateUUID } from '../db';
import { exportToCSV } from '../excelExport';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface CampRegistrationProps {
  onSelectCamp: (camp: Camp) => void;
}

const CampRegistration: React.FC<CampRegistrationProps> = ({ onSelectCamp }) => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [organizationName, setOrganizationName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingCampId, setEditingCampId] = useState<string | null>(null);
  const [editSerial, setEditSerial] = useState<number | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisData, setAnalysisData] = useState<{ camp: Camp; stats: any } | null>(null);
  const [renderReady, setRenderReady] = useState(false);
  
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCamps(getCamps().sort((a, b) => b.serial - a.serial));
  }, []);

  useEffect(() => {
    if (isProcessing && analysisData && !renderReady) {
      const paintTimer = setTimeout(() => setRenderReady(true), 300);
      return () => clearTimeout(paintTimer);
    }
    if (isProcessing && analysisData && renderReady) {
      const captureTimer = setTimeout(() => triggerPdfGeneration(), 800);
      return () => clearTimeout(captureTimer);
    }
  }, [isProcessing, analysisData, renderReady]);

  const calculateStats = (patients: Patient[]) => {
    const getIllnessStr = (p: Patient) => {
      if (!p.previousIllness) return '';
      return (Array.isArray(p.previousIllness) ? p.previousIllness.join(' ') : String(p.previousIllness)).toLowerCase();
    };

    const isKnownDM = (p: Patient) => getIllnessStr(p).includes('diabetes');
    const isKnownHTN = (p: Patient) => {
      const s = getIllnessStr(p);
      return s.includes('hypertension') || s.includes('cvd') || s.includes('cardiovascular') || s.includes('blood pressure');
    };

    // Screening thresholds for newly detected
    const isNewHighSugar = (p: Patient) => !isKnownDM(p) && (Number(p.glucose) > 140);
    const isNewHighBP = (p: Patient) => {
      if (isKnownHTN(p)) return false;
      const [sys, dia] = (p.bp || '0/0').split('/').map(n => parseInt(n) || 0);
      return sys >= 140 || dia >= 90;
    };

    const kcoDM = patients.filter(isKnownDM).length;
    const kcoHTN = patients.filter(isKnownHTN).length;
    const newHighSugar = patients.filter(isNewHighSugar).length;
    const newHighBP = patients.filter(isNewHighBP).length;

    // Blood Sugar Categories (Analysis only)
    const sugarNormal = patients.filter(p => Number(p.glucose) <= 140).length;
    const sugarPre = patients.filter(p => Number(p.glucose) > 140 && Number(p.glucose) <= 200).length;
    const sugarHigh = patients.filter(p => Number(p.glucose) > 200).length;

    return {
      total: patients.length,
      males: patients.filter(p => p.gender === 'Male').length,
      females: patients.filter(p => p.gender === 'Female').length,
      kcoDM,
      kcoHTN,
      newHighSugar, // Labelled as High Blood Sugar
      newHighBP,    // Labelled as High Blood Pressure
      sugarNormal,
      sugarPre,
      sugarHigh,
      totalSugarAbnormal: patients.filter(p => Number(p.glucose) > 140).length,
      totalBPAbnormal: patients.filter(p => {
        const [sys, dia] = (p.bp || '0/0').split('/').map(n => parseInt(n) || 0);
        return sys >= 140 || dia >= 90;
      }).length,
      combined: patients.filter(p => {
        const [sys, dia] = (p.bp || '0/0').split('/').map(n => parseInt(n) || 0);
        return (Number(p.glucose) > 140) || (sys >= 140 || dia >= 90) || isKnownDM(p) || isKnownHTN(p);
      }).length
    };
  };

  const handleGenerateAnalysis = (e: React.MouseEvent, camp: Camp) => {
    e.stopPropagation();
    const patients = getPatients(camp.id);
    if (patients.length === 0) {
      alert("शिबिरात माहिती उपलब्ध नाही.");
      return;
    }
    setAnalysisData({ camp, stats: calculateStats(patients) });
    setRenderReady(false);
    setIsProcessing(true);
  };

  const triggerPdfGeneration = async () => {
    if (!analysisRef.current || !analysisData) {
      setIsProcessing(false);
      return;
    }
    // @ts-ignore
    if (typeof html2pdf === 'undefined') {
      alert("PDF library is loading. Try again in a second.");
      setIsProcessing(false);
      return;
    }
    const campName = analysisData.camp.name;
    const opt = {
      margin: 15,
      filename: `Analysis_${campName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, width: 800 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      if (Capacitor.isNativePlatform()) {
        // @ts-ignore
        const pdfDataUri = await html2pdf().from(analysisRef.current).set(opt).outputPdf('datauristring');
        const base64Data = pdfDataUri.split(',')[1];
        const fileName = `Analysis_${Date.now()}.pdf`;
        await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
        const uriResult = await Filesystem.getUri({ directory: Directory.Cache, path: fileName });
        await Share.share({ title: `Report: ${campName}`, files: [uriResult.uri] });
      } else {
        // @ts-ignore
        await html2pdf().from(analysisRef.current).set(opt).save();
      }
    } catch (err) {
      console.error(err);
      alert("अहवाल तयार करण्यास अडथळा आला.");
    } finally {
      setIsProcessing(false);
      setAnalysisData(null);
      setRenderReady(false);
    }
  };

  const handleEditCamp = (e: React.MouseEvent, camp: Camp) => {
    e.stopPropagation();
    setEditingCampId(camp.id);
    setName(camp.name);
    setDate(camp.date);
    setOrganizationName(camp.organizationName);
    setEditSerial(camp.serial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setOrganizationName('');
    setEditingCampId(null);
    setEditSerial(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    if (editingCampId) {
      const updatedCamp: Camp = {
        id: editingCampId,
        serial: editSerial || 0,
        organizationName: organizationName || 'N/A',
        name: name.substring(0, 80),
        date
      };
      updateCamp(updatedCamp);
      setCamps(getCamps().sort((a, b) => b.serial - a.serial));
      setSuccessMsg('Camp updated!');
    } else {
      const newCamp: Camp = { 
        id: generateUUID(), 
        serial: camps.length + 1, 
        organizationName: organizationName || 'N/A', 
        name: name.substring(0, 80), 
        date 
      };
      saveCamp(newCamp);
      setCamps([newCamp, ...camps]);
      setSuccessMsg('Camp added!');
    }
    
    resetForm();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDownloadExcel = async (e: React.MouseEvent, camp: Camp) => {
    e.stopPropagation();
    const patients = getPatients(camp.id);
    if (patients.length === 0) {
      alert("No data to export.");
      return;
    }
    await exportToCSV(camp, patients);
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 no-print">
        <h2 className="text-xl font-black mb-5 text-gray-800 flex items-center gap-2">
          {editingCampId ? 'Edit Camp Information' : 'Camp Registration'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1 px-1">Serial</label>
              <input type="text" value={editSerial !== null ? editSerial : camps.length + 1} disabled className="bg-gray-100 p-3 rounded-xl text-gray-400 font-bold text-sm" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1 px-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-gray-50 border-gray-200 border p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 px-1">Organization Name</label>
            <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Organization Name" required className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 px-1">Camp Place / Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Camp Place" required className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 pt-2">
            {editingCampId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-xl shadow-sm uppercase text-xs active:scale-95 transition-all"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className={`flex-[2] ${editingCampId ? 'bg-amber-600' : 'bg-blue-600'} text-white font-black py-4 rounded-xl shadow-lg uppercase text-xs active:scale-95 transition-all`}
            >
              {editingCampId ? 'Update Camp' : 'Create Camp'}
            </button>
          </div>
        </form>
        {successMsg && <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-lg text-center text-[10px] font-bold uppercase">{successMsg}</div>}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 no-print pb-8">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-2">Registered Camps</h3>
        {camps.map((camp) => (
             <div 
             key={camp.id}
             onClick={() => onSelectCamp(camp)}
             className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:bg-blue-50 transition-all border-l-4 border-l-blue-600 cursor-pointer"
           >
             <div className="flex items-center gap-2 min-w-0 flex-1">
               <div className="flex gap-1.5 mr-2">
                 <button 
                   onClick={(e) => handleDownloadExcel(e, camp)}
                   className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 rounded-xl active:scale-110 transition-transform"
                   title="CSV"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 </button>
                 <button 
                   onClick={(e) => handleGenerateAnalysis(e, camp)}
                   className="w-9 h-9 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl active:scale-110 transition-transform"
                   title="Analysis PDF"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a4 4 0 014-4h.18M18 13V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2v-2" /></svg>
                 </button>
                 <button 
                   onClick={(e) => handleEditCamp(e, camp)}
                   className="w-9 h-9 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl active:scale-110 transition-transform"
                   title="Edit Camp"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
               </div>
               <div className="min-w-0">
                 <h4 className="font-black text-gray-800 text-sm truncate uppercase">{camp.name}</h4>
                 <p className="text-[10px] text-gray-500 font-bold">
                   {new Date(camp.date).toLocaleDateString('en-GB')} • #{camp.serial}
                 </p>
               </div>
             </div>
             <div className="text-blue-600 bg-blue-50 p-2 rounded-lg ml-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
             </div>
           </div>
        ))}
        {camps.length === 0 && (
          <div className="py-12 text-center text-gray-400 italic text-sm font-medium">
            No camps registered yet.
          </div>
        )}
      </div>

      {analysisData && (
        <div className="fixed inset-0 pointer-events-none opacity-0 overflow-hidden h-0 w-0">
          <div
            ref={analysisRef}
            className="bg-white p-12 w-[800px] text-black"
            style={{
              fontFamily: "'Noto Sans Devanagari', sans-serif"
            }}
          >
            <h1
              className="text-4xl font-black text-center mb-1"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
              }}
            >
              शिबिर विश्लेषण (Report)
            </h1>
            <p className="text-center font-bold text-gray-600 mb-6"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
              }}
            >{analysisData.camp.name} • {formatDate(analysisData.camp.date)}</p>
            
            <div className="border-b-4 border-black mb-6"></div>
            
            <h2 className="text-2xl font-black mb-4 underline"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
              }}
            >१. रुग्णांची आकडेवारी (Patient Demographics)</h2>
            <table className="w-full text-2xl border-collapse mb-8">
              <tbody className="divide-y divide-gray-200">
                <tr><td className="py-2"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >एकूण रुग्ण (Total patients):</td><td className="text-right font-black">{analysisData.stats.total}</td></tr>
                <tr><td className="py-2"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >पुरुष (Male):</td><td className="text-right font-black">{analysisData.stats.males}</td></tr>
                <tr><td className="py-2"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >महिला (Female):</td><td className="text-right font-black">{analysisData.stats.females}</td></tr>
              </tbody>
            </table>

            <h2 className="text-2xl font-black mb-4 underline"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
              }}
            >२. रक्तामधील साखर विश्लेषण (Blood Sugar Analysis)</h2>
            <table className="w-full text-2xl border-collapse mb-8">
              <tbody className="divide-y divide-gray-200">
                <tr><td className="py-2"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >Normal (&lt; 140):</td><td className="text-right font-black">{analysisData.stats.sugarNormal}</td></tr>
                <tr><td className="py-2 text-orange-600 font-bold"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >Pre-diabetic / IGT (141-200):</td><td className="text-right font-black text-orange-600">{analysisData.stats.sugarPre}</td></tr>
                <tr><td className="py-2 text-red-600 font-bold"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >High Blood Sugar (&gt; 200):</td><td className="text-right font-black text-red-600">{analysisData.stats.sugarHigh}</td></tr>
              </tbody>
            </table>

            <h2 className="text-2xl font-black mb-4 underline"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
              }}
            >३. तपासणी अहवाल (Screening Summary)</h2>
            <table className="w-full text-2xl border-collapse">
              <tbody className="divide-y divide-gray-200">
                <tr><td className="py-3"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >k/c/o Diabetes (DM):</td><td className="text-right font-black">{analysisData.stats.kcoDM}</td></tr>
                <tr><td className="py-3"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >k/c/o Hypertension (HTN):</td><td className="text-right font-black">{analysisData.stats.kcoHTN}</td></tr>
                <tr className="bg-orange-50"><td className="py-3 font-bold"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >High Blood Sugar (Newly Detected):</td><td className="text-right font-black text-orange-700">{analysisData.stats.newHighSugar}</td></tr>
                <tr className="bg-blue-50"><td className="py-3 font-bold"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >High Blood Pressure (Newly Detected):</td><td className="text-right font-black text-blue-700">{analysisData.stats.newHighBP}</td></tr>
                <tr className="bg-black text-white"><td className="p-4 font-black"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
                  }}
                >Total (Detected + Known):</td><td className="p-4 text-right font-black text-4xl">{analysisData.stats.combined}</td></tr>
              </tbody>
            </table>

            <div className="mt-12 text-center text-gray-400 font-bold text-base italic uppercase tracking-widest border-t pt-4"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', 'Marathi', 'Devanagari', sans-serif"
              }}
            >Camp Info • {analysisData.camp.name} • {formatDate(analysisData.camp.date)}
            </div>
            </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-white/95 z-[1000] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-blue-600 text-xs tracking-widest animate-pulse uppercase">Generating Report...</p>
        </div>
      )}
    </div>
  );
};

export default CampRegistration;