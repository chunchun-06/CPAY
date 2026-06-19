'use strict';

const PDFDocument = require('pdfkit');
const { formatDate } = require('../helpers/dateHelper');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  navy:        '#0F172A',
  blue:        '#3B82F6',
  blueLight:   '#EFF6FF',
  amber:       '#D97706',
  amberLight:  '#FFFBEB',
  green:       '#16A34A',
  greenLight:  '#DCFCE7',
  red:         '#DC2626',
  redLight:    '#FEE2E2',
  slate100:    '#F1F5F9',
  slate200:    '#E2E8F0',
  slate400:    '#94A3B8',
  slate600:    '#475569',
  slate700:    '#334155',
  slate800:    '#1E293B',
  white:       '#FFFFFF',
};

const PAGE_W   = 595.28;   // A4 width  (pt)
const PAGE_H   = 841.89;   // A4 height (pt)
const MARGIN   = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const inr = (n) => `Rs.${Number(n).toLocaleString('en-IN')}`;

// Draw a filled rectangle helper
const fillRect = (doc, x, y, w, h, color) => {
  doc.save().rect(x, y, w, h).fill(color).restore();
};

// Draw a stroked rectangle helper
const strokeRect = (doc, x, y, w, h, color, lw = 0.5) => {
  doc.save().rect(x, y, w, h).strokeColor(color).lineWidth(lw).stroke().restore();
};

// Horizontal rule helper
const hRule = (doc, y, color = C.slate200, lw = 0.5) => {
  doc.save()
    .moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
    .strokeColor(color).lineWidth(lw).stroke()
    .restore();
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const generateCustomerLedgerPDF = (customer, loan, payments) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
    const chunks = [];

    doc.on('data',  (chunk) => chunks.push(chunk));
    doc.on('end',   ()      => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawPage(doc, customer, loan, payments || []);

    doc.end();
  });
};

