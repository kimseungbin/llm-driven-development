# Change categories (decided, #6 Q1, 2026-09-29)

A result gate describes each change with one category from a shared list, so the same word means the same thing in every kind:

`added`, `removed`, `renamed`, `moved`, `type changed`, `nullability changed`, `value changed`, `behavior changed`, `content changed`.

## By kind

Each kind declares the categories it can produce:

| Kind | Categories |
|---|---|
| `data-shape` | added, removed, renamed, type changed, nullability changed |
| `signature-change` | added, removed, renamed, type changed |
| `behavior-change` | behavior changed, value changed |
| `feature` | added |
| `instructions` | added, removed, moved, behavior changed |
| `docs` | added, removed, moved, content changed |
| `non-semantic` | moved, renamed, content changed |
| `other` | any |

Validation rejects a category outside the kind's list. A change no category fits shows as uncategorized, never as the nearest category.
