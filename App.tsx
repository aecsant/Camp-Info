import React, { useState, useEffect } from 'react';
import { Screen, Camp, Patient } from './types';
import CampRegistration from './screens/CampRegistration';
import PatientInformation from './screens/PatientInformation';
import PatientList from './screens/PatientList';
import PrintPreview from './screens/PrintPreview';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.CampRegistration);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate application loading time for a smoother splash transition
    const timer = setTimeout(() => {
      setIsInitializing(false);
      // Notify the static splash screen in index.html to hide
      const splash = document.getElementById('splash-root');
      if (splash) {
        splash.classList.add('hidden');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (screen: Screen, camp?: Camp, patient?: Patient) => {
    if (camp) setSelectedCamp(camp);
    if (patient) setSelectedPatient(patient);
    setCurrentScreen(screen);
  };

  if (isInitializing) {
    return null; // Keep the HTML splash screen visible
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden animate-in fade-in duration-700">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-2">
           <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" fill="#fff" stroke="#2563eb" strokeWidth="4"/>
            <rect x="20" y="12" width="8" height="24" rx="2" fill="#2563eb"/>
            <rect x="12" y="20" width="24" height="8" rx="2" fill="#2563eb"/>
          </svg>
          <h1 className="text-xl font-bold uppercase tracking-wider">Camp Info</h1>
        </div>
        {currentScreen !== Screen.CampRegistration && (
          <button 
            onClick={() => setCurrentScreen(Screen.CampRegistration)}
            className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors active:scale-95 flex items-center gap-1 font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="container mx-auto max-w-lg md:max-w-3xl lg:max-w-4xl">
          {currentScreen === Screen.CampRegistration && (
            <CampRegistration onSelectCamp={(camp) => navigateTo(Screen.PatientList, camp)} />
          )}
          {currentScreen === Screen.PatientInformation && selectedCamp && (
            <PatientInformation 
              camp={selectedCamp} 
              patientToEdit={selectedPatient}
              onSuccess={(p, mode) => {
                if (mode === 'print') {
                  navigateTo(Screen.PrintPreview, selectedCamp, p);
                } else {
                  navigateTo(Screen.PatientList, selectedCamp);
                }
              }} 
            />
          )}
          {currentScreen === Screen.PatientList && selectedCamp && (
            <PatientList 
              camp={selectedCamp} 
              onAddPatient={() => { setSelectedPatient(null); navigateTo(Screen.PatientInformation, selectedCamp); }}
              onEditPatient={(p) => navigateTo(Screen.PatientInformation, selectedCamp, p)}
              onPrintPatient={(p) => navigateTo(Screen.PrintPreview, selectedCamp, p)}
            />
          )}
          {currentScreen === Screen.PrintPreview && selectedPatient && (
            <PrintPreview 
              patient={selectedPatient} 
              camp={selectedCamp!}
              onClose={() => navigateTo(Screen.PatientList, selectedCamp!)} 
            />
          )}
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="bg-white border-t p-2 text-center text-[10px] text-gray-500 flex-shrink-0 font-bold">
        &copy; {new Date().getFullYear()} - BrahmCS.co.in
      </footer>
    </div>
  );
};

export default App;