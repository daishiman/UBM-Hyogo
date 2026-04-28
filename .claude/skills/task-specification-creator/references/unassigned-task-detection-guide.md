# 未完了タスク検出・監査ガイド

> 親ファイル: [unassigned-task-guidelines.md](unassigned-task-guidelines.md)
> 読み込み条件: Phase 12 での未タスク検出・監査コマンドを実行するとき。

---

## Phase 12での未タスク検出【必須】

**Phase 12完了前に、未完了タスクの検出を必ず実行すること。**

### 検出ソース一覧

| #   | ソース                        | 確認項目                                   | 必須 |
| --- | ----------------------------- | ------------------------------------------ | ---- |
| 1   | Phase 3レビュー結果           | MINOR判定の指摘事項                        | ✅   |
| 2   | Phase 10レビュー結果          | MINOR判定の指摘事項                        | ✅   |
| 3   | Phase 11手動テスト結果        | スコープ外の発見事項                       | ✅   |
| 4   | 各Phase成果物                 | 「将来対応」「TODO」「FIXME」              | ✅   |
| 5   | コードベース                  | TODO/FIXME/HACK/XXXコメント                | ✅   |
| 6   | documentation-changelog苦戦箇所 | 実装中に発見された課題で未解決のもの       | ✅   |

### 検出コマンド例

```bash
# 実装ディレクトリを優先スキャン（推奨）
node scripts/detect-unassigned-tasks.js --scan apps/desktop/src/main --output .tmp/unassigned-main.json

# Phase成果物からTODO/FIXMEを検出
grep -rn "TODO\|FIXME\|将来対応\|later\|TBD" outputs/

# コードベースからTODO/FIXMEを検出
grep -rn "TODO\|FIXME\|HACK\|XXX" packages/ apps/ --include="*.ts" --include="*.tsx"

# レビュー結果からMINOR判定を検出
grep -rn "MINOR\|軽微\|指摘" outputs/phase-3/ outputs/phase-10/
```

---

## 未タスク監査（current/baseline 分離）

`audit-unassigned-tasks.js` は **対象監査（current）** と **全体監査（baseline）** を分離して扱う。

```bash
# 1) 対象未タスクの今回差分監査（推奨）
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --json \
  --diff-from HEAD \
  --target-file docs/30-workflows/unassigned-task/task-imp-unassigned-audit-scope-control-001.md

# 1-b) standalone 完了指示書の current 監査
node .agents/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --json \
  --target-file docs/30-workflows/completed-tasks/task-imp-unassigned-audit-scope-control-001.md

# 2) 差分監査（workflow全体の current 判定）
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --json \
  --diff-from HEAD

# 3) 全体監査（資産健全性監視）
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --json
```

> 重要: `--target-file` は root `docs/30-workflows/unassigned-task/`、actual parent `docs/30-workflows/completed-tasks/<workflow>/unassigned-task/`、standalone `docs/30-workflows/completed-tasks/*.md` のいずれかを指定可能。

```bash
node .agents/skills/task-specification-creator/scripts/verify-unassigned-links.js \
  --source .agents/skills/aiworkflow-requirements/references/task-workflow.md
```

判定ルール:

| モード | fail条件 | 用途 |
| --- | --- | --- |
| `--diff-from HEAD --target-file` | `currentViolations.total > 0` | 対象未タスク指示書の今回差分判定 |
| `--diff-from HEAD` | `currentViolations.total > 0` | 今回タスク全体の合否判定 |
| `--target-file` のみ | 参考値 | repo 全体の既存違反が current 側へ寄る場合があるため合否には使わない |
| scope指定なし `--json` | 全体違反が1件以上 | baseline監視 |

---

## legacy baseline の扱い（重要）

`currentViolations=0` は **今回差分が適切** であることを示すだけで、`docs/30-workflows/unassigned-task/` 全体が完全に正規化済みという意味ではない。

- `currentViolations=0` かつ `baselineViolations>0` の場合:
  - 検出レポートには「今回差分は合格」「legacy 負債は継続」の両方を明記する
  - baseline 負債に既存の改善未タスクがある場合は、その参照をレポートへ記載する
  - baseline 負債を feature の不具合として扱わない

推奨の記述例:

