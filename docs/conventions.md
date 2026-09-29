# Conventions (from the ldd design, carried by #3)

Repo and team rules that agents follow while writing code, and that reviews check.

## Matching

Each convention carries its own matching rules:

```yaml
id: conv-042
applies_to:
  file_name: ["*.spec.ts", "*.test.ts"]
  imports: ["aws-cdk-lib"]
  paths: ["src/infra/**"]
body: "..."
status: confirmed   # proposed | confirmed
```

## Delivery

- One generic `PreToolUse` hook on Write/Edit matches the file path and content, then returns the matches as `additionalContext`. It replaces per-repo hooks that classify files by name and imports.
- The review side uses the same matcher, so the agent writing the code and the reviewer see the same conventions. The result gate lists the conventions that apply to each step.

## Changes

- Agents propose conventions, often drafted from review discussion; a human confirms each one before it applies.
- A change records which convention versions it was checked against.

Where conventions are stored is open; see [open questions](open-questions.md). In the team phase the ldd design keeps them in the coordinator, with a read-only local file cache.
