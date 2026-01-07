import { Patient, Camp } from './types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const exportToCSV = async (camp: Camp, patients: Patient[]) => {
  const headers = [
    'Serial No', 'Name', 'Gender', 'Age', 'Phone', 'Addiction', 
    'Previous Illness', 'Height (cm)', 'Ideal Weight (kg)', 
    'Weight (kg)', 'BMI', 'Blood Pressure', 'Blood Glucose', 'Remark'
  ];

  const rows = patients.map(p => [
    p.serial,
    p.name.replace(/,/g, ' '),
    p.gender,
    p.age,
    p.phone,
    (Array.isArray(p.addiction) ? p.addiction.join('; ') : (p.addiction || 'None')).replace(/,/g, ' '),
    (Array.isArray(p.previousIllness) ? p.previousIllness.join('; ') : (p.previousIllness || 'None')).replace(/,/g, ' '),
    p.height,
    p.idealWeight,
    p.weight,
    p.bmi,
    p.bp,
    p.glucose,
    p.remark.replace(/,/g, ' ')
  ]);

  // \uFEFF is the BOM for Excel UTF-8 Marathi support
  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  const fileName = `Camp_${camp.name.replace(/[^a-z0-9]/gi, '_')}_${camp.date}.csv`;

  try {
    if (Capacitor.isNativePlatform()) {
      // NATIVE FLOW (Android/iOS)
      await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const fileResult = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName,
      });

      await Share.share({
        title: 'Export Camp Data',
        text: `Patient data for ${camp.name}`,
        files: [fileResult.uri],
        dialogTitle: 'Save or Share CSV File',
      });
    } else {
      // WEB FLOW (Browser)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Export failed", err);
    alert("Export failed. If on Android, please check permissions.");
  }
};