export const calculateBMI = (weight: number, heightCm: number): number => {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(2));
};

export const calculateIdealWeight = (heightCm: number, gender: 'Male' | 'Female' | 'Other' = 'Male'): number => {
  if (!heightCm || heightCm <= 0) return 0;

  // Hamwi Formula (Metric implementation)
  // Base height: 152.4 cm (5 feet)
  // Male: 48.0 kg + 2.7 kg per inch (2.54 cm) over 5ft
  // Female: 45.5 kg + 2.2 kg per inch (2.54 cm) over 5ft
  
  const baseHeightCm = 152.4;
  const inchesOverBase = (heightCm - baseHeightCm) / 2.54;
  
  let baseWeight: number;
  let incrementPerInch: number;

  if (gender === 'Female') {
    baseWeight = 45.5;
    incrementPerInch = 2.2;
  } else {
    // Default to Male formula for 'Male' and 'Other'
    baseWeight = 48.0;
    incrementPerInch = 2.7;
  }

  const idealWeight = baseWeight + (inchesOverBase * incrementPerInch);
  return parseFloat(Math.max(0, idealWeight).toFixed(1));
};

export const generateRemark = (
  illness: string | string[],
  glucose: number,
  bp: string
): string => {
  const bpParts = bp.split('/');
  const sys = parseInt(bpParts[0]) || 0;
  const dia = parseInt(bpParts[1]) || 0;

  /**
   * BP LOGIC:
   * Low/Normal: (sys < 140 AND dia < 90)
   * High: (sys > 140 OR dia > 90)
   * 
   * GLUCOSE LOGIC:
   * Threshold: 150
   */
  
  const isHighBP = sys > 140 || dia > 90;
  const isLowBP = sys < 140 && dia < 90;
  const isHighGluc = glucose > 150;
  const isLowGluc = glucose < 150;

  const illnessList = Array.isArray(illness) ? illness : [illness];
  
  const hasDiabetes = illnessList.some(i => i.toLowerCase().includes('diabetes'));
  const hasHypertension = illnessList.some(i => 
    i.toLowerCase().includes('hypertension') || 
    i.toLowerCase().includes('cardiovascular') || 
    i.toLowerCase().includes('cvd')
  );
  
  const hasBoth = hasDiabetes && hasHypertension;

  // D] If history of Hypertension and diabetes then whatever sys/dia and Blood glucose be
  if (hasBoth) {
    return "मधुमेह तसेच रक्तदाबाची तपासणी आणि उपचार नियमित घेणे";
  }

  // B] If previous illness is only Diabetes
  if (hasDiabetes && !hasHypertension) {
    if (isLowBP) {
      return "मधुमेहाची तपासणी आणि उपचार नियमित करणे";
    }
    if (isHighBP) {
      return "रिकाम्यापोटी व जेवणानंतरचे रक्तामधील साखरेचे प्रमाण नियमित करणे तसेच रक्तदाब पुन्हा तपासणे";
    }
  }

  // C] If previous illness is only hypertension
  if (hasHypertension && !hasDiabetes) {
    if (isLowGluc) {
      return "रक्तदाबाची तपासणी आणि उपचार नियमित करणे";
    }
    if (isHighGluc) {
      return "रक्तदाबाची तपासणी व उपचार नियमित करणे तसेच रिकाम्यापोटी व जेवणानंतरचे रक्तामधील साखरेचे प्रमाण तपासणे";
    }
  }

  // A] No previous illness
  if (isLowGluc && isLowBP) {
    return "रक्तामधील साखरेचे प्रमाण व रक्तदाब योग्य आहे.";
  }
  if (isHighGluc && isLowBP) {
    return "रिकाम्यापोटी व जेवणानंतरचे रक्तामधील साखरेचे प्रमाण तपासणे";
  }
  if (isLowGluc && isHighBP) {
    return "रक्तदाब पुन्हा तपासणे व उपचार घेणे";
  }
  if (isHighGluc && isHighBP) {
    return "रिकाम्यापोटी व जेवणानंतरचे रक्तामधील साखरेचे प्रमाण तसेच रक्तदाब पुन्हा तपासणे";
  }

  return "तपासणी आणि उपचार नियमित करणे";
};