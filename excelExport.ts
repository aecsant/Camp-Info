
import { Patient, Camp } from './types';

export const exportToCSV = (camp: Camp, patients: Patient[]) => {
  const headers = [
    'Serial No', 'Name', 'Gender', 'Age', 'Phone', 'Addiction', 
    'Previous Illness', 'Height (cm)', 'Ideal Weight (kg)', 
    'Weight (kg)', 'BMI', 'Blood Pressure', 'Blood Glucose', 'Remark'
  ];

  const rows = patients.map(p => [
    p.serial,
    p.name,
    p.gender,
    p.age,
    p.phone,
    p.addiction,
    p.previousIllness,
    p.height,
    p.idealWeight,
    p.weight,
    p.bmi,
    p.bp,
    p.glucose,
    p.remark
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Camp_${camp.name}_${camp.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
