import { formatUnits, Interface, type Log, type Provider } from "ethers";
import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { KONTOR_ESCROW_ABI } from "./abis";
import { operationalLog } from "./logger";

const escrowInterface = new Interface(KONTOR_ESCROW_ABI);

type IndexerOptions = {
  provider: Provider;
  network: string;
  contractAddress: string;
  confirmations?: number;
  startBlock?: number;
  batchSize?: number;
};

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, jsonValue(nested)])
    );
  }
  return value as Prisma.InputJsonValue;
}

function parsedPayload(log: Log) {
  const parsed = escrowInterface.parseLog({ topics: [...log.topics], data: log.data });
  if (!parsed) return null;
  const payload: Record<string, Prisma.InputJsonValue> = {};
  parsed.fragment.inputs.forEach((input, index) => {
    payload[input.name || String(index)] = jsonValue(parsed.args[index]);
  });
  return { eventName: parsed.name, payload };
}

async function updateMilestoneAfterExecution(milestoneId: string) {
  const milestone = await prisma.tradeMilestone.findUnique({
    where: { id: milestoneId },
    include: { settlements: { where: { status: "EXECUTED" } } },
  });
  if (!milestone) return;
  const executed = milestone.settlements.reduce(
    (sum, settlement) => sum.add(settlement.amountUsdc),
    milestone.amountUsdc.mul(0)
  );
  await prisma.tradeMilestone.update({
    where: { id: milestoneId },
    data: {
      status: executed.gte(milestone.amountUsdc) ? "RELEASED" : "PARTIALLY_RELEASED",
    },
  });
}

