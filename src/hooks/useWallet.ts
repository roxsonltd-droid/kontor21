"use client";

import { useState, useEffect } from 'react';

// Extend window object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected on load
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

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

  // Fake transaction method for UI demo purposes
  const mockTransaction = async (actionName: string) => {
    if (!address) {
      await connectWallet();
      if (!window.ethereum) return false;
    }
    
    try {
      // We simulate a contract interaction by sending a 0 ETH transaction to ourselves
      // This forces the MetaMask window to open and ask for confirmation, making the demo extremely realistic!
      const params = [{
        from: address,
        to: address,
        value: '0x0', // 0 ETH
      }];
      
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params,
      });
      
      return true;
    } catch (error) {
      console.error(`Transaction failed: ${actionName}`, error);
      return false;
    }
  };

  return {
    address,
    formattedAddress: formatAddress(address),
    isConnecting,
    connectWallet,
    mockTransaction
  };
}
