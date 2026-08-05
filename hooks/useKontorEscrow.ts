"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, parseUnits, formatUnits, keccak256, toUtf8Bytes } from "ethers";
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

const AMOY_CHAIN_ID = "0x13882"; // 80002 in hex
const AMOY_RPC = "https://rpc-amoy.polygon.technology";

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

  const ensureAmoyNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== AMOY_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: AMOY_CHAIN_ID }],
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
              chainId: AMOY_CHAIN_ID,
              chainName: "Polygon Amoy Testnet",
              rpcUrls: [AMOY_RPC],
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              blockExplorerUrls: ["https://amoy.polygonscan.com/"]
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Моля, инсталирайте MetaMask портфейл!");
      return null;
    }
    setIsConnecting(true);
    try {
      const netOk = await ensureAmoyNetwork();
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
  }, [ensureAmoyNetwork, initContracts]);

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

  const createTrade = useCallback(
    async (
      buyer: string,
      oracle: string,
      amount: number,
      tokenAddress: string
    ) => {
      if (!escrowContract) return null;
      try {
        const amountWei = parseUnits(amount.toString(), 6);
        const tx = await escrowContract.createTrade(
          buyer,
          oracle,
          amountWei,
          tokenAddress
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
    },
    [escrowContract]
  );

  const fundTrade = useCallback(
    async (tradeId: number) => {
      if (!escrowContract || !usdcContract) return false;
      try {
        const trade = await escrowContract.trades(tradeId);
        const amountWei = trade.totalAmount; // V2 uses totalAmount
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
    },
    [escrowContract, usdcContract]
  );

  const proposeRelease = useCallback(
    async (tradeId: number, milestoneHash: string, amount: number, evidenceCid: string) => {
      if (!escrowContract) return false;
      try {
        const amountWei = parseUnits(amount.toString(), 6);
        const evidenceRoot = keccak256(toUtf8Bytes(`ipfs://${evidenceCid}`));
        const tx = await escrowContract.proposeRelease(
          tradeId,
          milestoneHash,
          amountWei,
          evidenceRoot
        );
        await tx.wait();
        return true;
      } catch (error) {
        console.error("proposeRelease failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const proposeFullRelease = useCallback(
    async (tradeId: number, milestoneHash: string, evidenceCid: string) => {
      if (!escrowContract) return false;
      try {
        const trade = await escrowContract.trades(tradeId);
        const remaining = trade.totalAmount - trade.releasedAmount;
        if (remaining <= BigInt(0)) return false;
        const evidenceRoot = keccak256(toUtf8Bytes(`ipfs://${evidenceCid}`));
        const tx = await escrowContract.proposeRelease(
          tradeId,
          milestoneHash,
          remaining,
          evidenceRoot
        );
        await tx.wait();
        return true;
      } catch (error) {
        console.error("proposeFullRelease failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const approveRelease = useCallback(
    async (tradeId: number) => {
      if (!escrowContract) return false;
      try {
        const proposalId = Number(await escrowContract.pendingProposalOf(tradeId));
        if (proposalId <= 0) return false;
        const proposal = await escrowContract.proposals(proposalId);
        const pendingAmount = proposal.amount;
        const pendingEvidenceRoot = proposal.evidenceRoot;
        if (pendingAmount <= BigInt(0) || pendingEvidenceRoot === `0x${"0".repeat(64)}`) return false;
        const tx = await escrowContract.approveRelease(
          proposalId,
          pendingAmount,
          pendingEvidenceRoot
        );
        await tx.wait();
        return true;
      } catch (error) {
        console.error("approveRelease failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const cancelRelease = useCallback(
    async (proposalId: number) => {
      if (!escrowContract) return false;
      try {
        const tx = await escrowContract.cancelRelease(proposalId);
        await tx.wait();
        return true;
      } catch (error) {
        console.error("cancelRelease failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const claimTimeoutRefund = useCallback(
    async (tradeId: number) => {
      if (!escrowContract) return false;
      try {
        const tx = await escrowContract.claimTimeoutRefund(tradeId);
        await tx.wait();
        return true;
      } catch (error) {
        console.error("claimTimeoutRefund failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const claimDisputeTimeoutRefund = useCallback(
    async (tradeId: number) => {
      if (!escrowContract) return false;
      try {
        const tx = await escrowContract.claimDisputeTimeoutRefund(tradeId);
        await tx.wait();
        return true;
      } catch (error) {
        console.error("claimDisputeTimeoutRefund failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const raiseDispute = useCallback(
    async (tradeId: number) => {
      if (!escrowContract) return false;
      try {
        const tx = await escrowContract.raiseDispute(tradeId);
        await tx.wait();
        return true;
      } catch (error) {
        console.error("raiseDispute failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const voteDispute = useCallback(
    async (tradeId: number, refundBuyer: boolean) => {
      if (!escrowContract) return false;
      try {
        const tx = await escrowContract.voteDispute(tradeId, refundBuyer);
        await tx.wait();
        return true;
      } catch (error) {
        console.error("voteDispute failed", error);
        return false;
      }
    },
    [escrowContract]
  );

  const getTrade = useCallback(
    async (tradeId: number) => {
      if (!escrowContract) return null;
      try {
        const trade = await escrowContract.trades(tradeId);
        return {
          buyer: trade[0],
          seller: trade[1],
          oracle: trade[2],
          amount: formatUnits(trade[3], 6),
          releasedAmount: formatUnits(trade[4], 6),
          token: trade[5],
          status: Number(trade[6]),
          votesForBuyer: Number(trade[7]),
          votesForSeller: Number(trade[8]),
        };
      } catch (error) {
        console.error("getTrade failed", error);
        return null;
      }
    },
    [escrowContract]
  );

  const getUsdcBalance = useCallback(
    async (address: string) => {
      if (!usdcContract) return "0";
      try {
        const bal = await usdcContract.balanceOf(address);
        return formatUnits(bal, 6);
      } catch {
        return "0";
      }
    },
    [usdcContract]
  );

  const formatAddress = useCallback((addr: string | null) => {
    if (!addr) return "";
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  }, []);

  return {
    address: signerAddress,
    formattedAddress: formatAddress(signerAddress),
    isConnecting,
    connect,
    createTrade,
    fundTrade,
    proposeRelease,
    proposeFullRelease,
    approveRelease,
    cancelRelease,
    claimTimeoutRefund,
    claimDisputeTimeoutRefund,
    raiseDispute,
    voteDispute,
    getTrade,
    getUsdcBalance,
  };
}
