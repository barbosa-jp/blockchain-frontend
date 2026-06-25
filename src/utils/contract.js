import { ethers } from 'ethers';
import contractAbi from '../abi/AcademicChain.json';
import tokenAbi from '../abi/AcademicToken.json';

export const CONTRACT_ADDRESS = '0xA9b7A7540F73a9137396b1c426b15aA312E8B57a';
export const TOKEN_ADDRESS = '0xdd37e05e1BC340C1e916D5CaA77432D070Cc0212';

export const getContract = (signerOrProvider) => new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signerOrProvider);
export const getTokenContract = (signerOrProvider) => new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signerOrProvider);
