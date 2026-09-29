# Identity (team phase)

## Humans

- **Web:** passkeys (WebAuthn). Each account keeps at least two passkeys, or one plus recovery codes.
- **CLI:** `login` runs the OAuth device authorization flow (RFC 8628). The CLI opens the browser with the code filled in, or prints the link on remote machines; the human approves with a passkey; the CLI keeps a short-lived access token and a rotating refresh token in the OS keychain.
- **Git:** through the forge, as usual.

## Agents

Each agent session gets its own short-lived token, derived from a human's login: `subject` is the human responsible, `actor` is `agent:<name>`, and the session is revocable on its own. Local agents get one from the CLI when the MCP server starts; CI and cloud agents exchange the CI platform's identity token, so no secret is stored.

Agents may write intents, plans, and records, and comment. They may not approve a gate, confirm conventions, or loosen a gate.

## Signing

- The coordinator signs every event commit with its SSH signing key. Each event records `subject`, `actor`, and how the actor logged in. Anyone with a clone can check that an event came from the coordinator and wasn't altered on the forge.
- Acts that decide a gate (approvals, rulings, confirming conventions, loosening a gate) also carry a passkey signature over the event hash (#3 Q8). A passkey needs a human physically present, so an agent can't approve, even with the human's CLI login.
- Delegated approvals (`Via: agent`) never count toward a team gate.
- The coordinator's public key and users' passkey public keys live in `refs/ldd/keys`, so signatures can be checked from any clone.
