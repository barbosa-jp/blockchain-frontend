import jsPDF from 'jspdf';

export const generateCertificatePDF = (data) => {
  const { studentName, courseName, workloadHours, issueDate, certificateId } = data;
  
  // Criar documento A4 em paisagem
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Adicionar borda decorativa
  doc.setDrawColor(124, 58, 237); // Roxo do tema
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  // Segunda borda mais fina
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);
  
  // Título principal
  doc.setFontSize(32);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO ACADÊMICO', pageWidth / 2, 50, { align: 'center' });
  
  // Subtítulo
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Instituto Federal do Piauí - IFPI', pageWidth / 2, 65, { align: 'center' });
  
  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(80, 72, pageWidth - 80, 72);
  
  // Texto do certificado
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Certificamos que', pageWidth / 2, 95, { align: 'center' });
  
  // Nome do aluno (destaque)
  doc.setFontSize(28);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName, pageWidth / 2, 125, { align: 'center' });
  
  // Texto do curso
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`concluiu o curso de`, pageWidth / 2, 150, { align: 'center' });
  
  // Nome do curso (destaque)
  doc.setFontSize(22);
  doc.setTextColor(124, 58, 237);
  doc.setFont('helvetica', 'bold');
  doc.text(courseName, pageWidth / 2, 175, { align: 'center' });
  
  // Detalhes do curso
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`com carga horária de ${workloadHours} horas`, pageWidth / 2, 195, { align: 'center' });
  
  // Data de emissão
  const formattedDate = new Date(issueDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Emitido em ${formattedDate}`, pageWidth / 2, 220, { align: 'center' });
  
  // Informações da blockchain
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Verifique a autenticidade deste certificado na blockchain`, pageWidth / 2, 250, { align: 'center' });
  doc.text(`ID do Certificado: ${certificateId}`, pageWidth / 2, 258, { align: 'center' });
  doc.text(`AcademicChain - Verificação pública na blockchain Ethereum Sepolia`, pageWidth / 2, 266, { align: 'center' });
  
  // Assinatura
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'italic');
  doc.text('_________________________________', pageWidth / 2, 235, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Instituição Emissora', pageWidth / 2, 243, { align: 'center' });
  
  // Rodapé com selo blockchain
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('✓ Registrado na blockchain Ethereum Sepolia', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text('✓ Imutável e à prova de fraude', pageWidth / 2, pageHeight - 8, { align: 'center' });
  
  // Retornar o PDF como blob para download
  return doc.output('blob');
};