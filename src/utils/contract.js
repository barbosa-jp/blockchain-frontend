import { ethers } from 'ethers';

// Substitua pelo endereço do seu contrato na Sepolia
export const CONTRACT_ADDRESS = '0xeE361DB55eE10Bc895121e5f1A1E0a44568b4409';

// ABI do contrato - você deve copiar do arquivo artifacts/contracts/AcademicChain.sol/AcademicChain.json
export const CONTRACT_ABI = [
  // Funções principais
  "function issueCertificate(string memory studentName, string memory courseName, uint256 workloadHours, string memory documentHash) external",
  "function revokeCertificate(uint256 id, string memory reason) external",
  "function getMyCertificates() external view returns (uint256[])",
  "function getCertificatesOf(address student) external view returns (uint256[])",
  "function verifyByHash(string memory documentHash) external view returns (bool, uint256)",
  "function authorizeIssuer(address issuer) external",
  "function revokeIssuer(address issuer) external",
  "function isAuthorizedIssuer(address issuer) external view returns (bool)",
  // Eventos
  "event CertificateIssued(uint256 indexed id, address indexed student, address indexed issuer, string documentHash)",
  "event CertificateRevoked(uint256 indexed id, string reason)",
  "event IssuerAuthorized(address indexed issuer)",
  "event IssuerRevoked(address indexed issuer)"
];

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};