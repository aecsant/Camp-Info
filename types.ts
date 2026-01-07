export interface Camp {
  id: string;
  serial: number;
  name: string;
  date: string;
  organizationName: string;
}

export interface Patient {
  id: string;
  campId: string;
  serial: number;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  phone: string;
  addiction: string[];
  previousIllness: string | string[];
  height: number;
  idealWeight: number;
  weight: number;
  bmi: number;
  bp: string;
  glucose: number;
  remark: string;
  createdAt: string;
}

export enum Screen {
  CampRegistration = 'CampRegistration',
  PatientInformation = 'PatientInformation',
  PatientList = 'PatientList',
  PrintPreview = 'PrintPreview'
}