import { useState, useEffect } from "react";
import { useMetaMask } from "./useMetaMask";
import { getTokenContract } from "../utils/contract";
import { ethers } from "ethers";

export const useGovernanceToken = () => {
  const { signer, account, isConnected } = useMetaMask();
  const [balance, setBalance] = useState(0n);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !account || !signer) {
      setBalance(0n);
      setHasToken(false);
      setIsLoading(false);
      return;
    }
    const fetchBalance = async () => {
      try {
        const token = getTokenContract(signer);
        const bal = await token.balanceOf(account);
        setBalance(bal);
        setHasToken(bal > 0n);
      } catch (err) {
        console.error("Erro ao buscar saldo ACT:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, [isConnected, account, signer]);

  const formatBalance = () => ethers.formatEther(balance);

  return { balance, hasToken, isLoading, formatBalance };
};
