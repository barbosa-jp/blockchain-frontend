import React from 'react';
import { Link } from 'react-router-dom';
import { useMetaMask } from '../hooks/useMetaMask';
import { formatAddress } from '../utils/helpers';
import { Wallet, LogOut } from 'lucide-react';

const Header = () => {
  const { account, isConnected, connectWallet, disconnectWallet, isConnecting } = useMetaMask();

  const handleConnect = async () => {
    await connectWallet();
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AcademicChain
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors">
              Início
            </Link>
            <Link to="/verify" className="text-gray-600 hover:text-primary-600 transition-colors">
              Verificar
            </Link>
            {isConnected && (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
                <Link to="/my-certificates" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Meus Certificados
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 font-medium">
                    {formatAddress(account)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="Desconectar"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-primary flex items-center space-x-2"
              >
                <Wallet size={20} />
                <span>{isConnecting ? 'Conectando...' : 'Conectar MetaMask'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;