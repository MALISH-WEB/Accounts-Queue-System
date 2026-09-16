import { ProgrammeTuitionStructure } from '../types';

export const UCU_PROGRAMME_FEE_STRUCTURES: ProgrammeTuitionStructure[] = [
  {
    id: 'PROG_BSIT',
    code: 'BSIT',
    name: 'Bachelor of Science in Information Technology (BSIT)',
    faculty: 'Faculty of Science & Technology',
    campus: 'Main Campus - Mukono',
    tuitionFee: 2200000,
    functionalFees: 200000,
    functionalFeesBreakdown: {
      examinationFee: 50000,
      technologyIctFee: 50000,
      libraryFee: 40000,
      medicalClinicFee: 30000,
      guildSportsFee: 30000,
      developmentFundFee: 0,
    },
    totalAssessed: 2400000,
    policyRegistration45: 1080000, // 45% of 2,400,000
    policyMidSem75: 1800000,       // 75% of 2,400,000
    policyFinal100: 2400000,       // 100% of 2,400,000
    latePaymentCharge: 50000,
    description: 'Undergraduate professional computing programme specializing in enterprise infrastructure, cloud systems, and software engineering.'
  },
  {
    id: 'PROG_BBA',
    code: 'BBA',
    name: 'Bachelor of Business Administration (BBA)',
    faculty: 'School of Business',
    campus: 'Main Campus - Mukono',
    tuitionFee: 1800000,
    functionalFees: 200000,
    functionalFeesBreakdown: {
      examinationFee: 50000,
      technologyIctFee: 40000,
      libraryFee: 40000,
      medicalClinicFee: 40000,
      guildSportsFee: 30000,
      developmentFundFee: 0,
    },
    totalAssessed: 2000000,
    policyRegistration45: 900000,  // 45% of 2,000,000
    policyMidSem75: 1500000,       // 75% of 2,000,000
    policyFinal100: 2000000,       // 100% of 2,000,000
    latePaymentCharge: 50000,
    description: 'Comprehensive business degree emphasizing financial stewardship, marketing, procurement, and enterprise management.'
  },
  {
    id: 'PROG_LLB',
    code: 'LLB',
    name: 'Bachelor of Laws (LLB)',
    faculty: 'Faculty of Law',
    campus: 'Main Campus - Mukono',
    tuitionFee: 2700000,
    functionalFees: 300000,
    functionalFeesBreakdown: {
      examinationFee: 70000,
      technologyIctFee: 50000,
      libraryFee: 90000, // Specialized Law reports and moot courts
      medicalClinicFee: 50000,
      guildSportsFee: 40000,
      developmentFundFee: 0,
    },
    totalAssessed: 3000000,
    policyRegistration45: 1350000, // 45% of 3,000,000
    policyMidSem75: 2250000,       // 75% of 3,000,000
    policyFinal100: 3000000,       // 100% of 3,000,000
    latePaymentCharge: 50000,
    description: 'Flagship professional law curriculum preparing advocates for legal practice, statutory compliance, and judiciary advocacy.'
  },
  {
    id: 'PROG_BNS',
    code: 'BNS',
    name: 'Bachelor of Nursing Science (BNS)',
    faculty: 'School of Medicine & Dentistry',
    campus: 'Mengo Hospital Campus',
    tuitionFee: 2500000,
    functionalFees: 300000,
    functionalFeesBreakdown: {
      examinationFee: 60000,
      technologyIctFee: 40000,
      libraryFee: 40000,
      medicalClinicFee: 50000,
      guildSportsFee: 30000,
      developmentFundFee: 0,
      clinicalLabFee: 80000, // Hospital clinical skills simulation
    },
    totalAssessed: 2800000,
    policyRegistration45: 1260000, // 45% of 2,800,000
    policyMidSem75: 2100000,       // 75% of 2,800,000
    policyFinal100: 2800000,       // 100% of 2,800,000
    latePaymentCharge: 50000,
    description: 'Clinical nursing and healthcare sciences programme delivered in conjunction with Mengo Hospital clinical departments.'
  },
  {
    id: 'PROG_BDIV',
    code: 'BDIV',
    name: 'Bachelor of Divinity (Theology)',
    faculty: 'Bishop Tucker School of Divinity',
    campus: 'Main Campus - Mukono',
    tuitionFee: 1600000,
    functionalFees: 200000,
    functionalFeesBreakdown: {
      examinationFee: 40000,
      technologyIctFee: 40000,
      libraryFee: 60000, // Specialized Theological archives & hermeneutics
      medicalClinicFee: 30000,
      guildSportsFee: 30000,
      developmentFundFee: 0,
    },
    totalAssessed: 1800000,
    policyRegistration45: 810000,  // 45% of 1,800,000
    policyMidSem75: 1350000,       // 75% of 1,800,000
    policyFinal100: 1800000,       // 100% of 1,800,000
    latePaymentCharge: 50000,
    description: 'Historical founding faculty of UCU preparing clergy, chaplains, and Christian institutional leaders.'
  },
  {
    id: 'PROG_MBCHB',
    code: 'MBCHB',
    name: 'Bachelor of Medicine and Bachelor of Surgery (MBChB)',
    faculty: 'School of Medicine & Dentistry',
    campus: 'Mengo Hospital Campus',
    tuitionFee: 4200000,
    functionalFees: 600000,
    functionalFeesBreakdown: {
      examinationFee: 120000,
      technologyIctFee: 80000,
      libraryFee: 80000,
      medicalClinicFee: 70000,
      guildSportsFee: 50000,
      developmentFundFee: 0,
      clinicalLabFee: 200000, // Surgical theatre & anatomy lab consumables
    },
    totalAssessed: 4800000,
    policyRegistration45: 2160000, // 45% of 4,800,000
    policyMidSem75: 3600000,       // 75% of 4,800,000
    policyFinal100: 4800000,       // 100% of 4,800,000
    latePaymentCharge: 50000,
    description: 'Premier 5-year medical practitioner training recognized by the Uganda Medical and Dental Practitioners Council.'
  },
  {
    id: 'PROG_BSCS',
    code: 'BSCS',
    name: 'Bachelor of Science in Computer Science (BSCS)',
    faculty: 'Faculty of Science & Technology',
    campus: 'Main Campus - Mukono',
    tuitionFee: 2300000,
    functionalFees: 250000,
    functionalFeesBreakdown: {
      examinationFee: 50000,
      technologyIctFee: 70000,
      libraryFee: 40000,
      medicalClinicFee: 40000,
      guildSportsFee: 30000,
      developmentFundFee: 20000,
    },
    totalAssessed: 2550000,
    policyRegistration45: 1147500, // 45% of 2,550,000
    policyMidSem75: 1912500,       // 75% of 2,550,000
    policyFinal100: 2550000,       // 100% of 2,550,000
    latePaymentCharge: 50000,
    description: 'Advanced theoretical computing, algorithm design, artificial intelligence, and software systems.'
  },
  {
    id: 'PROG_BAJMC',
    code: 'BAJMC',
    name: 'Bachelor of Arts in Journalism & Mass Communication (BAJMC)',
    faculty: 'Faculty of Social Sciences',
    campus: 'Main Campus - Mukono',
    tuitionFee: 1950000,
    functionalFees: 250000,
    functionalFeesBreakdown: {
      examinationFee: 50000,
      technologyIctFee: 50000,
      libraryFee: 40000,
      medicalClinicFee: 40000,
      guildSportsFee: 30000,
      developmentFundFee: 0,
      clinicalLabFee: 40000, // Broadcast radio & television studios
    },
    totalAssessed: 2200000,
    policyRegistration45: 990000,  // 45% of 2,200,000
    policyMidSem75: 1650000,       // 75% of 2,200,000
    policyFinal100: 2200000,       // 100% of 2,200,000
    latePaymentCharge: 50000,
    description: 'Media production, investigative reporting, digital broadcasting, and institutional corporate communications.'
  },
  {
    id: 'PROG_BCEE',
    code: 'BCEE',
    name: 'Bachelor of Civil and Environmental Engineering (BCEE)',
    faculty: 'Faculty of Engineering, Design & Technology',
    campus: 'Main Campus - Mukono',
    tuitionFee: 2800000,
    functionalFees: 400000,
    functionalFeesBreakdown: {
      examinationFee: 70000,
      technologyIctFee: 70000,
      libraryFee: 50000,
      medicalClinicFee: 50000,
      guildSportsFee: 40000,
      developmentFundFee: 0,
      clinicalLabFee: 120000, // Concrete materials, surveying & hydrology workshops
    },
    totalAssessed: 3200000,
    policyRegistration45: 1440000, // 45% of 3,200,000
    policyMidSem75: 2400000,       // 75% of 3,200,000
    policyFinal100: 3200000,       // 100% of 3,200,000
    latePaymentCharge: 50000,
    description: 'Structural engineering, hydraulics, environmental impact management, and civil infrastructure construction.'
  }
];

export function findProgrammeFeeStructure(programmeString: string): ProgrammeTuitionStructure {
  if (!programmeString) return UCU_PROGRAMME_FEE_STRUCTURES[0];
  const query = programmeString.toLowerCase();

  const found = UCU_PROGRAMME_FEE_STRUCTURES.find((p) => {
    return (
      p.code.toLowerCase() === query ||
      query.includes(p.code.toLowerCase()) ||
      p.name.toLowerCase().includes(query) ||
      query.includes(p.name.toLowerCase())
    );
  });

  return found || UCU_PROGRAMME_FEE_STRUCTURES[0];
}
