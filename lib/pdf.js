// PDF generation - runs client-side
// The logo is stored as a public Supabase Storage URL now (not inline
// base64), so it needs to be fetched and converted before jsPDF can embed
// it — jsPDF's addImage() only accepts base64/binary image data, not a URL.
async function urlToDataURL(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateQuotePDF(quote, profile) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  let logoDataUrl = null;
  if (profile.logo_url) {
    try {
      logoDataUrl = profile.logo_url.startsWith('data:image') ? profile.logo_url : await urlToDataURL(profile.logo_url);
    } catch (e) {
      logoDataUrl = null; // Missing/unreachable logo shouldn't block the whole PDF.
    }
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const blue = [37, 99, 235];
  const navy = [30, 58, 95];
  const gray = [100, 116, 139];
  const lightGray = [248, 250, 252];
  const white = [255, 255, 255];

  // Header band
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 42, 'F');

  // Logo (if the contractor uploaded one — stored as a data URL) and
  // company name. Text sits a bit lower than the band's top edge on
  // purpose: PDF viewers — iOS Safari's inline viewer in particular —
  // often float a page-count badge over the very top-left corner of the
  // first page.
  let nameX = 15;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 15, 8, 24, 24);
      nameX = 44;
    } catch (e) {
      // Malformed/unsupported image data — skip the logo rather than fail the whole PDF.
    }
  }
  doc.setTextColor(...white);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.company_name || 'My Company', nameX, 20);

  // Contact info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 195, 215);
  const contactParts = [profile.phone, profile.email, profile.license_number ? `Lic# ${profile.license_number}` : ''].filter(Boolean);
  doc.text(contactParts.join('  ·  '), nameX, 28);

  // Quote number
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(96, 165, 250);
  doc.text(`#${quote.number}`, pageW - 15, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 195, 215);
  doc.text('ESTIMATE', pageW - 15, 28, { align: 'right' });
  doc.text(new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - 15, 34, { align: 'right' });

  // Customer + job info cards
  doc.setFillColor(...lightGray);
  doc.roundedRect(12, 48, 90, 28, 3, 3, 'F');
  doc.roundedRect(108, 48, 90, 28, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('CUSTOMER', 18, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text(quote.customer_name || 'Customer', 18, 62);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(doc.splitTextToSize(quote.address || '', 80), 18, 68);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('VALID UNTIL', 114, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  const validDate = new Date(quote.created_at);
  validDate.setDate(validDate.getDate() + 30);
  doc.text(validDate.toLocaleDateString(), 114, 62);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`Status: ${quote.status}`, 114, 68);

  // Line items table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('SCOPE OF WORK', 15, 84);

  doc.autoTable({
    startY: 88,
    head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
    body: (quote.line_items || []).map(item => [
      { content: item.task + '\n' + (item.desc || ''), styles: { fontSize: 8 } },
      item.qty,
      item.unit,
      `$${Number(item.price).toLocaleString()}`,
      `$${(item.price * item.qty).toLocaleString()}`,
    ]),
    headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: lightGray },
    margin: { left: 15, right: 15 },
  });

  const endY = doc.lastAutoTable.finalY + 6;

  // Totals
  const hasTax = quote.tax_amount > 0;
  const hasDiscount = quote.discount_amount > 0;
  const extraLines = (hasTax ? 1 : 0) + (hasDiscount ? 1 : 0);
  const tx = pageW - 80;
  doc.setFillColor(...lightGray);
  doc.roundedRect(tx - 5, endY, 73, 20 + extraLines * 8, 3, 3, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  doc.text('Subtotal:', tx, endY + 8);
  doc.setTextColor(...navy);
  doc.text(`$${Number(quote.subtotal).toLocaleString()}`, pageW - 18, endY + 8, { align: 'right' });

  let lineY = endY + 8;
  if (hasTax) {
    lineY += 8;
    doc.setTextColor(...gray);
    const taxLabel = quote.tax_type === 'percent' ? `Tax (${quote.tax_value}%):` : 'Tax:';
    doc.text(taxLabel, tx, lineY);
    doc.setTextColor(...navy);
    doc.text(`$${Number(quote.tax_amount).toFixed(2)}`, pageW - 18, lineY, { align: 'right' });
  }
  if (hasDiscount) {
    lineY += 8;
    doc.setTextColor(...gray);
    const discountLabel = quote.discount_type === 'percent' ? `Discount (${quote.discount_value}%):` : 'Discount:';
    doc.text(discountLabel, tx, lineY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-$${Number(quote.discount_amount).toFixed(2)}`, pageW - 18, lineY, { align: 'right' });
  }

  const totalY = endY + 14 + extraLines * 8;
  doc.setFillColor(...navy);
  doc.roundedRect(tx - 5, totalY - 6, 73, 12, 3, 3, 'F');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...white);
  doc.text('TOTAL:', tx, totalY + 2);
  doc.setTextColor(96, 165, 250);
  doc.text(`$${Number(quote.total).toLocaleString()}`, pageW - 18, totalY + 2, { align: 'right' });

  // Notes + terms
  if (profile.payment_terms || profile.quote_notes || quote.notes) {
    const notesY = totalY + 18;
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, notesY, pageW - 30, 26, 3, 3, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray);
    doc.text('NOTES & TERMS', 20, notesY + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    const notesText = [quote.notes, profile.payment_terms, profile.quote_notes].filter(Boolean).join('  ·  ');
    doc.text(doc.splitTextToSize(notesText, pageW - 45), 20, notesY + 13);
  }

  // Signature lines
  const sigY = 255;
  doc.setDrawColor(...gray); doc.setLineWidth(0.3);
  doc.line(15, sigY, 90, sigY);
  doc.line(110, sigY, pageW - 15, sigY);
  doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text('Customer Signature & Date', 15, sigY + 5);
  doc.text('Authorized Contractor', 110, sigY + 5);

  // Footer
  doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text(`${profile.company_name} · Powered by JobSnap`, pageW / 2, 283, { align: 'center' });

  return doc;
}

export async function downloadQuotePDF(quote, profile) {
  const doc = await generateQuotePDF(quote, profile);
  const filename = `Quote-${quote.number}-${(quote.customer_name || 'customer').replace(/\s+/g, '-')}.pdf`;

  // doc.save() triggers a hidden <a download> click, which silently does
  // nothing inside the iOS app's embedded web view (no download manager
  // there). Opening the PDF in a new tab lets iOS's built-in PDF viewer
  // take over, where the user can view/share/save it from the toolbar.
  try {
    const blobUrl = doc.output('bloburl');
    const win = window.open(blobUrl, '_blank');
    if (!win) throw new Error('popup blocked');
  } catch (e) {
    doc.save(filename);
  }
}
