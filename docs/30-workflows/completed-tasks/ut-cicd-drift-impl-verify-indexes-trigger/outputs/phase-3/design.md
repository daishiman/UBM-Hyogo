# Phase 3 — 設計

## 追記対象ファイル

**1 ファイルのみ**: `docs/00-getting-started-manual/lefthook-operations.md`

新規ファイル作成・既存ファイル分割は行わない（SSOT 維持・docs 散逸防止）。

## 章構成（追記）

既存 `## post-merge 自動再生成廃止について` セクションの直後に新セクションを追加する。

```
## skill indexes drift gate — trigger 条件と復旧 SOP

### CI gate (verify-indexes-up-to-date)
  - workflow: .github/workflows/verify-indexes.yml
  - trigger: push (branches: main) / pull_request (branches: main, dev)
  - 監視 path: .claude/skills/aiworkflow-requirements/indexes
  - status context 名: verify-indexes-up-to-date (job 名と一致)
  - 判定: pnpm install --frozen-lockfile → pnpm indexes:rebuild → git diff --exit-code

### 一次防衛: pre-push hook (indexes-drift-guard)
  - lefthook.yml の pre-push.indexes-drift-guard
  - script: scripts/hooks/indexes-drift-guard.sh
  - 効果: drift があれば push 自体をブロックし、CI 失敗を未然に防ぐ

### 復旧 SOP

#### A. pre-push 拒否時（通常ケース）
  1. mise exec -- pnpm indexes:rebuild
  2. git status .claude/skills/aiworkflow-requirements/indexes
  3. git add .claude/skills/aiworkflow-requirements/indexes
  4. git commit -m "chore(indexes): rebuild aiworkflow-requirements indexes"
  5. git push

#### B. CI で verify-indexes-up-to-date が fail した場合（例外: hook を bypass した push 等）
  1. ローカルに最新を pull
  2. mise exec -- pnpm indexes:rebuild
  3. git diff で drift を確認し、A と同じ手順で commit & push

### 厳守事項
  - generator 管理 index (`topic-map.md` / `keywords.json`) を手編集してはならない（generator 単独正本）
  - 復旧で --no-verify を使わない
```

## 文書間リンク方針

| 起点 | 終点 | 種別 |
|---|---|---|
| `lefthook.yml` `indexes-drift-guard.fail_text` | 本セクション (章タイトル) | 文章参照（命名一致で導線確保） |
| `CLAUDE.md` 既存記述 (`詳細: lefthook-operations.md`) | 本セクション | 既存リンクで自動到達 |
| 本セクション | `.github/workflows/verify-indexes.yml` | パス参照 |
| 本セクション | `scripts/hooks/indexes-drift-guard.sh` | パス参照 |

## 設計上の判断記録

- 原 issue で想定された `docs/00-getting-started-manual/deployment-gha.md` は存在しない。`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` は CI/CD 正本として存在するが、復旧 SOP は `lefthook-operations.md` に統合（最も近接した hook 運用正本）
- 「CI 失敗時 SOP」を主、「pre-push 拒否時 SOP」を副、ではなく、現実の発生頻度に合わせて **pre-push 拒否を一次/通常、CI 失敗を例外** として記述順を逆転
- SOP 内コマンドはすべて `mise exec --` プレフィックスを付与（CLAUDE.md「よく使うコマンド」と整合）
