import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { formatDate, formatAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Award, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const MyCertificatesPage = () => {
  const { signer, account, isConnected } = useMetaMask();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && account) {
      loadCertificates();
    } else {
      setCertificates([]);
      setIsLoading(false);
    }
  }, [isConnected, account]);

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

      const certPromises = ids.map(async (id) => {
        return {
          id: id.toString(),
          studentName: 'Carregando...',
          courseName: 'Carregando...',
          workloadHours: 0,
          issuedAt: Date.now() / 1000,
          documentHash: '...',
          issuer: account,
          revoked: false,
          revocationReason: ''
        };
      });

      const certs = await Promise.all(certPromises);
      setCertificates(certs);
    } catch (err) {
      console.error('Erro ao carregar certificados:', err);
      setError(err.message);
      toast.error('Erro ao carregar certificados');
    } finally {
      setIsLoading(false);
    }
  };

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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meus Certificados</h1>

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
                <p><strong>Emissor:</strong> {formatAddress(cert.issuer)}</p>
                <p><strong>Data:</strong> {formatDate(cert.issuedAt)}</p>
              </div>

              {cert.revoked && cert.revocationReason && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                  <strong>Motivo da revogação:</strong> {cert.revocationReason}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <a
                  href={`https://sepolia.etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1"
                >
                  <span>Ver na blockchain</span>
                  <ExternalLink size={14} />
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