// ══════════════════════════════════════════════════════════════════
//  E-Max AI — Google Apps Script
//  Paste this into: Google Sheet → Extensions → Apps Script
//  Then: Deploy → New Deployment → Web App → Execute as ME → Anyone
//  Copy the Web App URL and paste into the PWA's SHEET_WEBHOOK_URL
// ══════════════════════════════════════════════════════════════════

const SHEET_NAME = "Beta Data";
const ADMIN_EMAIL = "1angshuman.biswas@gmail.com"; // Change to your email

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create sheet if it doesn't exist
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Write header row
      sheet.appendRow([
        // Identity
        "Tester ID", "City", "Fill #",
        // Vehicle
        "Car Make", "Car Model", "Year", "Reg No", "Engine Type",
        // User inputs per fill
        "Odometer (KM)", "Litres Filled", "Amount Paid (₹)",
        "Full Tank", "Fuel Station", "Season",
        // App calculated
        "KM Travelled", "KM/L", "% Drop vs Baseline",
        "Cost/KM (₹)", "Efficiency Score",
        // Baseline
        "Baseline Status", "Baseline KM/L",
        // AI generated
        "Alert Level", "AI Verdict", "Anomaly Flag", "Coaching Tip",
        // Meta
        "Timestamp", "App Version"
      ]);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 27);
      headerRange.setBackground("#1a1a2e");
      headerRange.setFontColor("#00d4aa");
      headerRange.setFontWeight("bold");
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);

      // Set column widths
      sheet.setColumnWidth(1, 90);   // Tester ID
      sheet.setColumnWidth(2, 110);  // City
      sheet.setColumnWidth(22, 80);  // Alert Level
      sheet.setColumnWidth(23, 300); // AI Verdict
      sheet.setColumnWidth(24, 120); // Anomaly Flag
      sheet.setColumnWidth(25, 300); // Coaching Tip
    }

    const ai = data.ai || {};
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "Asia/Kolkata", "dd-MMM-yyyy HH:mm:ss");

    // Append data row
    sheet.appendRow([
      data.testerID || "",
      data.city || "",
      data.fillCount || "",
      data.carMake || "",
      data.carModel || "",
      data.carYear || "",
      data.regNo || "",
      data.engineType || "",
      data.odometerNow || "",
      data.litresFilled || "",
      data.amountPaid || "",
      data.fullTank ? "YES" : "NO",
      data.fuelStation || "",
      data.season || "",
      data.kmTravelled ? data.kmTravelled.toFixed(1) : "",
      data.kml ? data.kml.toFixed(2) : "",
      data.dropPercent ? data.dropPercent.toFixed(1) + "%" : "",
      data.costPerKm ? "₹" + data.costPerKm.toFixed(2) : "",
      data.efficiencyScore || "",
      data.baselineStatus || "CALIBRATING",
      data.baselineKml ? data.baselineKml.toFixed(2) : "—",
      ai.alertLevel || "—",
      ai.verdict || "—",
      ai.anomalyFlag || "—",
      ai.coachingTip || "—",
      timestamp,
      "1.0.0-beta"
    ]);

    // Colour-code the alert level cell
    const lastRow = sheet.getLastRow();
    const alertCell = sheet.getRange(lastRow, 22);
    const alertLevel = ai.alertLevel || "";
    if (alertLevel === "CRITICAL") alertCell.setBackground("#7f1d1d").setFontColor("#fca5a5");
    else if (alertLevel === "WARNING") alertCell.setBackground("#78350f").setFontColor("#fcd34d");
    else if (alertLevel === "WATCH")   alertCell.setBackground("#1e3a5f").setFontColor("#93c5fd");
    else if (alertLevel === "NORMAL")  alertCell.setBackground("#064e3b").setFontColor("#6ee7b7");
    else if (alertLevel === "INFO")    alertCell.setBackground("#1e232b").setFontColor("#8892a4");

    // Send admin email alert only for CRITICAL anomalies
    if (alertLevel === "CRITICAL") {
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
        subject: `🚨 E-Max AI CRITICAL Alert — ${data.testerID} · ${data.carMake} ${data.carModel}`,
        body: `Tester: ${data.testerID}\nCar: ${data.carYear} ${data.carMake} ${data.carModel}\nCity: ${data.city}\nKM/L: ${data.kml}\nDrop: ${data.dropPercent}%\nVerdict: ${ai.verdict}\nAnomaly: ${ai.anomalyFlag}\nTime: ${timestamp}`
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this manually to verify the sheet setup
function testSetup() {
  doPost({
    postData: {
      contents: JSON.stringify({
        testerID: "EMAX001",
        city: "Bengaluru",
        fillCount: 1,
        carMake: "Maruti",
        carModel: "Swift",
        carYear: "2022",
        regNo: "KA01AB1234",
        engineType: "Petrol",
        odometerNow: 42318,
        litresFilled: 38.5,
        amountPaid: 3850,
        fullTank: true,
        fuelStation: "HP Pump Koramangala",
        season: "Monsoon",
        kmTravelled: 650,
        kml: 16.9,
        dropPercent: 8.6,
        costPerKm: 5.92,
        efficiencyScore: 82,
        baselineStatus: "CALIBRATING",
        baselineKml: null,
        ai: {
          alertLevel: "INFO",
          verdict: "Calibrating your baseline — 1 of 3 fills complete.",
          anomalyFlag: "NONE",
          coachingTip: "Avoid high RPMs in Bengaluru traffic to improve E20 efficiency."
        }
      })
    }
  });
  Logger.log("Test row inserted. Check the Beta Data sheet.");
}