```md
- 今回タスク由来の新規未タスク: 0件
- `docs/30-workflows/unassigned-task/` への配置要否: 追加作成なし
- `verify-unassigned-links`: 213/213（missing=0）
- `audit-unassigned-tasks --json --diff-from HEAD`: currentViolations=0 / baselineViolations=133
- baseline backlog（継続監視）:
  - `docs/30-workflows/unassigned-task/task-imp-unassigned-task-format-normalization-001.md`
```

---

## 指定ディレクトリ配置チェック（報告テンプレート）

| 項目 | 記録例 |
| --- | --- |
| 今回差分の配置可否 | `docs/30-workflows/unassigned-task/` 配下に新規/更新未タスク `N` 件（または `0` 件） |
| 今回差分の品質可否 | `audit --json --diff-from HEAD` の `currentViolations.total = X` |
| 全体legacy状況 | `audit --json` の `baselineViolations.total = Y`（既存改善タスクID: ...） |

> 重要: `X=0` でも `Y>0` はあり得る。`Y` は今回タスクの不合格理由にしない。

workflow ローカル配置ドリフト防止:

```bash
# root canonical 以外に未タスクを置いていないか確認
find docs/30-workflows -path "*/tasks/unassigned-task/*.md" -print

# 参照が workflow ローカル path を向いていないか確認
rg -n "tasks/unassigned-task/" \
  docs/30-workflows \
  .claude/skills/aiworkflow-requirements/references
```

---

## raw検出の誤検知対策（推奨）

`detect-unassigned-tasks.js` の結果は「未タスク候補（raw）」であり、確定件数ではない。

| ステップ | 判定内容 | 記録方法 |
| --- | --- | --- |
| 1 | 実装ディレクトリ（`apps/`, `packages/`）の検出結果を優先確認 | `unassigned-task-detection.md` に raw件数を記録 |
| 2 | ドキュメント由来の raw 検出を手動精査し、説明文 TODO を除外 | 「実タスク候補（精査後）」件数を別行で記録 |

> 重要: 未タスク指示書を作成する条件は、**精査後件数 > 0** の場合のみ。

---

## 出力要件

| 出力物                         | 必須 | 配置先                                                   |
| ------------------------------ | ---- | -------------------------------------------------------- |
| 未タスク検出レポート           | ✅   | `outputs/phase-12/unassigned-task-detection.md`          |
| 未タスク指示書（該当時）       | 条件 | `docs/30-workflows/unassigned-task/`                     |
| task-workflow.md テーブル登録  | 条件 | `references/task-workflow.md` の残課題テーブル           |
| 関連仕様書の残課題テーブル登録 | 条件 | 対象機能の仕様書（例: `interfaces-agent-sdk-history.md`） |

> **⚠️ 重要**: 未タスクが1件以上検出された場合、以下の4ステップを**全て**完了すること:
>
> | #   | ステップ               | 確認方法                                                        |
> | --- | ---------------------- | --------------------------------------------------------------- |
> | 1   | 指示書作成             | `unassigned-task/` にMarkdownファイルを配置                     |
> | 2   | 物理ファイル存在確認   | `ls docs/30-workflows/unassigned-task/` で作成済みファイルを検証 |
> | 3   | task-workflow.md 登録  | 残課題テーブルにエントリを追加                                  |
> | 4   | 関連仕様書テーブル登録 | 対象機能の仕様書の残課題テーブルにエントリを追加                |

---

## 既存 follow-up 未タスクの current contract 再同期

Phase 12 の再監査で「新規未タスク 0 件」と判定しても、既存 follow-up 未タスクを参照・流用する場合は、本文が **最新の system spec / current implementation** を向いていることを確認する。

| チェック箇所 | 確認内容 |
| --- | --- |
| `2.2 最終ゴール` | 最新 contract の state key / callback / handoff を誤記していないか |
| `3.1 前提条件` | 現行の責務分離が反映されているか |
| `3.5 実装課題と解決策` | 親タスクの苦戦箇所が current implementation 前提で継承されているか |
| `6. 検証方法` | 検証手順が最新 contract に沿っているか |

```bash
rg -n "completed=false|persist reset|old key name" docs/30-workflows/unassigned-task/task-*.md

node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --json \
  --diff-from HEAD \
  --target-file docs/30-workflows/unassigned-task/<task-file>.md
```

---

## 正本フォーマット（UT-06 派生 UNASSIGNED-G を題材に）

UT-06 (本番デプロイ実行タスク) の Phase 12 で派生検出された UNASSIGNED-G を例に、正本フォーマットを以下に固定する。

