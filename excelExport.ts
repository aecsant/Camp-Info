import { Patient, Camp } from './types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
    p.addiction,
    (Array.isArray(p.previousIllness) ? p.previousIllness.join('; ') : p.previousIllness).replace(/,/g, ' '),
    p.height,
    p.idealWeight,
    p.weight,
    p.bmi,
    p.bp,
    p.glucose,
    p.remark.replace(/,/g, ' ')
  ]);

  // \uFEFF is the Byte Order Mark (BOM) for UTF-8. 
  // It tells Excel that the following content is UTF-8 encoded, 
  // ensuring Unicode characters like Marathi display correctly.
  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  const fileName = `Camp_${camp.name.replace(/[^a-z0-9]/gi, '_')}_${camp.date}.csv`;

  try {
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
      url: fileResult.uri,
      dialogTitle: 'Save or Share Excel/CSV File',
    });
  } catch (err) {
    console.error("Export failed", err);
    alert("Export failed. Please ensure storage permissions are granted.");
  }
};