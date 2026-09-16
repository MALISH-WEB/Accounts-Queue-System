export interface CourseUnit {
  code: string;
  title: string;
  creditUnits: number;
  type: 'CORE' | 'ELECTIVE' | 'FOUNDATIONAL';
  description?: string;
}

export interface ProgrammeCurriculum {
  programmeCode: string;
  programmeName: string;
  faculty: string;
  yearOfStudy: number;
  semester: number;
  totalRequiredCredits: number;
  courses: CourseUnit[];
}

export const UCU_SEMESTER_CURRICULA: Record<string, ProgrammeCurriculum> = {
  BSIT: {
    programmeCode: 'BSIT',
    programmeName: 'Bachelor of Science in Information Technology',
    faculty: 'Faculty of Science & Technology',
    yearOfStudy: 2,
    semester: 1,
    totalRequiredCredits: 21,
    courses: [
      {
        code: 'BIT 2101',
        title: 'Object-Oriented Programming & Systems (Java)',
        creditUnits: 4,
        type: 'CORE',
        description: 'Advanced OOP principles, concurrency, exception handling, and design patterns in Java.',
      },
      {
        code: 'BIT 2102',
        title: 'Database Management Systems & Relational SQL',
        creditUnits: 4,
        type: 'CORE',
        description: 'Relational algebra, normalization, query optimization, ACID transactions, and indexing.',
      },
      {
        code: 'BIT 2103',
        title: 'Data Communications & Computer Networks',
        creditUnits: 4,
        type: 'CORE',
        description: 'OSI/TCP-IP models, packet routing, IP subnetting, VLANs, and network security protocols.',
      },
      {
        code: 'BIT 2104',
        title: 'Systems Analysis & Software Architecture',
        creditUnits: 3,
        type: 'CORE',
        description: 'Requirements engineering, UML modeling, agile development, and SDLC governance.',
      },
      {
        code: 'CSU 2101',
        title: 'Christian Ethics & Contemporary World Issues',
        creditUnits: 3,
        type: 'FOUNDATIONAL',
        description: 'University foundational worldview, biblical moral philosophy, and Christian leadership.',
      },
      {
        code: 'BIT 2105',
        title: 'Web Technologies & Cloud APIs',
        creditUnits: 3,
        type: 'CORE',
        description: 'Client-server architecture, modern front-end frameworks, REST APIs, and authentication.',
      },
    ],
  },
  LLB: {
    programmeCode: 'LLB',
    programmeName: 'Bachelor of Laws',
    faculty: 'Faculty of Law',
    yearOfStudy: 2,
    semester: 1,
    totalRequiredCredits: 18,
    courses: [
      {
        code: 'LAW 2101',
        title: 'Constitutional Law & Governance II',
        creditUnits: 4,
        type: 'CORE',
        description: 'Separation of powers, judicial review, constitutional litigation, and bill of rights.',
      },
      {
        code: 'LAW 2102',
        title: 'Law of Contract & Commercial Agreements II',
        creditUnits: 4,
        type: 'CORE',
        description: 'Breach of contract, remedies, discharge, privity, and equitable relief doctrine.',
      },
      {
        code: 'LAW 2103',
        title: 'Criminal Law & Procedure',
        creditUnits: 4,
        type: 'CORE',
        description: 'Actus reus, mens rea, defenses, homicide, criminal trial proceedings in Uganda.',
      },
      {
        code: 'LAW 2104',
        title: 'Administrative Law & Tribunals',
        creditUnits: 3,
        type: 'CORE',
        description: 'Natural justice, ultra vires doctrine, statutory bodies, and administrative tribunals.',
      },
      {
        code: 'CSU 2101',
        title: 'Christian Ethics in Jurisprudence',
        creditUnits: 3,
        type: 'FOUNDATIONAL',
        description: 'Biblical principles of justice, natural law, human dignity, and legal ethics.',
      },
    ],
  },
  MBCHB: {
    programmeCode: 'MBCHB',
    programmeName: 'Bachelor of Medicine and Bachelor of Surgery',
    faculty: 'School of Medicine & Dentistry',
    yearOfStudy: 2,
    semester: 1,
    totalRequiredCredits: 18,
    courses: [
      {
        code: 'MED 2101',
        title: 'Systemic Human Anatomy & Embryology II',
        creditUnits: 5,
        type: 'CORE',
        description: 'Neuroanatomy, musculoskeletal dissections, thoracic systems, and fetal development.',
      },
      {
        code: 'MED 2102',
        title: 'Medical Physiology & Biophysics II',
        creditUnits: 5,
        type: 'CORE',
        description: 'Cardiovascular hemodynamics, renal function, endocrine control, and homeostasis.',
      },
      {
        code: 'MED 2103',
        title: 'Medical Biochemistry & Clinical Genetics',
        creditUnits: 5,
        type: 'CORE',
        description: 'Metabolic pathways, enzyme kinetics, genetic disorders, and diagnostic pathology.',
      },
      {
        code: 'CSU 2101',
        title: 'Medical Ethics & Christian Healing Ministry',
        creditUnits: 3,
        type: 'FOUNDATIONAL',
        description: 'Bioethics, sanctity of life, clinical empathy, and holistic Christ-centered care.',
      },
    ],
  },
  BBA: {
    programmeCode: 'BBA',
    programmeName: 'Bachelor of Business Administration',
    faculty: 'School of Business',
    yearOfStudy: 2,
    semester: 1,
    totalRequiredCredits: 17,
    courses: [
      {
        code: 'BBA 2101',
        title: 'Financial Accounting & Reporting II',
        creditUnits: 4,
        type: 'CORE',
        description: 'IFRS corporate statements, inventory valuation, cash flow analysis, and auditing.',
      },
      {
        code: 'BBA 2102',
        title: 'Strategic Marketing & Consumer Behavior',
        creditUnits: 3,
        type: 'CORE',
        description: 'Market segmentation, digital channels, brand positioning, and pricing strategy.',
      },
      {
        code: 'BBA 2103',
        title: 'Business Law, Contracts & Corporate Governance',
        creditUnits: 4,
        type: 'CORE',
        description: 'Companies Act, corporate compliance, commercial paper, and partnership law.',
      },
      {
        code: 'BBA 2104',
        title: 'Intermediate Macroeconomic Policy',
        creditUnits: 3,
        type: 'CORE',
        description: 'Fiscal and monetary policies, inflationary models, foreign exchange, and GDP metrics.',
      },
      {
        code: 'CSU 2101',
        title: 'Christian Ethics in Business & Stewardship',
        creditUnits: 3,
        type: 'FOUNDATIONAL',
        description: 'Faith in the marketplace, integrity, servant leadership, and social responsibility.',
      },
    ],
  },
  BCE: {
    programmeCode: 'BCE',
    programmeName: 'Bachelor of Science in Civil Engineering',
    faculty: 'Faculty of Engineering, Design & Technology',
    yearOfStudy: 2,
    semester: 1,
    totalRequiredCredits: 19,
    courses: [
      {
        code: 'ENG 2101',
        title: 'Engineering Mathematics & Differential Equations III',
        creditUnits: 4,
        type: 'CORE',
        description: 'Fourier series, Laplace transforms, vector calculus, and numerical modeling.',
      },
      {
        code: 'CIV 2102',
        title: 'Fluid Mechanics & Open Channel Hydraulics',
        creditUnits: 4,
        type: 'CORE',
        description: 'Hydrostatics, Bernoulli theorem, pipe flow, and catchment hydrology analysis.',
      },
      {
        code: 'CIV 2103',
        title: 'Structural Analysis & Mechanics of Materials I',
        creditUnits: 4,
        type: 'CORE',
        description: 'Stress-strain tensors, indeterminate trusses, moment distribution, and deflection.',
      },
      {
        code: 'CIV 2104',
        title: 'Surveying, GIS & Geomatics Field Practice',
        creditUnits: 4,
        type: 'CORE',
        description: 'Theodolite traverse, leveling, GPS photogrammetry, and road profile design.',
      },
      {
        code: 'CSU 2101',
        title: 'Christian Worldview & Engineering Ethics',
        creditUnits: 3,
        type: 'FOUNDATIONAL',
        description: 'Environmental stewardship, public safety, infrastructure justice, and integrity.',
      },
    ],
  },
};

