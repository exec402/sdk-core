# @exec402/core

Core SDK for exec402 protocol

## Installation

```bash
npm install @exec402/core
```

## Usage

### ExecClient

```ts
import { ExecClient } from "@exec402/core";

const client = new ExecClient({ network: "testnet" });

// Contract call
await client.call({ chainId, target, data, amount, initiator });

// Transfer
await client.transfer({ chainId, recipients, amounts, initiator });
```

### ExecProxyClient

```ts
import { ExecProxyClient } from "@exec402/core";

const proxy = new ExecProxyClient({ network: "testnet" });

// Build 402 response
const requirements = proxy.buildPaymentRequirements({
  amount: "1000000",
  resource: "https://example.com/call?amount=1000000",
});

// Forward request
const result = await proxy.forwardCall(paymentHeader, callParams);
```