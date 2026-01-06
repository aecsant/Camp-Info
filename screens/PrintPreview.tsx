import React from 'react';
import { Patient, Camp } from '../types';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

interface PrintPreviewProps {
  patient: Patient;
  camp: Camp;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ patient, camp, onClose }) => {
  const slogan = "!! आरोग्य तपासणी करा वेळेवर - स्वस्थ तुम्ही रहाल आयुष्यभर !!";

  const handlePrint = async () => {
    // On Android, sharing a formatted HTML file is the most reliable way to 
    // trigger the native "Print" or "Save as PDF" menu.
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; line-height: 1.4; }
          .container { border: 2px solid #000; padding: 25px; border-radius: 12px; max-width: 600px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
          h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; display: block; }
          .value { font-size: 15px; font-weight: bold; border-bottom: 1px solid #eee; display: block; padding-bottom: 3px; }
          .vital-container { display: flex; gap: 15px; margin-top: 10px; }
          .vital-box { flex: 1; border: 2px solid #2563eb; padding: 12px; border-radius: 10px; text-align: center; }
          .vital-box.orange { border-color: #ea580c; }
          .remark-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-top: 20px; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .officer-block { display: flex; flex-direction: column; align-items: center; }
          .officer-text { font-size: 10px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          .officer-line { border-bottom: 1px solid #000; width: 140px; }
          .slogan-final { text-align: center; margin-top: 20px; font-weight: bold; color: #000; font-size: 12px; border-top: 1px dashed #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Medical Camp Report</h1>
            <p style="margin: 5px 0;">${camp.name} • ${camp.date}</p>
          </div>
          
          <div class="meta">
            <span>Patient Serial: #${patient.serial}</span>
            <span>Ref: ${patient.id.substring(0,8).toUpperCase()}</span>
          </div>

          <div class="grid">
            <div>
              <span class="label">Patient Name</span>
              <span class="value">${patient.name}</span>
            </div>
            <div>
              <span class="label">Phone / Mobile</span>
              <span class="value">${patient.phone}</span>
            </div>
            <div>
              <span class="label">Age / Gender</span>
              <span class="value">${patient.age}Y / ${patient.gender}</span>
            </div>
            <div>
              <span class="label">BMI / Ideal Weight</span>
              <span class="value">${patient.bmi} / ${patient.idealWeight}kg</span>
            </div>
          </div>

          <div class="vital-container">
            <div class="vital-box">
              <span class="label" style="color:#2563eb">Blood Pressure</span>
              <div style="font-size: 22px; font-weight: 900;">${patient.bp}</div>
              <span style="font-size: 8px; color: #2563eb;">mm of Hg</span>
            </div>
            <div class="vital-box orange">
              <span class="label" style="color:#ea580c">Blood Glucose</span>
              <div style="font-size: 22px; font-weight: 900;">${patient.glucose}</div>
              <span style="font-size: 8px; color: #ea580c;">mg%</span>
            </div>
          </div>

          <div class="remark-box">
            <span class="label">Diagnostic Remark / सल्ला</span>
            <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: #1e293b;">${patient.remark}</p>
          </div>

          <div class="footer">
            <div style="font-size: 8px; color: #999;">Printed on ${new Date().toLocaleDateString()}</div>
            <div class="officer-block">
                <span class="officer-text">Medical Officer</span>
                <div class="officer-line"></div>
            </div>
          </div>

          <div class="slogan-final">
            ${slogan}
          </div>
        </div>
      </body>
      </html>
    `;

    const fileName = `Report_${patient.name.replace(/[^a-z0-9]/gi, '_')}.html`;

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: reportHtml,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName,
      });

      // Android will show "Print" or "Save as PDF" when sharing an HTML file
      await Share.share({
        title: `Medical Report: ${patient.name}`,
        url: uriResult.uri,
        dialogTitle: 'Select Print or Save as PDF',
      });
    } catch (err) {
      console.error("Print flow failed", err);
      // Fallback to basic text share if filesystem fails
      handleShare();
    }
  };

  const handleShare = async () => {
    const reportText = `
🏥 MEDICAL CAMP REPORT
-----------------------
CAMP: ${camp.name}
DATE: ${camp.date}
SERIAL NO: ${patient.serial}

PATIENT DETAILS:
- Name: ${patient.name}
- Age/Sex: ${patient.age} / ${patient.gender}
- Phone: ${patient.phone}

VITALS:
- BP: ${patient.bp}
- Glucose: ${patient.glucose} mg%
- BMI: ${patient.bmi}

REMARK / सल्ला:
${patient.remark}

${slogan}
-----------------------
    `.trim();

    try {
      await Share.share({
        title: `Report: ${patient.name}`,
        text: reportText,
        dialogTitle: 'Share Patient Info',
      });
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* Header (Hidden during print) */}
      <div className="p-4 bg-white border-b flex flex-col gap-3 print:hidden sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center">
          <button 
            onClick={onClose}
            className="text-gray-600 font-bold flex items-center gap-1 text-sm bg-gray-100 px-3 py-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              SHARE TEXT
            </button>
            <button 
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              PRINT / PDF
            </button>
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
           <p className="text-[10px] text-center text-blue-700 font-bold leading-tight">
             Tap <strong>PRINT / PDF</strong> then choose <strong>"Print"</strong> or <strong>"Save as PDF"</strong> from the Android menu.
           </p>
        </div>
      </div>

      {/* Visual Preview */}
      <div className="flex-1 p-4 md:p-10 bg-gray-50 overflow-auto">
        <div className="max-w-md mx-auto border-2 border-gray-900 p-6 rounded-xl relative bg-white shadow-2xl">
          <div className="absolute top-4 right-4 text-[10px] font-black bg-black text-white px-2 py-1 rounded">
             SR: {patient.serial}
          </div>
          
          <div className="text-center border-b-2 border-gray-900 pb-4 mb-6 mt-4">
            <h1 className="text-xl font-black uppercase text-gray-900 leading-tight">Camp Diagnostic Card</h1>
            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
              {camp.name}
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Patient Name</span>
                <span className="font-bold text-sm text-gray-900 block truncate">{patient.name}</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Phone</span>
                <span className="font-bold text-sm text-gray-900 block">{patient.phone}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded text-center border">
                <span className="block text-[7px] font-black text-gray-400 uppercase">Age/Sex</span>
                <span className="font-bold text-xs">{patient.age} / {patient.gender.charAt(0)}</span>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center border">
                <span className="block text-[7px] font-black text-gray-400 uppercase">Height</span>
                <span className="font-bold text-xs">{patient.height}cm</span>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center border">
                <span className="block text-[7px] font-black text-gray-400 uppercase">Weight</span>
                <span className="font-bold text-xs">{patient.weight}kg</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="border-2 border-blue-600 p-3 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-blue-600 uppercase mb-1">Blood Pressure</span>
                  <span className="text-lg font-black text-gray-900">{patient.bp}</span>
               </div>
               <div className="border-2 border-orange-600 p-3 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-orange-600 uppercase mb-1">Glucose</span>
                  <span className="text-lg font-black text-gray-900">{patient.glucose}</span>
               </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Doctor's Remark</span>
               <p className="text-xs font-bold leading-relaxed text-gray-800 italic">
                  "{patient.remark}"
               </p>
            </div>

            <div className="pt-6 flex justify-between items-end">
              <div className="text-[7px] text-gray-400 font-bold uppercase">
                ID: {patient.id.substring(0,8)}
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="text-[8px] font-black uppercase mb-1">Medical Officer</span>
                <div className="w-24 border-t border-gray-900"></div>
              </div>
            </div>

            {/* Slogan moved to bottom, black, bold, and 2px smaller (from 11px to 9px) */}
            <div className="text-center pt-2 border-t border-dashed border-gray-300">
              <p className="text-[9px] font-black text-black leading-tight">
                {slogan}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;