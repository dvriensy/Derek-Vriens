/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { AirBalanceData } from '../types';

export function generateExcelReport(data: AirBalanceData, originalFileName: string) {
  const wb = XLSX.utils.book_new();
  const unitLabel = data.projectIdentity?.measurementUnits === 'Metric (L/s)' ? 'L/s' : 'CFM';

  // Parser helper for Cell References
  const parseLocation = (loc: string) => {
    if (!loc) {
      return { sheetName: "TAB Outlets Schedule", cellRef: "A1" };
    }
    const match = loc.match(/^(.*)!([A-Z]+)(\d+)$/i);
    if (match) {
      return {
        sheetName: match[1].trim(),
        cellRef: `${match[2]}${match[3]}`.toUpperCase()
      };
    }
    return {
      sheetName: "TAB Outlets Schedule",
      cellRef: loc
    };
  };

  // ==========================================
  // SHEET 0: TAB AUDIT SUMMARY (PROGRAMMATICALLY INJECTED)
  // ==========================================
  if (data.excelAudit) {
    const auditSummaryRows: any[][] = [
      ["ACCU-AIR TECHNICAL SERVICES LTD. - COMPREHENSIVE TAB AUDIT SUMMARY"],
      ["This worksheet displays cell-level markup coordinates, severe/critical errors, and compliance warnings."],
      [],
      ["1. EXECUTIVE PERFORMANCE METRICS"],
      ["Metric Category", "Audit Value / Level", "Description & Compliance Standard"],
      ["Overall Audit Score:", `${data.excelAudit.summary?.engineeringScore || 100}/100`, "Accu-Air quality index based on three-pass logic validation"],
      ["Verification Status:", data.excelAudit.summary?.overallStatus || "Compliant", "Overall assessment (Pass / Fail / Partial)"],
      ["Total Checked Cells:", data.excelAudit.summary?.totalCheckedCells || 0, "Number of numeric, capacity, and schedule items scanned"],
      ["Unique Discrepancies:", data.excelAudit.summary?.issuesFound || 0, "Total count of engineering, logic, and tolerance violations"],
      [],
      ["2. CELL-LEVEL DETAILED DEFICIENCIES & VISUAL ALERT MARKUP LOG"],
      ["Issue ID", "Severity Flag", "Finding Type", "Target Sheet Name", "Cell / Coordinate", "Deficiency Description / Message", "Required Visual Color Alert Fill"],
    ];

    const findings = data.excelAudit.findings || [];
    findings.forEach((finding, index) => {
      const parsed = parseLocation(finding.location);
      const isCritical = finding.severity === 'Critical' || finding.severity === 'High';
      const severityFlag = isCritical ? 'CRITICAL' : 'WARNING';
      const fillStyle = isCritical ? 'Red Fill (#FEE2E2) - Action Required' : 'Yellow Fill (#FEF3C7) - Review/Verify';
      
      auditSummaryRows.push([
        `AUD-${index + 1}`,
        severityFlag,
        finding.type || 'Engineering Logic',
        parsed.sheetName,
        parsed.cellRef,
        finding.message,
        fillStyle
      ]);
    });

    const spelling = data.excelAudit.spellingAndPunctuationIssues || [];
    spelling.forEach((issue, index) => {
      const parsed = parseLocation(issue.location);
      auditSummaryRows.push([
        `SPL-${index + 1}`,
        'WARNING',
        'Grammar / Spelling',
        parsed.sheetName,
        parsed.cellRef,
        issue.message,
        'Yellow Fill (#FEF3C7) - Review/Verify'
      ]);
    });

    const suggested = data.excelAudit.suggestedChanges || [];
    if (suggested.length > 0) {
      auditSummaryRows.push([]);
      auditSummaryRows.push(["3. PROPOSED VALUE CORRECTIONS & CALCULATED MATCHES"]);
      auditSummaryRows.push(["Correction ID", "Target Location", "Original Value", "Proposed Correct Value", "Audit Justification / Engineering Reason"]);
      suggested.forEach((change, index) => {
        auditSummaryRows.push([
          `COR-${index + 1}`,
          change.location || "N/A",
          change.originalValue || "-",
          change.proposedValue || "-",
          change.reason || ""
        ]);
      });
    }

    // Programmatic Visual Alert Definitions
    auditSummaryRows.push([]);
    auditSummaryRows.push(["4. PROGRAMMATIC VISUAL ALERT DEFINITIONS (CELL MARKUP ARRAY)"]);
    auditSummaryRows.push(["Target Cell Reference", "Severity Flag", "Action Code"]);
    
    findings.forEach((finding) => {
      const parsed = parseLocation(finding.location);
      const isCritical = finding.severity === 'Critical' || finding.severity === 'High';
      auditSummaryRows.push([
        `${parsed.sheetName}!${parsed.cellRef}`,
        isCritical ? 'CRITICAL' : 'WARNING',
        isCritical ? 'applyFillColor("red")' : 'applyFillColor("yellow")'
      ]);
    });
    
    spelling.forEach((issue) => {
      const parsed = parseLocation(issue.location);
      auditSummaryRows.push([
        `${parsed.sheetName}!${parsed.cellRef}`,
        'WARNING',
        'applyFillColor("yellow")'
      ]);
    });

    const wsAuditSummary = XLSX.utils.aoa_to_sheet(auditSummaryRows);
    wsAuditSummary['!cols'] = [
      { wch: 12 }, // ID
      { wch: 15 }, // Severity Flag
      { wch: 20 }, // Finding Type
      { wch: 25 }, // Target Sheet Name
      { wch: 15 }, // Cell / Coordinate
      { wch: 65 }, // Deficiency Description / Message
      { wch: 35 }  // Required Visual Color Alert Fill
    ];
    wsAuditSummary['!pageSetup'] = { paperSize: 1, orientation: 'portrait' };
    
    XLSX.utils.book_append_sheet(wb, wsAuditSummary, "TAB Audit Summary");
  }

  // ==========================================
  // SHEET 1: PROJECT OVERVIEW & EXECUTIVE SUMMARY
  // ==========================================
  const overviewRows: any[][] = [
    ["ACCU-AIR TECHNICAL SERVICES LTD."],
    ["HVAC TAB AUDIT & COMMISSIONING REPORT"],
    [],
    ["1. PROJECT IDENTITY & DNA"],
    ["Project Name:", data.projectIdentity?.projectName || "N/A"],
    ["Project Location:", data.projectIdentity?.siteAddress || "N/A"],
    ["Engineering Firm:", data.projectIdentity?.engineeringFirm || "N/A"],
    ["HVAC System Type:", data.projectIdentity?.systemType || "N/A"],
    ["HVAC Classification:", data.projectIdentity?.classification || "N/A"],
    ["Measurement Units:", data.projectIdentity?.measurementUnits || "Imperial (cfm)"],
    [],
    ["2. AUDIT STATUS & EXECUTIVE SUMMARY"],
    ["Compliance Status:", data.executiveSummary?.complianceStatus || "Conditional"],
    ["Overview:", data.executiveSummary?.overview || "N/A"],
    []
  ];

  // Outside Air summary (if present)
  let totalOAFromSystems = 0;
  if (data.globalAirBalance?.systems) {
    totalOAFromSystems = data.globalAirBalance.systems.reduce((acc, sys) => acc + (sys.totalOutdoorAirVolume || 0), 0);
  }
  const totalOAUnits = (data.equipmentSchedules?.units || []).filter(u => (u.outdoorAirCfm || 0) > 0);

  if (totalOAFromSystems > 0 || totalOAUnits.length > 0) {
    overviewRows.push(["3. OUTDOOR VENTILATION & OUTSIDE AIR (OA) DESIGNS"]);
    if (totalOAFromSystems > 0) {
      overviewRows.push(["Consolidated Outdoor Air Design Volume:", `${totalOAFromSystems.toLocaleString()} ${unitLabel}`]);
    }
    if (totalOAUnits.length > 0) {
      const unitTags = totalOAUnits.map(u => `${u.tag} (${u.outdoorAirCfm || 0} ${unitLabel})`).join(', ');
      overviewRows.push(["Active Outside Air Intake Units:", unitTags]);
    }
    overviewRows.push([]);
  }

  // Key Technical Findings
  overviewRows.push(["4. KEY TECHNICAL FINDINGS"]);
  const findings = data.executiveSummary?.keyFindings || [];
  if (findings.length === 0) {
    overviewRows.push(["• No major technical findings identified."]);
  } else {
    findings.forEach(finding => {
      overviewRows.push([`• ${finding}`]);
    });
  }
  overviewRows.push([]);

  // Critical Red Flags & Warnings
  overviewRows.push(["5. CRITICAL RED FLAGS & WARNINGS"]);
  const flags = data.executiveSummary?.majorRedFlags || [];
  if (flags.length === 0) {
    overviewRows.push(["✔ No critical red flags or capacity overloads identified."]);
  } else {
    flags.forEach(flag => {
      overviewRows.push([`⚠️ ${flag}`]);
    });
  }

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);

  // Apply some column widths for Sheet 1
  wsOverview['!cols'] = [
    { wch: 35 }, // Col A
    { wch: 75 }  // Col B
  ];
  wsOverview['!pageSetup'] = { paperSize: 1, orientation: 'portrait' };

  XLSX.utils.book_append_sheet(wb, wsOverview, "Project Summary");

  // ==========================================
  // SHEET 2: EQUIPMENT & OUTLETS SCHEDULE
  // ==========================================
  const scheduleRows: any[][] = [];
  
  // Title block for testing sheet
  scheduleRows.push(["ACCU-AIR TECHNICAL SERVICES LTD. - FIELD TEST & BALANCE SHEET"]);
  scheduleRows.push(["Instructions: Enter Actual Field Flow measurements in Column H. Deviations and totals calculate automatically."]);
  scheduleRows.push([]);

  const units = data.equipmentSchedules?.units || [];
  
  if (units.length === 0) {
    scheduleRows.push(["No equipment or outlet data available."]);
  } else {
    units.forEach((unit) => {
      // Unit header block
      scheduleRows.push([`UNIT TAG:`, unit.tag, `TYPE:`, unit.type, `DESIGN FLOW:`, unit.designCfm, unitLabel]);
      scheduleRows.push([`STATIC PRESSURE:`, unit.staticPressure || "N/A", `NOTES:`, unit.notes || "N/A"]);
      
      // Table headers
      scheduleRows.push([
        "Outlet No.", 
        "Register Type", 
        "Manufacturer", 
        "Duct Size", 
        "Quantity", 
        `Design Flow (${unitLabel})`, 
        `Total Design Flow (${unitLabel})`, 
        `Actual Field Flow (${unitLabel})`, 
        "Deviation (%)", 
        "Visual Justification / Reference Location"
      ]);

      const startRowIdx = scheduleRows.length + 1; // 1-based index in Excel for the first outlet row
      const outlets = unit.outlets || [];

      if (outlets.length === 0) {
        // Fallback row if no outlets
        scheduleRows.push([
          "No diffusers listed", 
          "-", 
          "-", 
          "-", 
          0, 
          0, 
          0, 
          "", 
          "", 
          "Add diffusers to verify distribution balance"
        ]);
      } else {
        outlets.forEach((o) => {
          const currentIdx = scheduleRows.length + 1; // Excel row index
          
          const qty = o.quantity || 1;
          const designVol = o.designVolume || 0;
          
          // Formula for Total Design Flow: Qty * Design Flow per device
          const totalDesignFormula = `E${currentIdx}*F${currentIdx}`;
          // Formula for Deviation %: (Actual - TotalDesign) / TotalDesign
          const deviationFormula = `IF(ISBLANK(H${currentIdx}),"",(H${currentIdx}-G${currentIdx})/G${currentIdx})`;

          scheduleRows.push([
            o.outletNumber,
            o.registerType || "-",
            o.manufacturer || "-",
            o.ductSize || "-",
            qty,
            designVol,
            { t: 'n', f: totalDesignFormula }, // Column G: Total Design Flow
            "", // Column H: Actual Field Flow (Empty for manual technician entry)
            { t: 'n', f: deviationFormula, z: '0.0%' }, // Column I: Deviation %
            o.visualJustification || ""
          ]);
        });
      }

      const endRowIdx = scheduleRows.length; // 1-based index of the last outlet row
      const totalRowIdx = endRowIdx + 1;
      const capacityRowIdx = totalRowIdx + 1;
      const varianceRowIdx = capacityRowIdx + 1;

      // Add summary calculations below unit outlets
      // 1. Total outlet sum
      scheduleRows.push([
        "TOTAL OUTLET SUM", 
        "", 
        "", 
        "", 
        "", 
        "", 
        { t: 'n', f: `SUM(G${startRowIdx}:G${endRowIdx})` }, 
        { t: 'n', f: `SUM(H${startRowIdx}:H${endRowIdx})` }, 
        { t: 'n', f: `IF(ISBLANK(H${totalRowIdx}),"",(H${totalRowIdx}-G${totalRowIdx})/G${totalRowIdx})`, z: '0.0%' }, 
        "Total sum of connected ventilation outlets"
      ]);

      // 2. Unit Design Capacity
      scheduleRows.push([
        "UNIT CAPACITY DESIGN", 
        "", 
        "", 
        "", 
        "", 
        "", 
        unit.designCfm, 
        "", 
        "", 
        "Design flow from primary equipment schedule"
      ]);

      // 3. Variance VS Design
      scheduleRows.push([
        "VARIANCE VS DESIGN", 
        "", 
        "", 
        "", 
        "", 
        "", 
        { t: 'n', f: `G${totalRowIdx}-G${capacityRowIdx}` }, 
        "", 
        { t: 'n', f: `IF(G${capacityRowIdx}=0,"",(G${totalRowIdx}-G${capacityRowIdx})/G${capacityRowIdx})`, z: '0.0%' }, 
        "Difference between outlet sum and unit capacity design"
      ]);

      // Empty separator lines before next unit
      scheduleRows.push([]);
      scheduleRows.push([]);
    });
  }

  // Add VAV/Terminal box summation audit if present
  const vav = data.equipmentSchedules?.vavSummation;
  if (vav && (vav.totalVavCfm > 0 || vav.mainUnitCfm > 0)) {
    scheduleRows.push(["VAV / TERMINAL BOX SUMMATION AUDIT"]);
    scheduleRows.push(["Metric", "Design Value", "Discrepancy / Formula Notes"]);
    scheduleRows.push(["Total Terminal Box Sum Flow:", vav.totalVavCfm, vav.mathString || ""]);
    scheduleRows.push(["Main Equipment Air Volume:", vav.mainUnitCfm, ""]);
    scheduleRows.push(["Arithmetic Discrepancy:", vav.discrepancy, vav.mathNote || ""]);
    scheduleRows.push([]);
  }

  const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleRows);

  // Column width formatting for Sheet 2
  wsSchedule['!cols'] = [
    { wch: 18 }, // Outlet No. / Tag
    { wch: 18 }, // Register Type
    { wch: 16 }, // Manufacturer
    { wch: 14 }, // Duct Size
    { wch: 10 }, // Qty
    { wch: 22 }, // Design Flow (per device)
    { wch: 22 }, // Total Design Flow
    { wch: 22 }, // Actual Field Flow
    { wch: 14 }, // Deviation %
    { wch: 45 }  // Visual Justification
  ];
  wsSchedule['!pageSetup'] = { paperSize: 1, orientation: 'portrait' };

  XLSX.utils.book_append_sheet(wb, wsSchedule, "TAB Outlets Schedule");

  // ==========================================
  // SHEET 3: SYSTEMS & GLOBAL BALANCE
  // ==========================================
  const systemsRows: any[][] = [
    ["ACCU-AIR TECHNICAL SERVICES LTD. - GLOBAL AIR BALANCE & SPECS"],
    [],
    ["1. GLOBAL AIR BALANCE RECONCILIATION SUMMARY"],
    ["System Type", "Total Design Volume", "Total Outlets Volume", "Outdoor Air (OA) Volume", "Diversified Total", "Calculation Note"]
  ];

  const systems = data.globalAirBalance?.systems || [];
  if (systems.length === 0) {
    systemsRows.push(["No system-wide balance summaries found.", "", "", "", "", ""]);
  } else {
    systems.forEach(sys => {
      systemsRows.push([
        sys.type,
        sys.totalDesignVolume,
        sys.totalOutletsVolume || "N/A",
        sys.totalOutdoorAirVolume || 0,
        sys.diversifiedTotal || "N/A",
        sys.calculationNote || ""
      ]);
    });
  }
  systemsRows.push([]);

  // TAB Specs Compliance
  systemsRows.push(["2. TAB COMPLIANCE SPECIFICATIONS (Section 23 05 93)"]);
  systemsRows.push(["Compliance Standard/Requirement", "Value / Extraction Detail"]);
  systemsRows.push(["Allowable Tolerances:", data.tabSpecs?.tolerances || "N/A"]);
  systemsRows.push(["Mandated Certifications:", data.tabSpecs?.certifications || "N/A"]);
  systemsRows.push(["Section Reference:", data.tabSpecs?.sectionRef || "N/A"]);
  systemsRows.push(["Mandated Instrumentation:", (data.tabSpecs?.instrumentation || []).join(', ') || "N/A"]);
  systemsRows.push(["Fire Damper Drop Testing:", data.tabSpecs?.fireDamperDropTesting ? "Required" : "Not Mandated"]);
  systemsRows.push(["Fire Damper Count:", data.tabSpecs?.fireDamperCount || 0]);
  if (data.tabSpecs?.fireDamperLocations && data.tabSpecs.fireDamperLocations.length > 0) {
    systemsRows.push(["Fire Damper Locations:", data.tabSpecs.fireDamperLocations.join(', ')]);
  }
  systemsRows.push(["Sound Pressure Readings:", data.tabSpecs?.soundReadingsRequired ? "Required" : "Not Mandated"]);
  if (data.tabSpecs?.soundReadingLocations && data.tabSpecs.soundReadingLocations.length > 0) {
    systemsRows.push(["Sound Reading Mandated Rooms:", data.tabSpecs.soundReadingLocations.join(', ')]);
  }
  systemsRows.push([]);

  // Water / Hydronic Specs
  if (data.hydronicSpecs) {
    systemsRows.push(["2b. WATER / HYDRONIC BALANCING SPECIFICATIONS"]);
    systemsRows.push(["Hydronic Balancing Parameter", "Value / Extraction Detail"]);
    systemsRows.push(["Water Flow Tolerances:", data.hydronicSpecs.waterTolerances || "N/A"]);
    systemsRows.push(["Hydronic Loops Identified:", (data.hydronicSpecs.systemTypes || []).join(', ') || "N/A"]);
    systemsRows.push(["Flow Control Devices Specified:", (data.hydronicSpecs.balancingValves || []).join(', ') || "N/A"]);
    systemsRows.push(["Pre-TAB System Flushing:", data.hydronicSpecs.flushingRequired ? "Mandatory / Required" : "Not Specified"]);
    systemsRows.push(["Bypass Loop Balancing:", data.hydronicSpecs.bypassBalanceRequired ? "Mandatory / Required" : "Not Specified"]);
    systemsRows.push(["Required Instruments:", (data.hydronicSpecs.instruments || []).join(', ') || "N/A"]);
    if (data.hydronicSpecs.pumpDetails && data.hydronicSpecs.pumpDetails.length > 0) {
      const pumpStrs = data.hydronicSpecs.pumpDetails.map(p => `${p.tag} (${p.designGpm || 0} GPM${p.headFeet ? `, ${p.headFeet} ft head` : ''}${p.motorHp ? `, ${p.motorHp}` : ''})`);
      systemsRows.push(["Pump Design Schedule:", pumpStrs.join('; ')]);
    }
    if (data.hydronicSpecs.auditNotes) {
      systemsRows.push(["Hydronic Special Notes:", data.hydronicSpecs.auditNotes]);
    }
    systemsRows.push([]);
  }

  // Pre-TAB Readiness Checklist
  systemsRows.push(["3. PRE-TAB FIELD READINESS CHECKLIST"]);
  systemsRows.push(["Checklist Task Description", "Current Status", "Verification Note"]);
  const readinessChecklist = data.preBalanceReadiness?.checklist || [];
  if (readinessChecklist.length === 0) {
    systemsRows.push(["No pre-readiness checks found.", "", ""]);
  } else {
    readinessChecklist.forEach(item => {
      systemsRows.push([
        item.item,
        item.status,
        item.note || ""
      ]);
    });
  }

  const wsSystems = XLSX.utils.aoa_to_sheet(systemsRows);

  wsSystems['!cols'] = [
    { wch: 35 }, // Col A
    { wch: 22 }, // Col B
    { wch: 22 }, // Col C
    { wch: 22 }, // Col D
    { wch: 22 }, // Col E
    { wch: 55 }  // Col F
  ];
  wsSystems['!pageSetup'] = { paperSize: 1, orientation: 'portrait' };

  XLSX.utils.book_append_sheet(wb, wsSystems, "Systems & TAB Specs");

  // ==========================================
  // SHEET 4: UNIT DESIGN PROFILES
  // ==========================================
  const profileRows: any[][] = [
    ["ACCU-AIR TECHNICAL SERVICES LTD. - COMPREHENSIVE UNIT DESIGN PROFILES"],
    ["This sheet lists detailed design parameters paired with blank columns for field measurements. Deviation (%) is computed automatically upon entry."],
    []
  ];

  const groupedUnits: { [key: string]: typeof data.equipmentSchedules.units } = {};
  (data.equipmentSchedules?.units || []).forEach(unit => {
    const type = unit.type || "Other";
    if (!groupedUnits[type]) {
      groupedUnits[type] = [];
    }
    groupedUnits[type].push(unit);
  });

  const types = Object.keys(groupedUnits);
  if (types.length === 0) {
    profileRows.push(["No equipment or unit data available."]);
  } else {
    types.forEach(type => {
      profileRows.push([]);
      profileRows.push([`UNIT TYPE: ${type.toUpperCase()}`]);
      profileRows.push([
        "Equipment Tag",
        "Design Parameter",
        "Specified Design Value",
        "Actual Field Measured Value",
        "Deviation (%)",
        "Reference Location"
      ]);

      const typeUnits = groupedUnits[type];
      typeUnits.forEach(unit => {
        const unitParams: { label: string, spec: string | number | undefined, isNumeric?: boolean }[] = [
          { label: `Supply Airflow Rate (${unitLabel})`, spec: unit.airflowSupply || unit.designCfm, isNumeric: true },
          { label: `Return Airflow Rate (${unitLabel})`, spec: unit.airflowReturn, isNumeric: true },
          { label: `Outside Airflow Rate (${unitLabel})`, spec: unit.airflowOutsideAir || unit.outdoorAirCfm, isNumeric: true },
          { label: `Exhaust Airflow Rate (${unitLabel})`, spec: unit.airflowExhaust, isNumeric: true },
          { label: "External Static Pressure (ESP)", spec: unit.esp || unit.staticPressure },
          { label: "Total Static Pressure (TSP)", spec: unit.tsp },
          { label: "Total Cooling Capacity (MBH)", spec: unit.coolingTotalMbh, isNumeric: true },
          { label: "Sensible Cooling Capacity (MBH)", spec: unit.coolingSensibleMbh, isNumeric: true },
          { label: "Heating Capacity (MBH)", spec: unit.heatingMbh, isNumeric: true },
          { label: "Entering Air Temp", spec: unit.enteringAirTemp },
          { label: "Leaving Air Temp", spec: unit.leavingAirTemp },
          { label: "Electrical Voltage / Phase", spec: unit.voltagePhase },
          { label: "Motor Horsepower (HP)", spec: unit.motorHp },
          { label: "Motor RPM", spec: unit.motorRpm },
        ];

        // Filter parameters that actually have data
        const activeParams = unitParams.filter(p => p.spec !== undefined && p.spec !== "" && p.spec !== 0);
        if (activeParams.length === 0) {
          activeParams.push({ label: `Airflow Rate (Primary, ${unitLabel})`, spec: unit.designCfm, isNumeric: true });
        }

        activeParams.forEach((param, idx) => {
          const currentIdx = profileRows.length + 1; // Excel row index
          
          let specVal = param.spec;
          if (param.isNumeric && typeof specVal === "string") {
            const parsed = parseFloat(specVal);
            if (!isNaN(parsed)) specVal = parsed;
          }

          // Formula for deviation if it's numeric
          // Col C is Design Value, Col D is Actual Field Measured, Col E is Deviation (%)
          const deviationFormula = param.isNumeric && typeof specVal === "number" && specVal > 0
            ? `IF(ISBLANK(D${currentIdx}),"",(D${currentIdx}-C${currentIdx})/C${currentIdx})`
            : "";

          profileRows.push([
            idx === 0 ? unit.tag : "", // Only print tag on first line of unit
            param.label,
            specVal,
            "", // Column D: Actual Field Measured Value
            deviationFormula ? { t: 'n', f: deviationFormula, z: '0.0%' } : "",
            idx === 0 ? (unit.visualJustification || "") : ""
          ]);
        });

        // Append traceability reasoning log rows
        if (unit.sourceLocation || unit.mathConversionSteps || unit.engineeringAssumptions) {
          if (unit.sourceLocation) {
            profileRows.push([
              "",
              "↳ Traceability Source Location",
              unit.sourceLocation,
              "",
              "",
              ""
            ]);
          }
          if (unit.mathConversionSteps) {
            profileRows.push([
              "",
              "↳ Traceability Math/Conversions",
              unit.mathConversionSteps,
              "",
              "",
              ""
            ]);
          }
          if (unit.engineeringAssumptions) {
            profileRows.push([
              "",
              "↳ Traceability Assumptions",
              unit.engineeringAssumptions,
              "",
              "",
              ""
            ]);
          }
        }

        // Blank spacer row after each unit
        profileRows.push([]);
      });
    });
  }

  const wsProfiles = XLSX.utils.aoa_to_sheet(profileRows);
  wsProfiles['!cols'] = [
    { wch: 18 }, // Equipment Tag
    { wch: 32 }, // Design Parameter
    { wch: 24 }, // Specified Design Value
    { wch: 28 }, // Actual Field Measured Value
    { wch: 16 }, // Deviation (%)
    { wch: 45 }  // Reference Location
  ];
  wsProfiles['!pageSetup'] = { paperSize: 1, orientation: 'portrait' };

  XLSX.utils.book_append_sheet(wb, wsProfiles, "Unit Design Profiles");

  // Write and Save workbook
  const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
  const finalExportName = `${baseName}_TAB_Audit_Report.xlsx`;
  XLSX.writeFile(wb, finalExportName);
}
