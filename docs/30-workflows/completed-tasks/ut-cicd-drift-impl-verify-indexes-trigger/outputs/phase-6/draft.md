# Phase 6 — 追記本文ドラフト

以下を `docs/00-getting-started-manual/lefthook-operations.md` の「## post-merge 自動再生成廃止について」セクションの直後 / 「## sync-merge (main 取り込み) 時の hook 自動スキップ — 個人開発ポリシー」セクションの直前に挿入する。

````markdown
## skill indexes drift gate — trigger 条件と復旧 SOP

`.claude/skills/aiworkflow-requirements/indexes/topic-map.md` と `indexes/keywords.json` は generator (`pnpm indexes:rebuild`) の出力で、手編集禁止の単独正本である。`quick-reference.md` / `resource-map.md` は仕様同期時に手動で追記する導線 index だが、CI は indexes 全体の未コミット差分を検出する。drift は **pre-push hook (一次防衛)** と **CI gate (二次防衛)** の二段で検出する。

### CI gate: verify-indexes-up-to-date

| 項目 | 値 |
| --- | --- |
| workflow | `.github/workflows/verify-indexes.yml` |
| trigger | `push` (branches: `main`) / `pull_request` (branches: `main`, `dev`) |
| 監視 path | `.claude/skills/aiworkflow-requirements/indexes` |
| status context 名 | `verify-indexes-up-to-date` (workflow `name:` / job `name:` と一致) |
| 判定ロジック | `pnpm install --frozen-lockfile` → `pnpm indexes:rebuild` → `git diff --exit-code` |

### 一次防衛: pre-push hook (indexes-drift-guard)

| 項目 | 値 |
| --- | --- |
| 配線 | `lefthook.yml` `pre-push.indexes-drift-guard` |
| 実装 | `scripts/hooks/indexes-drift-guard.sh` |
| 効果 | drift があれば push 自体をブロックし CI 失敗を未然に防ぐ |

### 復旧 SOP

#### A. pre-push 拒否時（通常ケース）

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes
git add .claude/skills/aiworkflow-requirements/indexes
git commit -m "chore(indexes): rebuild aiworkflow-requirements indexes"
git push
```

#### B. CI で `verify-indexes-up-to-date` が fail した場合（例外: hook を bypass した push 等）

```bash
git pull --rebase
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes
git add .claude/skills/aiworkflow-requirements/indexes
git commit -m "chore(indexes): rebuild aiworkflow-requirements indexes"
git push
```

### 厳守事項

- `topic-map.md` / `keywords.json` を手編集してはならない（generator 単独正本）。手編集して通したコミットは、次回 `pnpm indexes:rebuild` 実行で必ず差分が再発する。
- `quick-reference.md` / `resource-map.md` など手動同期 index を更新した場合も、最後に `pnpm indexes:rebuild` を実行して generator 管理 index の行番号・キーワードを揃える。
- 復旧で `--no-verify` を使わない。pre-push hook が動かない原因（hook 未配置・lefthook 未インストール）を先に直す。
- index 更新コミットは feature コミットと分離して push する（PR review 時の見通し確保）。
````

## 文章スタイル方針

- 既存ガイドの「post-merge 自動再生成廃止について」と同じトーン（事実 → 設計意図 → 手順 → 厳守事項）。
- 表で trigger 条件を構造化し grep 性を確保。
- コードブロックは `bash` 言語タグで統一。
