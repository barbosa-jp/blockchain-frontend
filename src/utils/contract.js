import { ethers } from 'ethers';
import contractAbi from '../abi/AcademicChain.json';
import tokenAbi from '../abi/AcademicToken.json';

export const CONTRACT_ADDRESS = '0xAA1f215b31bd6Ee1c6B8E3D4AAc6EBf9a3feE33d';
export const TOKEN_ADDRESS = '0x1f99B5E241Bb468946114998fC9873ef297455Cc';

export const getContract = (signerOrProvider) => new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signerOrProvider);
export const getTokenContract = (signerOrProvider) => new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signerOrProvider);