export function getCurriculumForProgramme(programme: string): ProgrammeCurriculum {
  const norm = programme.toUpperCase();
  if (norm.includes('INFORMATION') || norm.includes('BSIT') || norm.includes('COMPUTING') || norm.includes('CS')) {
    return UCU_SEMESTER_CURRICULA.BSIT;
  }
  if (norm.includes('LAW') || norm.includes('LLB')) {
    return UCU_SEMESTER_CURRICULA.LLB;
  }
  if (norm.includes('MEDICINE') || norm.includes('SURGERY') || norm.includes('MBCHB')) {
    return UCU_SEMESTER_CURRICULA.MBCHB;
  }
  if (norm.includes('BUSINESS') || norm.includes('BBA') || norm.includes('ACCOUNTING')) {
    return UCU_SEMESTER_CURRICULA.BBA;
  }
  if (norm.includes('ENGINEERING') || norm.includes('CIVIL') || norm.includes('BCE')) {
    return UCU_SEMESTER_CURRICULA.BCE;
  }

  // Generic fallback with realistic units
  return {
    programmeCode: 'UCU-GEN',
    programmeName: programme || 'Undergraduate Degree Programme',
    faculty: 'Uganda Christian University',
    yearOfStudy: 2,
    semester: 1,
    totalRequiredCredits: 18,
    courses: [
      { code: 'ACAD 2101', title: 'Advanced Academic Research & Methods', creditUnits: 4, type: 'CORE' },
      { code: 'ACAD 2102', title: 'Disciplinary Core Studies I', creditUnits: 4, type: 'CORE' },
      { code: 'ACAD 2103', title: 'Disciplinary Core Studies II', creditUnits: 4, type: 'CORE' },
      { code: 'ACAD 2104', title: 'Professional Practicum & Fieldwork', creditUnits: 3, type: 'CORE' },
      { code: 'CSU 2101', title: 'Christian Ethics & Worldview Leadership', creditUnits: 3, type: 'FOUNDATIONAL' },
    ],
  };
}
