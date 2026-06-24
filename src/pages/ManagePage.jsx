import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { formatAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Users, UserPlus, UserMinus, Loader2, CheckCircle, Shield } from 'lucide-react';

const ManagePage = () => {
  const { signer, account, isConnected } = useMetaMask();
  const [issuers, setIssuers] = useState([]);
  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      checkOwnerAndLoadIssuers();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, account]);

  const checkOwnerAndLoadIssuers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      setIssuers([]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIssuer = async (e) => {
    e.preventDefault();

    if (!newIssuerAddress || !isOwner) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.authorizeIssuer(newIssuerAddress);
      
      toast.loading('Aguardando confirmação...', { id: 'add-issuer' });
      await tx.wait();

      toast.success('Emissor autorizado com sucesso!', { id: 'add-issuer' });
      setNewIssuerAddress('');
      await checkOwnerAndLoadIssuers();
    } catch (err) {
      console.error('Erro ao autorizar emissor:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`, { id: 'add-issuer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIssuer = async (address) => {
    if (!isOwner) return;

    if (!confirm(`Deseja realmente revogar o emissor ${formatAddress(address)}?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.revokeIssuer(address);
      
      toast.loading('Aguardando confirmação...', { id: 'remove-issuer' });
      await tx.wait();

      toast.success('Emissor revogado com sucesso!', { id: 'remove-issuer' });
      await checkOwnerAndLoadIssuers();
    } catch (err) {
      console.error('Erro ao revogar emissor:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`, { id: 'remove-issuer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Conecte sua MetaMask
        </h2>
        <p className="text-gray-500">Para gerenciar emissores, você precisa estar conectado</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <span className="ml-3 text-gray-600">Carregando...</span>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Acesso Restrito
        </h2>
        <p className="text-gray-500">
          Apenas o administrador (Owner) do contrato pode gerenciar emissores.
          <br />
          <span className="text-sm text-gray-400">
            Entre com a carteira que possui privilégios de administrador.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Emissores</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <UserPlus className="mr-2" size={20} />
          Autorizar Novo Emissor
        </h2>
        <form onSubmit={handleAddIssuer} className="flex space-x-3">
          <input
            type="text"
            value={newIssuerAddress}
            onChange={(e) => setNewIssuerAddress(e.target.value)}
            className="input-field flex-1"
            placeholder="Endereço Ethereum do emissor (0x...)"
            disabled={isSubmitting}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || !newIssuerAddress}
            className="btn-primary flex items-center space-x-2 whitespace-nowrap"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <UserPlus size={20} />
            )}
            <span>Autorizar</span>
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Users className="mr-2" size={20} />
          Emissores Autorizados
        </h2>

        {issuers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum emissor autorizado encontrado.
            <br />
            <span className="text-sm">Adicione o primeiro emissor acima.</span>
          </p>
        ) : (
          <div className="space-y-3">
            {issuers.map((issuer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500" size={18} />
                  <span className="font-mono text-sm">{formatAddress(issuer)}</span>
                </div>
                <button
                  onClick={() => handleRemoveIssuer(issuer)}
                  disabled={isSubmitting}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                  title="Revogar emissor"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <Shield className="inline-block mr-2" size={16} />
            Apenas emissores autorizados podem emitir e revogar certificados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManagePage;