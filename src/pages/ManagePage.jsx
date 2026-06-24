import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { getContract } from '../utils/contract';
import { formatAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Users, UserPlus, UserMinus, Loader2, CheckCircle, Shield, AlertCircle, Eye } from 'lucide-react';

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
      
      // Verifica quem é o owner
      const owner = await contract.owner();
      setOwnerAddress(owner);
      
      // Verifica se o usuário conectado é o owner
      const isUserOwner = owner.toLowerCase() === account.toLowerCase();
      setIsOwner(isUserOwner);
      
      // Verifica se o usuário é um emissor autorizado
      const isUserAuthorized = await contract.isAuthorizedIssuer(account);
      setIsAuthorized(isUserAuthorized);

      // Se for owner OU emissor autorizado, carrega a lista de emissores
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
      // Como não temos uma função para listar todos os emissores,
      // vamos buscar os emissores a partir do evento ou de um mapping
      // Por enquanto, vamos usar uma lista simulada
      // Na prática, você precisaria armazenar os emissores em um array no contrato
      
      // Exemplo de como seria com um array:
      // const issuerList = await contract.getIssuers();
      // setIssuers(issuerList);
      
      // Por enquanto, vamos criar uma lista vazia
      setIssuers([]);
      
      // Para teste, você pode adicionar alguns endereços manualmente
      // setIssuers(['0x123...', '0x456...']);
    } catch (err) {
      console.error('Erro ao carregar emissores:', err);
    }
  };

  const handleAddIssuer = async (e) => {
    e.preventDefault();

    // Permite tanto owner quanto emissores autorizados
    if (!isOwner && !isAuthorized) {
      toast.error('Você não tem permissão para autorizar emissores');
      return;
    }

    if (!newIssuerAddress) {
      toast.error('Digite um endereço válido');
      return;
    }

    // Validação básica do endereço
    if (!newIssuerAddress.startsWith('0x') || newIssuerAddress.length !== 42) {
      toast.error('Endereço Ethereum inválido. Deve começar com 0x e ter 42 caracteres');
      return;
    }

    // Não permite autorizar a si mesmo
    if (newIssuerAddress.toLowerCase() === account.toLowerCase()) {
      toast.error('Você já é um emissor autorizado');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.authorizeIssuer(newIssuerAddress);
      
      toast.loading('Aguardando confirmação da transação...', { id: 'add-issuer' });
      await tx.wait();

      toast.success('Emissor autorizado com sucesso!', { id: 'add-issuer' });
      setNewIssuerAddress('');
      
      // Recarregar lista
      await checkPermissionsAndLoad();
    } catch (err) {
      console.error('Erro ao autorizar emissor:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`, { id: 'add-issuer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIssuer = async (address) => {
    // Permite tanto owner quanto emissores autorizados
    if (!isOwner && !isAuthorized) {
      toast.error('Você não tem permissão para revogar emissores');
      return;
    }

    // Não permite revogar a si mesmo
    if (address.toLowerCase() === account.toLowerCase()) {
      toast.error('Você não pode revogar a si mesmo');
      return;
    }

    // Não permite revogar o owner
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
      
      // Recarregar lista
      await checkPermissionsAndLoad();
    } catch (err) {
      console.error('Erro ao revogar emissor:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`, { id: 'remove-issuer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para verificar se um endereço é emissor
  const checkIfIssuer = async (address) => {
    try {
      const contract = getContract(signer);
      return await contract.isAuthorizedIssuer(address);
    } catch {
      return false;
    }
  };

  // Estado de carregamento
  if (isLoading || isChecking) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <span className="ml-3 text-gray-600">Carregando...</span>
      </div>
    );
  }

  // Se não estiver conectado
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

  // Se não for owner nem emissor autorizado
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
              Para se tornar um emissor autorizado, entre em contato com o owner do contrato.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se for owner ou emissor autorizado - mostrar o gerenciamento completo
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
            {isOwner || isAuthorized ? 'Você tem permissão total para gerenciar emissores' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start space-x-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Issuer - Disponível para owner e emissores */}
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

      {/* Issuers List - Visível para todos autorizados */}
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
            {issuers.map((issuer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500" size={18} />
                  <span className="font-mono text-sm">{formatAddress(issuer)}</span>
                  {issuer.toLowerCase() === account.toLowerCase() && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Você
                    </span>
                  )}
                  {issuer.toLowerCase() === ownerAddress.toLowerCase() && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Owner
                    </span>
                  )}
                </div>
                {(isOwner || isAuthorized) && (
                  <button
                    onClick={() => handleRemoveIssuer(issuer)}
                    disabled={isSubmitting || issuer.toLowerCase() === account.toLowerCase() || issuer.toLowerCase() === ownerAddress.toLowerCase()}
                    className={`text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded ${
                      (issuer.toLowerCase() === account.toLowerCase() || issuer.toLowerCase() === ownerAddress.toLowerCase()) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                    title={issuer.toLowerCase() === account.toLowerCase() ? 'Não pode revogar a si mesmo' : 
                           issuer.toLowerCase() === ownerAddress.toLowerCase() ? 'Não pode revogar o owner' : 
                           'Revogar emissor'}
                    disabled={issuer.toLowerCase() === account.toLowerCase() || issuer.toLowerCase() === ownerAddress.toLowerCase()}
                  >
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 flex items-center">
            <Shield className="mr-2" size={16} />
            Apenas emissores autorizados podem emitir e revogar certificados.
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

export default ManagePage;