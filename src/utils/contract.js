import { ethers } from 'ethers';
import contractAbi from '../abi/AcademicChain.json';
import tokenAbi from '../abi/AcademicToken.json';

export const CONTRACT_ADDRESS = '0xE5FE02f74bBA6B8571F8DE404Cf2f981D9aF683b';
export const TOKEN_ADDRESS = '0x852D02750a7EdEb4290E782EC2E69Fcd2dEBac2E';

export const getContract = (signerOrProvider) => new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signerOrProvider);
export const getTokenContract = (signerOrProvider) => new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signerOrProvider);
