
export const calculateBMI = (weight: number, heightCm: number): number => {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(2));
};

export const calculateIdealWeight = (heightCm: number): number => {
  if (!heightCm) return 0;
  const heightM = heightCm / 100;
  // Based on target BMI of 22.0 (Middle of healthy range)
  return parseFloat((22.0 * (heightM * heightM)).toFixed(1));
};

export const generateRemark = (
  illness: string,
  glucose: number,
  bp: string
): string => {
  const [sysStr, diaStr] = bp.split('/');
  const sys = parseInt(sysStr) || 0;
  const dia = parseInt(diaStr) || 0;

  const isHighGlucose = glucose > 150;
  const isHighBP = sys > 140 || dia > 90;
  
  const hasDiabetes = illness.toLowerCase().includes('diabetes');
  const hasHypertension = illness.toLowerCase().includes('cardiovascular') || illness.toLowerCase().includes('hypertension');
  const hasNone = illness === 'None';

  // Case D: Both
  if (hasHypertension && hasDiabetes) {
    return "मधुमेह तसेच रक्तदाबाची तपासणी आणि उपचार नियमित घेणे";
  }

  // Case B: Only Diabetes
  if (hasDiabetes && !isHighBP) {
    return "मधुमेहाची तपासणी आणि उपचार नियमित करणे";
  }

  // Case C: Only Hypertension
  if (hasHypertension && !isHighGlucose) {
    return "रक्तदाबाची तपासणी आणि उपचार नियमित करणे";
  }

  // Case A: No previous illness
  if (hasNone || (!hasDiabetes && !hasHypertension)) {
    if (!isHighGlucose && !isHighBP) {
      return "रक्तामधील साखरेचे प्रमाण व रक्तदाब योग्य आहे.";
    }
    if (isHighGlucose && !isHighBP) {
      return "रिकाम्यापोटी व जेवणानंतरचे रक्तामधील साखरेचे प्रमाण तपासणे";
    }
    if (!isHighGlucose && isHighBP) {
      return "रक्तदाब पुन्हा तपासणे व उपचार घेणे";
    }
    if (isHighGlucose && isHighBP) {
      return "रिकाम्यापोटी व जेवणानंतरचे रक्तामधील साखरेचे प्रमाण तसेच रक्तदाब पुन्हा तपासणे";
    }
  }

  return "तपासणी आणि उपचार नियमित करणे";
};
