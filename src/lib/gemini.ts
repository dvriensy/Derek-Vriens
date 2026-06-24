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
              airflowSupply: { type: Type.NUMBER, description: "Extracted Supply Air airflow capacity (CFM or L/s)" },
              airflowReturn: { type: Type.NUMBER, description: "Extracted Return Air airflow capacity (CFM or L/s)" },
              airflowExhaust: { type: Type.NUMBER, description: "Extracted Exhaust Air airflow capacity (CFM or L/s)" },
              airflowOutsideAir: { type: Type.NUMBER, description: "Extracted Outside Air airflow capacity (CFM or L/s)" },
              esp: { type: Type.STRING, description: "External Static Pressure, e.g. '0.5 in. w.g.'" },
              tsp: { type: Type.STRING, description: "Total Static Pressure, e.g. '1.2 in. w.g.'" },
              coolingTotalMbh: { type: Type.NUMBER, description: "Total Cooling Capacity in MBH" },
              coolingSensibleMbh: { type: Type.NUMBER, description: "Sensible Cooling Capacity in MBH" },
              heatingMbh: { type: Type.NUMBER, description: "Heating Capacity in MBH" },
              enteringAirTemp: { type: Type.STRING, description: "Entering Air Temperature, e.g. '75 F / 62 F'" },
              leavingAirTemp: { type: Type.STRING, description: "Leaving Air Temperature, e.g. '55 F / 53 F'" },
              voltagePhase: { type: Type.STRING, description: "Electrical Voltage/Phase, e.g. '460V/3PH'" },
              motorHp: { type: Type.STRING, description: "Motor Horsepower (HP), e.g. '3.0 HP'" },
              motorRpm: { type: Type.STRING, description: "Motor RPM, e.g. '1725 RPM'" },
              sourceLocation: { type: Type.STRING, description: "Exact sheet name, table, detail number, or plan view note where this unit was found" },
              mathConversionSteps: { type: Type.STRING, description: "Any calculations or unit conversion steps performed (e.g. converting L/s to CFM, totaling sensible/latent heat for total MBH, etc.)" },
              engineeringAssumptions: { type: Type.STRING, description: "Any engineering assumptions made if specifications were ambiguous, missing, or required industry defaults" },
              outlets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    outletNumber: { type: Type.STRING },
                    quantity: { type: Type.NUMBER, description: "Quantity prefix if found, e.g., 2 for '2 @ 500 CFM'. Default to 1." },
                    registerType: { type: Type.STRING },
                    manufacturer: { type: Type.STRING, description: "e.g., Titus, Price, Carnes, Krueger" },
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
        manufacturers: { type: Type.ARRAY, items: { type: Type.STRING } },
        hardwareNotes: { type: Type.STRING },
      },
    },
    hydronicSpecs: {
      type: Type.OBJECT,
      properties: {
        waterTolerances: { type: Type.STRING, description: "Hydronic flow tolerances, e.g. '+/- 5%' or '+/- 10%'" },
        systemTypes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Types of water systems present (e.g. Chilled Water, Hot Water, Condenser Water)" },
        balancingValves: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Types of balancing valves or flow limiters specified (e.g., Circuit Setters, PICVs)" },
        pumpDetails: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tag: { type: Type.STRING },
              designGpm: { type: Type.NUMBER },
              headFeet: { type: Type.NUMBER },
              motorHp: { type: Type.STRING },
            },
            required: ["tag", "designGpm"]
          }
        },
        instruments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hydronic balancing instrumentation required (e.g. Digital Differential Manometers, Ultrasonic Meter)" },
        flushingRequired: { type: Type.BOOLEAN, description: "Whether system flushing and chemical treatment are mandated before balancing" },
        bypassBalanceRequired: { type: Type.BOOLEAN, description: "Whether balancing of the bypass lines is explicitly required" },
        auditNotes: { type: Type.STRING, description: "Important water balancing specification details, guidelines, or checklists" }
      }
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
    
    1. PROJECT IDENTITY & DNA: 
       - SITE ADDRESS EXTRACTION: Target title blocks specifically. Scan the bottom-right and far-right margins of every sheet for labels like "Project Address," "Site Location," "Job Address," or "Project Site."
       - SUBMITTAL CROSS-REFERENCE: If found in a submittal package (Lennox, Titus, etc.), check "Project Information" or "Cover Page" blocks for the location.
       - PRIORITIZATION: If multiple addresses appear (e.g., Engineer vs Site), ALWAYS prioritize the one labeled "Site" or "Job Site." If no explicit "Site" label is found, use the most plausible physical construction address.
       - Complete other fields: projectName, engineering firm, and HVAC architecture classification (e.g., VAV with Reheat, RTU with CAV, HRV).
    2. GLOBAL AIR BALANCE RECONCILIATION: Perform a high-level "sanity check." Aggregate total volumes category (Supply, Return, Exhaust). Compare Total Design Volume of all equipment against any Diversified Totals listed. ALSO aggregate and extract TOTAL OUTDOOR AIR (OA) volumes per system type.
    3. TAB SPEC COMPLIANCE (Section 23 05 93): Scan for tolerances (e.g., +/- 5% or 10%), Certifications (AABC or NEBB), and mandated Instrumentation (e.g., Pitot tubes).
    4. FIRE DAMPER DROP TESTING: Specifically scan job notes and specifications for requirements regarding "Fire Damper Drop Testing" or "Smoke Damper Verification." 
       MANDATORY: Count the number of dampers and list their specific locations found in drawings/notes in 'fireDamperCount' and 'fireDamperLocations'.
    5. SOUND READINGS: Check if "Sound Pressure Level Readings" or "NC Level Verification" are required. List specific room names/numbers where these are mandated in 'soundReadingLocations'.
    6. EXCLUSION: Do NOT mention or extract calibration dates for any equipment. This is a specific request to keep the report concise.
    7. MATH SUMMATION AUDIT: Provide an explicit math string for every unit's outlet summation.
       QUANTITY RECOGNITION: If an airflow value is prefixed with a quantity (e.g., '2@ 500' or '3x 200'), you MUST interpret this as multiple outlets.
       MULTIPLICATION RULE: For totals, calculate as Quantity x Value (e.g., '2 @ 500 = 1000' or '3 x 200 = 600').
       MATH STRING FORMAT: Your 'mathString' must show this work: "(2 @ 500) + (3 @ 200) = 1600".
       IMPORTANT MATH LOGIC: If the sum (including quantities) EQUALS the main unit's design CFM, you MUST NOT report a discrepancy. Re-verify your arithmetic multiple times. Hallucinating a deficit where the math is correct is a critical failure.
       NOTE: For CAV (Constant Air Volume) systems where terminal boxes (VAVs) are absent, the 'totalVavCfm' (Terminal Box Sum) must NOT be 0; instead, it must be the aggregate sum of ALL individual outlets (diffusers/grilles) listed. Ensure 'mathString' reflects this addition.
    8. SHOP DRAWING & SCHEDULE CROSS-REFERENCE: Reconcile schedules with shop drawings and plan outlets. MANDATORY STEPS: (1) Locate 'Mechanical Equipment Schedule' and identify 'Design CFM' column. (2) Find 'Diffuser Schedule' (or plan callouts) and sum all 'Airflow' values, APPLY MULTIPLIERS where quantities are listed. (3) Extract Manufacturer names for all grilles and diffusers identified. (4) Compare these to determine the "Actual Design Total Air Volume." Populate 'designReconciliation' with status and detailed discrepancies. 
       VISUAL JUSTIFICATION: For every discrepancy, you MUST provide a "Visual Justification". Describe exactly where the conflicting info is located (e.g., 'Bottom-right legend of Sheet M-103' or 'Next to the red-lined revision cloud on Page 5'). Explain visual cues like 'tag shows 150 L/s but branch line matches 500 CFM scale'.
       RECONCILIATION MATH: Ensure 'outletSumVolume' is the EXACT arithmetic sum (including quantity multipliers) of the diffusers you identified. Double-check your own calculation before determining the 'status'.
    9. MANUFACTURER IDENTIFICATION: Prioritize identifying the manufacturer for all air distribution devices (Diffusers, Grilles, Registers). If found in the legend or schedule, apply it to every applicable outlet.
    10. DIVERSITY AUDIT: Calculate the ratio of total peak flow of all outlets (including multipliers) to unit capacity. If ratio is >105% and no "Diversity Note" exists, flag as Capacity Risk.
    11. PRESSURE PATH ANALYSIS: Compare External Static Pressure (ESP) in schedules to ductwork complexity (long runs, excessive elbows) on plans. Flag Bottleneck Risks.
    12. HARDWARE INDEX: Identify presence of Manual Volume Dampers (MVDs) for balanceability and specify Pitot Traverse locations for accurate measurements.
    13. EXECUTIVE SUMMARY & OUTSIDE AIR DESIGN MANDATE: Generate a high-level summary for leadership highlighting the critical path forward, major project risks, overall drawing compliance, and outside air designs.
        - OUTSIDE AIR ACTIONS: You MUST actively scan the entire document/drawings for any outside air (OA) designs, minimum outdoor air volume requirements, outdoor vent ventilation rates, or OA schedules. 
        - SUMMARY INTEGRATION: Incorporate a clear, dedicated highlight of these outside air designs and ventilation rates under your Key Technical Findings and Executive Summary Overview. Ensure they are prominently identified.
    14. COMPREHENSIVE UNIT DESIGN EXTRACTION, GAP WARNINGS, & TRACEABILITY LOGS (SHOW YOUR WORK):
        - Scan all pages thoroughly for equipment schedules (RTUs, AHUs, FCUs, VAVs, EF, etc.) and extract the specified parameters for each unit: Airflow Capacity (Supply, Return, OA, Exhaust), Pressure Profiles (ESP, TSP), Thermal/Coil Capacities (Total/Sensible Cooling MBH, Heating MBH, Entering/Leaving Air Temperatures), and Electrical/Drive Data (Voltage/Phase, Motor HP, and Motor RPM).
        - TRACEABILITY LOGS FOR EVERY UNIT: For every mechanical unit found, you MUST explicitly populate the following reasoning fields in the JSON response:
            * 'sourceLocation': The exact sheet name, table title, detail number, or plan view note where this unit's data was extracted (e.g. "Sheet M-502, Rooftop Unit Schedule, Row 3").
            * 'mathConversionSteps': Detailed math calculations or unit conversion steps performed. If no conversions were needed, explicitly state "No conversions required; design value of XXX taken directly from schedule." Otherwise, show formulas like "L/s converted to CFM: 50 L/s * 2.1189 = 105.9 CFM" or "Total Cooling MBH = Sensible (24 MBH) + Latent (6 MBH) = 30 MBH".
            * 'engineeringAssumptions': Document any engineering assumptions made if a specification was ambiguous, missing, or required industry defaults (e.g., assuming a standard ESP of 0.5 in w.g. for FCU model if unlisted).
        - CROSS-REFERENCE layout plans with schedules: Compare unit tags shown on floor layout drawing plans with those listed in schedules. If a unit tag is present on the floor layout plan but its corresponding design schedule row is missing, incomplete, or illegible, automatically generate a Critical Warning.
        - EXPLICIT LOGIC DETAIL: In the discrepancy detail or key findings, detail the exact step in your cross-referencing logic that triggered the warning (e.g., "Unit EF-3 identified on Sheet M-102 layout plan, but no corresponding entry found in Exhaust Fan Schedule on Sheet M-501").
        - You MUST format the warning clearly: "CRITICAL WARNING: Missing or incomplete design schedule data for Unit [Unit ID]." Include this exact warning in the 'executiveSummary.majorRedFlags' array and list it as a critical discrepancy.
    15. COMPREHENSIVE SPECIFICATION SCAN (AIR & WATER BALANCING):
        - If a specification document or Section 23 05 93 / TAB Specification is dropped or included:
        - READ IT IN ITS ENTIRETY to extract all critical parameters required for both Air Balancing and Water/Hydronic Balancing.
        - Extract water tolerances (e.g., +/- 10% on heating coils, +/- 5% on chillers/boilers), water/hydronic systems types, specified balancing valves (manual, automatic, or PICVs), and any pump/equipment data.
        - Look for specified flow-measurement instruments (differential pressure gauges, ultrasonic flow meters), bypass balance requirements, and flushing/chemical treatment mandates before balancing.
        - Integrate these crucial details into the 'hydronicSpecs' object. Ensure you distinguish between Air tolerances (+/- 5% or 10%) and Water tolerances clearly in keyFindings and overview!
    16. SEQUENTIAL FILE & PAGE ANALYSIS (BATCH PROCESSING):
        - When documents are processed sequentially page-by-page or chunk-by-chunk:
        - ISOLATED EXTRACTION: Treat the current page/file segment as an isolated dataset. Extract all matching schedules, equipment layouts, or notes found *only* within this specific segment.
        - CONTEXTUAL ANCHORING: Do not guess or assume data exists elsewhere. If a schedule row cuts off or continues onto another sheet, explicitly state: "Schedule continues on next sheet; tracking [Unit IDs] extracted so far" inside the notes or audit summary.
        - INCREMENTAL DELTA MAPPING: Output the extracted JSON structure containing *only* the newly discovered equipment, parameters, or warnings found in this specific segment. This is critical for programmatic state merging on the master dashboard.

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

