
import { Camp, Patient } from './types';

const STORAGE_KEYS = {
  CAMPS: 'camp_info_camps',
  PATIENTS: 'camp_info_patients',
};

export const getCamps = (): Camp[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CAMPS);
  return data ? JSON.parse(data) : [];
};

export const saveCamp = (camp: Camp) => {
  const camps = getCamps();
  localStorage.setItem(STORAGE_KEYS.CAMPS, JSON.stringify([...camps, camp]));
};

export const getPatients = (campId?: string): Patient[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
  const allPatients: Patient[] = data ? JSON.parse(data) : [];
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
