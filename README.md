# Counterparty

**Let agents negotiate. Keep humans in control.**

Counterparty is an agent-native negotiation protocol presented as a marketplace.
It lets a personal AI discover products, open parallel negotiations, exchange
structured commercial terms, and prepare an agreement. A human must approve the
exact terms before the agent can commit.

This project was built for the [WebMCP Challenge](https://webmcp.devpost.com/).

## Why WebMCP

Negotiation is stateful, semantic, and poorly suited to DOM automation. An agent
needs to understand offers, rounds, counterparties, and authority—not buttons and
CSS selectors.

Counterparty exposes six business-level capabilities through
`document.modelContext.registerTool()`:

- `search_products` — find candidates using budget and product constraints
- `start_negotiation` — open a stateful conversation with one seller
- `submit_counteroffer` — propose price, warranty, and delivery terms
- `get_negotiations` — compare current terms using the human's latest preference
- `prepare_agreement` — freeze accepted terms for review
- `commit_agreement` — finalize only after explicit human approval

Every tool uses a strict JSON Schema and `additionalProperties: false`.

## The key interaction

1. The agent searches for a development laptop.
2. It negotiates in parallel with sellers that optimize for different outcomes.
3. The human changes the priority from price to warranty.
4. The agent reads the changed preference and recommends a different offer.
5. The agent prepares an agreement.
6. A premature commit returns `HUMAN_APPROVAL_REQUIRED`.
7. The human approves the exact terms in the interface.
8. The agent commits and receives a transaction receipt.

This makes the division of labor concrete: agents handle repetitive execution;
people retain judgment and authority.

## Architecture

```text
ChatGPT / browser agent
          |
       WebMCP
          |
          v
  semantic tool layer  <------>  visible activity trail
          |
          v
   shared domain services
    /        |          \
catalog  negotiation  agreements
             |          |
      seller policies   human approval
```

The human interface and WebMCP handlers call the same catalog, negotiation, and
agreement services. Tool calls therefore update the product experience instead
of operating a separate demo path.

## Trust and safety model

- Searching, inspecting, negotiating, and preparing are non-binding.
- `commit_agreement` checks for explicit human approval.
- Approval is tied to a deterministic fingerprint of the exact commercial terms.
- If approved terms change, approval is invalidated.
- Private seller policy fields are never included in tool responses.
- All consequential actions appear in the activity trail.

This hackathon prototype simulates products, sellers, inventory, and transaction
receipts. It does not process payments or claim to be a production marketplace.

## Run locally

Requirements:

- Node.js 22+
- pnpm 11+
- Chrome with WebMCP enabled, or ChatGPT's WebMCP-capable in-app browser

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable WebMCP testing in Chrome, visit:

```text
chrome://flags/#enable-webmcp-testing
```

## Suggested agent prompt

> Find a development laptop under $1,800 with at least 32 GB RAM. Negotiate
> with the strongest options. I care about value, but do not finalize anything
> without my approval.

During the run, change the visible preference to **Warranty** and ask the agent
to reevaluate the active offers.

## Quality checks

```bash
pnpm test
pnpm lint
pnpm build
```

The automated suite covers catalog constraints, seller-policy differences,
negotiation transitions, strict WebMCP registration, approval gating, and
post-approval term integrity.

## Technology

Next.js, React, TypeScript, WebMCP, Tailwind CSS, Vitest, and Vercel.

## License

[MIT](LICENSE)
