import { jsPDF } from 'jspdf';

const clean = (value) => typeof value === 'string' ? value.trim() : '';
const hasText = (value) => Boolean(clean(value));

export function downloadSampleResumePdf(resume) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 48;

  const ensureSpace = (height = 24) => {
    if (y + height > pageHeight - 48) {
      pdf.addPage();
      y = 48;
    }
  };

  const heading = (label) => {
    ensureSpace(34);
    y += 9;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(73, 62, 160);
    pdf.text(label.toUpperCase(), margin, y);
    y += 8;
    pdf.setDrawColor(220, 222, 232);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  const paragraph = (value, options = {}) => {
    const text = clean(value);
    if (!text) return;
    const { fontSize = 9.5, bold = false, color = [48, 53, 68], gap = 5 } = options;
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * (fontSize + 3) + gap);
    pdf.text(lines, margin, y);
    y += lines.length * (fontSize + 3) + gap;
  };

  const bullet = (value) => {
    const text = clean(value);
    if (!text) return;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(48, 53, 68);
    const lines = pdf.splitTextToSize(text, contentWidth - 14);
    ensureSpace(lines.length * 13 + 4);
    pdf.text('•', margin + 2, y);
    pdf.text(lines, margin + 14, y);
    y += lines.length * 13 + 4;
  };

  const name = clean(resume.fullName) || 'Sample Resume';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(21);
  pdf.setTextColor(25, 29, 46);
  const nameLines = pdf.splitTextToSize(name, contentWidth);
  pdf.text(nameLines, margin, y);
  y += nameLines.length * 24 + 3;

  if (hasText(resume.headline)) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(85, 82, 130);
    pdf.text(pdf.splitTextToSize(clean(resume.headline), contentWidth), margin, y);
    y += 15;
  }

  const contact = [
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.location,
    ...(Array.isArray(resume.contact?.links) ? resume.contact.links : []),
  ].map(clean).filter(Boolean);
  if (contact.length) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(90, 96, 110);
    const lines = pdf.splitTextToSize(contact.join('  |  '), contentWidth);
    pdf.text(lines, margin, y);
    y += lines.length * 11 + 8;
  } else {
    y += 5;
  }

  if (hasText(resume.summary)) {
    heading('Professional Summary');
    paragraph(resume.summary);
  }
  if (resume.skills?.length) {
    heading('Skills');
    paragraph(resume.skills.join('  •  '));
  }
  if (resume.experience?.length) {
    heading('Experience');
    resume.experience.forEach((item) => {
      paragraph([item.role, item.company].filter(hasText).join(' | '), { bold: true, fontSize: 10, gap: 2 });
      if (hasText(item.dates)) paragraph(item.dates, { fontSize: 8.5, color: [100, 105, 118], gap: 3 });
      (item.bullets || []).forEach(bullet);
    });
  }
  if (resume.projects?.length) {
    heading('Projects');
    resume.projects.forEach((item) => {
      paragraph(item.name, { bold: true, fontSize: 10, gap: 2 });
      paragraph(item.description);
      if (hasText(item.technologies)) paragraph('Technologies: ' + item.technologies, { fontSize: 8.5, color: [90, 96, 110] });
    });
  }
  if (resume.education?.length) {
    heading('Education');
    resume.education.forEach((item) => {
      paragraph([item.degree, item.institution].filter(hasText).join(' | '), { bold: true, fontSize: 10, gap: 2 });
      if (hasText(item.dates)) paragraph(item.dates, { fontSize: 8.5, color: [100, 105, 118], gap: 3 });
      if (hasText(item.details)) paragraph(item.details);
    });
  }
  if (resume.certifications?.length) {
    heading('Certifications');
    resume.certifications.forEach(bullet);
  }
  (resume.additionalSections || []).forEach((section) => {
    if (hasText(section.title) && hasText(section.items)) {
      heading(section.title);
      paragraph(section.items);
    }
  });

  const fileName = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'sample-resume').replace(/^-|-$/g, '');
  pdf.save(fileName + '-sample-resume.pdf');
}
