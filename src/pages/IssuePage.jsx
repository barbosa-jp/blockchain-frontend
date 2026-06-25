import React, { useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { generateCertificatePDF, generateBadgePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { FileUp, Loader2, CheckCircle, XCircle, Download, User, BookOpen, Clock, Wallet, Sparkles, Award, Shield } from 'lucide-react';

const IssuePage = () => {
  const { signer, isConnected, account } = useMetaMask();

  const [formData, setFormData] = useState({
    studentName: '',
    studentAddress: '',
    courseName: '',
    workloadHours: '',
  });
  const [documentType, setDocumentType] = useState('certificate');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [certificateId, setCertificateId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const fillWithMyAddress = () => {
    if (account) {
      setFormData(prev => ({ ...prev, studentAddress: account }));
      toast.success('Endereço preenchido com sua carteira!');
    } else {
      toast.error('Conecte sua MetaMask primeiro');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Conecte sua MetaMask primeiro');
      return;
    }

    const { studentName, studentAddress, courseName, workloadHours } = formData;
    if (!studentName || !studentAddress || !courseName || !workloadHours) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!studentAddress.startsWith('0x') || studentAddress.length !== 42) {
      toast.error('Endereço Ethereum inválido');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setGeneratedPDF(null);

    try {
      const pdfData = {
        studentName,
        courseName,
        workloadHours: parseInt(workloadHours),
        issueDate: Date.now(),
        certificateId: `temp-${Date.now()}`
      };
      
      let pdfBlob;
      let fileName;
      
      if (documentType === 'certificate') {
        pdfBlob = generateCertificatePDF(pdfData);
        fileName = `certificado-${studentName}.pdf`;
      } else {
        pdfBlob = generateBadgePDF(pdfData, 'medium');
        fileName = `badge-${studentName}.pdf`;
      }
      
      setGeneratedPDF(pdfBlob);
      
      // 2. Calcular hash do PDF
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // 3. Conectar ao contrato
      const contract = getContract(signer);
      
      // 4. Emitir certificado na blockchain
      const tx = await contract.issueCertificate(
        studentAddress,
        studentName,
        courseName,
        BigInt(parseInt(workloadHours)),
        fileHash
      );

      toast.loading('Aguardando confirmação da transação...', { id: 'tx' });

      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      
      // Buscar o ID do certificado do evento
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'CertificateIssued';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        const id = parsedEvent.args[0];
        setCertificateId(id.toString());
      } else {
        setCertificateId(Math.floor(Math.random() * 10000).toString());
      }

      // SALVAR O TIPO DE DOCUMENTO NO LOCALSTORAGE
      const docKey = `doc_${studentAddress}_${Date.now()}`;
      const docInfo = {
        id: certificateId || 'N/A',
        studentAddress,
        documentType,
        issuedAt: Date.now()
      };
      
      // Salvar no localStorage
      const savedDocs = JSON.parse(localStorage.getItem('academicchain_docs') || '[]');
      savedDocs.push(docInfo);
      localStorage.setItem('academicchain_docs', JSON.stringify(savedDocs));

      toast.success(`${documentType === 'certificate' ? 'Certificado' : 'Badge'} emitido com sucesso!`, { id: 'tx' });

      setFormData({ 
        studentName: '', 
        studentAddress: '',
        courseName: '', 
        workloadHours: '' 
      });

    } catch (err) {
      console.error('Erro ao emitir:', err);
      setError(err.message || 'Erro desconhecido');
      toast.error(`Erro: ${err.message || 'Erro desconhecido'}`, { id: 'tx' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (generatedPDF) {
      const url = URL.createObjectURL(generatedPDF);
      const a = document.createElement('a');
      a.href = url;
      const fileName = documentType === 'certificate' 
        ? `certificado-${formData.studentName || 'aluno'}.pdf`
        : `badge-${formData.studentName || 'aluno'}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF baixado com sucesso!');
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Conecte sua MetaMask
        </h2>
        <p className="text-gray-500">Para emitir documentos, você precisa estar conectado</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <FileUp className="mr-3 text-primary-600" size={28} />
        Emitir Documento
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label-field">Tipo de Documento</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDocumentType('certificate')}
              className={`p-4 rounded-lg border-2 transition-all ${
                documentType === 'certificate'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <Award size={28} className={documentType === 'certificate' ? 'text-primary-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium mt-1 ${documentType === 'certificate' ? 'text-primary-600' : 'text-gray-600'}`}>
                  Certificado
                </span>
                <span className="text-xs text-gray-400">Formato tradicional</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDocumentType('badge')}
              className={`p-4 rounded-lg border-2 transition-all ${
                documentType === 'badge'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <Shield size={28} className={documentType === 'badge' ? 'text-primary-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium mt-1 ${documentType === 'badge' ? 'text-primary-600' : 'text-gray-600'}`}>
                  Badge
                </span>
                <span className="text-xs text-gray-400">Distintivo digital</span>
              </div>
            </button>
          </div>
        </div>

        {/* Campos do Formulário */}
        <div>
          <label className="label-field flex items-center">
            <User size={18} className="mr-2 text-primary-600" />
            Nome do Aluno
          </label>
          <input
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Ex: João Silva Santos"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="label-field flex items-center">
            <Wallet size={18} className="mr-2 text-primary-600" />
            Endereço Ethereum do Aluno
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              name="studentAddress"
              value={formData.studentAddress}
              onChange={handleInputChange}
              className="input-field flex-1"
              placeholder="0x..."
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={fillWithMyAddress}
              disabled={isLoading}
              className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap text-sm font-medium"
            >
              Minha Carteira
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Endereço Ethereum do estudante que receberá o documento
          </p>
        </div>

        <div>
          <label className="label-field flex items-center">
            <BookOpen size={18} className="mr-2 text-primary-600" />
            Nome do Curso
          </label>
          <input
            type="text"
            name="courseName"
            value={formData.courseName}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Ex: Bacharelado em Ciência da Computação"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="label-field flex items-center">
            <Clock size={18} className="mr-2 text-primary-600" />
            Carga Horária (horas)
          </label>
          <input
            type="number"
            name="workloadHours"
            value={formData.workloadHours}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Ex: 3600"
            min="1"
            required
            disabled={isLoading}
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-700 flex items-center">
            <Sparkles className="mr-2" size={18} />
            {documentType === 'certificate' 
              ? 'O certificado será gerado em PDF com design profissional tradicional'
              : 'O badge será gerado em PDF com design de distintivo circular'}
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Emitindo...</span>
            </>
          ) : (
            <>
              <FileUp size={20} />
              <span>Emitir {documentType === 'certificate' ? 'Certificado' : 'Badge'}</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-700 font-semibold">Erro na transação</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {txHash && generatedPDF && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-700 font-semibold">
                  {documentType === 'certificate' ? 'Certificado' : 'Badge'} emitido com sucesso!
                </p>
                <p className="text-sm text-gray-600">
                  ID: #{certificateId || 'N/A'}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline text-sm"
                >
                  Ver no Etherscan →
                </a>
              </div>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Download size={20} />
              <span>Baixar {documentType === 'certificate' ? 'Certificado' : 'Badge'} PDF</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default IssuePage;