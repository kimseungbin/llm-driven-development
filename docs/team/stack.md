# Stack (team phase)

Decided in the ldd design session, except the runtime, which #3 left open.

| Part | Choice |
|---|---|
| Runtime | Open, in #4 (#3 Q11). The solo phase uses Node 26 running `.ts` directly. A NestJS coordinator needs a build step (for example SWC), because its decorators need metadata that Node's type stripping doesn't produce. |
| Coordinator | NestJS with the Fastify adapter. Modules, dependency injection, and guards structure the subsystems; workers reuse the modules via `createApplicationContext`. |
| API | oRPC v2, contract-first, pinned to exact beta versions. One contract package serves RPC to TypeScript clients, REST with OpenAPI 3.2 to everything else, and the input schemas for MCP tools. Upgrade betas on purpose; ship the server and clients together. |
| Database | Postgres, through Drizzle ORM with the `pg` driver. It holds the search index, rebuilt by rescanning refs, and claims. Migrations are plain SQL. |
| Jobs | pg-boss inside the coordinator process, behind a `JobQueue` interface. Moving to SQS later needs an outbox table, because SQS can't join a Postgres transaction. |
| Auth | Better Auth: passkey, device authorization with the OAuth provider, organization, and API-key plugins. Versions pinned; security advisories tracked. |
| Web | A React SPA built with Vite, with TanStack Router and Query. |
| Git | The `git` binary against the coordinator's partial clone. |

Risk to check first: oRPC is ESM-only, so a first prototype must confirm NestJS and oRPC load together on whichever runtime #4 picks.