async function applyEscrowEvent(
  eventName: string,
  payload: Record<string, Prisma.InputJsonValue>,
  transactionHash: string
) {
  const blockchainTradeId = Number(payload.tradeId);
  if (!Number.isSafeInteger(blockchainTradeId) || blockchainTradeId <= 0) return;
  const trade = await prisma.tradeMetadata.findUnique({ where: { blockchainTradeId } });
  if (!trade) return;

  if (eventName === "TradeFunded") {
    await prisma.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "FUNDED" },
    });
  } else if (eventName === "TradePartialReleased") {
    await prisma.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "PARTIAL_SETTLEMENT" },
    });
  } else if (eventName === "TradeCompleted") {
    await prisma.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "RELEASED", operationalStatus: "CONDITIONS_SATISFIED" },
    });
  } else if (eventName === "TradeTimedOut" || eventName === "DisputeTimedOut") {
    await prisma.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "REFUNDED" },
    });
  } else if (eventName === "DisputeRaised") {
    await prisma.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "DISPUTED", operationalStatus: "DISPUTED" },
    });
  } else if (eventName === "DisputeResolved") {
    await prisma.tradeMetadata.update({
      where: { id: trade.id },
      data: {
        settlementStatus: payload.refundBuyer === true ? "REFUNDED" : "RELEASED",
        operationalStatus: "CONDITIONS_SATISFIED",
      },
    });
  } else if (eventName === "ReleaseApproved") {
    const amount = String(payload.amount);
    const evidenceRoot = String(payload.evidenceRoot).toLowerCase();
    const settlement = await prisma.milestoneSettlement.findFirst({
      where: {
        milestone: { tradeId: trade.id },
        amountUsdc: { equals: formatUnits(BigInt(amount), 6) },
        evidenceRoot,
        status: { in: ["PROPOSED", "APPROVED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    if (settlement) {
      await prisma.milestoneSettlement.update({
        where: { id: settlement.id },
        data: { status: "EXECUTED", transactionHash },
      });
      await updateMilestoneAfterExecution(settlement.milestoneId);
    }
  }
}

async function processLog(
  log: Log,
  network: string,
  contractAddress: string
) {
  const parsed = parsedPayload(log);
  if (!parsed) return;
  const unique = {
    network_contractAddress_transactionHash_logIndex: {
      network,
      contractAddress,
      transactionHash: log.transactionHash,
      logIndex: log.index,
    },
  };
  const existing = await prisma.chainEvent.findUnique({ where: unique });
  if (existing?.status === "PROCESSED") return;
  const chainEvent = existing || await prisma.chainEvent.create({
    data: {
      network,
      contractAddress,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.index,
      eventName: parsed.eventName,
      payload: parsed.payload,
    },
  });

  try {
    await applyEscrowEvent(parsed.eventName, parsed.payload, log.transactionHash);
    await prisma.chainEvent.update({
      where: { id: chainEvent.id },
      data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null },
    });
    await prisma.deadLetterEvent.updateMany({
      where: { chainEventId: chainEvent.id, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.chainEvent.update({
      where: { id: chainEvent.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 2000) },
    });
    await prisma.deadLetterEvent.upsert({
      where: { chainEventId: chainEvent.id },
      create: { chainEventId: chainEvent.id, lastError: message.slice(0, 2000) },
      update: {
        retryCount: { increment: 1 },
        lastError: message.slice(0, 2000),
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    operationalLog("error", "chain_event_failed", {
      eventName: parsed.eventName,
      transactionHash: log.transactionHash,
      error: message,
    });
  }
}

async function retryDeadLetters(network: string, contractAddress: string) {
  const deadLetters = await prisma.deadLetterEvent.findMany({
    where: {
      resolvedAt: null,
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      chainEvent: { network, contractAddress },
    },
    include: { chainEvent: true },
    orderBy: { createdAt: "asc" },
    take: 25,
  });
  let recovered = 0;
  for (const deadLetter of deadLetters) {
    try {
      await applyEscrowEvent(
        deadLetter.chainEvent.eventName,
        deadLetter.chainEvent.payload as Record<string, Prisma.InputJsonValue>,
        deadLetter.chainEvent.transactionHash
      );
      await prisma.$transaction([
        prisma.chainEvent.update({
          where: { id: deadLetter.chainEventId },
          data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null },
        }),
        prisma.deadLetterEvent.update({
          where: { id: deadLetter.id },
          data: { resolvedAt: new Date(), nextRetryAt: null },
        }),
      ]);
      recovered++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.deadLetterEvent.update({
        where: { id: deadLetter.id },
        data: {
          retryCount: { increment: 1 },
          lastError: message.slice(0, 2000),
          nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    }
  }
  return recovered;
}

export async function runEscrowIndexer(options: IndexerOptions) {
  const confirmations = options.confirmations ?? 12;
  const batchSize = options.batchSize ?? 1000;
  const contractAddress = options.contractAddress.toLowerCase();
  const recoveredDeadLetters = await retryDeadLetters(options.network, contractAddress);
  const latestBlock = await options.provider.getBlockNumber();
  const safeBlock = latestBlock - confirmations;
  if (safeBlock < 0) return { processedTo: 0, logs: 0 };

  const cursor = await prisma.chainCursor.findUnique({
    where: {
      network_contractAddress: { network: options.network, contractAddress },
    },
  });
  let fromBlock = cursor
    ? Number(cursor.lastProcessedBlock) + 1
    : options.startBlock ?? safeBlock;
  let logCount = 0;

  while (fromBlock <= safeBlock) {
    const toBlock = Math.min(safeBlock, fromBlock + batchSize - 1);
    const logs = await options.provider.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock,
    });
    for (const log of logs) {
      await processLog(log, options.network, contractAddress);
      logCount++;
    }
    await prisma.chainCursor.upsert({
      where: {
        network_contractAddress: { network: options.network, contractAddress },
      },
      create: {
        network: options.network,
        contractAddress,
        lastProcessedBlock: toBlock,
        confirmations,
      },
      update: { lastProcessedBlock: toBlock, confirmations },
    });
    fromBlock = toBlock + 1;
  }

  operationalLog("info", "chain_indexer_complete", {
    network: options.network,
    contractAddress,
    safeBlock,
    logCount,
  });
  return { processedTo: safeBlock, logs: logCount, recoveredDeadLetters };
}
