import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-semibold text-gray-700">AcademicChain</span>
            <span className="text-sm text-gray-500 ml-2">© 2026</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
              Etherscan
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;