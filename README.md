# Kontor21

Kontor21 is a Web3 escrow platform for agricultural B2B trades. It combines a
Next.js application, PostgreSQL/Prisma metadata, IPFS evidence, and a Polygon
smart contract with milestone releases and 2-of-3 arbitration.

## Local setup

Requirements: Node.js 22+, PostgreSQL, and a Web3 wallet.

```bash
npm ci
copy .env.example .env
npm run db:migrate
npm run dev
```

Required environment variables:

- `DATABASE_URL` — PostgreSQL connection string.
- `PINATA_JWT` — server-only Pinata token with file pinning permission.
- `AMOY_RPC_URL` — Polygon Amoy RPC endpoint.
- `DEPLOYER_PRIVATE_KEY` — deployment wallet key; never expose it to the browser.
- `POLYGONSCAN_API_KEY` — contract verification key.
- `ARBITRATOR_WALLETS` — three unique, controlled addresses separated by commas.
- `NEXT_PUBLIC_APP_URL` — public application origin.
- `NEXT_PUBLIC_IPFS_GATEWAY` — public IPFS gateway prefix.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Smart contract deployment

Use test wallets and test funds on Polygon Amoy:

```bash
npm run deploy:amoy
```

The deployment script updates both `contract-addresses.json` and
`lib/contract-addresses.json`. Commit the resulting addresses before deploying
the web application.

## Render staging

`render.yaml` defines the Next.js web service, PostgreSQL database, migration
command, and health check. Secret values are intentionally marked `sync: false`
and must be entered in Render.

The pre-deploy command runs `prisma migrate deploy`; application startup never
changes the database schema.