### 命名規則

- **ファイル名 / taskId 共通**: `^task-[a-z]+-[a-z0-9-]+-[0-9]+$`
  - 第1セグメント: カテゴリ (`fix` / `imp` / `ref` / `doc` / `ops` / `cicd` 等)
  - 中間セグメント: kebab-case の主題（`a-z0-9-` のみ。日本語・大文字・アンダースコア禁止）
  - 末尾セグメント: 3桁ゼロ詰め通番（`001` / `002` / ...）
- 例: `task-ops-cloudflare-wrangler-wrapper-001.md`、`task-fix-nextjs-turbopack-worktree-root-001.md`
- 旧形式（`UT-XX-NNN` / `TASK-FOO-BAR` 等）は legacy として残置可だが、新規起票は本パターンに統一する

### 配置

- **正規パス**: `docs/30-workflows/unassigned-task/<taskId>.md`
- 完了後は `docs/30-workflows/completed-tasks/unassigned-task/<taskId>.md` へ移動
- workflow 個別 `outputs/phase-12/unassigned-task-detection.md` 内には **載せ替えず**、リンクのみ保持（後述「二段運用」）

### 二段運用（検出ログ ↔ 独立タスク起票）

Phase 12 では未タスクを以下の **二段運用** に分離する。両ファイルは責務が異なるため必ず別ファイルとして管理する。

| 種別 | ファイル | 役割 |
| --- | --- | --- |
| 検出ログ | `outputs/phase-12/unassigned-task-detection.md` | 当該 workflow の Phase 12 で検出された未タスクの **一覧・要約・分類**。UNASSIGNED-A/B/C... の連番で見出しを付け、症状・発生 phase・優先度・起票先 taskId を記録 |
| 独立タスク | `docs/30-workflows/unassigned-task/<taskId>.md` | 各 UNASSIGNED-X に対応する **正式タスク仕様書**。`assets/unassigned-task-template.md` に従い 2.2 最終ゴール / 3.x 前提・課題 / 4.x 実装方針 / 5. 受け入れ条件 / 6. 検証方法を記述 |

- 検出ログ → 独立タスクへは **必ず双方向リンク** を張る
  - 検出ログ側: `[起票先](../../../unassigned-task/task-ops-...-001.md)`
  - 独立タスク側: 冒頭メタに `source: docs/30-workflows/<workflow>/outputs/phase-12/unassigned-task-detection.md#unassigned-g`
- 独立タスク化を後送りする場合は検出ログに `formalize_status: pending` を明記し、Phase 12 close-out 同 wave で `verify-unassigned-links.js` を再実行して link 整合を確認する

### UT-06 派生 UNASSIGNED-G の具体例

UT-06 では以下が UNASSIGNED-G として検出され、本ガイドに沿って独立タスク化された:

| UNASSIGNED-X | 主題 | 起票 taskId（例） |
| --- | --- | --- |
| UNASSIGNED-G | Cloudflare wrangler 直接呼び出しを `scripts/cf.sh` ラッパーへ強制集約 | `task-ops-cloudflare-wrangler-wrapper-001` |
| UNASSIGNED-G' | Next.js 16 / Turbopack の worktree root 誤検出ガード（`outputFileTracingRoot` / `turbopack.root` 明示） | `task-fix-nextjs-turbopack-worktree-root-001` |
| UNASSIGNED-G'' | wrangler 4.x `[env.production]` strict mode への二重定義同期 | `task-ops-wrangler-env-production-strict-001` |

> 上記 taskId は本ガイドのフォーマット例示であり、実起票時は通番衝突を `ls docs/30-workflows/unassigned-task/ | grep -c '^task-ops-'` 等で確認してから採番すること。

### 起票時チェックリスト

- [ ] taskId が `^task-[a-z]+-[a-z0-9-]+-[0-9]+$` にマッチする
- [ ] 配置パスが `docs/30-workflows/unassigned-task/<taskId>.md`
- [ ] 検出ログ側に独立タスクへのリンクを記載
- [ ] 独立タスク側に検出ログへの逆リンクをメタに記載
- [ ] `node .claude/skills/task-specification-creator/scripts/verify-unassigned-links.js` PASS
- [ ] 親 workflow の Phase 12 changelog に「UNASSIGNED-X → <taskId> formalize」を 1 行記録

