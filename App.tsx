
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

  const navigateTo = (screen: Screen, camp?: Camp, patient?: Patient) => {
    if (camp) setSelectedCamp(camp);
    if (patient) setSelectedPatient(patient);
    setCurrentScreen(screen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h1 className="text-xl font-bold uppercase tracking-wider">Camp Info</h1>
        </div>
        {currentScreen !== Screen.CampRegistration && (
          <button 
            onClick={() => setCurrentScreen(Screen.CampRegistration)}
            className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors"
          >
            Home
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-lg md:max-w-3xl lg:max-w-4xl p-4">
        {currentScreen === Screen.CampRegistration && (
          <CampRegistration onSelectCamp={(camp) => navigateTo(Screen.PatientList, camp)} />
        )}
        {currentScreen === Screen.PatientInformation && selectedCamp && (
          <PatientInformation 
            camp={selectedCamp} 
            patientToEdit={selectedPatient}
            onSuccess={(p) => navigateTo(Screen.PrintPreview, selectedCamp, p)} 
          />
        )}
        {currentScreen === Screen.PatientList && selectedCamp && (
          <PatientList 
            camp={selectedCamp} 
            onAddPatient={() => { setSelectedPatient(null); navigateTo(Screen.PatientInformation, selectedCamp); }}
            onEditPatient={(p) => navigateTo(Screen.PatientInformation, selectedCamp, p)}
          />
        )}
        {currentScreen === Screen.PrintPreview && selectedPatient && (
          <PrintPreview 
            patient={selectedPatient} 
            camp={selectedCamp!}
            onClose={() => navigateTo(Screen.PatientList, selectedCamp!)} 
          />
        )}
      </main>

      {/* Footer / Mobile Hint */}
      <footer className="bg-white border-t p-2 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Camp Info - Secure Medical Field Records
      </footer>
    </div>
  );
};

export default App;
