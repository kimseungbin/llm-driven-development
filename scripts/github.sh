#!/bin/sh
# Sync this workspace through private GitHub repos: the project itself plus each scenario repo,
# including the refs/plans/* plan data that git doesn't fetch or push by default.
#
#   scripts/github.sh publish <owner>          once, on the Mac that has everything
#   scripts/github.sh clone-scenarios <owner>  once, on a new Mac, after cloning the project
#   scripts/github.sh push | pull              whenever you switch Macs
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
scenarios="coupons soft-delete"

# No "+" on the plans refspecs: plan refs only move forward, so a diverged ref should fail loudly
# instead of being overwritten, the same compare-and-swap rule the write path follows locally.
track_plans() {
  git -C "$1" config --add remote.origin.fetch 'refs/plans/*:refs/plans/*'
  git -C "$1" config --add remote.origin.push 'refs/heads/*:refs/heads/*'
  git -C "$1" config --add remote.origin.push 'refs/plans/*:refs/plans/*'
}

each_repo() {
  "$@" "$root"
  for s in $scenarios; do "$@" "$root/scenarios/$s/repo"; done
}

case "${1:-}" in
  publish)
    owner=${2:?usage: scripts/github.sh publish <owner>}
    gh repo create "$owner/llm-driven-development" --private --source "$root" --remote origin
    track_plans "$root"
    git -C "$root" push origin
    for s in $scenarios; do
      dir="$root/scenarios/$s/repo"
      gh repo create "$owner/llmdd-scenario-$s" --private --source "$dir" --remote origin
      track_plans "$dir"
      git -C "$dir" push origin
    done
    ;;
  clone-scenarios)
    owner=${2:?usage: scripts/github.sh clone-scenarios <owner>}
    # The project plans its own development too, so its clone needs the plans refspecs as well.
    track_plans "$root"
    git -C "$root" fetch origin
    for s in $scenarios; do
      dir="$root/scenarios/$s/repo"
      gh repo clone "$owner/llmdd-scenario-$s" "$dir"
      track_plans "$dir"
      git -C "$dir" fetch origin
    done
    ;;
  push) each_repo git push origin ;;
  pull) each_repo git pull --ff-only origin main ;;
  *)
    sed -n '2,8p' "$0"
    exit 1
    ;;
esac