export async function reconcileProjectData(projectData: AirBalanceData): Promise<AirBalanceData> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }

  const projectContext = JSON.stringify(projectData, (key, value) => {
    // Prune raw text and insights to save tokens
    if (key === 'rawTextFeed' || key === 'ocrInsight') return undefined;
    return value;
  });

  const prompt = `
    Role: Master TAB Reconciliation Engineer.
    Task: Perform a Global Reconciliation Pass on the multi-document air balance data extraction.
    
    CRITICAL OBJECTIVES:
    1. MASTER SUMMATION: Sum ALL individual diffuser/outlet CFMs found across all documents (captured in the 'units.outlets' arrays).
    2. CROSS-REFERENCE: Compare this Master Sum against the RTU/AHU Design Totals found in equipment schedules.
    3. DESIGN RECONCILIATION: Update the 'designReconciliation' object with:
       - scheduleDesignVolume: The aggregate design volume from all main units.
       - outletSumVolume: The absolute arithmetic sum of all identified diffusers/grilles.
       - reconciledVolume: Your final engineering determination of the actual project target.
       - status: 'Matched', 'Discrepancy', or 'Critical Error'.
       - discrepancies: List any specific units where the sum doesn't match the schedule.
    4. HARDWARE CONSOLIDATION: Group and list all unique manufacturers (e.g., Titus, Price) into a unified Hardware Index.
    5. PATH RISK: Flag any major systemic risks that only become apparent when looking at the project as a whole (e.g., "The combined ESP of AHU-1 branch 'A' exceeds its rated capacity despite individual outlets being correct").
    6. PROJECT IDENTITY RECONCILIATION: Review all extracted project names and site addresses. Prioritize the address explicitly labeled "Site Address" or "Job Site." If multiple documents show different addresses, determine the actual physical project location.
    7. EXECUTIVE SUMMARY & OUTSIDE AIR AUDIT: Update the summary to reflect a completed project-wide audit rather than single-file findings. Ensure that all compiled Outside Air (OA) designs, requirements, and minimum outdoor air ventilation rates discovered across the batch of audited documents are explicitly summarized and integrated into the final Executive Summary 'overview' and 'keyFindings'.

    Merged Project Data (JSON):
    ${projectContext}

    Return the final PROJECT-WIDE AirBalanceData in strictly valid JSON format matching the schema. Ensure ALL original details (units, tags, locations) are preserved while consolidating the higher-level audit fields.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash is sufficient for JSON-to-JSON reasoning
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: AIR_BALANCE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned during reconciliation");
    
    return JSON.parse(text) as AirBalanceData;
  } catch (error) {
    console.error("Project Reconciliation failed, returning original data:", error);
    return projectData;
  }
}
