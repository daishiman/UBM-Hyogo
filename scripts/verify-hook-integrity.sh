#!/usr/bin/env bash
# lefthook.yml ↔ scripts/hooks 参照整合 + tracked stray hook 検知（issue-230 / local・CI 共用）
# 正本: lefthook.yml / docs/00-getting-started-manual/lefthook-operations.md
# 方針: CLAUDE.md「Git hook の方針」
#
# 検証項目:
#   A. lefthook.yml が `run: bash|node <path>` で参照するスクリプトが実在するか
#   B. git 管理下に手書き hook の shadow（hooks/pre-commit 等）が commit されていないか
#   C. lefthook.yml の構造健全性（min_version 行の存在）
# 副作用なし（read-only）。`::error::` は GitHub Actions annotation 形式。
set -euo pipefail

fail=0

# A. 参照スクリプトの実在検証
#    `run:` 行から実行コマンド（bash/node）に続く第2トークン（スクリプトパス）のみ抽出する。
#    `--changed` 等の引数を script path と誤検出しないよう第2トークンに限定する。
while IFS= read -r p; do
  [ -z "$p" ] && continue
  if [ ! -f "$p" ]; then
    echo "::error::lefthook.yml references missing script: $p"
    fail=1
  fi
done < <(grep -oE 'run:[[:space:]]*(bash|node)[[:space:]]+[^[:space:]]+' lefthook.yml \
  | awk '{print $3}' || true)

# B. tracked stray hook 検知: git 管理下に commit された hook shadow（forbidden）
stray="$(git ls-files | grep -E '(^|/)hooks/(pre-commit|pre-push|commit-msg|post-merge|prepare-commit-msg|post-checkout)(\.|$)' || true)"
if [ -n "$stray" ]; then
  echo "::error::tracked stray git-hook shadow files detected:"
  echo "$stray"
  fail=1
fi

# C. lefthook.yml 構造健全性: min_version 行の存在
if ! grep -qE '^min_version:' lefthook.yml; then
  echo "::error::lefthook.yml missing min_version"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "OK: lefthook.yml integrity verified"
fi
exit "$fail"
