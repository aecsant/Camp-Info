import React, { useState, useRef } from 'react';
import { Patient, Camp } from '../types';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface PrintPreviewProps {
  patient: Patient;
  camp: Camp;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ patient, camp, onClose }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const slogan = "|| आरोग्य तपासणी कराल वेळेवर स्वस्थ तुम्ही रहाल आयुष्यभर ||";

  // Professional PDF margin: 18mm (top/bottom/left/right) - commonly used for reports
  const pdfMargins = [14, 14, 14, 14];

  const generatePdfBase64 = async (): Promise<string | null> => {
    if (!reportRef.current) return null;

    // @ts-ignore
    if (typeof html2pdf === 'undefined') {
      alert("PDF library (html2pdf) not loaded. Please check your internet connection.");
      return null;
    }

    const element = reportRef.current;

    // Use more professional margin (18mm, or 0.7 inch) for better output
    const opt = {
      margin: pdfMargins,
      filename: `Report_${patient.name.replace(/[\\/:*?"<>|]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 1,
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 680    // <--- ADJUSTED WIDTH TO max 680px
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      const pdfDataUri = await html2pdf().from(element).set(opt).outputPdf('datauristring');
      if (!pdfDataUri) return null;
      return pdfDataUri.split(',')[1];
    } catch (err) {
      console.error("PDF generation error:", err);
      return null;
    }
  };

  const handlePrintAction = async () => {
    setShowOptions(false);

    if (Capacitor.isNativePlatform()) {
      setIsProcessing(true);
      setLoadingText('Preparing Print...');

      const base64Data = await generatePdfBase64();
      if (base64Data) {
        try {
          const fileName = `Print_${Date.now()}.pdf`;
          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          const uriResult = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName,
          });

          await Share.share({
            title: `Print: ${patient.name}`,
            files: [uriResult.uri],
            dialogTitle: 'Select a Print Service or App',
          });
        } catch (e) {
          console.error("Native print flow failed:", e);
          alert("Error opening print menu. Please try 'Save as PDF' instead.");
        }
      } else {
        alert("Could not generate report document.");
      }
      setIsProcessing(false);
    } else {
      window.print();
    }
  };

  const handleSaveAsPDF = async () => {
    setShowOptions(false);
    setIsProcessing(true);
    setLoadingText('Generating PDF...');

    if (!reportRef.current) {
      setIsProcessing(false);
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const base64Data = await generatePdfBase64();
        if (base64Data) {
          const safeName = patient.name.replace(/[^\p{L}\p{N}]/gu, '_');
          const fileName = `Report_${safeName}_${Date.now()}.pdf`;

          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          const uriResult = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName,
          });

          await Share.share({
            title: `Save PDF: ${patient.name}`,
            files: [uriResult.uri],
            dialogTitle: 'Save or Send PDF अहवाल (Report)',
          });
        }
      } else {
        // Professional (18mm) margin for PDF download
        const opt = {
          margin: pdfMargins,
          filename: `Report_${patient.name.replace(/[^\p{L}\p{N}]/gu, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 1,
            windowWidth: 680 // <--- ADJUSTED WIDTH TO max 680px
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        await html2pdf().from(reportRef.current).set(opt).save();
      }
    } catch (err) {
      console.error("PDF process failed:", err);
      alert("Failed to generate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareText = async () => {
    const reportText = `
🏥 स्वयम् आरोग्य (आरोग्य शिबिर)
-----------------------
शिबिर क्रमांक (Camp Number): ${camp.serial}
संस्थेचे नाव (Organization Name): ${camp.organizationName}
शिबिराचे ठिकाण (Camp location): ${camp.name}
दिनांक (Date): ${new Date(camp.date).toLocaleDateString('en-GB')}

नोंदणी क्रमांक (Serial Number): ${patient.serial}
नाव (Name): ${patient.name}
लिंग (Gender): ${patient.gender === 'Male' ? 'पुरुष' : 'महिला'}
वय (Age): ${patient.age} वर्ष
मोबाईल क्र. (Mobile Number): ${patient.phone}
${Array.isArray(patient.previousIllness) && patient.previousIllness[0] !== 'None'
  ? `पूर्वीचे आजार (Previous Illness): ${Array.isArray(patient.previousIllness)
    ? patient.previousIllness.slice(0, 2).map((illness) => {
        if (illness === "Diabetes") return "मधुमेह";
        if (illness === "Hypertension") return "रक्तदाब";
        return illness;
      }).join(', ')
    : (
      patient.previousIllness === "Diabetes"
        ? "मधुमेह"
        : patient.previousIllness === "Hypertension"
          ? "रक्तदाब"
          : patient.previousIllness
    )}`
  : ''}

उंची (Height): ${patient.height} cm
वजन (Weight): ${patient.weight} kg
बी.एम.आय. (BMI - Weight/Height²): ${patient.bmi}
रक्तदाब (Blood Pressure): ${patient.bp}
रक्तशर्करा (Blood Glucose): ${patient.glucose} mg%

निष्कर्ष (Remarks): ${patient.remark}

${slogan}
    `.trim();

    try {
      const canShare = Capacitor.isNativePlatform() || (navigator && typeof navigator.share === 'function');
      if (canShare) {
        await Share.share({ title: `अहवाल (Report): ${patient.name}`, text: reportText });
      } else {
        await navigator.clipboard.writeText(reportText);
        alert("Report text copied to clipboard.");
      }
    } catch (err) {
      console.error("Text share failed:", err);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col relative font-sans">
      {/* Header Buttons */}
      <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10 no-print shadow-sm">
        <button
          onClick={onClose}
          className="text-gray-900 font-bold flex items-center gap-1 text-sm bg-gray-100 px-4 py-2 rounded-xl active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleShareText}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg active:scale-95 flex items-center gap-2"
          >
            SHARE TEXT
          </button>
          <button
            onClick={() => setShowOptions(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg active:scale-95 flex items-center gap-2"
          >
            PRINT / PDF
          </button>
        </div>
      </div>

      {/* Main Print Area Container */}
      <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center">
        <div
          ref={reportRef}
          className="print-area w-full mx-auto my-1 bg-white px-2 py-2   text-gray-900"
          style={{
            fontFamily: "'Noto Sans Devanagari', sans-serif",
            maxWidth: 680 // Limit PDF content width to max 680px
          }}
        >
          {/* Main Title */}
          <h1 className="text-3xl font-black text-center mb-2 text-black">स्वयम् आरोग्य<br/> 
          (आरोग्य शिबिर)</h1>
          <div
            className="mb-2"
            style={{
              borderWidth: "2.0px",
              borderStyle: "solid",
              borderColor: "#cccccc",
              borderBottomWidth: "4px",
            }}
          ></div>
          {/* Camp Details Table */}
          <table
            className="w-full border-collapse mb-2 border-black leading-tight"
            style={{
              borderWidth: "2.0px",
              borderStyle: "solid",
              borderColor: "#cccccc",
            }}
          >
            <tbody>
              <tr>
                <td
                  className="p-1.5 font-bold bg-gray-50 w-1/3 leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderRight: "none",
                    borderBottom: "none",
                  }}
                >
                  Organization Name<br />
                  (संस्थेचे नाव):
                </td>
                <td
                  className="p-1.5 font-medium leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderBottom: "none",
                  }}
                >
                  {camp.organizationName}
                </td>
              </tr>
              <tr>
                <td
                  className="p-1.5 font-bold bg-gray-50 w-1/3 leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderRight: "none",
                    borderBottom: "none",
                  }}
                >
                  शिबिर क्रमांक<br />
                  (Camp Number):
                </td>
                <td
                  className="p-1.5 font-medium leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderBottom: "none",
                  }}
                >
                  {camp.serial}
                </td>
              </tr>
              <tr>
                <td
                  className="p-1.5 font-bold bg-gray-50 leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderRight: "none",
                    borderBottom: "none",
                  }}
                >
                  शिबिराचे ठिकाण<br />
                  (Camp location):
                </td>
                <td
                  className="p-1.5 font-medium uppercase leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderBottom: "none",
                  }}
                >
                  {camp.name}
                </td>
              </tr>
              <tr>
                <td
                  className="p-1.5 font-bold bg-gray-50 leading-tight"
                  style={{
                    lineHeight: "1.1",
                    borderRight: "none",
                  }}
                >
                  दिनांक (Date):
                </td>
                <td
                  className="p-1.5 font-medium leading-tight"
                  style={{
                    lineHeight: "1.1",
                  }}
                >
                  {new Date(camp.date).toLocaleDateString('en-GB')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Personal Details Table */}
          <table className="w-full border-collapse mb-2 mt-4 border-black leading-tight"
            style={{
              borderWidth: "2.0px",
              borderStyle: "solid",
              borderColor: "#cccccc",
            }}
          >
            <tbody>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 w-1/3 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>नोंदणी क्रमांक<br />
                (Serial Number):</td>
                <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>{patient.serial}</td>
              </tr>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>नाव (Name):</td>
                <td className=" p-1.5 font-bold text-base uppercase leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>{patient.name}</td>
              </tr>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>लिंग (Gender):</td>
                <td className=" p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>{patient.gender === 'Male' ? 'पुरुष' : 'महिला'}</td>
              </tr>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>वय (Age):</td>
                <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>{patient.age} वर्ष</td>
              </tr>
              <tr>
                <td className=" p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>मोबाईल क्र.<br />
                  (Mobile Number):</td>
                <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>{patient.phone}</td>
              </tr>
              {Array.isArray(patient.previousIllness) && patient.previousIllness[0] !== 'None' && (
                <tr>
                  <td className=" p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>पूर्वीचे आजार<br />
                    (Previous Illness):</td>
                  <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>
                     {Array.isArray(patient.previousIllness)
                       ? patient.previousIllness.slice(0, 2).map((illness) => {
                           if (illness === "Diabetes") return "मधुमेह";
                           if (illness === "Hypertension") return "रक्तदाब";
                           return illness;
                         }).join(', ')
                       : (
                         patient.previousIllness === "Diabetes"
                           ? "मधुमेह"
                           : patient.previousIllness === "Hypertension"
                             ? "रक्तदाब"
                             : patient.previousIllness
                       )
                     }
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Health Metrics Table */}
          <table className="w-full border-collapse mb-2 mt-4 border-black leading-tight"
            style={{
              borderWidth: "2.0px",
              borderStyle: "solid",
              borderColor: "#cccccc",
            }}
          >
            <tbody>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 w-1/3 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>उंची (Height):</td>
                <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>{patient.height} cm</td>
              </tr>
              <tr>
                <td className=" p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>वजन (Weight):</td>
                <td className=" p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>
                  {patient.weight} kg <span className="text-gray-900 text-xs" style={{ lineHeight: "1.1" }}>(योग्य वजन: {patient.idealWeight} kg)</span>
                </td>
              </tr>
              <tr>
                <td className=" p-1.5 font-bold bg-gray-50 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>बी.एम.आय.<br />
                  (BMI - Weight/Height²):</td>
                <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>
                  {patient.bmi} <span className="text-gray-900 text-xs" style={{ lineHeight: "1.1" }}>(18.5–25)</span>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse mb-2 mt-4 border-black leading-tight"
            style={{
              borderWidth: "2.0px",
              borderStyle: "solid",
              borderColor: "#cccccc",
            }}
          >
            <tbody>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 w-1/3 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>रक्तदाब (Blood Pressure):</td>
                <td className="  p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>
                  {patient.bp} <span className="text-gray-900 font-medium text-xs ml-2" style={{ lineHeight: "1.1" }}>(&lt;140/90 mm of Hg)</span>
                </td>
              </tr>
              <tr>
                <td className="  p-1.5 font-bold bg-gray-50 w-1/3 leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>रक्तशर्करा (Blood Glucose):</td>
                <td className=" p-1.5 font-medium leading-tight" style={{ lineHeight: "1.1", borderBottom: "none" }}>
                  {patient.glucose} <span className="text-gray-900 font-medium text-xs ml-2" style={{ lineHeight: "1.1" }}>(&lt;140 mg%)</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Remarks Table */}
          <table className="w-full border-collapse mb-2 mt-4 border-black leading-tight"
            style={{
              borderWidth: "2.0px",
              borderStyle: "solid",
              borderColor: "#cccccc",
            }}
          >
            <tbody>
              <tr style={{ height: "6.5em", minHeight: "6.5em" }}>
                <td className="p-1.5 font-bold bg-gray-50 w-1/3 align-top leading-tight" style={{ lineHeight: "1.1", borderRight: "none", borderBottom: "none" }}>
                  निष्कर्ष (Remarks):
                </td>
                <td
                  className="p-1.5 font-bold text-gray-800 italic leading-snug align-top"
                  style={{ lineHeight: "1.1", verticalAlign: "top", borderBottom: "none" }}
                >
                  {patient.remark}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Notes */}
          <div className="text-left mb-3 px-3" style={{ lineHeight: "1.5" }}>
            <p
              className="text-xs font-black text-gray-900 leading-tight"
              style={{
                lineHeight: "1.5",
                fontFamily: "Noto Sans Devanagari, 'Marathi', 'Devanagari', sans-serif",
              }}
            >
              टिप: वरील माहिती तुमच्या नेहमीच्या डॉक्टरना दाखवुन त्यांचा सल्ला घेणे.<br />
              <span
                style={{
                  fontFamily: "inherit", // use same font for continuity
                }}
              >
                Note: Consult your regular doctor with this report.
              </span>
            </p>
          </div>

          <div className="text-center py-4 border-t border-black" style={{ lineHeight: "2.5" }}>
            <p
              className="text-lg font-black text-gray-900 leading-tight tracking-wide"
              style={{
                lineHeight: "2.5",
                fontFamily: "inherit", // Ensure Marathi font preserved in print
              }}
            >
              {slogan}
            </p>
          </div>
        </div>
      </div>

      {/* Choice Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-6 no-print">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 text-center border-b bg-gray-50">
              <h3 className="text-lg font-black text-gray-900">Select Action</h3>
              <p className="text-xs text-gray-900 font-bold uppercase tracking-widest mt-1">Choose output method</p>
            </div>
            <div className="p-4 grid grid-cols-1 gap-3">
              <button
                onClick={handlePrintAction}
                className="flex items-center gap-4 p-4 bg-blue-50 text-blue-700 rounded-2xl active:scale-95 transition-all border-2 border-blue-100"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                </div>
                <div className="text-left">
                  <span className="block font-black text-sm uppercase">Print Report (अहवाल)</span>
                  <span className="text-[10px] font-bold opacity-70">Android Print System</span>
                </div>
              </button>

              <button
                onClick={handleSaveAsPDF}
                className="flex items-center gap-4 p-4 bg-orange-50 text-orange-700 rounded-2xl active:scale-95 transition-all border-2 border-orange-100"
              >
                <div className="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <div className="text-left">
                  <span className="block font-black text-sm uppercase">Save as PDF</span>
                  <span className="text-[10px] font-bold opacity-70">Download Document</span>
                </div>
              </button>

              <button onClick={() => setShowOptions(false)} className="mt-2 w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-[300] no-print">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-blue-600 uppercase tracking-[0.2em] text-xs">{loadingText}</p>
        </div>
      )}
    </div>
  );
};

export default PrintPreview;