import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { formatDate, formatAddress } from '../utils/helpers';
import { generateCertificatePDF, generateBadgePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { Award, Loader2, CheckCircle, XCircle, ExternalLink, Download, FileText, Eye, Shield } from 'lucide-react';

const MyCertificatesPage = () => {
  const { signer, account, isConnected } = useMetaMask();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrls, setPdfUrls] = useState({});


  useEffect(() => {
    if (isConnected && account) {
      loadCertificates();
    } else {
      setCertificates([]);
      setIsLoading(false);
    }
  }, [isConnected, account]);

  const generatePDFForCertificate = async (cert) => {
    try {
      const pdfData = {
        studentName: cert.studentName,
        courseName: cert.courseName,
        workloadHours: parseInt(cert.workloadHours) || 0,
        issueDate: cert.issuedAt ? new Date(cert.issuedAt * 1000).getTime() : Date.now(),
        certificateId: cert.id
      };

      const isBadge = cert.documentType === 1;

      let pdfBlob;
      let fileType;

      if (isBadge) {
        pdfBlob = generateBadgePDF(pdfData, 'medium');
        fileType = 'badge';
      } else {
        pdfBlob = generateCertificatePDF(pdfData);
        fileType = 'certificate';
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);

      setPdfUrls(prev => ({
        ...prev,
        [cert.id]: { url: pdfUrl, type: fileType }
      }));

      return { pdfUrl, type: fileType };
    } catch (err) {
      console.error('Erro ao gerar documento:', err);
      return null;
    }
  };

  const loadCertificates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      
      const ids = await contract.getMyCertificates();
      console.log('IDs dos certificados:', ids);

      if (ids.length === 0) {
        setCertificates([]);
        setIsLoading(false);
        return;
      }

      const promises = ids.map(async (id) => {
        try {
          const cert = await contract.getCertificate(id);
          
          const certData = {
            id: id.toString(),
            studentName: cert.studentName || 'N/A',
            student: cert.student || 'N/A',
            courseName: cert.courseName || 'N/A',
            workloadHours: cert.workloadHours ? cert.workloadHours.toString() : '0',
            issuedAt: cert.issuedAt ? Number(cert.issuedAt) : 0,
            issuedBy: cert.issuedBy || 'N/A',
            documentHash: cert.documentHash || 'N/A',
            revoked: cert.revoked || false,
            revokeReason: cert.revokeReason || 'N/A',
            documentType: Number(cert.documentType)
          };
          
          await generatePDFForCertificate(certData);
          
          return certData;
        } catch (err) {
          console.error(`Erro ao buscar certificado ${id}:`, err);
          return null;
        }
      });

      const certs = await Promise.all(promises);
      const validCerts = certs.filter(cert => cert !== null);
      setCertificates(validCerts);

    } catch (err) {
      console.error('Erro ao carregar certificados:', err);
      setError(err.message);
      toast.error('Erro ao carregar certificados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (cert) => {
    const docInfo = pdfUrls[cert.id];
    if (docInfo && docInfo.url) {
      const a = document.createElement('a');
      a.href = docInfo.url;
      const fileName = docInfo.type === 'badge' 
        ? `badge-${cert.studentName}-${cert.id}.pdf`
        : `certificado-${cert.studentName}-${cert.id}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`${docInfo.type === 'badge' ? 'Badge' : 'Certificado'} baixado com sucesso!`);
    } else {
      toast.error('Erro ao baixar documento');
    }
  };

  // Cleanup URLs ao desmontar
  useEffect(() => {
    return () => {
      Object.values(pdfUrls).forEach(docInfo => {
        if (docInfo && docInfo.url) URL.revokeObjectURL(docInfo.url);
      });
    };
  }, [pdfUrls]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Conecte sua MetaMask
        </h2>
        <p className="text-gray-500">Para visualizar seus certificados, conecte sua carteira</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <span className="ml-3 text-gray-600">Carregando certificados...</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Award className="mr-3 text-primary-600" size={28} />
        Meus Documentos
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="card text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhum documento encontrado
          </h3>
          <p className="text-gray-500">
            Você ainda não possui documentos emitidos nesta carteira
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert, index) => {
            const docInfo = pdfUrls[cert.id];
            const isBadge = docInfo && docInfo.type === 'badge';
            
            return (
              <div key={index} className="card hover:shadow-2xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    {cert.revoked ? (
                      <XCircle className="text-red-500" size={20} />
                    ) : (
                      <CheckCircle className="text-green-500" size={20} />
                    )}
                    <span className={`text-sm font-semibold ${
                      cert.revoked ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {cert.revoked ? 'Revogado' : 'Válido'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isBadge 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isBadge ? (
                        <span className="flex items-center">
                          <Shield size={12} className="mr-1" />
                          Badge
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FileText size={12} className="mr-1" />
                          Certificado
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">ID: #{cert.id}</span>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {cert.studentName}
                </h3>
                <p className="text-gray-600 mb-2">{cert.courseName}</p>

                <div className="space-y-1 text-sm text-gray-500">
                  <p><strong>Carga Horária:</strong> {cert.workloadHours}h</p>
                  <p><strong>Emissor:</strong> {formatAddress(cert.issuedBy)}</p>
                  <p><strong>Data:</strong> {formatDate(cert.issuedAt)}</p>
                </div>

                {cert.revoked && cert.revokeReason !== 'N/A' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                    <strong>Motivo da revogação:</strong> {cert.revokeReason}
                  </div>
                )}

                {docInfo && docInfo.url && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isBadge ? (
                          <Shield size={18} className="text-purple-600" />
                        ) : (
                          <FileText size={18} className="text-primary-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {isBadge ? 'Badge' : 'Certificado'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={docInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg transition-colors ${
                            isBadge 
                              ? 'text-purple-600 hover:bg-purple-50' 
                              : 'text-primary-600 hover:bg-primary-50'
                          }`}
                          title={`Visualizar ${isBadge ? 'Badge' : 'Certificado'}`}
                        >
                          <Eye size={18} />
                        </a>
                        <button
                          onClick={() => handleDownloadPDF(cert)}
                          className={`p-2 rounded-lg transition-colors ${
                            isBadge 
                              ? 'text-purple-600 hover:bg-purple-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={`Baixar ${isBadge ? 'Badge' : 'Certificado'}`}
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <a
                    href={`https://sepolia.etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1"
                  >
                    <ExternalLink size={16} />
                    <span>Ver na Blockchain</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCertificatesPage;