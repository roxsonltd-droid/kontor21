export function buildAuthMessage(
  method: string,
  pathname: string,
  timestamp: string,
  body: string
) {
  return `Kontor21 API\n${method.toUpperCase()}\n${pathname}\n${timestamp}\n${body}`;
}
