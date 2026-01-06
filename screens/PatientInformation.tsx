import React, { useState, useEffect } from 'react';
import { Camp, Patient } from '../types';
import { getPatients, savePatient, generateUUID } from '../db';
import { calculateBMI, calculateIdealWeight, generateRemark } from '../utils';

interface PatientInformationProps {
  camp: Camp;
  patientToEdit: Patient | null;
  onSuccess: (patient: Patient, mode: 'print' | 'list') => void;
}

const ADDICTIONS = ['None', 'Tobacco', 'Smoking', 'Drinking', 'Other'];
const ILLNESSES = [
  'None', 
  'Hypertension', 
  'Diabetes', 
  'Cancers', 
  'Cardiovascular diseases (CVD)', 
  'Chronic respiratory (COPD)', 
  'Tuberculosis (TB)', 
  'Liver diseases', 
  'Oral health problems', 
  'Malnutrition', 
  'Cerebrovascular attack', 
  'Other'
];

const PatientInformation: React.FC<PatientInformationProps> = ({ camp, patientToEdit, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    gender: 'Male',
    age: 18,
    phone: '',
    addiction: 'None',
    previousIllness: ['None'],
    height: 0,
    weight: 0,
    bmi: 0,
    idealWeight: 0,
    bp: '120/80',
    glucose: 100,
    remark: ''
  });

  const [serial, setSerial] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedPatient, setSavedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (patientToEdit) {
      setFormData(patientToEdit);
      setSerial(patientToEdit.serial);
    } else {
      const campPatients = getPatients(camp.id);
      setSerial(campPatients.length + 1);
      setFormData(prev => ({...prev, remark: generateRemark(['None'], 100, '120/80')}));
    }
  }, [camp.id, patientToEdit]);

  const updateField = (field: keyof Patient, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      const currentHeight = field === 'height' ? Number(value) : (prev.height || 0);
      const currentWeight = field === 'weight' ? Number(value) : (prev.weight || 0);
      const currentGender = field === 'gender' ? value : (prev.gender || 'Male');

      if (field === 'height' || field === 'weight' || field === 'gender') {
        updated.bmi = calculateBMI(currentWeight, currentHeight);
        updated.idealWeight = calculateIdealWeight(currentHeight, currentGender);
      }

      const currentIllness = field === 'previousIllness' ? value : (updated.previousIllness || ['None']);
      const currentGlucose = field === 'glucose' ? Number(value) : (updated.glucose || 0);
      const currentBP = field === 'bp' ? value : (updated.bp || '120/80');
      
      updated.remark = generateRemark(currentIllness, currentGlucose, currentBP);

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPatient: Patient = {
      ...formData as Patient,
      id: patientToEdit?.id || generateUUID(),
      campId: camp.id,
      serial: serial,
      createdAt: patientToEdit?.createdAt || new Date().toISOString()
    };
    savePatient(finalPatient);
    setSavedPatient(finalPatient);
    setShowSuccess(true);
  };

  return (
    <div className="relative">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Patient Entry</h2>
            <p className="text-xs text-gray-500 font-medium">Camp: {camp.name}</p>
          </div>
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-sm">
            S.No: {serial}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input 
              type="text" maxLength={80} required
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="border p-4 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
            <div className="flex gap-4 p-3 border rounded-lg bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold flex-1 justify-center py-1">
                <input type="radio" name="gender" checked={formData.gender === 'Male'} onChange={() => updateField('gender', 'Male')} className="w-4 h-4" /> Male
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold flex-1 justify-center py-1 border-l pl-4">
                <input type="radio" name="gender" checked={formData.gender === 'Female'} onChange={() => updateField('gender', 'Female')} className="w-4 h-4" /> Female
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Age (1-100)</label>
              <input 
                type="number" min="1" max="100" required
                value={formData.age}
                onChange={(e) => updateField('age', Number(e.target.value))}
                className="border p-4 rounded-lg text-base"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Phone No</label>
              <input 
                type="tel" maxLength={10} required
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                className="border p-4 rounded-lg text-base"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Addiction</label>
            <select 
              value={formData.addiction}
              onChange={(e) => updateField('addiction', e.target.value)}
              className="border p-4 rounded-lg bg-white text-base"
            >
              {ADDICTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Previous Illness (Multi-select)</label>
            <select
              multiple
              value={Array.isArray(formData.previousIllness) ? formData.previousIllness : (formData.previousIllness ? [formData.previousIllness] : [])}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                let finalSelection = selected;
                if (selected.length > 1 && selected.includes('None')) {
                    finalSelection = selected.filter(s => s !== 'None');
                } else if (selected.length === 0) {
                    finalSelection = ['None'];
                }
                updateField('previousIllness', finalSelection);
              }}
              className="border p-4 rounded-lg bg-white text-base min-h-[140px]"
            >
              {ILLNESSES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <p className="text-[9px] text-gray-400 mt-1 font-bold italic">Hold Ctrl/Cmd or long press to select multiple.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Height (cm)</label>
              <input 
                type="number" step="1" required
                value={formData.height || ''}
                onChange={(e) => updateField('height', Number(e.target.value))}
                className="border p-4 rounded-lg text-base"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
              <input 
                type="number" step="0.1" required
                value={formData.weight || ''}
                onChange={(e) => updateField('weight', Number(e.target.value))}
                className="border p-4 rounded-lg text-base"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Auto Diagnostics</p>
              <div className="flex justify-between mt-2">
                  <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">BMI</span>
                      <p className="text-xl font-black text-blue-700">{formData.bmi || '0.00'}</p>
                  </div>
                  <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Ideal Weight</span>
                      <p className="text-xl font-black text-green-700">{formData.idealWeight || '0.0'} <small className="text-xs">kg</small></p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1">BP (mm of HG)</label>
              <input 
                type="text" placeholder="120/90" required
                value={formData.bp}
                onChange={(e) => updateField('bp', e.target.value)}
                className="border p-4 rounded-lg text-base"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Blood Glucose (mg%)</label>
              <input 
                type="number" required
                value={formData.glucose || ''}
                onChange={(e) => updateField('glucose', Number(e.target.value))}
                className="border p-4 rounded-lg text-base"
              />
            </div>
          </div>

          <div className="flex flex-col col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Remark (Auto Calculated)</label>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-900 font-bold italic text-sm leading-relaxed min-h-[70px] flex items-center shadow-inner">
              {formData.remark || 'Calculating advice...'}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 pt-2">
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-wider"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Submit Information
            </button>
          </div>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl scale-in-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-500 mb-8 font-medium">Patient record has been saved successfully to local storage.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onSuccess(savedPatient!, 'list')}
                className="w-full bg-gray-100 text-gray-800 font-bold py-4 rounded-2xl active:scale-95 transition-all"
              >
                OK
              </button>
              <button 
                onClick={() => onSuccess(savedPatient!, 'print')}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                PRINT REPORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInformation;