/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AirBalanceData } from "../types";

export function generateAirBalanceReport(data: AirBalanceData, fileName: string) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true // Optimize for lightweight readers
  });

  doc.setProperties({
    title: `TAB Audit - ${data.projectIdentity.projectName}`,
    subject: 'Air Balance Audit Report',
    author: 'Accu-Air Technical Services',
    creator: 'Accu-Air Technical Services',
    keywords: 'TAB, HVAC, Audit'
  });

  const timestamp = new Date().toLocaleDateString();
  const isMetric = data.projectIdentity.measurementUnits === 'Metric (L/s)';
  const unitLabel = isMetric ? "L/s" : "CFM";
  const convertToCfm = (ls: number) => ls * 2.119;

  // --- Title Page: "Architectural Precision" ---
  // Background
  doc.setFillColor(255, 255, 255); // White
  doc.rect(0, 0, 210, 297, 'F');

  // Left Branding Sidebar
  doc.setFillColor(35, 135, 166); // Accu-Air Teal
  doc.rect(0, 0, 15, 297, 'F');
  
  // Subtle Background Accents (Grid corner)
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.1);
  for(let i=0; i<40; i+=5) {
    doc.line(200, 250+i, 210, 250+i); // Horizontal lines bottom right
    doc.line(160+i, 290, 160+i, 297); // Vertical lines bottom right
  }

  // Company Name - Top Left
  doc.setTextColor(35, 135, 166);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ACCU-AIR TECHNICAL SERVICES LTD.", 25, 25);
  
  // Main Title Area
  doc.setTextColor(20, 20, 20); // Near Black
  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  doc.text("8-POINT", 25, 75);
  doc.text("PRECISION", 25, 92);
  doc.text("AUDIT", 25, 109);
  
  // Subtitle
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Technical Readiness & Field Protocol Report", 25, 122);
  
  // Accent Bar
  doc.setFillColor(35, 135, 166);
  doc.rect(25, 130, 40, 1.5, 'F');
  
  // Project Info Card
  const infoX = 25;
  const infoY = 160;
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("PROJECT IDENTIFICATION", infoX, infoY);
  
  doc.setTextColor(20, 20, 20); // Near Black
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectIdentity.projectName || "Not Specified", infoX, infoY + 8);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(data.projectIdentity.siteAddress || "Site Address Unavailable", infoX, infoY + 16);
  
  // Technical Data
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("ENGINEERING COMPLIANCE", infoX, infoY + 35);
  
  doc.setTextColor(80, 80, 80);
  doc.text(`Doc Ref: CSN Sec. 23 05 93`, infoX, infoY + 41);
  doc.text(`System DNA: ${data.projectIdentity.classification || "Unknown"}`, infoX, infoY + 46);
  doc.text(`System Type: ${data.projectIdentity.systemType || "Commercial HVAC"}`, infoX, infoY + 51);
  doc.text(`Measurement: ${data.projectIdentity.measurementUnits}`, infoX, infoY + 56);
  
  // Date and Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(timestamp, infoX, 270);
  doc.setTextColor(35, 135, 166);
  doc.text("RELEASED FOR FIELD OPERATIONS", 195, 270, { align: 'right' });

  // --- Page 2: Executive Summary Report & Outside Air Designs ---
  doc.addPage();

  // Header for standard pages (Keeping white background for printability, but dark accents)
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ACCU-AIR TECHNICAL SERVICES LTD.", 14, 10);
  const headerRight = `Audit: ${data.projectIdentity.projectName || 'Project'}${data.projectIdentity.siteAddress ? ` | ${data.projectIdentity.siteAddress}` : ''}`;
  doc.text(headerRight, 196, 10, { align: 'right' });
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 12, 196, 12);

  // Section Title
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary Report", 14, 23);

  // Draw Compliance Status Box
  const status = data.executiveSummary?.complianceStatus || "Conditional";
  let statusColor = [35, 135, 166]; // Teal default
  if (status === "Compliant") statusColor = [16, 185, 129]; // Emerald
  if (status === "Non-Compliant") statusColor = [239, 68, 68]; // Red
  if (status === "Conditional") statusColor = [245, 158, 11]; // Amber

  doc.setFillColor(248, 250, 252); // Very light slate background
  doc.setDrawColor(226, 232, 240); // Slate 200 border
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 28, 182, 38, 2, 2, 'FD');

  // Accent colored bar on left of status box
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(14, 28, 3, 38, 'F');

  // Status text inside box
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont("helvetica", "normal");
  doc.text("AUDIT COMPLIANCE STATUS", 22, 35);

  doc.setFontSize(14);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(status.toUpperCase(), 22, 42);

  // Overview paragraph inside box
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.setFont("helvetica", "normal");
  const overviewText = data.executiveSummary?.overview || "Review of mechanical design files, equipment schedules and terminal layouts completed.";
  const wrappedOverview = doc.splitTextToSize(overviewText, 165);
  doc.text(wrappedOverview, 22, 49);

  let currentY = 74;

  // Sum up all outdoor air volumes
  let totalOAFromSystems = 0;
  if (data.globalAirBalance?.systems) {
    totalOAFromSystems = data.globalAirBalance.systems.reduce((acc, sys) => acc + (sys.totalOutdoorAirVolume || 0), 0);
  }
  
  // Also count total OA units
  const totalOAUnits = (data.equipmentSchedules?.units || []).filter(u => (u.outdoorAirCfm || 0) > 0);
  
  if (totalOAFromSystems > 0 || totalOAUnits.length > 0) {
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.setDrawColor(191, 219, 254); // Blue 200 border
    doc.setLineWidth(0.2);
    doc.roundedRect(14, currentY, 182, 26, 1.5, 1.5, 'FD');

    // Colored bar
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(14, currentY, 3, 26, 'F');

    // Section title inside box
    doc.setFontSize(9);
    doc.setTextColor(29, 78, 216); // Blue 700
    doc.setFont("helvetica", "bold");
    doc.text("OUTDOOR VENTILATION & OUTSIDE AIR (OA) DESIGNS", 22, currentY + 6);

    // Context details inside box
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFont("helvetica", "normal");
    
    let oaDetailString = "";
    if (totalOAFromSystems > 0) {
      oaDetailString += `Consolidated Outdoor Air Design Volume: ${totalOAFromSystems.toLocaleString()} ${unitLabel}. `;
    }
    if (totalOAUnits.length > 0) {
      const unitTags = totalOAUnits.map(u => `${u.tag} (${u.outdoorAirCfm || 0} ${unitLabel})`).join(', ');
      oaDetailString += `Active Outside Air Intake Units: ${unitTags}.`;
    } else {
      oaDetailString += `Minimum outside air volume constraints analyzed.`;
    }
    
    const wrappedOADetails = doc.splitTextToSize(oaDetailString, 165);
    doc.text(wrappedOADetails, 22, currentY + 12);
    currentY += 34; // Advance Y past the OA card
  }

  // Key Technical Findings Section
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont("helvetica", "bold");
  doc.text("Key Technical Findings", 14, currentY);
  currentY += 6;

  const keyFindings = data.executiveSummary?.keyFindings || [];
  if (keyFindings.length === 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("- No major technical findings listed.", 14, currentY);
    currentY += 5;
  } else {
    keyFindings.forEach((finding) => {
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      const wrappedFinding = doc.splitTextToSize(`• ${finding}`, 180);
      wrappedFinding.forEach((line: string) => {
        if (currentY > 275) {
          doc.addPage();
          // Header on transition page
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("ACCU-AIR TECHNICAL SERVICES LTD.", 14, 10);
          doc.text(headerRight, 196, 10, { align: 'right' });
          doc.setDrawColor(230, 230, 230);
          doc.line(14, 12, 196, 12);
          currentY = 25;
        }
        doc.text(line, 14, currentY);
        currentY += 4.5;
      });
      currentY += 1.5; // space between findings
    });
  }

  currentY += 4;

  // Major Red Flags / Concerns Section
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // Red-600
  doc.setFont("helvetica", "bold");
  doc.text("Critical Red Flags & Warnings", 14, currentY);
  currentY += 6;

  const majorRedFlags = data.executiveSummary?.majorRedFlags || [];
  if (majorRedFlags.length === 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129); // Emerald-600
    doc.setFont("helvetica", "normal");
    doc.text("✔ No critical red flags or capacity overloads identified.", 14, currentY);
    currentY += 5;
  } else {
    majorRedFlags.forEach((flag) => {
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28); // Red-700
      doc.setFont("helvetica", "normal");
      const wrappedFlag = doc.splitTextToSize(`⚠️ ${flag}`, 180);
      wrappedFlag.forEach((line: string) => {
        if (currentY > 275) {
          doc.addPage();
          // Header on transition page
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("ACCU-AIR TECHNICAL SERVICES LTD.", 14, 10);
          doc.text(headerRight, 196, 10, { align: 'right' });
          doc.setDrawColor(230, 230, 230);
          doc.line(14, 12, 196, 12);
          currentY = 25;
        }
        doc.text(line, 14, currentY);
        currentY += 4.5;
      });
      currentY += 1.5; // space between flags
    });
  }

  // --- Add a page break and draw standard header for Section 0 ---
  doc.addPage();

  // Draw header for the new page
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ACCU-AIR TECHNICAL SERVICES LTD.", 14, 10);
  doc.text(headerRight, 196, 10, { align: 'right' });
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 12, 196, 12);

  // 0. Pre-Balance Readiness Summary
  doc.setFontSize(18);
  doc.setTextColor(10, 10, 10);
  doc.text("Pre-Balance Readiness Summary", 14, 25);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const overview = data.preBalanceReadiness?.systemOverview || "Pre-balance assessment performed on architectural and mechanical schedules.";
  doc.text(doc.splitTextToSize(overview, 180), 14, 35);

  autoTable(doc, {
    startY: 45,
    head: [['Item', 'Status', 'Technician Note']],
    body: (data.preBalanceReadiness?.checklist || []).map(item => [
      item.item,
      item.status,
      item.note
    ]),
    theme: 'grid',
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], font: 'helvetica' },
    styles: { fontSize: 8, font: 'helvetica' },
    columnStyles: { 1: { fontStyle: 'bold' } }
  });

  if (data.preBalanceReadiness?.criticalDeficiencies?.length > 0) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(10);
    doc.text("CRITICAL DEFICIENCIES:", 14, y);
    doc.setFontSize(9);
    data.preBalanceReadiness?.criticalDeficiencies?.forEach((def: string, i: number) => {
      doc.text(`- ${def}`, 14, y + 5 + (i * 5));
    });
    doc.setTextColor(0, 0, 0);
  }

  // 1. Project Identity
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("1. Project Identity", 14, 20);
  
  autoTable(doc, {
    startY: 25,
    body: [
      ["Project Name", data.projectIdentity.projectName || "Not Specified"],
      ["Site Address", data.projectIdentity.siteAddress || "Not Specified"],
      ["Engineering Firm", data.projectIdentity.engineeringFirm || "Not Specified"],
      ["System DNA", data.projectIdentity.classification || "Not Specified"],
      ["System Type", data.projectIdentity.systemType || "Not Specified"],
      ["Measurement Units", data.projectIdentity.measurementUnits || "Imperial (cfm)"],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] } }
  });

  // 2. Global Air Balance
  doc.text("2. Global Air Balance Summary", 14, (doc as any).lastAutoTable.finalY + 15);
  
  const gabHead = isMetric 
    ? [['System', `Design (${unitLabel})`, 'Total OA', 'Equiv. CFM', 'Diversified', 'Notes', 'Status']]
    : [['System', `Design (${unitLabel})`, 'Total OA', 'Diversified', 'Notes', 'Status']];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: gabHead,
    body: (data.globalAirBalance?.systems || []).map(s => {
      const outletsVol = s.totalOutletsVolume || 0;
      const variance = s.totalDesignVolume > 0 ? Math.abs(((outletsVol - s.totalDesignVolume) / s.totalDesignVolume) * 100) : 0;
      const baseRow = [
        s.type,
        s.totalDesignVolume.toLocaleString(),
        s.totalOutdoorAirVolume?.toLocaleString() || "-",
      ];
      
      if (isMetric) {
        baseRow.push(Math.round(convertToCfm(s.totalDesignVolume)).toLocaleString());
      }
      
      baseRow.push(
        s.diversifiedTotal?.toLocaleString() || "-",
        s.calculationNote,
        variance > 5 ? "DISCREPANCY" : "PASSED"
      );
      
      return baseRow;
    }),
    theme: 'grid',
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], font: 'helvetica' },
    styles: { fontSize: 8, font: 'helvetica' }
  });

  // 3. TAB Specs & Logistics
  doc.text("3. TAB Specifications & Logistics", 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    body: [
      ["Tolerances", data.tabSpecs.tolerances || "-"],
      ["Certifications", data.tabSpecs.certifications || "-"],
      ["Section Ref", data.tabSpecs.sectionRef || "-"],
      ["Instrumentation", data.tabSpecs.instrumentation?.join(", ") || "-"],
      ["Fire Damper Testing", data.tabSpecs.fireDamperDropTesting ? `REQUIRED (${data.tabSpecs.fireDamperCount || 0} units)` : "NOT SPECIFIED"],
      ["Fire Damper Locations", data.tabSpecs.fireDamperLocations?.join("; ") || "-"],
      ["Sound Readings", data.tabSpecs.soundReadingsRequired ? "REQUIRED" : "NOT SPECIFIED"],
      ["Sound Audit Areas", data.tabSpecs.soundReadingLocations?.join("; ") || "-"],
      ["Tools Required", data.logistics?.toolsRequired?.join(", ") || "None"],
      ["Critical Paths (SP > 0.5\")", data.logistics?.criticalPaths?.join(", ") || "None"],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [250, 250, 250], textColor: [80, 80, 80], cellWidth: 40 } }
  });

  // 4. Equipment Schedule
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("4. Equipment Schedule & Math Audit", 14, 20);
  
  const equipHead = isMetric
    ? [['Tag', 'Type', `Total (${unitLabel})`, `O.A. (${unitLabel})`, 'Equiv. CFM', 'Static']]
    : [['Tag', 'Type', `Total (${unitLabel})`, `O.A. (${unitLabel})`, 'Static']];

  autoTable(doc, {
    startY: 25,
    head: equipHead,
    body: (data.equipmentSchedules?.units || []).map(u => {
      const row = [u.tag, u.type, (u.designCfm || 0).toLocaleString(), (u.outdoorAirCfm || 0).toLocaleString()];
      if (isMetric) {
        row.push(Math.round(convertToCfm(u.designCfm || 0)).toLocaleString());
      }
      row.push(u.staticPressure || "-");
      if (u.visualJustification) {
        row[0] = `${u.tag}\n(REF: ${u.visualJustification})`;
      }
      return row;
    }) || [],
    theme: 'striped',
    headStyles: { fillColor: [20, 20, 20], font: 'helvetica' },
    styles: { fontSize: 8, font: 'helvetica' }
  });

  doc.setFont("helvetica", "bold");
  doc.text("System Summation Audit", 14, (doc as any).lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    body: [
      [`Main Unit Discharge ${unitLabel}`, (data.equipmentSchedules?.vavSummation?.mainUnitCfm || 0).toLocaleString()],
      [`Sum of Terminal Units (${unitLabel})`, (data.equipmentSchedules?.vavSummation?.totalVavCfm || 0).toLocaleString()],
      [`Calculated Discrepancy (${unitLabel})`, (data.equipmentSchedules?.vavSummation?.discrepancy || 0).toLocaleString()],
      ["Math Summation string", data.equipmentSchedules?.vavSummation?.mathString || "-"],
      ["Audit Logic Note", data.equipmentSchedules?.vavSummation?.mathNote || "No anomalies detected in branch summation."],
    ],
    theme: 'grid',
    styles: { fontSize: 9, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [250, 250, 250], textColor: [80, 80, 80], cellWidth: 50 } }
  });

  // 5. Shop Drawings
  doc.text("5. Shop Drawings / Submittals", 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    body: [
      ["Design Match", data.shopDrawings?.confirmsDesign ? "YES" : "NO"],
      ["Cross-Ref", data.shopDrawings?.crossRefDetails || "-"],
      ["Inlet Sizes", data.shopDrawings?.inletSizeNotes?.join("; ") || "-"],
      ["Constraints", data.shopDrawings?.physicalConstraints?.join("; ") || "-"],
    ],
    theme: 'grid',
    headStyles: { fillColor: [20, 20, 20], font: 'helvetica' },
    styles: { fontSize: 9, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 80, 80] } }
  });

  // 6. Diversity Audit
  if (data.diversityAudit) {
    doc.text("6. Diversity Audit", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      body: [
        ["Outlet Peak Sum", `${data.diversityAudit.totalOutletPeak.toLocaleString()} ${unitLabel}`],
        ["Unit Rated Capacity", `${data.diversityAudit.unitCapacity.toLocaleString()} ${unitLabel}`],
        ["Diversity Ratio", `${(data.diversityAudit.ratio * 100).toFixed(1)}%`],
        ["Audit Status", data.diversityAudit.isFlagged ? "FLAGGED: Potential Overload" : "COMPLIANT"],
        ["Diversity Notes", data.diversityAudit.diversityNote || "Standard diversity applied."],
      ],
      theme: 'grid',
      styles: { fontSize: 9, font: 'helvetica' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: [80, 80, 80] } }
    });
  }

  // 7. Pressure Path & Bottlenecks
  if (data.pressurePath) {
    doc.text("7. Pressure Path Analysis", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      body: [
        ["External Static (ESP)", data.pressurePath.espRating || "-"],
        ["Bottleneck Risk", data.pressurePath.bottleneckRisk || "-"],
        ["Complexity Notes", data.pressurePath.complexityNotes?.join("; ") || "Standard duct routing."],
      ],
      theme: 'grid',
      styles: { fontSize: 9, font: 'helvetica' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: [80, 80, 80] } }
    });
  }

  // 8. Hardware Index
  if (data.hardwareIndex) {
    doc.text("8. Hardware & Traverse Index", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      body: [
        ["MVD Presence", data.hardwareIndex.mvdStatus || "-"],
        ["Traverse Locations", data.hardwareIndex.traversePoints?.join(", ") || "Main Duct Only"],
        ["Hardware Notes", data.hardwareIndex.hardwareNotes || "-"],
      ],
      theme: 'grid',
      styles: { fontSize: 9, font: 'helvetica' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: [80, 80, 80] } }
    });
  }

  // 9. Field Strategy
  const strategyY = (doc as any).lastAutoTable.finalY + 15;
  doc.text("9. Field Strategy", 14, strategyY);
  autoTable(doc, {
    startY: strategyY + 3,
    body: [
      ["Plenum Return", data.fieldStrategy?.plenumReturnIdentified ? "YES" : "NO"],
      ["First-Hour Strategy", data.fieldStrategy?.firstHourStrategy || "-"],
      ["Sequence", data.fieldStrategy?.balancingSequences?.join(" > ") || "-"],
      ["Strategy Notes", data.fieldStrategy?.strategyNotes || "-"],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] } }
  });

  if (data.fieldStrategy?.checklists?.length > 0) {
    data.fieldStrategy.checklists.forEach((list) => {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 5,
        head: [[list.title, 'Status']],
        body: list.tasks.map(t => [t.description, t.isCompleted ? "[X] DONE" : "[ ] PENDING"]),
        theme: 'striped',
        headStyles: { fillColor: [35, 135, 166], textColor: [255, 255, 255], font: 'helvetica' },
        styles: { fontSize: 8, font: 'helvetica' },
        columnStyles: { 1: { cellWidth: 30, fontStyle: 'bold' } }
      });
    });
  }

  // 10. Field Data Sheets (Terminal Outlet Sheets)
  const unitsWithOutlets = (data.equipmentSchedules?.units || []).filter(u => u.outlets && u.outlets.length > 0);
  
  if (unitsWithOutlets.length > 0) {
    unitsWithOutlets.forEach((unit) => {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(20, 20, 20);
      doc.text(`System Field Sheet: ${unit.tag}`, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Unit Discharge Total: ${unit.designCfm.toLocaleString()} ${unitLabel}`, 14, 28);
      
      const outletRows = (unit.outlets || []).map(o => [
        o.visualJustification ? `${o.outletNumber}${o.quantity && o.quantity > 1 ? ` (${o.quantity}x)` : ''}\n(REF: ${o.visualJustification})` : `${o.outletNumber}${o.quantity && o.quantity > 1 ? ` (${o.quantity}x)` : ''}`,
        o.registerType || "-",
        o.manufacturer || "-",
        o.ductSize || "-",
        (o.designVolume * (o.quantity || 1)).toLocaleString(),
        "                " // Space for manual entry
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Outlet #', 'Type', 'Manufacturer', 'Duct Size', `Design (${unitLabel})`, 'Field Reading']],
        body: outletRows,
        theme: 'grid',
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], font: 'helvetica' },
        styles: { fontSize: 9, font: 'helvetica' },
        columnStyles: { 5: { cellWidth: 40, fillColor: [250, 250, 250] } }
      });

      const totalOutlets = unit.outlets?.reduce((acc, o) => acc + (o.designVolume * (o.quantity || 1)), 0) || 0;
      const variance = unit.designCfm > 0 ? Math.abs(((totalOutlets - unit.designCfm) / unit.designCfm) * 100) : 0;

      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Outlet Design: ${totalOutlets.toLocaleString()} ${unitLabel}`, 14, (doc as any).lastAutoTable.finalY + 10);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Math: Σ ${unit.outletMathString || "N/A"}`, 14, (doc as any).lastAutoTable.finalY + 15);
      doc.text(`Variance: ${variance.toFixed(1)}%`, 14, (doc as any).lastAutoTable.finalY + 20);
      
      if (variance > 5) {
        doc.setTextColor(220, 38, 38);
        doc.text("FLAGGED: Design Discrepancy > 5%", 14, (doc as any).lastAutoTable.finalY + 25);
        doc.setTextColor(0, 0, 0);
      }
    });
  }

  // 11. Design Reconciliation & Audit Evidence
  if (data.designReconciliation) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("11. Design Reconciliation & Audit Evidence", 14, 20);

    autoTable(doc, {
      startY: 25,
      body: [
        ["Schedule Design Total", `${data.designReconciliation.scheduleDesignVolume.toLocaleString()} ${unitLabel}`],
        ["Outlet Summation Total", `${data.designReconciliation.outletSumVolume.toLocaleString()} ${unitLabel}`],
        ["Reconciled Volume", `${data.designReconciliation.reconciledVolume.toLocaleString()} ${unitLabel}`],
        ["Audit Status", data.designReconciliation.status],
        ["Discrepancies", data.designReconciliation.discrepancies.join("; ") || "None"],
        ["Visual Justification (REF)", data.designReconciliation.visualJustification || "No landmark cited"]
      ],
      theme: 'grid',
      styles: { fontSize: 9, font: 'helvetica' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] } }
    });
  }

  doc.save(`TAB_Audit_${data.projectIdentity.projectName?.replace(/\s+/g, '_') || 'Project'}.pdf`);
}
