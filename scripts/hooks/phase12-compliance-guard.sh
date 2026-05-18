#!/usr/bin/env bash
# pre-push: 変更された Phase 12 compliance file の canonical 9 heading が欠落していれば push を拒否。
# 対応 CI: .github/workflows/verify-phase12-compliance.yml
#
# 背景: verify-phase12-compliance CI は task の Phase 12 compliance check ファイル
# (`outputs/phase-12/phase12-task-spec-compliance-check.md`) が canonical 9 heading
# (1. Summary verdict / 2. Changed-files classification / 3. workflow_state and phase
# status consistency / 4. Phase 11 evidence file inventory / 5. Phase 12 strict 7 file
# inventory / 6. Skill/reference/system spec same-wave sync / 7. Runtime or user-gated
# boundary / 8. Archive/delete stale-reference gate / 9. Four-condition verdict) を
# すべて含むことを要求する。task 作成時に独自命名の heading を書くと CI が必ず fail する
# recurring pattern を pre-push でブロックする。
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null); then
  BASE="$UPSTREAM"
else
  BASE="origin/dev"
fi

# sync-merge ノイズ除去:
#   本ブランチが分岐した時点 (merge-base HEAD origin/dev) を真の base にし、
#   --first-parent --no-merges で本ブランチ独自コミットの changed file だけを評価する。
#   こうしないと sync-merge した他タスクの compliance file まで再評価対象になり、
#   越境 fail を引き起こす。
FORK_BASE=$(git merge-base HEAD origin/dev 2>/dev/null || true)
if [ -z "$FORK_BASE" ]; then
  FORK_BASE="$BASE"
fi
CHANGED=$(git log --first-parent --no-merges --name-only --format= "$FORK_BASE..HEAD" 2>/dev/null \
  | sort -u | sed '/^$/d' \
  | grep -E '(^|/)(outputs/phase-12/phase12-task-spec-compliance-check\.md|outputs/phase-12/main\.md|artifacts\.json)$' || true)

if [ -z "$CHANGED" ]; then
  exit 0
fi

# 追加チェック（再発防止 / Refs L-DEVSYNC-014）:
#   Phase 12 compliance file が `present` 宣言した evidence path のうち
#   gitignored で tracked 化されていないものがあると、CI 環境では物理実在検出に失敗する。
#   ローカル file は存在しても tracked でない（.gitignore で除外されている）なら fail させる。
GITIGNORED_EVIDENCE=""
for compliance_md in $(echo "$CHANGED" | grep -E 'phase12-task-spec-compliance-check\.md$' || true); do
  [ -f "$compliance_md" ] || continue
  ROOT=$(dirname "$(dirname "$(dirname "$compliance_md")")")
  EVIDENCE_PATHS=$(awk '/^## Phase 11 evidence file inventory/{f=1;next} /^## /{f=0} f && /\| `[^`]+` \| present \|/' "$compliance_md" \
    | grep -oE '`[^`]+`' | tr -d '`' | sort -u)
  for ep in $EVIDENCE_PATHS; do
    abs="$ROOT/$ep"
    [ -f "$abs" ] || continue
    if git check-ignore -q "$abs" 2>/dev/null; then
      if ! git ls-files --error-unmatch "$abs" >/dev/null 2>&1; then
        GITIGNORED_EVIDENCE="${GITIGNORED_EVIDENCE}\n  - ${abs}"
      fi
    fi
  done
done

if [ -n "$GITIGNORED_EVIDENCE" ]; then
  cat <<EOF >&2
🚫 Phase 11 evidence file が .gitignore で除外され untracked です（CI で missing-evidence になります）:$(printf "$GITIGNORED_EVIDENCE")

対処:
  1) .gitignore に negation pattern を追加（恒久対応）— 例:
     !docs/30-workflows/**/outputs/phase-11/*.log
  2) git add <path> して tracked 化
  3) 再 push

参照: L-DEVSYNC-014 / SP-DEVSYNC-013
EOF
  exit 1
fi

# 変更ファイルが含まれる workflow root に対して compliance check を実行。
# verify-phase12-compliance.ts は COMPLIANCE_BASE_REF / COMPLIANCE_HEAD_REF で diff scope を決める。
if ! COMPLIANCE_BASE_REF="$FORK_BASE" COMPLIANCE_HEAD_REF="HEAD" \
  node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
  scripts/verify-phase12-compliance.ts 2>&1 | tee /tmp/phase12-compliance-guard.log \
  | grep -q '"status": "pass"'; then
  cat <<'EOF' >&2
🚫 Phase 12 compliance check failure（CI verify-phase12-compliance と同等チェック）。

代表原因:
  1. outputs/phase-12/phase12-task-spec-compliance-check.md の見出しが canonical 9 と一致していない
     → SSOT テンプレート: .claude/skills/task-specification-creator/references/phase12-compliance-check-template.md
     → canonical heading: 1. Summary verdict / 2. Changed-files classification /
        3. `workflow_state` and phase status consistency / 4. Phase 11 evidence file inventory /
        5. Phase 12 strict 7 file inventory / 6. Skill/reference/system spec same-wave sync /
        7. Runtime or user-gated boundary / 8. Archive/delete stale-reference gate /
        9. Four-condition verdict
  2. Phase 11 evidence inventory に書かれた path が物理実在しない（issue-730 validator が検出）

修正手順:
  pnpm verify:phase12-compliance   # 失敗箇所の詳細 JSON 出力
  # → details / reason フィールドの指示に従って修正
EOF
  exit 1
fi

exit 0
