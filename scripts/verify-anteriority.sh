#!/usr/bin/env bash
# ASTRA — Anteriority check of the preregistrations (v3.2.0; path argument v3.3.0-rc.3)
# ══════════════════════════════════════════════════════════
# Programme minimal de consolidation, point 1: "les empreintes doivent permettre
# l'inspection indépendante de l'antériorité, pas simplement être déclarées".
#
# The E1/E2 history lives in the ORIGINAL public repository. Its default branch (v3.1.1)
# predates this script, so run THIS copy of the script against a FULL (non-shallow)
# clone of it, passed as the argument:
#   git clone https://github.com/christophejlegros-lgtm/ASTRA-Unified-ResearchLab-MCP-FCS-v3.1.0.git /tmp/astra-origin
#   bash scripts/verify-anteriority.sh /tmp/astra-origin
# Without an argument the current directory is checked. In ASTRA-FCS-v3.3.0, created on
# 19 Oct 2026 from the rc.3 tree in ONE commit, the script correctly reports "added in the
# SAME commit — no anteriority can be shown from this history" (empirical/PROVENANCE.md §2bis).
# A shallow clone is refused: its oldest commit would look like the commit that added
# every file, and the check would report a spurious absence of anteriority.
#
# For each preregistration it reports: the first commit that added it, the
# LF-normalised SHA-256 of the file AT that commit (compared with the declared
# hash), and whether that commit is an ancestor of the first commit adding the
# corresponding results.
#
# WHAT THIS DOES NOT PROVE. Git commit dates are set by the committer's machine
# and can be chosen freely; ancestry proves order WITHIN the history, not
# against the calendar or the date the data were downloaded. Independent proof
# of anteriority requires a third-party time stamp: a filed registration (OSF
# Registries), a Zenodo deposit, an RFC 3161 time-stamp token or an
# OpenTimestamps proof of the preregistration's hash. RELEASE.md §4 describes
# how to obtain one for future preregistrations (E3, H1–H3).
#
# © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
set -uo pipefail

REPO="${1:-.}"
if ! git -C "$REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git work tree: $REPO (an archive carries no history; pass a clone of the original repository)." >&2
  exit 2
fi
if [ "$(git -C "$REPO" rev-parse --is-shallow-repository)" = "true" ]; then
  echo "Shallow clone: $REPO. Clone without --depth (or run git -C \"$REPO\" fetch --unshallow) and retry." >&2
  exit 2
fi
cd "$REPO" || exit 2
echo "Repository checked: $(git remote get-url origin 2>/dev/null || pwd) @ $(git rev-parse --short HEAD)"

lfsha() { python3 -c 'import hashlib,sys; print(hashlib.sha256(sys.stdin.buffer.read().replace(b"\r\n", b"\n")).hexdigest())'; }

status=0
check() {
  local prereg="$1" declared="$2" results="$3"
  echo "── $prereg"
  local first
  first="$(git log --diff-filter=A --format='%H' --follow -- "$prereg" | tail -1)"
  if [ -z "$first" ]; then echo "   not found in history"; status=1; return; fi
  echo "   first commit   $first  (committer date $(git show -s --format=%cI "$first") — declarative)"
  local h
  h="$(git show "$first:$prereg" | lfsha)"
  if [ "$h" = "$declared" ]; then echo "   hash at commit $h  = declared"; else echo "   hash at commit $h  ≠ declared $declared"; status=1; fi
  local now
  now="$(lfsha < "$prereg")"
  if [ "$now" = "$declared" ]; then echo "   hash now       unchanged since"; else echo "   hash now       $now  (file modified after the first commit)"; status=1; fi
  local rfirst
  rfirst="$(git log --diff-filter=A --format='%H' -- "$results" | tail -1)"
  if [ -n "$rfirst" ]; then
    if [ "$rfirst" = "$first" ]; then
      echo "   results        $results added in the SAME commit — no anteriority can be shown from this history"; status=1
    elif git merge-base --is-ancestor "$first" "$rfirst"; then
      echo "   results        $results first added in $rfirst — the preregistration commit is an ANCESTOR"
    else
      echo "   results        $results first added in $rfirst — NOT a descendant of the preregistration commit"; status=1
    fi
  else
    echo "   results        $results not found in history"
  fi
}

check empirical/PREREG-DANDI-001603.md    869d80ff4fcb71bee450c029377ff20a45a81528c3ace54fe5b42c572c356ce6 empirical/results/E1.json
check empirical/PREREG-E2-DANDI-001603.md bc5a3d5c9a757afef1a8160272583e72d66a26536cb3fd296e77c47897e6bf54 empirical/results/E2.json

echo
echo "Ancestry establishes order within the history only. For calendar anteriority, compare with a third-party"
echo "time stamp (registry filing, Zenodo deposit, RFC 3161 or OpenTimestamps proof of the hash)."
exit $status
