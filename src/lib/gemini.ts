/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AirBalanceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
        soundReadingsRequired: { type: Type.BOOLEAN },
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
              outlets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    outletNumber: { type: Type.STRING },
                    registerType: { type: Type.STRING },
                    ductSize: { type: Type.STRING },
                    designVolume: { type: Type.NUMBER },
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
        },
        required: ["type", "severity", "location", "message"],
      },
    },
    questionsForEngineer: { type: Type.ARRAY, items: { type: Type.STRING } },
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
  },
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function auditExcelReport(excelData: any[], retryCount = 0): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const excelContext = JSON.stringify(excelData, null, 2);
    const prompt = `
    Role: Senior TAB Quality Control Engineer.
    Task: Audit the following Air Balance Report (Excel Data).
    
    Audit Constraints:
    1. TOLERANCE CHECK: Verify if (Actual / Design) falls within [0.90, 1.10] range. Flag any outliers as 'Tolerance' issues.
    2. SPELLING & PROFESSIONALISM: Check for professional clarity, punctuation, typos in unit tags, and technical terminology errors. Treat these as "Red Flags" if they impact the professional look of the final deliverable.
    3. ENGINEERING LOGIC: 
       - Do the totals make sense? (e.g., Sum of outlets vs main unit).
       - Are there suspicious duplicate values (lazy balancing)?
    4. RED FLAGS: Explicitly identify anything that would make an engineer reject this report (missing data, huge discrepancies, sloppy formatting).
    5. QUESTIONS: Formulate strategic questions for the field balancer based on anomalies found.
    6. SUGGESTED CHANGES: Propose exact cell updates for identified errors.

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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

    const prompt = `
    Role: Expert HVAC Testing, Adjusting, and Balancing (TAB) Technical Assistant.
    Perform a 10-point Precision Audit on the provided PDF drawing or specification:
    
    1. PROJECT IDENTITY & DNA: Extract site address, project name, engineering firm, and specifically classify the HVAC architecture (e.g., VAV with Reheat, RTU with CAV, HRV).
    2. GLOBAL AIR BALANCE RECONCILIATION: Perform a high-level "sanity check." Aggregate total volumes category (Supply, Return, Exhaust). Compare Total Design Volume of all equipment against any Diversified Totals listed. ALSO aggregate and extract TOTAL OUTDOOR AIR (OA) volumes per system type.
    3. TAB SPEC COMPLIANCE (Section 23 05 93): Scan for tolerances (e.g., +/- 5% or 10%), Certifications (AABC or NEBB), and mandated Instrumentation (e.g., Pitot tubes).
    4. FIRE DAMPER DROP TESTING: Specifically scan job notes and specifications for requirements regarding "Fire Damper Drop Testing" or "Smoke Damper Verification."
    5. SOUND READINGS: Check if "Sound Pressure Level Readings" or "NC Level Verification" are required in specific rooms or building-wide.
    6. MATH SUMMATION AUDIT: Provide an explicit math string for every unit's outlet summation (e.g., "75 + 50 + 50 + 50 = 225"). Compare this sum to the unit's rated capacity. Flag any variance > 5%. 
       IMPORTANT: For CAV (Constant Air Volume) systems where terminal boxes (VAVs) are absent, the 'totalVavCfm' (Terminal Box Sum) must NOT be 0; instead, it must be the aggregate sum of ALL individual outlets (diffusers/grilles) listed. Ensure 'mathString' reflects this addition.
    7. SHOP DRAWING VERIFICATION: Cross-reference design drawings with contractor submittals. Check if equipment matches airflow and physical requirements (like inlet sizes).
    8. DIVERSITY AUDIT: Calculate the ratio of total peak flow of all outlets to unit capacity. If ratio is >105% and no "Diversity Note" exists, flag as Capacity Risk.
    9. PRESSURE PATH ANALYSIS: Compare External Static Pressure (ESP) in schedules to ductwork complexity (long runs, excessive elbows) on plans. Flag Bottleneck Risks.
    10. HARDWARE INDEX: Identify presence of Manual Volume Dampers (MVDs) for balanceability and specify Pitot Traverse locations for accurate measurements.

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
