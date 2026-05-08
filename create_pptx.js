const fs = require('fs');
const path = require('path');

// Create shapes data
const shapes = [
  // Row 1 - Main flow
  { x: 0.3, y: 1.2, w: 0.8, h: 0.6, text: "Customer", color: "F0F0F0" },
  { x: 1.3, y: 1.2, w: 1.0, h: 0.6, text: "Website", color: "E3F2FD" },
  { x: 2.5, y: 1.2, w: 1.1, h: 0.6, text: "Session", color: "E3F2FD" },
  { x: 3.8, y: 1.2, w: 1.1, h: 0.6, text: "Seat Selection", color: "E3F2FD" },
  { x: 5.1, y: 1.2, w: 1.1, h: 0.6, text: "Booking Entry", color: "FFF3E0" },
  // Row 2 - Forms & Payment
  { x: 5.1, y: 2.1, w: 1.1, h: 0.6, text: "Insurance Form", color: "FFF3E0" },
  { x: 3.8, y: 2.1, w: 1.1, h: 0.6, text: "Payment Notification", color: "FFF3E0" },
  // Row 3 - Decision
  { x: 2.5, y: 2.9, w: 1.3, h: 0.8, text: "Admin Approval\n(Backoffice)", color: "FCE4EC" },
  // Row 4 - Outcomes
  { x: 0.8, y: 4.0, w: 1.2, h: 0.7, text: "Final Booking\nConfirmed", color: "E8F5E9" },
  { x: 2.5, y: 4.0, w: 1.3, h: 0.7, text: "Rejected / Refund", color: "FFEBEE" },
  // Row 5 - Notification
  { x: 1.1, y: 5.1, w: 0.8, h: 0.6, text: "Email / SMS", color: "F0F0F0" },
];

// Create HTML visualization
let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Ticket Booking Workflow System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 40px;
      font-size: 28px;
    }
    .workflow {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    .box {
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #1c1c1c;
      text-align: center;
      font-weight: bold;
      min-width: 110px;
      font-size: 13px;
      transition: transform 0.2s;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .box:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }
    .flow-chart {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .flow-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
    }
    .flow-text {
      color: #666;
      line-height: 1.6;
      font-size: 13px;
    }
    .legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .legend-item {
      padding: 10px;
      background: white;
      border-left: 4px solid #667eea;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎫 Project Ticket Booking Workflow System</h1>

    <div class="workflow">`;

shapes.forEach(shape => {
  html += `<div class="box" style="background-color: #${shape.color}">${shape.text}</div>`;
});

html += `
    </div>

    <div class="flow-chart">
      <div class="flow-title">📊 Workflow Process:</div>
      <div class="flow-text">
        <strong>Main Flow:</strong><br>
        Customer → Website → Booking Session → Seat Selection → Booking Entry → Insurance Form → Payment Notification → Admin Approval<br>
        <br>
        <strong>Decision Point (Admin Approval):</strong><br>
        ✓ Approved → Final Booking Confirmation → Send Email/SMS<br>
        ✗ Rejected → Refund Processing<br>
      </div>

      <div class="legend">
        <div class="legend-item">
          <strong style="color: #1976D2;">🔵 Blue Boxes</strong><br>
          Customer-facing steps (Website, Session, Seat Selection)
        </div>
        <div class="legend-item">
          <strong style="color: #F57C00;">🟠 Orange Boxes</strong><br>
          Booking details & payments
        </div>
        <div class="legend-item">
          <strong style="color: #C2185B;">🔴 Pink Diamond</strong><br>
          Admin review & approval point
        </div>
        <div class="legend-item">
          <strong style="color: #388E3C;">🟢 Green Boxes</strong><br>
          Successful booking confirmation
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync("D:\\project_ticket\\booking_workflow.html", html);
console.log("✅ Created: booking_workflow.html");

// Try to create a basic ODP (OpenDocument Presentation) or direct XML-based PPTX
// For now, the HTML version is the most compatible
console.log("📄 You can open the HTML file in any browser or convert it to PDF/PPTX using your browser's print function");
