/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AirBalanceData } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' 
});

export const AIR_BALANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    projectIdentity: {
      type: Type.OBJECT,
      properties: {
        projectName: { type: Type.STRING },
        siteAddress: { type: Type.STRING },
        engineeringFirm: { type: Type.STRING },
        systemType: { type: Type.STRING },
        classification: { type: Type.STRING, description: "Detailed classification (e.g., VAV with Reheat, RTU with CAV, HRV)" },
        measurementUnits: { type: Type.STRING, enum: ['Imperial (cfm)', 'Metric (L/s)'] },
      },
      required: ["measurementUnits", "classification"],
    },
    globalAirBalance: {
      type: Type.OBJECT,
      properties: {
        systems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['Supply', 'Return', 'Exhaust'] },
              totalDesignVolume: { type: Type.NUMBER },
              totalOutdoorAirVolume: { type: Type.NUMBER, description: "Total Outdoor Air component for this system type" },
              diversifiedTotal: { type: Type.NUMBER },
              calculationNote: { type: Type.STRING },
              totalOutletsVolume: { type: Type.NUMBER },
            },
            required: ["type", "totalDesignVolume", "calculationNote"],
          },
        },
      },
      required: ["systems"],
    },
    tabSpecs: {
      type: Type.OBJECT,
      properties: {
        tolerances: { type: Type.STRING },
        instrumentation: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.STRING },
        sectionRef: { type: Type.STRING },
        fireDamperDropTesting: { type: Type.BOOLEAN },
        fireDamperCount: { type: Type.NUMBER },
        fireDamperLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
        soundReadingsRequired: { type: Type.BOOLEAN },
        soundReadingLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
        auditNotes: { type: Type.STRING },
      },
    },
    equipmentSchedules: {
      type: Type.OBJECT,
      properties: {
        units: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tag: { type: Type.STRING },
              type: { type: Type.STRING },
              designCfm: { type: Type.NUMBER },
              outdoorAirCfm: { type: Type.NUMBER },
              staticPressure: { type: Type.STRING },
              notes: { type: Type.STRING },
              outletMathString: { type: Type.STRING, description: "Explicit math string for outlets, e.g., '75 + 50 + 50 = 175'" },
              visualJustification: { type: Type.STRING, description: "Description of where this unit was found (e.g., 'Sheet M-101, Schedule 1')" },
              outlets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    outletNumber: { type: Type.STRING },
                    registerType: { type: Type.STRING },
                    ductSize: { type: Type.STRING },
                    designVolume: { type: Type.NUMBER },
                    visualJustification: { type: Type.STRING },
                  },
                  required: ["outletNumber", "designVolume"],
                },
              },
            },
            required: ["tag", "type", "designCfm"],
          },
        },
        vavSummation: {
          type: Type.OBJECT,
          properties: {
            totalVavCfm: { type: Type.NUMBER },
            mainUnitCfm: { type: Type.NUMBER },
            discrepancy: { type: Type.NUMBER },
            mathString: { type: Type.STRING, description: "Explicit math string for VAV summation" },
            mathNote: { type: Type.STRING },
          },
          required: ["totalVavCfm", "mainUnitCfm", "discrepancy", "mathString"],
        },
      },
    },
    shopDrawings: {
      type: Type.OBJECT,
      properties: {
        confirmsDesign: { type: Type.BOOLEAN },
        inletSizeNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        physicalConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
        crossRefDetails: { type: Type.STRING },
      },
    },
    fieldStrategy: {
      type: Type.OBJECT,
      properties: {
        turbulentAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
        balancingSequences: { type: Type.ARRAY, items: { type: Type.STRING } },
        plenumReturnIdentified: { type: Type.BOOLEAN },
        strategyNotes: { type: Type.STRING },
        firstHourStrategy: { type: Type.STRING },
        checklists: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    description: { type: Type.STRING },
                    isCompleted: { type: Type.BOOLEAN },
                  },
                  required: ["id", "description", "isCompleted"],
                },
              },
            },
            required: ["title", "tasks"],
          },
        },
      },
    },
    logistics: {
      type: Type.OBJECT,
      properties: {
        toolsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
        criticalPaths: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    preBalanceReadiness: {
      type: Type.OBJECT,
      properties: {
        checklist: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["Ready", "Caution", "Pending"] },
              note: { type: Type.STRING },
            },
            required: ["item", "status"],
          },
        },
        systemOverview: { type: Type.STRING },
        criticalDeficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["checklist", "systemOverview"],
    },
    diversityAudit: {
      type: Type.OBJECT,
      properties: {
        totalOutletPeak: { type: Type.NUMBER },
        unitCapacity: { type: Type.NUMBER },
        ratio: { type: Type.NUMBER },
        isFlagged: { type: Type.BOOLEAN },
        diversityNote: { type: Type.STRING },
      },
    },
    pressurePath: {
      type: Type.OBJECT,
      properties: {
        espRating: { type: Type.STRING },
        complexityNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        bottleneckRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
      },
    },
    hardwareIndex: {
      type: Type.OBJECT,
      properties: {
        mvdStatus: { type: Type.STRING, enum: ["Present", "Missing", "Partial"] },
        traversePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        hardwareNotes: { type: Type.STRING },
      },
    },
    ocrInsight: { type: Type.STRING, description: "A technical summary of the 'DNA' of the document, including OCR confidence and key recurring patterns." },
    rawTextFeed: { type: Type.STRING, description: "A comprehensive extraction of all technical text, focusing on schedules, notes, and specification blocks." },
    executiveSummary: {
      type: Type.OBJECT,
      properties: {
        keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
        majorRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        complianceStatus: { type: Type.STRING, enum: ['Compliant', 'Non-Compliant', 'Conditional'] },
        overview: { type: Type.STRING, description: "A high-level executive summary of the entire audit findings." },
      },
      required: ["keyFindings", "majorRedFlags", "complianceStatus", "overview"],
    },
    designReconciliation: {
      type: Type.OBJECT,
      properties: {
        scheduleDesignVolume: { type: Type.NUMBER },
        shopDrawingVolume: { type: Type.NUMBER },
        outletSumVolume: { type: Type.NUMBER },
        reconciledVolume: { type: Type.NUMBER },
        discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
        visualJustification: { type: Type.STRING },
        status: { type: Type.STRING, enum: ['Matched', 'Discrepancy', 'Critical Error'] }
      },
      required: ["scheduleDesignVolume", "outletSumVolume", "reconciledVolume", "discrepancies", "status"]
    },
  },
};

