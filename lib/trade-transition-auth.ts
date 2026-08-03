type TransitionData = {
  blockchainTradeId?: number | null;
  operationalStatus?: string;
  settlementStatus?: string;
};

type TransitionContext = {
  currentBlockchainTradeId: number | null;
  currentOperationalStatus: string;
  currentSettlementStatus: string;
  isBuyer: boolean;
  isSeller: boolean;
  isOracle: boolean;
  isArbitrator: boolean;
};

export function isAuthorizedTradeTransition(
  data: TransitionData,
  context: TransitionContext
) {
  const fields = Object.keys(data);
  const onlyFields = (...expected: string[]) =>
    fields.length === expected.length && expected.every((field) => fields.includes(field));

  return (
    (onlyFields("blockchainTradeId") &&
      data.blockchainTradeId !== null &&
      context.currentBlockchainTradeId === null &&
      context.isSeller) ||
    (onlyFields("settlementStatus") &&
      data.settlementStatus === "FUNDED" &&
      context.currentSettlementStatus === "AWAITING_FUNDS" &&
      context.isBuyer) ||
    (onlyFields("operationalStatus", "settlementStatus") &&
      data.operationalStatus === "DISPUTED" &&
      data.settlementStatus === "DISPUTED" &&
      ["FUNDED", "PARTIAL_SETTLEMENT"].includes(context.currentSettlementStatus) &&
      (context.isBuyer || context.isSeller)) ||
    (onlyFields("operationalStatus") &&
      data.operationalStatus === "CONDITIONS_SATISFIED" &&
      context.currentOperationalStatus !== "DISPUTED" &&
      context.isOracle) ||
    (onlyFields("settlementStatus") &&
      data.settlementStatus === "RELEASED" &&
      ["FUNDED", "PARTIAL_SETTLEMENT"].includes(context.currentSettlementStatus) &&
      context.isBuyer) ||
    (onlyFields("operationalStatus", "settlementStatus") &&
      data.operationalStatus === "CONDITIONS_SATISFIED" &&
      ["RELEASED", "REFUNDED"].includes(data.settlementStatus || "") &&
      context.currentOperationalStatus === "DISPUTED" &&
      context.currentSettlementStatus === "DISPUTED" &&
      context.isArbitrator)
  );
}
