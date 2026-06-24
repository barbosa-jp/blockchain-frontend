import React from 'react';
import { Link } from 'react-router-dom';
import { useMetaMask } from '../hooks/useMetaMask';
import { FileUp, Search, Award, Users, Shield } from 'lucide-react';

const DashboardPage = () => {
  const { account } = useMetaMask();

  const actions = [
    {
      icon: FileUp,
      title: 'Emitir Certificado',
      description: 'Crie e emita novos certificados acadêmicos',
      to: '/issue',
      color: 'from-blue-500 to-blue-700'
    },
    {
      icon: Search,
      title: 'Verificar Certificado',
      description: 'Verifique a autenticidade de um certificado',
      to: '/verify',
      color: 'from-green-500 to-green-700'
    },
    {
      icon: Award,
      title: 'Meus Certificados',
      description: 'Visualize todos os seus certificados',
      to: '/my-certificates',
      color: 'from-purple-500 to-purple-700'
    },
    {
      icon: Users,
      title: 'Gerenciar Emissores',
      description: 'Autorize ou revogue emissores (Admin)',
      to: '/manage',
      color: 'from-orange-500 to-orange-700'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Conectado como: <span className="font-mono text-primary-600">{account}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.to}
            className="card hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-white`}>
                <action.icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-600 mt-1">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-blue-800">Rede Sepolia</h4>
            <p className="text-sm text-blue-700">
              Você está conectado à rede de testes Sepolia. Certifique-se de ter ETH de teste para realizar transações.
              <br />
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 underline font-medium hover:text-blue-600"
              >
                Obter ETH de teste aqui
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;