export const EXCEL_AUDIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        overallStatus: { type: Type.STRING, enum: ['Pass', 'Fail', 'Partial'] },
        totalCheckedCells: { type: Type.NUMBER },
        issuesFound: { type: Type.NUMBER },
        engineeringScore: { type: Type.NUMBER },
      },
      required: ["overallStatus", "engineeringScore"],
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['Grammar', 'Calculation', 'Engineering Logic', 'Tolerance'] },
          severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
          location: { type: Type.STRING },
          message: { type: Type.STRING },
          visualJustification: { type: Type.STRING },
        },
        required: ["type", "severity", "location", "message"],
      },
    },
    questionsForEngineer: { type: Type.ARRAY, items: { type: Type.STRING } },
    spellingAndPunctuationIssues: { 
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
          location: { type: Type.STRING }
        },
        required: ["message", "location"]
      },
      description: "List of spelling, grammar, and punctuation errors found in the report, including their exact cell location (e.g. Sheet1!B5)."
    },
    suggestedChanges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalValue: { type: Type.STRING },
          proposedValue: { type: Type.STRING },
          location: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["originalValue", "proposedValue", "location", "reason"],
      },
    },
    executiveSummary: {
      type: Type.OBJECT,
      properties: {
        keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
        majorRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        complianceStatus: { type: Type.STRING, enum: ['Compliant', 'Non-Compliant', 'Conditional'] },
        overview: { type: Type.STRING, description: "A high-level executive summary of the entire audit findings." },
      },
      required: ["keyFindings", "majorRedFlags", "complianceStatus", "overview"],
    },
  },
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function auditExcelReport(excelData: any[], retryCount = 0): Promise<any> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }

  const excelContext = JSON.stringify(excelData, null, 2);
    const prompt = `
    Role: Senior TAB Quality Control Engineer.
    Task: Audit the following Air Balance Report (Excel Data).
    
    Audit Constraints:
    1. THREE-PASS RIGOR: You MUST perform the audit in three distinct internal passes to ensure absolute coverage:
       - PASS 1: Engineering Logic & Totals Reconciliation (Verify summations, check for lazy balancing/duplicates).
       - PASS 2: Technical Precision & TAB Compliance (Analyze tolerances, instrumentation, and spec alignment).
       - PASS 3: Professionalism & Clarity (Spelling, grammar, technical terminology, and presentation).
       LIST ALL identified errors found during these three passes without exception. No error is too small to record.
    2. TOLERANCE CHECK: Verify if (Actual / Design) falls within [0.90, 1.10] range. Flag any outliers as 'Tolerance' issues.
    2. SPELLING & PROFESSIONALISM: Identify specific spelling mistakes, punctuation errors, and professional terminology typos. For EVERY issue found, you MUST provide the exact cell location (Sheet!Cell). Extract these into the 'spellingAndPunctuationIssues' category.
    3. ENGINEERING LOGIC: 
       - Do the totals make sense? (e.g., Sum of outlets vs main unit).
       - Are there suspicious duplicate values (lazy balancing)?
    4. RED FLAGS: Explicitly identify anything that would make an engineer reject this report (missing data, huge discrepancies, sloppy formatting). Highlight these as "Critical" or "High" severity findings.
    5. ORANGE FLAGS: Any minor engineering logic inconsistencies or professional clarity issues should be categorized with "Medium" or "Low" severity, which will be visualized as Orange/Amber warnings.
    6. EXCLUSION: Do NOT mention or audit calibration dates for equipment. This is a recurring request to ignore these data points.
    7. EXECUTIVE SUMMARY: Generate a concise summary for stakeholders including overall compliance status, key takeaways, and major red flags.
    8. TERMINATION: Do NOT provide 'Suggested Changes' or 'Strategic Questions' sections. Focus purely on the audit logs and spelling cleanup.

    Data Source (JSON representation of Excel Sheets):
    ${excelContext}

    Return the response in strictly valid JSON format matching the defined schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: EXCEL_AUDIT_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text);
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || 
                       error?.message?.includes('RESOURCE_EXHAUSTED') || 
                       error?.status === 429;

    if (isQuotaError && retryCount < 5) {
      const waitTime = Math.pow(2, retryCount) * 2000 + Math.random() * 1000;
      await sleep(waitTime);
      return auditExcelReport(excelData, retryCount + 1);
    }
    throw error;
  }
}

export async function analyzeAirBalancePDF(base64Data: string, retryCount = 0): Promise<AirBalanceData> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }

    const prompt = `
    Role: Expert HVAC Testing, Adjusting, and Balancing (TAB) Technical Assistant.

    SYSTEM RIGOR - THREE-PASS AUDIT:
    1. PASS 1 (INVENTORY): Perform an exhaustive scan of ALL pages. List every unique Unit Tag (AHU, EF, FCU, RTU) and Diffuser Tag (SD, SR, CD) found in the entire document. Do not skip any.
    2. PASS 2 (EXTRACTION): For every single tag identified in Pass 1, crawl the document again to identify its associated design values: CFM (Airflow), Voltage/Phase, and Static Pressure (ESP).
    3. PASS 3 (GAP AUDIT): Check for missing data. If a tag from your inventory (Pass 1) is found on a floor plan but has no corresponding value in a schedule, you MUST flag it in the 'findings' as a "Missing Schedule Value (High Severity)". Do not ignore missing parameters.

    SELF-VERIFICATION & QUALITY ASSURANCE:
    - Before outputting the JSON, you MUST perform a "Verification Pass".
    - Check every Page Number cited: Does that page actually contain the unit or schedule mentioned?
    - Fact-check CFM totals: Re-calculate all math strings. If they do not match the expected result, rewrite the finding.
    - Check for Hallucinations: If you are unsure of a value, flag it as "Awaiting Clarification" instead of assuming.
    - Correct any discrepancies found during this verification phase.

    AIRFLOW UNIT PRIORITY:
    - IDENTIFY AIRFLOW UNITS: Scan Equipment Schedule headers and the Drawing Legend to confirm if units are CFM or L/s.
    - DO NOT ASSUME: If a value is listed as L/s, keep it as L/s and ensure 'measurementUnits' in 'projectIdentity' reflects 'Metric (L/s)'.
    - UNIT ARRAY COMPLIANCE: Every identified mechanical unit MUST be returned in the 'equipmentSchedules.units' array. 
    - NO OMISSIONS: Even if no technical data (CFM, Static Pressure) is found for a specific unit tag identified on a plan, you MUST return the unit object with the 'tag' and 'null' or '0' for missing numeric values rather than omitting the unit entirely.

    SCHEMA COMPLIANCE & CRASH PREVENTION:
    - MANDATORY KEYS: You MUST include "toolsRequired" in the 'logistics' object, "inletSizeNotes" in 'shopDrawings', and "units" in 'equipmentSchedules' in every response. Use empty arrays [] if no data is found.
    - VISUAL EVIDENCE: For every discrepancy, data point, or equipment found, include a "visualJustification" field. Describe exactly where it is (e.g., "Sheet M-102, Top-right Schedule", "Note 4 on Page 3").
    - DEFAULT VALUES: If a numeric value is unknown, use 0. If a string is unknown, use "". Never omit a required key.

    Perform a 10-point Precision Audit on the provided PDF drawing or specification:
    
    1. PROJECT IDENTITY & DNA: Extract site address, project name, engineering firm, and specifically classify the HVAC architecture (e.g., VAV with Reheat, RTU with CAV, HRV).
    2. GLOBAL AIR BALANCE RECONCILIATION: Perform a high-level "sanity check." Aggregate total volumes category (Supply, Return, Exhaust). Compare Total Design Volume of all equipment against any Diversified Totals listed. ALSO aggregate and extract TOTAL OUTDOOR AIR (OA) volumes per system type.
    3. TAB SPEC COMPLIANCE (Section 23 05 93): Scan for tolerances (e.g., +/- 5% or 10%), Certifications (AABC or NEBB), and mandated Instrumentation (e.g., Pitot tubes).
    4. FIRE DAMPER DROP TESTING: Specifically scan job notes and specifications for requirements regarding "Fire Damper Drop Testing" or "Smoke Damper Verification." 
       MANDATORY: Count the number of dampers and list their specific locations found in drawings/notes in 'fireDamperCount' and 'fireDamperLocations'.
    5. SOUND READINGS: Check if "Sound Pressure Level Readings" or "NC Level Verification" are required. List specific room names/numbers where these are mandated in 'soundReadingLocations'.
    6. EXCLUSION: Do NOT mention or extract calibration dates for any equipment. This is a specific request to keep the report concise.
    7. MATH SUMMATION AUDIT: Provide an explicit math string for every unit's outlet summation (e.g., "75 + 50 + 50 + 50 = 225"). Compare this sum to the unit's rated capacity. Flag any variance > 5%. 
       IMPORTANT MATH LOGIC: If the sum of individual outlets EQUALS the main unit's design CFM, you MUST NOT report a discrepancy. Re-verify your arithmetic multiple times. Hallucinating a deficit where the math is correct is a critical failure.
       NOTE: For CAV (Constant Air Volume) systems where terminal boxes (VAVs) are absent, the 'totalVavCfm' (Terminal Box Sum) must NOT be 0; instead, it must be the aggregate sum of ALL individual outlets (diffusers/grilles) listed. Ensure 'mathString' reflects this addition.
    8. SHOP DRAWING & SCHEDULE CROSS-REFERENCE: Reconcile schedules with shop drawings and plan outlets. MANDATORY STEPS: (1) Locate 'Mechanical Equipment Schedule' and identify 'Design CFM' column. (2) Find 'Diffuser Schedule' (or plan callouts) and sum all 'Airflow' values. (3) Compare these to determine the "Actual Design Total Air Volume." Populate 'designReconciliation' with status and detailed discrepancies. 
       VISUAL JUSTIFICATION: For every discrepancy, you MUST provide a "Visual Justification". Describe exactly where the conflicting info is located (e.g., 'Bottom-right legend of Sheet M-103' or 'Next to the red-lined revision cloud on Page 5'). Explain visual cues like 'tag shows 150 L/s but branch line matches 500 CFM scale'.
       RECONCILIATION MATH: Ensure 'outletSumVolume' is the EXACT arithmetic sum of the diffusers you identified. Double-check your own calculation before determining the 'status'.
    9. DIVERSITY AUDIT: Calculate the ratio of total peak flow of all outlets to unit capacity. If ratio is >105% and no "Diversity Note" exists, flag as Capacity Risk.
    10. PRESSURE PATH ANALYSIS: Compare External Static Pressure (ESP) in schedules to ductwork complexity (long runs, excessive elbows) on plans. Flag Bottleneck Risks.
    11. HARDWARE INDEX: Identify presence of Manual Volume Dampers (MVDs) for balanceability and specify Pitot Traverse locations for accurate measurements.
    12. EXECUTIVE SUMMARY: Generate a high-level summary for leadership highlighting the critical path forward, major project risks, and overall drawing compliance.

    TECHNICAL OCR & DOCUMENT DISCOVERY:
    - Perform a "Digital Scan" to extract all technical text from schedules, legends, and specification blocks.
    - Identify hidden tolerances (e.g., in footer notes or specialized Section 23 05 93 snippets).
    - Capture specific language regarding Fire Dampers and NC levels in 'auditNotes'.
    - Provide an 'ocrInsight' summarizing the document quality and the core technical findings (e.g., "The document is a high-resolution scan with clear equipment schedules but handwritten notes in the margins regarding RFI #12").
    - Populate 'rawTextFeed' with a verbatim or highly summarized technical transcript of all identified data points.

    Field Strategy & Logistics:
    - SUGGEST A "FIRST-HOUR STRATEGY" based on the system type.
    - GENERATE DETAILED CHECKLISTS for field tasks.
    - Generate a Pre-Balance Readiness checklist and highlight Critical Deficiencies.
    
    Return the response in strictly valid JSON format matching the defined schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Using Pro for complex engineering drawings
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: AIR_BALANCE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text) as AirBalanceData;
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || 
                       error?.message?.includes('RESOURCE_EXHAUSTED') || 
                       error?.status === 429;

    if (isQuotaError && retryCount < 5) {
      const waitTime = Math.pow(2, retryCount) * 2000 + Math.random() * 1000;
      console.warn(`[TAB-AUDIT] Quota exceeded. Safety throttle active. Retrying in ${Math.round(waitTime/1000)}s...`);
      await sleep(waitTime);
      return analyzeAirBalancePDF(base64Data, retryCount + 1);
    }

    console.error("Gemini analysis failed:", error);
    throw error;
  }
}

export async function queryPDFReport(base64Data: string, question: string): Promise<string> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ 
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' 
  });

  const prompt = `
    Role: Expert HVAC Quality Control Inspector.
    Task: Answer a specific technical question about the provided PDF document.
    Question: ${question}
    
    Guidelines:
    1. Focus on Unit Identification, Specific Items, or Procedures requested.
    2. Be concise but technically precise.
    3. If the information is not in the document, state that clearly.
    4. Reference specific page numbers or schedule names if possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
    });

    return response.text;
  } catch (error: any) {
    console.error("PDF Query failed:", error);
    throw error;
  }
}
