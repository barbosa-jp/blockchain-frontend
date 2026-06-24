import React, { useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { calculateSHA256 } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Search, FileUp, Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';

const VerifyPage = () => {
  const { provider } = useMetaMask();
  const [verifyMethod, setVerifyMethod] = useState('id');
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
        if (!certificateId || isNaN(certificateId)) {
          toast.error('Digite um ID válido');
          setIsLoading(false);
          return;
        }

        toast.info('Funcionalidade em desenvolvimento. Use a verificação por PDF.');
        
      } else {
        if (!file) {
          toast.error('Selecione um arquivo PDF');
          setIsLoading(false);
          return;
        }

        const fileHash = await calculateSHA256(file);
        const [isValid, id] = await contract.verifyByHash(fileHash);

        if (isValid) {
          setResult({
            isValid: true,
            id: id.toString(),
            message: 'Certificado válido!',
            hash: fileHash
          });
          toast.success('Certificado verificado com sucesso!');
        } else {
          setResult({
            isValid: false,
            message: 'Certificado inválido ou não encontrado',
            hash: fileHash
          });
          toast.error('Certificado não encontrado');
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Verificar Certificado</h1>

      <div className="card space-y-6">
        <div className="flex space-x-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => setVerifyMethod('id')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              verifyMethod === 'id'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search size={18} />
            <span>Por ID</span>
          </button>
          <button
            onClick={() => setVerifyMethod('file')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              verifyMethod === 'file'
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} />
            <span>Por PDF</span>
          </button>
        </div>

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
                placeholder="Ex: 123"
                disabled={isLoading}
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

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-700 font-semibold">Erro na verificação</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

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
                {result.isValid && (
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p><strong>ID:</strong> {result.id}</p>
                    <p><strong>Hash:</strong> <span className="font-mono text-xs">{result.hash}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;