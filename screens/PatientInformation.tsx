
import React, { useState, useEffect } from 'react';
import { Camp, Patient } from '../types';
import { getPatients, savePatient } from '../db';
import { calculateBMI, calculateIdealWeight, generateRemark } from '../utils';

interface PatientInformationProps {
  camp: Camp;
  patientToEdit: Patient | null;
  onSuccess: (patient: Patient) => void;
}

const ADDICTIONS = ['None', 'Tobacco', 'Smoking', 'Drinking', 'Other'];
const ILLNESSES = [
  'None', 'Hypertension', 'Diabetes (Type 1)', 'Diabetes (Type 2)', 
  'Cancers', 'Cardiovascular diseases (CVD)', 'Chronic respiratory (COPD)', 
  'Tuberculosis (TB)', 'Liver diseases', 'Oral health problems', 
  'Malnutrition', 'Cerebrovascular attack', 'Other'
];

const PatientInformation: React.FC<PatientInformationProps> = ({ camp, patientToEdit, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    gender: 'Male',
    age: 18,
    phone: '',
    addiction: 'None',
    previousIllness: 'None',
    height: 0,
    weight: 0,
    bp: '120/80',
    glucose: 100
  });

  const [serial, setSerial] = useState(1);

  useEffect(() => {
    if (patientToEdit) {
      setFormData(patientToEdit);
      setSerial(patientToEdit.serial);
    } else {
      const campPatients = getPatients(camp.id);
      setSerial(campPatients.length + 1);
    }
  }, [camp.id, patientToEdit]);

  const updateField = (field: keyof Patient, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculations
      if (field === 'height' || field === 'weight') {
        const h = field === 'height' ? Number(value) : (prev.height || 0);
        const w = field === 'weight' ? Number(value) : (prev.weight || 0);
        updated.bmi = calculateBMI(w, h);
        updated.idealWeight = calculateIdealWeight(h);
      }

      // Remark auto-calc based on all required deps
      const currentIllness = field === 'previousIllness' ? value : (updated.previousIllness || 'None');
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
      id: patientToEdit?.id || crypto.randomUUID(),
      campId: camp.id,
      serial: serial,
      createdAt: patientToEdit?.createdAt || new Date().toISOString()
    };
    savePatient(finalPatient);
    onSuccess(finalPatient);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patient Entry</h2>
          <p className="text-sm text-gray-500">Camp: {camp.name}</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
          S.No: {serial}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="flex flex-col col-span-1 md:col-span-2">
          <label className="text-sm font-semibold mb-1">Full Name</label>
          <input 
            type="text" 
            maxLength={80}
            required
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Gender</label>
          <div className="flex gap-4 p-2 border rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gender" checked={formData.gender === 'Male'} onChange={() => updateField('gender', 'Male')} /> Male
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gender" checked={formData.gender === 'Female'} onChange={() => updateField('gender', 'Female')} /> Female
            </label>
          </div>
        </div>

        {/* Age & Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Age (1-100)</label>
            <input 
              type="number" min="1" max="100" required
              value={formData.age}
              onChange={(e) => updateField('age', Number(e.target.value))}
              className="border p-3 rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Phone No</label>
            <input 
              type="tel" maxLength={10} required
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
              className="border p-3 rounded-lg"
            />
          </div>
        </div>

        {/* Addiction Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Addiction</label>
          <select 
            value={formData.addiction}
            onChange={(e) => updateField('addiction', e.target.value)}
            className="border p-3 rounded-lg"
          >
            {ADDICTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Illness Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Previous Illness</label>
          <select 
            value={formData.previousIllness}
            onChange={(e) => updateField('previousIllness', e.target.value)}
            className="border p-3 rounded-lg"
          >
            {ILLNESSES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Vitals */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Height (cm)</label>
          <input 
            type="number" step="1" required
            value={formData.height || ''}
            onChange={(e) => updateField('height', Number(e.target.value))}
            className="border p-3 rounded-lg"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Weight (kg)</label>
          <input 
            type="number" step="0.1" required
            value={formData.weight || ''}
            onChange={(e) => updateField('weight', Number(e.target.value))}
            className="border p-3 rounded-lg"
          />
        </div>

        {/* Auto Calculated BMI / Ideal Weight */}
        <div className="bg-gray-50 p-4 rounded-lg border border-dashed flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-500 uppercase">Auto Diagnostics</p>
            <div className="flex justify-between mt-2">
                <div>
                    <span className="text-xs text-gray-400">BMI</span>
                    <p className="text-lg font-bold text-blue-700">{formData.bmi || '0.00'}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400">Ideal Weight</span>
                    <p className="text-lg font-bold text-green-700">{formData.idealWeight || '0.0'} kg</p>
                </div>
            </div>
        </div>

        {/* Health Details */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Blood Pressure (mm of HG)</label>
          <input 
            type="text" placeholder="120/90" required
            value={formData.bp}
            onChange={(e) => updateField('bp', e.target.value)}
            className="border p-3 rounded-lg"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Blood Glucose (mg%)</label>
          <input 
            type="number" required
            value={formData.glucose || ''}
            onChange={(e) => updateField('glucose', Number(e.target.value))}
            className="border p-3 rounded-lg"
          />
        </div>

        {/* Remark Display */}
        <div className="flex flex-col col-span-1 md:col-span-2">
          <label className="text-sm font-semibold mb-1">Remark (Automated)</label>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 font-medium italic min-h-[60px] flex items-center">
            {formData.remark || 'Fill details to see remark...'}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 pt-4">
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            Save Patient Information
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientInformation;
