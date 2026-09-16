/**
 * CampusQ — UCU Official Electronic Receipt PDF Generator
 * Uses jsPDF to generate a university-branded receipt.
 */

import { jsPDF } from 'jspdf';

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentNumber: string;
  registrationNumber?: string;
  programme: string;
  faculty?: string;
  semesterName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  verificationDate: string;
  verifiedByStaffName: string;
}

export function generateUcuReceiptPdf(receipt: ReceiptData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Background border & UCU Colors: Primary Navy (#091E3A), Accent Gold (#C69214)
  doc.setDrawColor(9, 30, 58);
  doc.setLineWidth(1);
  doc.rect(10, 10, 190, 277);

  doc.setDrawColor(198, 146, 20);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, 186, 273);

  // University Header Banner
  doc.setFillColor(9, 30, 58);
  doc.rect(12, 12, 186, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('UGANDA CHRISTIAN UNIVERSITY', 105, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('A Complete Education for a Complete Person | Directorate of Finance & Accounts', 105, 31, { align: 'center' });
  doc.setTextColor(200, 210, 225);
  doc.text('P.O. Box 4, Mukono, Uganda | Tel: +256 312 350 800 | accounts@ucu.ac.ug', 105, 37, { align: 'center' });

  // Receipt Title Bar
  doc.setFillColor(245, 247, 250);
  doc.rect(12, 45, 186, 16, 'F');
  doc.setDrawColor(220, 225, 235);
  doc.line(12, 61, 198, 61);

  doc.setTextColor(9, 30, 58);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL ELECTRONIC TUITION & FEES RECEIPT', 20, 55);

  doc.setFontSize(11);
  doc.setTextColor(198, 146, 20);
  doc.text(`Receipt No: ${receipt.receiptNumber}`, 190, 55, { align: 'right' });

  // Verification watermark
  doc.setFontSize(45);
  doc.setTextColor(238, 242, 248);
  doc.setFont('helvetica', 'bold');
  doc.text('UCU VERIFIED', 105, 165, { align: 'center', angle: 40 });

  // Student Particulars Box
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 125);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT PARTICULARS', 20, 72);

  doc.setDrawColor(230, 235, 245);
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(20, 75, 170, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 85);
  doc.text('Student Name:', 25, 83);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(9, 30, 58);
  doc.text(receipt.studentName, 60, 83);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 85);
  doc.text('Student Number:', 25, 91);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.studentNumber, 60, 91);

  doc.setFont('helvetica', 'normal');
  doc.text('Reg. Number:', 115, 91);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.registrationNumber || 'N/A', 145, 91);

  doc.setFont('helvetica', 'normal');
  doc.text('Programme:', 25, 99);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.programme, 60, 99);

  doc.setFont('helvetica', 'normal');
  doc.text('Academic Semester:', 25, 107);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.semesterName, 65, 107);

  // Payment Particulars Box
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 125);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION PARTICULARS', 20, 123);

  doc.setDrawColor(230, 235, 245);
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(20, 126, 170, 60, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 85);
  doc.text('Transaction Reference:', 25, 136);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(9, 30, 58);
  doc.text(receipt.transactionReference, 75, 136);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 85);
  doc.text('Payment Method / Channel:', 25, 145);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.paymentMethod.replace(/_/g, ' '), 75, 145);

  doc.setFont('helvetica', 'normal');
  doc.text('Payment Date:', 25, 154);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.paymentDate, 75, 154);

  doc.setFont('helvetica', 'normal');
  doc.text('Accounts Verification Date:', 25, 163);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(receipt.verificationDate).toLocaleDateString() + ' ' + new Date(receipt.verificationDate).toLocaleTimeString(), 75, 163);

  doc.setFont('helvetica', 'normal');
  doc.text('Verified By Accounts Officer:', 25, 172);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(9, 30, 58);
  doc.text(receipt.verifiedByStaffName, 75, 172);

  // Total Verified Amount Block
  doc.setFillColor(235, 245, 238);
  doc.setDrawColor(180, 220, 195);
  doc.roundedRect(20, 195, 170, 25, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(20, 85, 45);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL VERIFIED AMOUNT RECEIVED:', 25, 206);

  doc.setFontSize(16);
  doc.text(`${receipt.currency} ${receipt.amount.toLocaleString()}`, 25, 215);

  // Official Seal & Sign-off
  doc.setFontSize(9);
  doc.setTextColor(110, 120, 135);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This is a system-generated electronic receipt issued by the Directorate of Finance & Accounts, Uganda Christian University.',
    105,
    235,
    { align: 'center' }
  );
  doc.text(
    'Verified payments are automatically reflected on the student academic ledger for registration clearance.',
    105,
    240,
    { align: 'center' }
  );

  // Stamp Box
  doc.setDrawColor(9, 30, 58);
  doc.setLineWidth(0.6);
  doc.roundedRect(65, 246, 80, 22, 2, 2);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(9, 30, 58);
  doc.text('UGANDA CHRISTIAN UNIVERSITY', 105, 252, { align: 'center' });
  doc.setTextColor(198, 146, 20);
  doc.text('DIRECTORATE OF ACCOUNTS - VERIFIED', 105, 258, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 105);
  doc.text(`Official Stamp Ref: ${receipt.receiptNumber}`, 105, 264, { align: 'center' });

  // Save/Download
  doc.save(`${receipt.receiptNumber}.pdf`);
}
