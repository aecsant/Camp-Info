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
    const timer = setTimeout(() => {
      setIsInitializing(false);
      const splash = document.getElementById('splash-root');
      if (splash) {
        splash.classList.add('hidden');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (screen: Screen, camp?: Camp, patient?: Patient) => {
    if (camp) setSelectedCamp(camp);
    if (patient) setSelectedPatient(patient);
    setCurrentScreen(screen);
  };

  if (isInitializing) return null;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden animate-in fade-in duration-500">
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
            Home
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="container mx-auto max-w-lg">
          {currentScreen === Screen.CampRegistration && (
            <CampRegistration onSelectCamp={(camp) => navigateTo(Screen.PatientList, camp)} />
          )}
          {currentScreen === Screen.PatientInformation && selectedCamp && (
            <PatientInformation 
              camp={selectedCamp} 
              patientToEdit={selectedPatient}
              onSuccess={(p, mode) => navigateTo(mode === 'print' ? Screen.PrintPreview : Screen.PatientList, selectedCamp, p)} 
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
          {currentScreen === Screen.PrintPreview && selectedPatient && selectedCamp && (
            <PrintPreview 
              patient={selectedPatient} 
              camp={selectedCamp}
              onClose={() => navigateTo(Screen.PatientList, selectedCamp)} 
            />
          )}
        </div>
      </main>
      <footer className="bg-white border-t p-2 text-center text-[10px] text-gray-400 flex-shrink-0 font-bold">
        &copy; {new Date().getFullYear()} - BrahmCS.co.in
      </footer>
    </div>
  );
};

export default App;