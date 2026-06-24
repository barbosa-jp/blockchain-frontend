import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { formatDate, formatAddress } from '../utils/helpers';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { Award, Loader2, CheckCircle, XCircle, ExternalLink, Download, FileText, Eye } from 'lucide-react';

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
      
      const pdfBlob = generateCertificatePDF(pdfData);
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfUrls(prev => ({
        ...prev,
        [cert.id]: url
      }));
      
      return url;
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      return null;
    }
  };

  const loadCertificates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      
      const ids = await contract.getMyCertificates();

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
            revokeReason: cert.revokeReason || 'N/A'
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
    const url = pdfUrls[cert.id];
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${cert.studentName}-${cert.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('PDF baixado com sucesso!');
    } else {
      toast.error('Erro ao baixar PDF');
    }
  };

  // Cleanup URLs ao desmontar
  useEffect(() => {
    return () => {
      Object.values(pdfUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
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
        Meus Certificados
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
            Nenhum certificado encontrado
          </h3>
          <p className="text-gray-500">
            Você ainda não possui certificados emitidos nesta carteira
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert, index) => (
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

              {/* Prévia do PDF */}
              {pdfUrls[cert.id] && (
                <div className="mt-4">
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50" style={{ height: '200px' }}>
                    <object
                      data={pdfUrls[cert.id]}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <FileText size={32} className="mx-auto mb-2" />
                          <p className="text-xs">Prévia do certificado</p>
                          <p className="text-xs text-gray-300">Clique em "Visualizar" para abrir</p>
                        </div>
                      </div>
                    </object>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-3">
                {pdfUrls[cert.id] && (
                  <a
                    href={pdfUrls[cert.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1 px-3 py-1 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Eye size={16} />
                    <span>Visualizar</span>
                  </a>
                )}
                
                {pdfUrls[cert.id] && (
                  <button
                    onClick={() => handleDownloadPDF(cert)}
                    className="text-green-600 hover:text-green-800 text-sm flex items-center space-x-1 px-3 py-1 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Download size={16} />
                    <span>Baixar</span>
                  </button>
                )}

                <a
                  href={`https://sepolia.etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1"
                >
                  <ExternalLink size={16} />
                  <span>Blockchain</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificatesPage;