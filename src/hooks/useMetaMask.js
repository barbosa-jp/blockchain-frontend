import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export const useMetaMask = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const SEPOLIA_CHAIN_ID = '0xaa36a7';

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask não está instalada!');
      setError('MetaMask não encontrada');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });

      if (chainIdHex !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(chainIdHex);
      setIsConnected(true);

      toast.success('Carteira conectada com sucesso!');
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setError(err.message);
      toast.error(`Erro ao conectar: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    toast.success('Carteira desconectada');
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        toast.info('Conta alterada');
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const chainIdHex = await window.ethereum.request({
              method: 'eth_chainId',
            });

            setProvider(provider);
            setSigner(signer);
            setAccount(accounts[0]);
            setChainId(chainIdHex);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Erro ao verificar conexão:', err);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
    isSepolia: chainId === SEPOLIA_CHAIN_ID,
  };
};