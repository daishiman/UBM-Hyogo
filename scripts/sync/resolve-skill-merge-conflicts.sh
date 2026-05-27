#!/usr/bin/env bash
# resolve-skill-merge-conflicts.sh
#
# dev → feature sync-merge 中に skill / 30-workflows 系で発生する典型コンフリクトを
# 自律解消するヘルパー。merge 進行中（`MERGE_HEAD` 存在時）のみ動作する。
#
# 解消ルール（lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md SSOT）:
#   L-DEVSYNC-001: changelog table を含む混在 md → union 解決（HEAD + dev 両方残す）
#   L-DEVSYNC-002: indexes/keywords.json および indexes/*.md → --ours 採用後に
#                  `pnpm indexes:rebuild` で派生再生成
#
# 使い方:
#   bash scripts/sync/resolve-skill-merge-conflicts.sh
#
# Exit codes:
#   0 = 全件解消
#   1 = merge 進行中ではない / 未解消ファイルあり

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [ ! -f "$(git rev-parse --git-path MERGE_HEAD)" ]; then
  echo "[resolve-skill-merge-conflicts] no merge in progress" >&2
  exit 1
fi

# --- 1. union 解決対象（changelog table を含む混在 md） ---
UNION_TARGETS=(
  ".claude/skills/aiworkflow-requirements/SKILL.md"
  ".claude/skills/aiworkflow-requirements/references/task-workflow-active.md"
  ".claude/skills/aiworkflow-requirements/indexes/resource-map.md"
  ".claude/skills/aiworkflow-requirements/indexes/topic-map.md"
  ".claude/skills/aiworkflow-requirements/indexes/quick-reference.md"
  ".claude/skills/task-specification-creator/SKILL.md"
  ".claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md"
)

# --- 2. --ours + rebuild 対象（JSON 派生物） ---
OURS_THEN_REBUILD_TARGETS=(
  ".claude/skills/aiworkflow-requirements/indexes/keywords.json"
)

# --- 3. deterministic regenerate 対象（正本 spec から再生成可能な generated artifact） ---
# L-DEVSYNC-034 / SP-DEVSYNC-027: static-manifest.json は source-spec から hash 化生成される
# deterministic artifact のため、conflict marker を含んでいても
# `pnpm regenerate:static-manifest` で確定再生成すれば一意の結果が得られる
# （手動マージ不要・副作用ゼロ）。lessons-learned に最低 2 回再発（2026-05-21, 2026-05-24）の
# 実績があり pattern として確定。
REGENERATE_TARGETS=(
  "apps/api/src/repository/_shared/generated/static-manifest.json|mise exec -- pnpm regenerate:static-manifest"
)

UNMERGED=$(git diff --name-only --diff-filter=U)
if [ -z "$UNMERGED" ]; then
  echo "[resolve-skill-merge-conflicts] no unmerged paths" >&2
  exit 0
fi

# union 解決（state machine: normal / head / ancestor / theirs）
union_resolve() {
  python3 - "$@" <<'PYEOF'
import sys, pathlib
for f in sys.argv[1:]:
    p = pathlib.Path(f)
    lines = p.read_text().split('\n')
    out, state = [], 'normal'
    for line in lines:
        if state == 'normal':
            if line.startswith('<<<<<<< '):
                state = 'head'; continue
            out.append(line)
        elif state == 'head':
            if line.startswith('||||||| '):
                state = 'ancestor'; continue
            if line.startswith('======='):
                state = 'theirs'; continue
            out.append(line)
        elif state == 'ancestor':
            if line.startswith('======='):
                state = 'theirs'; continue
        elif state == 'theirs':
            if line.startswith('>>>>>>> '):
                state = 'normal'; continue
            out.append(line)
    if state != 'normal':
        print(f"[union_resolve] unfinished conflict in {f}", file=sys.stderr)
        sys.exit(2)
    p.write_text('\n'.join(out))
    print(f"  union-resolved {f}")
PYEOF
}

apply_union=()
apply_ours=()
apply_regenerate=()  # 各要素は "<path>|<regenerate command>" 形式
for path in $UNMERGED; do
  matched=0
  for t in "${UNION_TARGETS[@]}"; do
    if [ "$path" = "$t" ]; then apply_union+=("$path"); matched=1; break; fi
  done
  if [ "$matched" -eq 0 ]; then
    for t in "${OURS_THEN_REBUILD_TARGETS[@]}"; do
      if [ "$path" = "$t" ]; then apply_ours+=("$path"); matched=1; break; fi
    done
  fi
  # deterministic regenerate 対象（正本 spec から再生成可能な generated artifact）
  if [ "$matched" -eq 0 ]; then
    for entry in "${REGENERATE_TARGETS[@]}"; do
      target_path="${entry%%|*}"
      if [ "$path" = "$target_path" ]; then
        apply_regenerate+=("$entry"); matched=1; break
      fi
    done
  fi
  # pattern-based union targets (append-only logs / lessons-learned)
  if [ "$matched" -eq 0 ]; then
    case "$path" in
      .claude/skills/*/LOGS/_legacy.md|.claude/skills/*/lessons-learned/*.md)
        apply_union+=("$path"); matched=1 ;;
    esac
  fi
  if [ "$matched" -eq 0 ]; then
    echo "[resolve-skill-merge-conflicts] WARN unhandled conflict: $path" >&2
  fi
done

need_rebuild=0

if [ "${#apply_union[@]}" -gt 0 ]; then
  echo "[resolve-skill-merge-conflicts] union-resolving ${#apply_union[@]} files..."
  union_resolve "${apply_union[@]}"
  git add -- "${apply_union[@]}"
  for f in "${apply_union[@]}"; do
    case "$f" in
      .claude/skills/*/indexes/*) need_rebuild=1 ;;
    esac
  done
fi

if [ "${#apply_ours[@]}" -gt 0 ]; then
  echo "[resolve-skill-merge-conflicts] taking --ours for ${#apply_ours[@]} derived files..."
  for f in "${apply_ours[@]}"; do
    git checkout --ours -- "$f"
    git add -- "$f"
    echo "  ours: $f"
  done
  need_rebuild=1
fi

if [ "$need_rebuild" -eq 1 ]; then
  echo "[resolve-skill-merge-conflicts] running pnpm indexes:rebuild..."
  mise exec -- pnpm indexes:rebuild >/dev/null
  git add -A .claude/skills/aiworkflow-requirements/indexes/
fi

if [ "${#apply_regenerate[@]}" -gt 0 ]; then
  echo "[resolve-skill-merge-conflicts] deterministic-regenerating ${#apply_regenerate[@]} generated artifacts..."
  for entry in "${apply_regenerate[@]}"; do
    target_path="${entry%%|*}"
    regen_cmd="${entry#*|}"
    # conflict marker を一度 theirs で消してから再生成（再生成は input=正本 spec のため
    # ours/theirs どちらを起点にしても結果は同一だが、ours 側の手元 hash が古い場合に
    # 余計な diff を避けるため theirs を採用）
    git checkout --theirs -- "$target_path"
    echo "  regenerating $target_path via: $regen_cmd"
    eval "$regen_cmd" >/dev/null
    git add -- "$target_path"
  done
fi

REMAINING=$(git diff --name-only --diff-filter=U)
if [ -n "$REMAINING" ]; then
  echo "[resolve-skill-merge-conflicts] remaining unresolved files (manual resolution required):" >&2
  echo "$REMAINING" | sed 's/^/  /' >&2
  exit 1
fi

echo "[resolve-skill-merge-conflicts] all skill / index conflicts resolved"
