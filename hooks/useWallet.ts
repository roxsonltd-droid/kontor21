"use client";

import { useState, useEffect } from 'react';
import type { Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return;
      
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking wallet connection", error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const { ethereum } = window;

      if (!ethereum) {
        alert("Моля, инсталирайте MetaMask портфейл!");
        setIsConnecting(false);
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
      setIsConnecting(false);
      return accounts[0];
    } catch (error) {
      console.error("Error connecting wallet", error);
      setIsConnecting(false);
    }
  };

  // Helper function to format address like 0x123...ABCD
  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  return {
    address,
    formattedAddress: formatAddress(address),
    isConnecting,
    connectWallet
  };
}
