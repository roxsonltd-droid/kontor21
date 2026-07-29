"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, parseUnits, formatUnits } from "ethers";
import {
  CONTRACT_ADDRESSES,
  KONTOR_ESCROW_ABI,
  TEST_USDC_ABI,
} from "@/lib/abis";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

const HARDHAT_CHAIN_ID = "0x7a69";
const HARDHAT_RPC = "http://127.0.0.1:8545";

export function useKontorEscrow() {
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [usdcContract, setUsdcContract] = useState<Contract | null>(null);
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const initContracts = useCallback(async (address: string) => {
    if (!window.ethereum) return;
    const bp = new BrowserProvider(window.ethereum);
    const signer = await bp.getSigner();
    const escrow = new Contract(
      CONTRACT_ADDRESSES.kontorEscrow,
      KONTOR_ESCROW_ABI,
      signer
    );
    const usdc = new Contract(
      CONTRACT_ADDRESSES.testUSDC,
      TEST_USDC_ABI,
      signer
    );
    setEscrowContract(escrow);
    setUsdcContract(usdc);
    setSignerAddress(address);
  }, []);

  const ensureHardhatNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== HARDHAT_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      }
      return true;
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: HARDHAT_CHAIN_ID,
              chainName: "Hardhat Localhost",
              rpcUrls: [HARDHAT_RPC],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      alert("Моля, инсталирайте MetaMask портфейл!");
      return null;
    }
    setIsConnecting(true);
    try {
      const netOk = await ensureHardhatNetwork();
      if (!netOk) {
        setIsConnecting(false);
        return null;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      await initContracts(address);
      setIsConnecting(false);
      return address;
    } catch (error) {
      console.error("Error connecting wallet", error);
      setIsConnecting(false);
      return null;
    }
  };

  useEffect(() => {
    if (window.ethereum && CONTRACT_ADDRESSES.kontorEscrow) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            initContracts(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, [initContracts]);

  const createTrade = async (
    buyer: string,
    oracle: string,
    amount: number,
    tokenAddress: string,
    conditionDescription: string
  ) => {
    if (!escrowContract) return null;
    try {
      const amountWei = parseUnits(amount.toString(), 6);
      const tx = await escrowContract.createTrade(
        buyer,
        oracle,
        amountWei,
        tokenAddress,
        conditionDescription
      );
      const receipt = await tx.wait();
      const tradeCreatedLog = receipt.logs.find(
        (log: { fragment?: { name?: string } }) => log.fragment?.name === "TradeCreated"
      );
      const tradeId = tradeCreatedLog
        ? Number(tradeCreatedLog.args[0])
        : null;
      return tradeId;
    } catch (error) {
      console.error("createTrade failed", error);
      return null;
    }
  };

  const fundTrade = async (tradeId: number) => {
    if (!escrowContract || !usdcContract) return false;
    try {
      const trade = await escrowContract.trades(tradeId);
      const amountWei = trade.amount;
      const approveTx = await usdcContract.approve(
        CONTRACT_ADDRESSES.kontorEscrow,
        amountWei
      );
      await approveTx.wait();
      const tx = await escrowContract.fundTrade(tradeId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("fundTrade failed", error);
      return false;
    }
  };

  const approveTradeByOracle = async (tradeId: number) => {
    if (!escrowContract) return false;
    try {
      const tx = await escrowContract.approveTradeByOracle(tradeId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("approveTradeByOracle failed", error);
      return false;
    }
  };

  const raiseDispute = async (tradeId: number) => {
    if (!escrowContract) return false;
    try {
      const tx = await escrowContract.raiseDispute(tradeId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("raiseDispute failed", error);
      return false;
    }
  };

  const resolveDispute = async (tradeId: number, refundBuyer: boolean) => {
    if (!escrowContract) return false;
    try {
      const tx = await escrowContract.resolveDispute(tradeId, refundBuyer);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("resolveDispute failed", error);
      return false;
    }
  };

  const getTrade = async (tradeId: number) => {
    if (!escrowContract) return null;
    try {
      const trade = await escrowContract.trades(tradeId);
      return {
        buyer: trade[0],
        seller: trade[1],
        oracle: trade[2],
        amount: formatUnits(trade[3], 6),
        token: trade[4],
        status: Number(trade[5]),
        conditionDescription: trade[6],
      };
    } catch (error) {
      console.error("getTrade failed", error);
      return null;
    }
  };

  const getUsdcBalance = async (address: string) => {
    if (!usdcContract) return "0";
    try {
      const bal = await usdcContract.balanceOf(address);
      return formatUnits(bal, 6);
    } catch {
      return "0";
    }
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  return {
    address: signerAddress,
    formattedAddress: formatAddress(signerAddress),
    isConnecting,
    connect,
    createTrade,
    fundTrade,
    approveTradeByOracle,
    raiseDispute,
    resolveDispute,
    getTrade,
    getUsdcBalance,
  };
}
