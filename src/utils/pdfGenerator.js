import jsPDF from 'jspdf';

// Função para gerar Certificado tradicional
export const generateCertificatePDF = (data) => {
  const { studentName, courseName, workloadHours, issueDate, certificateId } = data;
  
  try {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Borda externa
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, pageWidth - 28, pageHeight - 28);
    
    // Título
    doc.setFontSize(32);
    doc.setTextColor(124, 58, 237);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICADO ACADÊMICO', pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Instituto Federal do Piauí - IFPI', pageWidth / 2, 65, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(80, 72, pageWidth - 80, 72);
    
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text('Certificamos que', pageWidth / 2, 95, { align: 'center' });
    
    doc.setFontSize(28);
    doc.setTextColor(124, 58, 237);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName || 'Nome do Aluno', pageWidth / 2, 125, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text('concluiu o curso de', pageWidth / 2, 150, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237);
    doc.setFont('helvetica', 'bold');
    doc.text(courseName || 'Nome do Curso', pageWidth / 2, 175, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`com carga horária de ${workloadHours || 0} horas`, pageWidth / 2, 195, { align: 'center' });
    
    let formattedDate = 'Data não disponível';
    if (issueDate) {
      const date = new Date(issueDate);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    }
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Emitido em ${formattedDate}`, pageWidth / 2, 220, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'italic');
    doc.text('_________________________________', pageWidth / 2, 235, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Instituição Emissora', pageWidth / 2, 243, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Verifique a autenticidade deste certificado na blockchain', pageWidth / 2, 250, { align: 'center' });
    doc.text(`ID do Certificado: ${certificateId || 'N/A'}`, pageWidth / 2, 258, { align: 'center' });
    doc.text('AcademicChain - Verificação pública na blockchain Ethereum Sepolia', pageWidth / 2, 266, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('✓ Registrado na blockchain Ethereum Sepolia', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('✓ Imutável e à prova de fraude', pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    return doc.output('blob');
    
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
};

// Função para gerar Badge - ESTILO MODERNO COM FONTES MUITO MAIORES
export const generateBadgePDF = (data, size = 'medium') => {
  const sizes = {
    small: [160, 160],
    medium: [220, 220],
    large: [300, 300]
  };
  
  const [width, height] = sizes[size] || sizes.medium;
  const { studentName, courseName, workloadHours, issueDate, certificateId } = data;
  
  try {
    const doc = new jsPDF('portrait', 'mm', [width, height]);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    const radius = Math.min(pageWidth, pageHeight) / 2 - 8;
    
    // CORES - Paleta moderna
    const colors = [
      { bg: '#4F46E5', text: '#C7D2FE' }, // Índigo
      { bg: '#7C3AED', text: '#DDD6FE' }, // Roxo
      { bg: '#2563EB', text: '#BFDBFE' }, // Azul
      { bg: '#059669', text: '#A7F3D0' }, // Verde
      { bg: '#DC2626', text: '#FECACA' }, // Vermelho
      { bg: '#D97706', text: '#FDE68A' }, // Laranja
      { bg: '#0891B2', text: '#CFFAFE' }, // Ciano
      { bg: '#7C3AED', text: '#C4B5FD' }, // Roxo escuro
    ];
    
    let colorIndex = 0;
    if (certificateId) {
      const numId = parseInt(certificateId.toString().replace(/[^0-9]/g, ''));
      if (!isNaN(numId) && numId > 0) {
        colorIndex = numId % colors.length;
      }
    }
    const color = colors[colorIndex];
    
    // ==========================================
    // FUNDO SIMPLES
    // ==========================================
    doc.setFillColor(color.bg);
    doc.circle(centerX, centerY, radius, 'F');
    
    doc.setFillColor(color.text);
    doc.circle(centerX, centerY, radius * 0.85, 'F');
    
    // ==========================================
    // BORDA DOURADA MAIS GROSSA
    // ==========================================
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(3);
    doc.circle(centerX, centerY, radius - 1, 'D');
    
    // ==========================================
    // TÍTULO "CERTIFICADO" - MUITO MAIOR
    // ==========================================
    doc.setFontSize(radius * 0.22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICADO', centerX, centerY - radius * 0.40, { align: 'center' });
    
    // ==========================================
    // NOME DO ALUNO - MUITO MAIOR (DESTAQUE)
    // ==========================================
    doc.setFontSize(radius * 0.32);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const maxNameLength = Math.floor(radius * 0.5);
    let name = studentName || 'Nome do Aluno';
    if (name.length > maxNameLength) {
      name = name.substring(0, maxNameLength - 2) + '...';
    }
    doc.text(name, centerX, centerY - radius * 0.10, { align: 'center' });
    
    // ==========================================
    // CURSO - MUITO MAIOR
    // ==========================================
    doc.setFontSize(radius * 0.14);
    doc.setTextColor(255, 255, 255, 0.85);
    doc.setFont('helvetica', 'normal');
    const maxCourseLength = Math.floor(radius * 0.5);
    let course = courseName || 'Nome do Curso';
    if (course.length > maxCourseLength) {
      course = course.substring(0, maxCourseLength - 2) + '...';
    }
    doc.text(course, centerX, centerY + radius * 0.20, { align: 'center' });
    
    // ==========================================
    // LINHA DECORATIVA MAIS GROSSA
    // ==========================================
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1.5);
    const lineY = centerY + radius * 0.32;
    doc.line(centerX - radius * 0.35, lineY, centerX + radius * 0.35, lineY);
    
    // ==========================================
    // ID DO CERTIFICADO - MUITO MAIOR (COM #)
    // ==========================================
    doc.setFontSize(radius * 0.14);
    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${certificateId || 'N/A'}`, centerX, centerY + radius * 0.48, { align: 'center' });
    
    // ==========================================
    // CARGA HORÁRIA - MUITO MAIOR
    // ==========================================
    if (workloadHours) {
      doc.setFontSize(radius * 0.10);
      doc.setTextColor(255, 255, 255, 0.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${workloadHours} horas`, centerX, centerY + radius * 0.62, { align: 'center' });
    }
    
    // ==========================================
    // DATA DE EMISSÃO - NOVO CAMPO
    // ==========================================
    let formattedDate = '';
    if (issueDate) {
      const date = new Date(issueDate);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }
    if (formattedDate) {
      doc.setFontSize(radius * 0.07);
      doc.setTextColor(255, 255, 255, 0.4);
      doc.setFont('helvetica', 'normal');
      doc.text(`Emitido em ${formattedDate}`, centerX, centerY + radius * 0.75, { align: 'center' });
    }
    
    return doc.output('blob');
    
  } catch (error) {
    console.error('Erro ao gerar badge:', error);
    throw error;
  }
};