import React, { useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { calculateSHA256, formatDate, formatAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Search, FileUp, Loader2, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

const VerifyPage = () => {
  const { provider } = useMetaMask();
  const [verifyMethod, setVerifyMethod] = useState('file');
  const [certificateId, setCertificateId] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido');
      setFile(null);
    }
  };

  const handleVerify = async () => {
    if (!provider) {
      toast.error('Conecte sua MetaMask ou use um provider público');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const contract = getContract(provider);

      if (verifyMethod === 'id') {
        // ==========================================
        // VERIFICAÇÃO POR ID
        // ==========================================
        if (!certificateId || isNaN(certificateId) || parseInt(certificateId) <= 0) {
          toast.error('Digite um ID válido (número positivo)');
          setIsLoading(false);
          return;
        }

        try {
          const [isValid, certData] = await contract.verifyById(parseInt(certificateId));
          
          if (isValid && certData) {
            // Certificado encontrado e válido
            setResult({
              isValid: true,
              id: certData.id ? certData.id.toString() : certificateId,
              message: '✅ Certificado válido!',
              details: {
                studentName: certData.studentName || 'N/A',
                student: certData.student || 'N/A',
                courseName: certData.courseName || 'N/A',
                workloadHours: certData.workloadHours ? certData.workloadHours.toString() : '0',
                issuedAt: certData.issuedAt ? Number(certData.issuedAt) : Date.now() / 1000,
                issuedBy: certData.issuedBy || 'N/A',
                documentHash: certData.documentHash || 'N/A',
                revoked: certData.revoked || false,
                revokeReason: certData.revokeReason || 'N/A'
              }
            });
            toast.success('Certificado verificado com sucesso!');
          } else {
            // Certificado não encontrado ou revogado
            setResult({
              isValid: false,
              id: certificateId,
              message: '❌ Certificado inválido ou não encontrado',
            });
            toast.error('Certificado não encontrado ou foi revogado');
          }
        } catch (err) {
          console.error('Erro na verificação por ID:', err);
          
          if (err.message && err.message.includes('execution reverted')) {
            setResult({
              isValid: false,
              id: certificateId,
              message: '❌ Certificado não encontrado na blockchain',
            });
            toast.error('Certificado não encontrado');
          } else {
            setError(err.message);
            toast.error(`Erro: ${err.message}`);
          }
        }
        
      } else {
        // ==========================================
        // VERIFICAÇÃO POR PDF
        // ==========================================
        if (!file) {
          toast.error('Selecione um arquivo PDF');
          setIsLoading(false);
          return;
        }

        try {
          const fileHash = await calculateSHA256(file);
          const [isValid, certData] = await contract.verifyByHash(fileHash);

          if (isValid && certData) {
            setResult({
              isValid: true,
              id: certData.id ? certData.id.toString() : 'N/A',
              message: '✅ Certificado válido!',
              details: {
                studentName: certData.studentName || 'N/A',
                student: certData.student || 'N/A',
                courseName: certData.courseName || 'N/A',
                workloadHours: certData.workloadHours ? certData.workloadHours.toString() : '0',
                issuedAt: certData.issuedAt ? Number(certData.issuedAt) : Date.now() / 1000,
                issuedBy: certData.issuedBy || 'N/A',
                documentHash: certData.documentHash || 'N/A',
                revoked: certData.revoked || false,
                revokeReason: certData.revokeReason || 'N/A'
              },
              hash: fileHash
            });
            toast.success('Certificado verificado com sucesso!');
          } else {
            setResult({
              isValid: false,
              message: '❌ Certificado inválido ou não encontrado',
              hash: fileHash
            });
            toast.error('Certificado não encontrado');
          }
        } catch (err) {
          console.error('Erro na verificação por PDF:', err);
          setError(err.message);
          toast.error(`Erro: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Search className="mr-3 text-primary-600" size={28} />
        Verificar Certificado
      </h1>

      <div className="card space-y-6">
        {/* Método de Verificação */}
        <div className="flex space-x-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => {
              setVerifyMethod('file');
              setResult(null);
              setError(null);
              setCertificateId('');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              verifyMethod === 'file'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} />
            <span>Por PDF</span>
          </button>
          <button
            onClick={() => {
              setVerifyMethod('id');
              setResult(null);
              setError(null);
              setFile(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              verifyMethod === 'id'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search size={18} />
            <span>Por ID</span>
          </button>
        </div>

        {/* Input Fields */}
        {verifyMethod === 'id' ? (
          <div>
            <label className="label-field">ID do Certificado</label>
            <div className="flex space-x-3">
              <input
                type="number"
                value={certificateId}
                onChange={(e) => {
                  setCertificateId(e.target.value);
                  setResult(null);
                  setError(null);
                }}
                className="input-field flex-1"
                placeholder="Ex: 1, 2, 3..."
                disabled={isLoading}
                min="1"
              />
              <button
                onClick={handleVerify}
                disabled={isLoading || !certificateId}
                className="btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Search size={20} />
                )}
                <span>Verificar</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Digite o ID numérico do certificado que você recebeu
            </p>
          </div>
        ) : (
          <div>
            <label className="label-field">Upload do PDF</label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="pdf-verify-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="pdf-verify-upload"
                  className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
                >
                  <div className="text-center">
                    <FileUp className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600">
                      {file ? file.name : 'Clique para selecionar o PDF'}
                    </span>
                    {file && (
                      <span className="block text-sm text-green-600 mt-1">
                        ✓ Arquivo selecionado
                      </span>
                    )}
                  </div>
                </label>
              </div>
              <button
                onClick={handleVerify}
                disabled={isLoading || !file}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Verificar Certificado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-700 font-semibold">Erro na verificação</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.isValid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {result.isValid ? (
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={24} />
              ) : (
                <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  result.isValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </h3>
                
                {result.isValid && result.details && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <p><strong>ID:</strong> #{result.id}</p>
                      <p><strong>Status:</strong> {result.details.revoked ? '❌ Revogado' : '✅ Válido'}</p>
                      <p className="col-span-2"><strong>Aluno:</strong> {result.details.studentName}</p>
                      <p className="col-span-2"><strong>Endereço:</strong> {formatAddress(result.details.student)}</p>
                      <p className="col-span-2"><strong>Curso:</strong> {result.details.courseName}</p>
                      <p><strong>Carga Horária:</strong> {result.details.workloadHours}h</p>
                      <p><strong>Emissor:</strong> {formatAddress(result.details.issuedBy)}</p>
                      <p className="col-span-2"><strong>Data de Emissão:</strong> {formatDate(result.details.issuedAt)}</p>
                    </div>
                    
                    {result.details.revoked && result.details.revokeReason !== 'N/A' && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-700">
                        <strong>Motivo da Revogação:</strong> {result.details.revokeReason}
                      </div>
                    )}
                    
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 break-all">
                        <strong>Hash do Documento:</strong> {result.hash || result.details.documentHash}
                      </p>
                    </div>
                  </div>
                )}

                {!result.isValid && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>O certificado não foi encontrado na blockchain ou foi revogado.</p>
                    <ul className="list-disc list-inside mt-1 text-xs text-gray-500">
                      <li>Verifique se o ID está correto</li>
                      <li>Verifique se o PDF é o original</li>
                      <li>O certificado pode ter sido revogado</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-blue-700">
              <p>A verificação é pública e não requer conexão com a MetaMask.</p>
              <p className="text-xs text-blue-600 mt-1">
                Qualquer pessoa pode verificar a autenticidade de um certificado usando o ID ou o PDF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;