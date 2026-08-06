export function buildAuthMessage(
  method: string,
  pathname: string,
  timestamp: string,
  body: string,
  nonce: string,
  domain: string,
  chainId: number
) {
  return [
    "Kontor21 API Request",
    `Domain: ${domain}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${timestamp}`,
    `Method: ${method.toUpperCase()}`,
    `Path: ${pathname}`,
    `Body: ${body}`,
  ].join("\n");
}