// ─── Page Renderer ────────────────────────────────────────────────────────────
function drawPage(doc, customer, loan, payments) {

  // ── 1. HEADER ──────────────────────────────────────────────────────────────
  const HEADER_H = 72;
  fillRect(doc, 0, 0, PAGE_W, HEADER_H, C.navy);

  // Brand mark (small square)
  fillRect(doc, MARGIN, 18, 22, 22, C.blue);
  doc.fillColor(C.white).fontSize(11).font('Helvetica-Bold')
     .text('C', MARGIN + 5, 23, { lineBreak: false });

  // Brand name
  doc.fillColor(C.white).fontSize(16).font('Helvetica-Bold')
     .text('CPAY', MARGIN + 28, 18, { lineBreak: false });

  // Brand sub
  doc.fillColor(C.slate400).fontSize(8).font('Helvetica')
     .text('Private Money Lender', MARGIN + 28, 37, { lineBreak: false });

  // Right: document type + date
  doc.fillColor(C.blue).fontSize(9).font('Helvetica-Bold')
     .text('CUSTOMER LEDGER', 0, 20, { align: 'right', width: PAGE_W - MARGIN, lineBreak: false });

  doc.fillColor(C.slate400).fontSize(8).font('Helvetica')
     .text(`Generated: ${formatDate(new Date())}`, 0, 36, { align: 'right', width: PAGE_W - MARGIN, lineBreak: false });

  // ── Accent strip (3 pt) ────────────────────────────────────────────────────
  // Simulated gradient: blue → purple → teal via two rects
  fillRect(doc, 0,           HEADER_H,     PAGE_W * 0.4, 3, '#3B82F6');
  fillRect(doc, PAGE_W * 0.4, HEADER_H,    PAGE_W * 0.3, 3, '#8B5CF6');
  fillRect(doc, PAGE_W * 0.7, HEADER_H,    PAGE_W * 0.3, 3, '#06B6D4');

  let curY = HEADER_H + 3 + 20; // padding after strip

  // ── 2. INFO GRID (two panels side-by-side) ─────────────────────────────────
  const INFO_H   = 100;
  const PANEL_W  = (CONTENT_W - 1) / 2;  // 1 pt divider
  const LEFT_X   = MARGIN;
  const RIGHT_X  = MARGIN + PANEL_W + 1;

  // Background fill
  fillRect(doc, LEFT_X,  curY, PANEL_W, INFO_H, C.slate100);
  fillRect(doc, RIGHT_X, curY, PANEL_W, INFO_H, C.slate100);

  // Vertical divider
  fillRect(doc, MARGIN + PANEL_W, curY, 1, INFO_H, C.slate200);

  // Outer border
  strokeRect(doc, MARGIN, curY, CONTENT_W, INFO_H, C.slate200);

  // ── Left Panel: Customer ──
  const LP = LEFT_X + 14;
  doc.fillColor(C.slate400).fontSize(7).font('Helvetica-Bold')
     .text('CUSTOMER DETAILS', LP, curY + 10);

  hRule(doc, curY + 21, C.slate200, 0.5);

  const customerRows = [
    ['Full name',     customer.fullName],
    ['Mobile',        customer.mobileNumber],
    ['Address',       customer.address || 'N/A'],
  ];

  let infoY = curY + 28;
  customerRows.forEach(([label, value]) => {
    doc.fillColor(C.slate400).fontSize(8).font('Helvetica').text(label, LP, infoY, { lineBreak: false });
    doc.fillColor(C.slate800).fontSize(8).font('Helvetica-Bold')
       .text(value, LP + 58, infoY, { width: PANEL_W - 70, lineBreak: false });
    infoY += 16;
  });

  // Token pill
  doc.fillColor(C.slate400).fontSize(8).font('Helvetica').text('Token', LP, infoY, { lineBreak: false });
  // Token background
  fillRect(doc, LP + 58, infoY - 2, PANEL_W - 72, 14, C.blueLight);
  doc.fillColor(C.blue).fontSize(7.5).font('Helvetica')
     .text(customer.secureToken, LP + 61, infoY, { lineBreak: false });

  // ── Right Panel: Loan ──
  const RP = RIGHT_X + 14;
  doc.fillColor(C.slate400).fontSize(7).font('Helvetica-Bold')
     .text('LOAN DETAILS', RP, curY + 10);

  hRule(doc, curY + 21, C.slate200, 0.5);

  const statusColor = loan.status === 'active' ? C.green : C.red;
  const statusBg    = loan.status === 'active' ? C.greenLight : C.redLight;

  const loanRows = [
    ['Start date',    formatDate(loan.loanStartDate)],
    ['Due day',       `${loan.monthlyDueDay}${getOrdinal(loan.monthlyDueDay)} of each month`],
    ['Interest rate', `${loan.interestRate}% / month`],
  ];

  infoY = curY + 28;
  loanRows.forEach(([label, value]) => {
    doc.fillColor(C.slate400).fontSize(8).font('Helvetica').text(label, RP, infoY, { lineBreak: false });
    doc.fillColor(C.slate800).fontSize(8).font('Helvetica-Bold')
       .text(value, RP + 62, infoY, { width: PANEL_W - 74, lineBreak: false });
    infoY += 16;
  });

  // Status badge
  doc.fillColor(C.slate400).fontSize(8).font('Helvetica').text('Status', RP, infoY, { lineBreak: false });
  fillRect(doc, RP + 62, infoY - 2, 42, 13, statusBg);
  doc.fillColor(statusColor).fontSize(7).font('Helvetica-Bold')
     .text(loan.status.toUpperCase(), RP + 64, infoY, { lineBreak: false });

  curY += INFO_H + 16;

  // ── 3. METRICS STRIP ───────────────────────────────────────────────────────
  const METRIC_H  = 58;
  const METRIC_W  = (CONTENT_W - 3) / 4;  // 3 × 1pt dividers
  const metrics = [
    { label: 'Loan amount',          value: inr(loan.loanAmount),           sub: 'Original principal',  valueColor: C.slate800 },
    { label: 'Remaining principal',  value: inr(loan.remainingPrincipal),   sub: 'Outstanding balance', valueColor: C.amber    },
    { label: 'Total interest paid',  value: inr(loan.totalInterestPaid),    sub: 'Across all payments', valueColor: C.blue     },
    { label: 'Total principal paid', value: inr(loan.totalPrincipalPaid),   sub: 'Recovered principal', valueColor: C.slate800 },
  ];

  metrics.forEach((m, i) => {
    const mx = MARGIN + i * (METRIC_W + 1);
    fillRect(doc, mx, curY, METRIC_W, METRIC_H, C.white);
    strokeRect(doc, mx, curY, METRIC_W, METRIC_H, C.slate200);

    doc.fillColor(C.slate400).fontSize(7.5).font('Helvetica')
       .text(m.label, mx + 10, curY + 10, { width: METRIC_W - 14, lineBreak: false });

    doc.fillColor(m.valueColor).fontSize(13).font('Helvetica-Bold')
       .text(m.value, mx + 10, curY + 24, { width: METRIC_W - 14, lineBreak: false });

    doc.fillColor(C.slate400).fontSize(7).font('Helvetica')
       .text(m.sub, mx + 10, curY + 41, { width: METRIC_W - 14, lineBreak: false });
  });

  curY += METRIC_H + 20;

  // ── 4. SECTION LABEL ───────────────────────────────────────────────────────
  doc.fillColor(C.slate400).fontSize(7).font('Helvetica-Bold')
     .text('PAYMENT HISTORY', MARGIN, curY, { lineBreak: false });

  const labelTextW = 80;
  doc.save()
     .moveTo(MARGIN + labelTextW + 6, curY + 4)
     .lineTo(PAGE_W - MARGIN, curY + 4)
     .strokeColor(C.slate200).lineWidth(0.5).stroke()
     .restore();

  curY += 14;

  // ── 5. PAYMENT TABLE ───────────────────────────────────────────────────────
  const COL = {
    date:      { x: MARGIN,      w: 68  },
    total:     { x: MARGIN + 68, w: 65  },
    interest:  { x: MARGIN + 133, w: 58 },
    principal: { x: MARGIN + 191, w: 58 },
    remaining: { x: MARGIN + 249, w: 70 },
    remarks:   { x: MARGIN + 319, w: PAGE_W - MARGIN - 319 - MARGIN },
  };

  const TABLE_HEADER_H = 22;

  // Header row background
  fillRect(doc, MARGIN, curY, CONTENT_W, TABLE_HEADER_H, C.navy);

  const headers = [
    { label: 'Date',      col: 'date'      },
    { label: 'Total paid', col: 'total'    },
    { label: 'Interest',  col: 'interest'  },
    { label: 'Principal', col: 'principal' },
    { label: 'Remaining', col: 'remaining' },
    { label: 'Remarks',   col: 'remarks'   },
  ];

  doc.fillColor(C.slate400).fontSize(7.5).font('Helvetica-Bold');
  headers.forEach(({ label, col }) => {
    doc.text(label, COL[col].x + 4, curY + 7, { width: COL[col].w - 4, lineBreak: false });
  });

  curY += TABLE_HEADER_H;

  // ── Data rows ──
  if (!payments || payments.length === 0) {
    fillRect(doc, MARGIN, curY, CONTENT_W, 30, C.slate100);
    doc.fillColor(C.slate400).fontSize(9).font('Helvetica')
       .text('No payments recorded yet.', MARGIN + 10, curY + 10, { lineBreak: false });
    curY += 30;
  } else {
    const ROW_H = 18;

    payments.forEach((p, idx) => {
      // Page overflow guard
      if (curY + ROW_H > PAGE_H - 50) {
        doc.addPage();
        curY = 30;
      }

      // Alternating row fill
      const rowBg = idx % 2 === 0 ? C.white : C.slate100;
      fillRect(doc, MARGIN, curY, CONTENT_W, ROW_H, rowBg);

      // Bottom border
      doc.save()
         .moveTo(MARGIN, curY + ROW_H)
         .lineTo(PAGE_W - MARGIN, curY + ROW_H)
         .strokeColor(C.slate100).lineWidth(0.5).stroke()
         .restore();

      const textY = curY + 5;

      // Date
      doc.fillColor(C.slate400).fontSize(8).font('Helvetica')
         .text(formatDate(p.date), COL.date.x + 4, textY, { width: COL.date.w - 4, lineBreak: false });

      // Total paid (bold, dark)
      doc.fillColor(C.slate800).fontSize(8).font('Helvetica-Bold')
         .text(inr(p.totalAmount), COL.total.x + 4, textY, { width: COL.total.w - 4, lineBreak: false });

      // Interest (amber)
      doc.fillColor(C.amber).fontSize(8).font('Helvetica')
         .text(inr(p.interestPaid), COL.interest.x + 4, textY, { width: COL.interest.w - 4, lineBreak: false });

      // Principal (blue)
      doc.fillColor(C.blue).fontSize(8).font('Helvetica')
         .text(inr(p.principalPaid), COL.principal.x + 4, textY, { width: COL.principal.w - 4, lineBreak: false });

      // Remaining (semi-bold)
      doc.fillColor(C.slate700).fontSize(8).font('Helvetica-Bold')
         .text(inr(p.remainingPrincipalAfter), COL.remaining.x + 4, textY, { width: COL.remaining.w - 4, lineBreak: false });

      // Remarks (muted italic)
      doc.fillColor(C.slate400).fontSize(7.5).font('Helvetica')
         .text(p.remarks || '—', COL.remarks.x + 4, textY, { width: COL.remarks.w - 4, lineBreak: false });

      curY += ROW_H;
    });

    // ── Totals row ─────────────────────────────────────────────────────────
    const TOTALS_H = 22;
    const totalInterest  = payments.reduce((s, p) => s + p.interestPaid,    0);
    const totalPrincipal = payments.reduce((s, p) => s + p.principalPaid,   0);
    const totalPaid      = payments.reduce((s, p) => s + p.totalAmount,     0);

    fillRect(doc, MARGIN, curY, CONTENT_W, TOTALS_H, C.navy);

    const totY = curY + 7;

    // Label
    doc.fillColor(C.slate400).fontSize(7.5).font('Helvetica')
       .text(`${payments.length} payments`, COL.date.x + 4, totY, { width: COL.date.w - 4, lineBreak: false });

    // Total paid (light blue)
    doc.fillColor('#93C5FD').fontSize(8).font('Helvetica-Bold')
       .text(inr(totalPaid), COL.total.x + 4, totY, { width: COL.total.w - 4, lineBreak: false });

    // Interest total (amber-light)
    doc.fillColor('#FCD34D').fontSize(8).font('Helvetica-Bold')
       .text(inr(totalInterest), COL.interest.x + 4, totY, { width: COL.interest.w - 4, lineBreak: false });

    // Principal total (green)
    doc.fillColor('#6EE7B7').fontSize(8).font('Helvetica-Bold')
       .text(inr(totalPrincipal), COL.principal.x + 4, totY, { width: COL.principal.w - 4, lineBreak: false });

    curY += TOTALS_H;
  }

  // ── 6. FOOTER ──────────────────────────────────────────────────────────────
  const footerY = PAGE_H - 32;
  hRule(doc, footerY, C.slate200);

  doc.fillColor(C.slate400).fontSize(7).font('Helvetica')
     .text('Computer-generated document · No signature required', MARGIN, footerY + 8, { lineBreak: false });

  doc.fillColor(C.slate200).fontSize(7).font('Helvetica')
     .text('CPAY · Private Money Lender · Page 1', 0, footerY + 8, { align: 'right', width: PAGE_W - MARGIN, lineBreak: false });
}

module.exports = { generateCustomerLedgerPDF };