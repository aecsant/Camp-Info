
import { Camp, Patient } from './types';

const generateUUID = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const STORAGE_KEYS = {
  CAMPS: 'camp_info_camps',
  PATIENTS: 'camp_info_patients',
};

const safeGet = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Storage error", e);
    return null;
  }
};

export const getCamps = (): Camp[] => {
  return safeGet(STORAGE_KEYS.CAMPS) || [];
};

export const saveCamp = (camp: Camp) => {
  const camps = getCamps();
  localStorage.setItem(STORAGE_KEYS.CAMPS, JSON.stringify([...camps, camp]));
};

export const updateCamp = (updatedCamp: Camp) => {
  const camps = getCamps();
  const index = camps.findIndex(c => c.id === updatedCamp.id);
  if (index >= 0) {
    camps[index] = updatedCamp;
    localStorage.setItem(STORAGE_KEYS.CAMPS, JSON.stringify(camps));
  }
};

export const getPatients = (campId?: string): Patient[] => {
  const allPatients: Patient[] = safeGet(STORAGE_KEYS.PATIENTS) || [];
  if (campId) {
    return allPatients.filter(p => p.campId === campId);
  }
  return allPatients;
};

export const savePatient = (patient: Patient) => {
  const patients = getPatients();
  const index = patients.findIndex(p => p.id === patient.id);
  if (index >= 0) {
    patients[index] = patient;
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  } else {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([...patients, patient]));
  }
};

export const deletePatient = (patientId: string) => {
    const patients = getPatients();
    const filtered = patients.filter(p => p.id !== patientId);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(filtered));
};

export { generateUUID };