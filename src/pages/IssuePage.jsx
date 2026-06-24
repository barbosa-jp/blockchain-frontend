import React, { useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { calculateSHA256 } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FileUp, Loader2, CheckCircle, XCircle } from 'lucide-react';

const IssuePage = () => {
  const { signer, isConnected } = useMetaMask();

  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    workloadHours: '',
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Conecte sua MetaMask primeiro');
      return;
    }

    if (!file) {
      toast.error('Selecione um arquivo PDF');
      return;
    }

    const { studentName, courseName, workloadHours } = formData;
    if (!studentName || !courseName || !workloadHours) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const fileHash = await calculateSHA256(file);
      const contract = getContract(signer);
      
      const tx = await contract.issueCertificate(
        studentName,
        courseName,
        parseInt(workloadHours),
        fileHash
      );

      toast.loading('Aguardando confirmação da transação...', { id: 'tx' });

      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      toast.success('Certificado emitido com sucesso!', { id: 'tx' });

      setFormData({ studentName: '', courseName: '', workloadHours: '' });
      setFile(null);
      
      const fileInput = document.getElementById('pdf-upload');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Erro ao emitir certificado:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`, { id: 'tx' });
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
        <p className="text-gray-500">Para emitir certificados, você precisa estar conectado</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Emitir Certificado</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label-field">Nome do Aluno</label>
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
          <label className="label-field">Nome do Curso</label>
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
          <label className="label-field">Carga Horária (horas)</label>
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

        <div>
          <label className="label-field">PDF do Certificado</label>
          <div className="relative">
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            <label
              htmlFor="pdf-upload"
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
        </div>

        <button
          type="submit"
          disabled={isLoading || !file}
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
              <span>Emitir Certificado</span>
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

        {txHash && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-green-700 font-semibold">Certificado emitido com sucesso!</p>
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
        )}
      </form>
    </div>
  );
};

export default IssuePage;