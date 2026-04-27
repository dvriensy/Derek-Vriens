/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AirBalanceData {
  // Existing fields...
  projectIdentity: {
    projectName?: string;
    siteAddress?: string;
    engineeringFirm?: string;
    systemType?: string; // e.g. VAV, RTU, AHU
    classification?: string; // e.g. VAV with Reheat, RTU with CAV, HRV
    measurementUnits: 'Imperial (cfm)' | 'Metric (L/s)';
  };
  globalAirBalance: {
    systems: {
      type: 'Supply' | 'Return' | 'Exhaust';
      totalDesignVolume: number;
      totalOutdoorAirVolume?: number; // Component of the total or separate for OA systems
      diversifiedTotal?: number;
      calculationNote: string;
      totalOutletsVolume?: number; // Sum of diffusers/grilles
    }[];
  };
  tabSpecs: {
    tolerances?: string;
    instrumentation?: string[];
    certifications?: string; // e.g. AABC, NEBB
    sectionRef?: string; // usually 23 05 93
    fireDamperDropTesting?: boolean;
    soundReadingsRequired?: boolean;
    auditNotes?: string;
  };
  equipmentSchedules: {
    units: TABEquipment[];
    vavSummation: {
      totalVavCfm: number;
      mainUnitCfm: number;
      discrepancy: number;
      mathString?: string; // e.g. "75 + 50 + 50 + 50 = 225"
      mathNote?: string;
    };
  };
  shopDrawings: {
    confirmsDesign: boolean;
    inletSizeNotes?: string[];
    physicalConstraints?: string[];
    crossRefDetails?: string;
  };
  fieldStrategy: {
    turbulentAreas?: string[];
    balancingSequences?: string[];
    plenumReturnIdentified: boolean;
    strategyNotes?: string;
    firstHourStrategy?: string;
    checklists: {
      title: string;
      tasks: { id: string; description: string; isCompleted: boolean }[];
    }[];
  };
  logistics: {
    toolsRequired: string[];
    criticalPaths: string[]; // Units with SP > 0.5" w.c.
  };
  preBalanceReadiness: {
    checklist: { item: string; status: 'Ready' | 'Caution' | 'Pending'; note: string }[];
    systemOverview: string;
    criticalDeficiencies: string[];
  };
  diversityAudit?: {
    totalOutletPeak: number;
    unitCapacity: number;
    ratio: number;
    isFlagged: boolean;
    diversityNote?: string;
  };
  pressurePath?: {
    espRating: string;
    complexityNotes: string[];
    bottleneckRisk: 'Low' | 'Medium' | 'High';
  };
  hardwareIndex?: {
    mvdStatus: 'Present' | 'Missing' | 'Partial';
    traversePoints: string[];
    hardwareNotes?: string;
  };
  ocrInsight?: string; // High-level technical discovery of the document
  rawTextFeed?: string; // Raw text transcript extracted from the PDF
  
  // Excel Audit specific field
  excelAudit?: ExcelAuditReport;
}

export interface ExcelAuditReport {
  summary: {
    overallStatus: 'Pass' | 'Fail' | 'Partial';
    totalCheckedCells: number;
    issuesFound: number;
    engineeringScore: number; // 1-100
  };
  findings: ExcelFinding[];
  questionsForEngineer: string[];
  suggestedChanges: {
    originalValue: string;
    proposedValue: string;
    location: string; // e.g. "Sheet1!B5"
    reason: string;
  }[];
}

export interface ExcelFinding {
  type: 'Grammar' | 'Calculation' | 'Engineering Logic' | 'Tolerance';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string; // e.g. "Unit AHU-1 Row"
  message: string;
}

export interface TABEquipment {
  tag: string;
  type: string; // RTU, VAV, EF, etc.
  designCfm: number;
  outdoorAirCfm?: number; // Added for expanded math verification
  staticPressure?: string;
  notes?: string;
  outletMathString?: string; // e.g. "100 + 100 + 200 = 400"
  outlets?: TABOutlet[];
}

export interface TABOutlet {
  outletNumber: string; // e.g. 1.1, 1.2
  registerType: string; // e.g. SD-1, Perforated
  ductSize: string;     // e.g. 8"Ø, 12x10
  designVolume: number;
}

export type ExtractionStatus = 'idle' | 'loading' | 'success' | 'error';
