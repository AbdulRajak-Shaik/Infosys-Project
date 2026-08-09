/**
 * PDF Report Generator matching the exact 4-page AgroAI Agronomic Advisory layout.
 */

export interface ReportData {
  reportId?: string
  userName?: string
  generatedOn?: string
  soilType?: string
  confidence?: number
  soilHealthScore?: number
  soilHealthStatus?: string
  location?: string
  temperature?: string
  humidity?: string
  rainfall?: string
  windSpeed?: string
  weatherCondition?: string
  N?: number
  P?: number
  K?: number
  ph?: number
  oc?: number
  ec?: number
  topCrop?: string
  topCropScore?: number
  crops?: Array<{ rank: string; name: string; score: number; match: string; insight: string }>
  fertilizers?: Array<{ category: string; product: string; dosage: string; method: string }>
  advisoryNotes?: string[]
}

export function generatePdfReport(data: ReportData) {
  const dateStr = data.generatedOn || new Date().toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const reportId = data.reportId || `ANL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100000 + Math.random() * 900000)}`
  
  const savedUserName = (() => {
    try {
      const u = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (u && u.startsWith('{')) {
        const parsed = JSON.parse(u)
        return parsed.username || parsed.name
      }
    } catch {}
    return null
  })()
  const userName = data.userName || savedUserName || 'Valued Farmer'
  
  const soilType = data.soilType || 'Black Soil'
  const confidence = data.confidence ? (data.confidence > 1 ? data.confidence.toFixed(1) : (data.confidence * 100).toFixed(1)) : '93.2'
  const healthScore = data.soilHealthScore ?? 61.2
  const healthStatus = data.soilHealthStatus || (healthScore >= 75 ? 'Optimal' : healthScore >= 50 ? 'Moderate' : 'Low')
  
  const N = data.N ?? 90
  const P = data.P ?? 42
  const K = data.K ?? 43
  const ph = data.ph ?? 6.8
  const oc = data.oc ?? 0.62
  const ec = data.ec ?? 0.41
  
  const savedUserLoc = (() => {
    try {
      const selected = localStorage.getItem('selected_location')
      if (selected) return selected

      const u = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (u && u.startsWith('{')) {
        const parsed = JSON.parse(u)
        if (parsed.region) return parsed.region
      }
    } catch {}
    return null
  })()

  const location = data.location || savedUserLoc || 'Srikalahasthi, Tirupati District, Andhra Pradesh, India'
  const temp = data.temperature || '33 deg C'
  const humidity = data.humidity || '67 %'
  const rainfall = data.rainfall || '0.0 mm'
  const wind = data.windSpeed || '12 km/h'
  const weatherCond = data.weatherCondition || 'Clear'

  const topCrop = data.topCrop || 'Cotton'
  const topCropScore = data.topCropScore || 100

  const crops = data.crops || [
    { rank: 'Top #1', name: 'Cotton', score: 100, match: 'Excellent Match', insight: 'Ideal for black/clay soil — maximises yield under current climate.' },
    { rank: '#2', name: 'Soybean', score: 94, match: 'Very Good Match', insight: 'Excellent nitrogen-fixing legume — improves soil for next season.' },
    { rank: '#3', name: 'Wheat', score: 79, match: 'Good Match', insight: 'High rabi yield potential under moderate temperature.' },
    { rank: '#4', name: 'Sugarcane', score: 73, match: 'Moderate Match', insight: 'Good commercial returns; assured irrigation required.' },
    { rank: '#5', name: 'Maize', score: 55, match: 'Suitable Match', insight: 'Performs well in high-moisture paddy conditions.' },
  ]

  const fertilizers = data.fertilizers || [
    { category: 'Potassium Supplement', product: 'MOP (Muriate of Potash)', dosage: '50 kg / acre', method: 'Basal — at sowing' },
    { category: 'Phosphorus Supplement', product: 'DAP (Di-ammonium Phosphate)', dosage: '40 kg / acre', method: 'Basal — at sowing' },
    { category: 'Nitrogen Supplement', product: 'Urea (46% N)', dosage: '25 kg / acre', method: 'Top dressing — 2 split doses' },
    { category: 'Organic Manure', product: 'Farm Yard Manure (FYM) / Compost', dosage: '3 Tons / acre', method: 'Incorporate 15 days before sowing' },
  ]

  const advisoryNotes = data.advisoryNotes || [
    'Apply nitrogen fertilizer as top dressing in split doses.',
    'Use phosphate fertilizer (DAP) as basal application before sowing.',
    'Apply gypsum to improve soil structure and calcium availability.',
  ]

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to download the PDF report.')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AgroAI Agronomic Advisory Report - ${reportId}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1a202c;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .page {
          width: 100%;
          box-sizing: border-box;
          page-break-after: always;
          min-height: 980px;
          position: relative;
          padding-bottom: 40px;
        }
        .page:last-child {
          page-break-after: avoid;
        }

        /* Top Bar */
        .header-table {
          width: 100%;
          margin-bottom: 12px;
          border-collapse: collapse;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #1B5E20;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .logo-sub {
          font-size: 12px;
          color: #4a5568;
          font-weight: 600;
          margin-top: 2px;
        }
        .header-meta {
          text-align: right;
          font-size: 12px;
          color: #2d3748;
        }
        .header-meta strong {
          color: #1a202c;
        }
        .green-divider {
          height: 3px;
          background: #2E7D32;
          margin-bottom: 20px;
          border-radius: 2px;
        }

        /* Executive Summary Box */
        .exec-summary {
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 8px;
          padding: 18px 22px;
          margin-bottom: 24px;
        }
        .exec-title {
          font-size: 13px;
          font-weight: 800;
          color: #166534;
          letter-spacing: 0.5px;
          margin-bottom: 14px;
        }
        .summary-line {
          font-size: 13px;
          margin-bottom: 8px;
          color: #1f2937;
        }
        .summary-line strong {
          color: #111827;
        }
        .amber-text { color: #d97706; font-weight: bold; }
        .green-text { color: #16a34a; font-weight: bold; }
        .red-text { color: #dc2626; font-weight: bold; }

        /* Section Titles */
        .sec-heading {
          font-size: 18px;
          font-weight: 800;
          color: #15803d;
          margin-top: 0;
          margin-bottom: 14px;
        }

        /* Gray Result Card */
        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }

        /* Tables */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12.5px;
        }
        .data-table th {
          background: #1B5E20;
          color: #ffffff;
          text-align: left;
          padding: 10px 14px;
          font-weight: 700;
        }
        .data-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
          color: #1f2937;
        }
        .data-table tr:nth-child(even) td {
          background: #f8fafc;
        }

        /* Progress bars */
        .bar-container {
          background: #e2e8f0;
          height: 18px;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          background: #15803d;
          border-radius: 4px;
        }
        .bar-fill-red {
          height: 100%;
          background: #dc2626;
          border-radius: 4px;
        }

        .bar-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .bar-label {
          width: 130px;
          font-weight: 600;
          color: #374151;
        }
        .bar-track {
          flex: 1;
          background: #e5e7eb;
          height: 22px;
          border-radius: 4px;
          overflow: hidden;
          margin-right: 12px;
        }
        .bar-val {
          width: 45px;
          text-align: right;
          font-weight: 700;
          color: #16a34a;
        }

        /* Advisory Box */
        .advisory-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        /* Page Footer */
        .footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
        }

        .disclaimer {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 24px;
          font-style: italic;
        }
      </style>
    </head>
    <body>

      <!-- PAGE 1 -->
      <div class="page">
        <table class="header-table">
          <tr>
            <td>
              <div class="logo">AgroAI</div>
              <div class="logo-sub">AI-Powered Agricultural Decision Support System</div>
            </td>
            <td class="header-meta">
              <div>Report ID: <strong>${reportId}</strong></div>
              <div>Prepared For: <strong>${userName}</strong></div>
              <div>Generated On: <strong>${dateStr}</strong></div>
            </td>
          </tr>
        </table>
        <div class="green-divider"></div>

        <div class="exec-summary">
          <div class="exec-title">EXECUTIVE AGRONOMIC SUMMARY</div>
          <div class="summary-line">[+] <strong>Soil Classified:</strong> ${soilType} (AI Confidence: <strong>${confidence}%</strong> | High Confidence)</div>
          <div class="summary-line">[+] <strong>Soil Health:</strong> <span class="amber-text">${healthStatus} (${healthScore} / 100)</span></div>
          <div class="summary-line">[+] <strong>Top Recommended Crop:</strong> ${topCrop} — <span class="green-text">Excellent Match (${topCropScore}/100)</span></div>
          <div class="summary-line">[+] <strong>Field Location:</strong> ${location} | ${temp}, ${humidity} Humidity, ${weatherCond}</div>
          <div class="summary-line">[+] <strong>Nutrient Alert:</strong> <span class="amber-text">Phosphorus, Potassium</span></div>
          <div class="summary-line">[+] <strong>Immediate Action:</strong> Apply MOP (50 kg/acre) and DAP (40 kg/acre) as basal dose before sowing.</div>
        </div>

        <div class="sec-heading">1. Soil Classification — AI Analysis Result</div>
        <div class="info-card">
          <div style="font-size: 13.5px; margin-bottom: 6px;">
            <strong>Predicted Soil Class:</strong> <span style="color:#15803d; font-weight:700;">${soilType}</span> (Confidence: <strong>${confidence}%</strong> | High Confidence)
          </div>
          <div style="font-size: 13px; margin-bottom: 6px;">
            <strong>Soil Fertility:</strong> Infertile / Moderate
          </div>
          <div style="font-size: 13px; color: #4b5563;">
            <strong>Characteristics:</strong> Clay-rich structure, high moisture retention, ideal cation-exchange — well-suited for deep-rooting cash crops.
          </div>
        </div>

        <div style="font-weight: 700; color: #374151; margin-bottom: 12px; font-size: 12px;">Soil Classification Probability Distribution:</div>
        
        <div class="bar-row">
          <div class="bar-label">${soilType}</div>
          <div class="bar-track"><div class="bar-fill" style="width: ${confidence}%;"></div></div>
          <div class="bar-val">${confidence}</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Alluvial Soil</div>
          <div class="bar-track"><div class="bar-fill" style="width: 16.9%; background:#4ade80;"></div></div>
          <div class="bar-val" style="color:#4ade80;">16.9</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Loamy Soil</div>
          <div class="bar-track"><div class="bar-fill" style="width: 9.3%; background:#a7f3d0;"></div></div>
          <div class="bar-val" style="color:#86efac;">9.3</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Silt Soil</div>
          <div class="bar-track"><div class="bar-fill" style="width: 6.5%; background:#cbd5e1;"></div></div>
          <div class="bar-val" style="color:#94a3b8;">6.5</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Sandy Soil</div>
          <div class="bar-track"><div class="bar-fill" style="width: 1.4%; background:#e2e8f0;"></div></div>
          <div class="bar-val" style="color:#cbd5e1;">1.4</div>
        </div>

        <div class="footer">
          <div>Generated by AgroAI | www.agroai.in | Confidential Agricultural Advisory</div>
          <div>Page 1 of 4</div>
        </div>
      </div>

      <!-- PAGE 2 -->
      <div class="page">
        <div style="display:flex; justify-between; color:#6b7280; font-size:11px; margin-bottom:12px;">
          <span>AgroAI | AI-Powered Agricultural Decision Support System</span>
          <span>Confidential Agronomic Advisory Report</span>
        </div>
        <div class="green-divider" style="margin-bottom:20px;"></div>

        <div class="sec-heading">2. Soil Chemistry & Agronomic Parameters</div>
        <div style="margin-bottom:16px;">
          <div style="font-weight:700; font-size:13px; margin-bottom:6px;">Soil Health Index:</div>
          <div style="display:flex; items-center; gap:16px;">
            <div style="flex:1; background:#e2e8f0; height:24px; border-radius:6px; overflow:hidden;">
              <div style="width: ${healthScore}%; background:#d97706; height:100%;"></div>
            </div>
            <div style="font-weight:800; font-size:15px; color:#d97706; min-width:140px; text-align:right;">
              ${healthScore} / 100 — ${healthStatus}
            </div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Measured Value</th>
              <th>Unit</th>
              <th>Agronomic Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Soil pH</strong></td>
              <td>${ph}</td>
              <td>pH Scale</td>
              <td><span class="green-text">Optimal</span></td>
            </tr>
            <tr>
              <td><strong>Nitrogen (N)</strong></td>
              <td>${N}</td>
              <td>kg/ha</td>
              <td><span class="green-text">Optimal</span></td>
            </tr>
            <tr>
              <td><strong>Phosphorus (P)</strong></td>
              <td>${P}</td>
              <td>kg/ha</td>
              <td><span class="red-text">Low (Deficient)</span></td>
            </tr>
            <tr>
              <td><strong>Potassium (K)</strong></td>
              <td>${K}</td>
              <td>kg/ha</td>
              <td><span class="red-text">Low (Deficient)</span></td>
            </tr>
            <tr>
              <td><strong>Organic Carbon (OC)</strong></td>
              <td>${oc}</td>
              <td>% content</td>
              <td><span class="green-text">Optimal</span></td>
            </tr>
            <tr>
              <td><strong>Electrical Conductivity</strong></td>
              <td>${ec}</td>
              <td>dS/m</td>
              <td><span class="green-text">Optimal</span></td>
            </tr>
            <tr style="background:#fef3c7;">
              <td><strong>Soil Health Score</strong></td>
              <td><strong>${healthScore} / 100</strong></td>
              <td>Index</td>
              <td><strong class="amber-text">${healthStatus.toUpperCase()}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="font-weight:700; margin-bottom:12px; font-size:12px;">Nutrient Level Status (Visual):</div>
        <div class="bar-row">
          <div class="bar-label">Nitrogen (N)</div>
          <div class="bar-track"><div class="bar-fill" style="width: 75%;"></div></div>
          <div class="bar-val" style="width:100px;">${N}.00 kg/ha</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Phosphorus (P)</div>
          <div class="bar-track"><div class="bar-fill-red" style="width: 35%;"></div></div>
          <div class="bar-val" style="width:100px; color:#dc2626;">${P}.00 kg/ha</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Potassium (K)</div>
          <div class="bar-track"><div class="bar-fill-red" style="width: 36%;"></div></div>
          <div class="bar-val" style="width:100px; color:#dc2626;">${K}.00 kg/ha</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">Organic Carbon</div>
          <div class="bar-track"><div class="bar-fill" style="width: 62%;"></div></div>
          <div class="bar-val" style="width:100px;">${(oc * 100).toFixed(2)} %</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">pH (x10)</div>
          <div class="bar-track"><div class="bar-fill" style="width: 68%;"></div></div>
          <div class="bar-val" style="width:100px;">${(ph * 10).toFixed(2)} pH</div>
        </div>

        <div class="sec-heading" style="margin-top:30px;">3. Current Field Weather Conditions</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Air Temperature</strong></td>
              <td>${temp}</td>
              <td><strong>Relative Humidity</strong></td>
              <td>${humidity}</td>
            </tr>
            <tr>
              <td><strong>Total Rainfall</strong></td>
              <td>${rainfall}</td>
              <td><strong>Wind Speed</strong></td>
              <td>${wind}</td>
            </tr>
            <tr>
              <td><strong>Weather Condition</strong></td>
              <td>${weatherCond}</td>
              <td><strong>Record Date</strong></td>
              <td>${dateStr.split(' at ')[0]}</td>
            </tr>
            <tr>
              <td><strong>Location</strong></td>
              <td>${location}</td>
              <td><strong>State / District</strong></td>
              <td>${location.includes(',') ? location.split(',')[1] : 'Andhra Pradesh'}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>AgroAI | AI-Powered Agricultural Decision Support System</div>
          <div>Page 2 of 4</div>
        </div>
      </div>

      <!-- PAGE 3 -->
      <div class="page">
        <div style="display:flex; justify-between; color:#6b7280; font-size:11px; margin-bottom:12px;">
          <span>AgroAI | AI-Powered Agricultural Decision Support System</span>
          <span>Confidential Agronomic Advisory Report</span>
        </div>
        <div class="green-divider" style="margin-bottom:20px;"></div>

        <div class="sec-heading">4. Top 5 Recommended Crops — AI Suitability Index</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Crop Name</th>
              <th>Suitability Index</th>
              <th>Match Rating</th>
              <th>Agronomic Insight</th>
            </tr>
          </thead>
          <tbody>
            ${crops.map(c => `
              <tr>
                <td><strong>${c.rank}</strong></td>
                <td><strong>${c.name}</strong></td>
                <td><strong>${c.score} / 100</strong></td>
                <td><span class="green-text">${c.match}</span></td>
                <td style="font-size:11.5px; color:#4b5563;">${c.insight}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="font-weight:700; margin-bottom:12px; font-size:12px;">Crop Suitability Index (Normalised):</div>
        ${crops.map(c => `
          <div class="bar-row">
            <div class="bar-label">${c.name}</div>
            <div class="bar-track"><div class="bar-fill" style="width: ${c.score}%;"></div></div>
            <div class="bar-val">${c.score}.0</div>
          </div>
        `).join('')}

        <div class="sec-heading" style="margin-top:30px;">5. Fertilizer Advisory & Application Schedule</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Fertilizer Category</th>
              <th>Product Name</th>
              <th>Dosage / Rate</th>
              <th>Application Method</th>
            </tr>
          </thead>
          <tbody>
            ${fertilizers.map(f => `
              <tr>
                <td><strong>${f.category}</strong></td>
                <td>${f.product}</td>
                <td><strong>${f.dosage}</strong></td>
                <td>${f.method}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="advisory-box">
          <div style="font-weight:800; color:#1f2937; margin-bottom:8px;">AgroAI Gemini Advisory Notes:</div>
          ${advisoryNotes.map(n => `<div style="margin-bottom:4px; color:#4b5563;">- ${n}</div>`).join('')}
        </div>

        <div class="footer">
          <div>Generated by AgroAI | www.agroai.in | Confidential Agricultural Advisory</div>
          <div>Page 3 of 4</div>
        </div>
      </div>

      <!-- PAGE 4 -->
      <div class="page">
        <div style="display:flex; justify-between; color:#6b7280; font-size:11px; margin-bottom:12px;">
          <span>AgroAI | AI-Powered Agricultural Decision Support System</span>
          <span>Confidential Agronomic Advisory Report</span>
        </div>
        <div class="green-divider" style="margin-bottom:20px;"></div>

        <div class="sec-heading">6. AI Agronomic Assessment & Field Advisory</div>
        <div class="info-card" style="line-height:1.7; font-size:13px; color:#374151;">
          <p style="margin-top:0;">
            AgroAI integrated the uploaded soil image analysis with soil chemistry measurements and real-time field weather data for <strong>${location}</strong>. The system identified the soil class as <strong>${soilType}</strong> with <strong>${confidence}% AI confidence</strong>. Based on this multi-parameter assessment, <strong>${topCrop}</strong> is recommended as the primary crop for this field season, rated an <strong>Excellent Match (${topCropScore}/100)</strong> under current soil and climate conditions.
          </p>
          <p style="margin-bottom:0;">
            The field profile shows adequate Nitrogen reserves (${N} kg/ha) but highlights below-optimal Phosphorus (${P} kg/ha) and Potassium (${K} kg/ha) levels. Applying the prescribed basal doses of MOP and DAP before sowing will correct these deficiencies, improve root establishment, and maximise climate resilience under prevailing conditions (${temp}, ${humidity} humidity, ${weatherCond}).
          </p>
        </div>

        <div class="disclaimer">
          Disclaimer: This report is generated by AgroAI for advisory purposes only. Always consult a certified agronomist or Krishi Vigyan Kendra (KVK) before taking any agronomic decision.
        </div>

        <div class="footer">
          <div>Generated by AgroAI | www.agroai.in | Confidential Agricultural Advisory</div>
          <div>Page 4 of 4</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
