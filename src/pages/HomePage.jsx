import React from 'react';
import { Link } from 'react-router-dom';
import { useMetaMask } from '../hooks/useMetaMask';
import { Shield, Globe, Infinity, ArrowRight } from 'lucide-react';

const HomePage = () => {
  const { isConnected, connectWallet, isConnecting } = useMetaMask();

  const steps = [
    {
      number: 1,
      title: 'Conectar Carteira',
      description: 'Conecte sua MetaMask à rede de testes Sepolia'
    },
    {
      number: 2,
      title: 'Emitir Certificado',
      description: 'Preencha os dados do aluno e faça upload do PDF'
    },
    {
      number: 3,
      title: 'Blockchain Storage',
      description: 'O hash do certificado é armazenado imutavelmente na blockchain'
    },
    {
      number: 4,
      title: 'Verificação Pública',
      description: 'Qualquer pessoa pode verificar a autenticidade usando ID ou PDF'
    }
  ];

  const stats = [
    { value: '100%', label: 'À Prova de Fraude', icon: Shield },
    { value: '24/7', label: 'Acesso Público', icon: Globe },
    { value: '∞', label: 'Armazenamento Permanente', icon: Infinity }
  ];

  return (
    <div className="space-y-16">
      <section className="text-center py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 bg-clip-text text-transparent">
          Certificados Acadêmicos<br />Verificados em Blockchain
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Emita e verifique certificados acadêmicos de forma segura, imutável e descentralizada na rede Ethereum Sepolia
        </p>
        {!isConnected ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
          >
            <span>{isConnecting ? 'Conectando...' : 'Conectar MetaMask'}</span>
            <ArrowRight size={24} />
          </button>
        ) : (
          <Link to="/dashboard" className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2">
            <span>Acessar Dashboard</span>
            <ArrowRight size={24} />
          </Link>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <stat.icon className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-3xl font-bold text-primary-700 mb-2">{stat.value}</h3>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Como Funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="card relative">
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white font-bold">
                {step.number}
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Pronto para Começar?</h2>
        <p className="text-xl mb-6 text-primary-100">
          Conecte sua MetaMask e comece a emitir ou verificar certificados acadêmicos na blockchain
        </p>
        {!isConnected ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            {isConnecting ? 'Conectando...' : 'Conectar MetaMask'}
          </button>
        ) : (
          <Link to="/dashboard" className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block">
            Ir para Dashboard
          </Link>
        )}
      </section>
    </div>
  );
};

export default HomePage;