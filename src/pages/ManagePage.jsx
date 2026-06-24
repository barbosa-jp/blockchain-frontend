import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { formatAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Users, UserPlus, UserMinus, Loader2, CheckCircle, Shield, AlertCircle } from 'lucide-react';

const ManagePage = () => {
  const { signer, account, isConnected } = useMetaMask();
  const [issuers, setIssuers] = useState([]);
  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isConnected && account && signer) {
      checkPermissionsAndLoad();
    } else {
      setIsLoading(false);
      setIsChecking(false);
    }
  }, [isConnected, account, signer]);

  const checkPermissionsAndLoad = async () => {
    setIsLoading(true);
    setIsChecking(true);
    setError(null);

    try {
      const contract = getContract(signer);
      
      const owner = await contract.owner();
      setOwnerAddress(owner);
      
      const isUserOwner = owner.toLowerCase() === account.toLowerCase();
      setIsOwner(isUserOwner);
      
      const isUserAuthorized = await contract.isAuthorizedIssuer(account);
      setIsAuthorized(isUserAuthorized);

      if (isUserOwner || isUserAuthorized) {
        await loadIssuers(contract);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  const loadIssuers = async (contract) => {
    try {
      const issuerList = await contract.getAuthorizedIssuers();
      console.log('Lista de emissores:', issuerList);
      
      const issuerAddresses = issuerList.map(addr => addr.toLowerCase());
      setIssuers(issuerAddresses);
    } catch (err) {
      console.error('Erro ao carregar emissores:', err);
      setIssuers([]);
    }
  };

  const handleAddIssuer = async (e) => {
    e.preventDefault();

    if (!isOwner && !isAuthorized) {
      toast.error('Você não tem permissão para autorizar emissores');
      return;
    }

    if (!newIssuerAddress) {
      toast.error('Digite um endereço válido');
      return;
    }

    if (!newIssuerAddress.startsWith('0x') || newIssuerAddress.length !== 42) {
      toast.error('Endereço Ethereum inválido');
      return;
    }

    if (newIssuerAddress.toLowerCase() === account.toLowerCase()) {
      toast.error('Você não pode autorizar a si mesmo');
      return;
    }

    if (newIssuerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      toast.error('O owner já é um emissor autorizado');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const contract = getContract(signer);
      
      const isAlreadyIssuer = await contract.isAuthorizedIssuer(newIssuerAddress);
      if (isAlreadyIssuer) {
        toast.error('Este endereço já é um emissor autorizado');
        setIsSubmitting(false);
        return;
      }
      
      const tx = await contract.authorizeIssuer(newIssuerAddress);
      
      toast.loading('Aguardando confirmação da transação...', { id: 'add-issuer' });
      await tx.wait();

      toast.success('Emissor autorizado com sucesso!', { id: 'add-issuer' });
      setNewIssuerAddress('');
      
      await checkPermissionsAndLoad();
    } catch (err) {
      console.error('Erro ao autorizar emissor:', err);
      let errorMsg = err.message;
      
      if (errorMsg.includes('execution reverted')) {
        if (errorMsg.includes('Apenas owner ou emissores autorizados')) {
          errorMsg = '❌ Você não tem permissão para autorizar emissores';
        } else if (errorMsg.includes('Ja e um emissor autorizado')) {
          errorMsg = '❌ Este endereço já é um emissor autorizado';
        } else if (errorMsg.includes('Endereco invalido')) {
          errorMsg = '❌ Endereço inválido';
        } else {
          errorMsg = '❌ Transação revertida. Verifique se você tem permissão.';
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg, { id: 'add-issuer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIssuer = async (address) => {
    if (!isOwner && !isAuthorized) {
      toast.error('Você não tem permissão para revogar emissores');
      return;
    }

    if (address.toLowerCase() === account.toLowerCase()) {
      toast.error('Você não pode revogar a si mesmo');
      return;
    }

    if (address.toLowerCase() === ownerAddress.toLowerCase()) {
      toast.error('Não é possível revogar o owner do contrato');
      return;
    }

    if (!confirm(`Deseja realmente revogar o emissor ${formatAddress(address)}?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.revokeIssuer(address);
      
      toast.loading('Aguardando confirmação da transação...', { id: 'remove-issuer' });
      await tx.wait();

      toast.success('Emissor revogado com sucesso!', { id: 'remove-issuer' });
      
      await checkPermissionsAndLoad();
    } catch (err) {
      console.error('Erro ao revogar emissor:', err);
      let errorMsg = err.message;
      
      if (errorMsg.includes('execution reverted')) {
        if (errorMsg.includes('Apenas owner ou emissores autorizados')) {
          errorMsg = '❌ Você não tem permissão para revogar emissores';
        } else if (errorMsg.includes('Nao e um emissor autorizado')) {
          errorMsg = '❌ Este endereço não é um emissor autorizado';
        } else {
          errorMsg = '❌ Transação revertida. Verifique se você tem permissão.';
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg, { id: 'remove-issuer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isChecking) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <span className="ml-3 text-gray-600">Carregando...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Conecte sua MetaMask
        </h2>
        <p className="text-gray-500">Para gerenciar emissores, você precisa estar conectado</p>
      </div>
    );
  }

  if (!isOwner && !isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Acesso Restrito
          </h2>
          <p className="text-gray-500 mb-4">
            Você precisa ser um <strong>owner</strong> ou <strong>emissor autorizado</strong> para acessar esta página.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-600">
              <strong>Seu endereço:</strong>
              <br />
              <span className="font-mono text-xs break-all">{account}</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Owner do contrato:</strong>
              <br />
              <span className="font-mono text-xs break-all">{ownerAddress}</span>
            </p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-yellow-700 text-left">
              Para se tornar um emissor autorizado, entre em contato com o owner ou um emissor autorizado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="mr-3 text-primary-600" size={28} />
          Gerenciar Emissores
        </h1>
        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
              <Shield size={14} className="mr-1" />
              Owner
            </span>
          )}
          {isAuthorized && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
              <CheckCircle size={14} className="mr-1" />
              Emissor Autorizado
            </span>
          )}
          <span className="text-sm text-gray-500 ml-2">
            {isOwner || isAuthorized ? 'Você tem permissão para gerenciar emissores' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start space-x-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {(isOwner || isAuthorized) && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <UserPlus className="mr-2" size={20} />
            Autorizar Novo Emissor
          </h2>
          <form onSubmit={handleAddIssuer} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
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
              className="btn-primary flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <UserPlus size={20} />
              )}
              <span>Autorizar</span>
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            O emissor autorizado poderá emitir certificados e gerenciar outros emissores
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Users className="mr-2" size={20} />
          Emissores Autorizados
          <span className="ml-2 text-xs text-gray-400 font-normal">
            (Total: {issuers.length})
          </span>
        </h2>

        {issuers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Nenhum emissor autorizado encontrado.
            </p>
            {(isOwner || isAuthorized) && (
              <p className="text-sm text-gray-400">
                Adicione o primeiro emissor usando o formulário acima.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {issuers.map((issuer, index) => {
              const isCurrentUser = issuer.toLowerCase() === account.toLowerCase();
              const isOwnerAddress = issuer.toLowerCase() === ownerAddress.toLowerCase();
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-500" size={18} />
                    <span className="font-mono text-sm">{formatAddress(issuer)}</span>
                    {isCurrentUser && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Você
                      </span>
                    )}
                    {isOwnerAddress && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                  {(isOwner || isAuthorized) && (
                    <button
                      onClick={() => handleRemoveIssuer(issuer)}
                      disabled={isSubmitting || isCurrentUser || isOwnerAddress}
                      className={`text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded ${
                        (isCurrentUser || isOwnerAddress) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={
                        isCurrentUser ? 'Não pode revogar a si mesmo' : 
                        isOwnerAddress ? 'Não pode revogar o owner' : 
                        'Revogar emissor'
                      }
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 flex items-center">
            <Shield className="mr-2" size={16} />
            Apenas emissores autorizados podem emitir certificados.
          </p>
          {(isOwner || isAuthorized) && (
            <p className="text-sm text-blue-600 mt-1">
              <CheckCircle size={14} className="inline mr-1" />
              Você tem permissão para autorizar e revogar emissores.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ VERIFIQUE SE ESTA LINHA EXISTE NO FINAL DO ARQUIVO
export default ManagePage;