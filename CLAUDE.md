# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run serve          # Dev server at localhost:8080
npm run serve-testnet  # Dev server against testnet (Linux/Mac only — uses NODE_ENV=testnet)
npm run build          # Production build → outputs to docs/
npm run lint           # ESLint
```

On Windows, `serve-testnet` won't work as-is because `NODE_ENV=testnet` is a Unix env-var prefix. Run it as: `$env:NODE_ENV='testnet'; npx vue-cli-service serve` in PowerShell.

No test suite is configured.

## Architecture

**Serey Explorer** is a Vue 2 SPA for exploring a Steem-based blockchain (Serey network). It's fully client-side — no backend server. All blockchain data is fetched directly from RPC nodes via `dsteem`.

The `backend/` directory contains an unused Express server (`student_server.js`) that was scaffolded for a server-side auth flow but is not wired up. `Auth.js` references `Config.SERVER_API` which is `undefined` in all environments — server-auth is dead code.

### Routing (`src/router.js`)

- `/` — Home dashboard (chain stats, last blocks, witness schedule)
- `/explorer/@:account` — Account profile, balances, transactions
- `/explorer/@:account/:permlink` — Post/content detail
- `/explorer/b/:id` — Block detail
- `/explorer/b/:id/:tx` — Specific transaction in a block
- `/explorer/tx/:tx` — Transaction search
- `/witnesses`, `/wallet`, `/broadcast`, `/rewardcalc`, `/proposals/:id`, `/reports` — Utility pages

Router base URL comes from `process.env.VUE_APP_ROUTER_BASE`; public path from `process.env.VUE_APP_PUBLIC_PATH` (set in `vue.config.js`).

### Directory Layout

```
src/
├── components/explorer/   # Explorer page components (Home, Account, Block, Post, Tx, etc.)
├── views/                 # Non-explorer pages (RewardCalc, Broadcast, Proposal, Reports)
├── js/
│   ├── utils.js           # Reputation, time formatting, date helpers (plain JS object, not a Vue mixin)
│   └── operations.js      # Blockchain operation type definitions
├── mixins/
│   ├── SteemClient.js     # RPC client + multi-node failover logic
│   ├── Auth.js            # Login/logout (server-auth path is unused)
│   ├── Alerts.js          # Toast/alert helpers
│   └── ChainProperties.js # Chain state helpers (fetches reward fund + global props)
├── config.js              # Environment-specific RPC endpoints and chain constants
├── store.js               # Vuex: auth (user/keys), chain properties, active rpc_node
├── router.js
├── main.js
└── App.vue
backend/                   # Unused Express server — ignore
eftg-send/                 # Standalone CLI scripts for broadcasting transactions — ignore
dictionary/                # JSON reference data files — ignore
```

### Key Patterns

**RPC failover** — `SteemClient.js` mixin manages connection to multiple nodes and automatically retries on failure. Components call blockchain methods through `steem_database_call(method, params)` rather than importing `dsteem` directly. The failover loop cycles through `Config.RPC_NODES` and respects `store.state.max_fails` / `max_fail_rounds`.

**Mixins over composition** — Shared logic lives in `src/mixins/`. Components include the relevant mixins (SteemClient, Auth, Alerts, ChainProperties) to get blockchain access and utilities. `ChainProperties` extends `SteemClient`.

**Vuex store is minimal** — Only `auth` (user identity + keys), `chain` (global chain properties like vests/steem ratio, reward fund), and `rpc_node` (current active node URL) are in the store. Component-level data is kept local.

**Environment config** — `src/config.js` exports different RPC endpoints based on `NODE_ENV` (production, development, testnet, acceptance). All chain math constants (inflation, block times) live here too.

**Build outputs to `docs/`** — Configured in `vue.config.js`. The Dockerfile uses a multi-stage build (Node builder → Nginx) serving on port 80.

**UI framework** — BootstrapVue (Bootstrap 4) is the primary component library. FontAwesome icons are used but must be individually imported in `main.js` before use in templates. `ant-design-vue` is also installed but usage is minimal.

### Chain Constants (Serey network)

- Address prefix: `SRY`
- Chain ID: `5205c25d3e87cb3e8e527e6fbbf324b7b2b9fe7a7192c604ce5b174d08987324`
- Block time: 3 seconds
- Token symbols: `Serey` (liquid), `SP` (staked), `VESTS` (raw shares)
- Config aliases: `Config.STEEM` = `Config.SBD` = `"Serey"` (both map to the same token)
