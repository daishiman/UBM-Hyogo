# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | umbrella close-out |
| Mode | docs-only / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

旧 UT-09 を legacy umbrella として閉じる本タスクの品質ゲートを通過させる。本タスクは新規ランタイム呼出を導入しない docs-only / NON_VISUAL タスクであるため、free-tier 影響評価・secret hygiene チェック・ドキュメント品質チェックの 3 軸で Phase 10 GO/NO-GO の根拠を確定する。a11y は UI 変更がないため N/A とする。

## 実行タスク

1. free-tier 見積もり: 本タスクが Workers 100k req/day 等に与える影響を評価（増分 0 を確認）
2. secret hygiene チェックリスト: `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` の取扱い点検
3. a11y チェック: docs-only / NON_VISUAL のため N/A 確定（理由を明記）
4. ドキュメント品質チェック: lowercase / hyphen filename、未タスクテンプレ 9 セクション、conflict marker 0 件
5. 品質ガード（docs-only のため `pnpm` 系は impactless 確認のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 元仕様 / Phase 1 棚卸結果 |
| 必須 | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-07.md` | AC matrix（Phase 9 では再確認） |
| 必須 | `CLAUDE.md` § シークレット管理 | secret 取扱い方針 |
| 必須 | `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md` | 必須 9 セクション定義 |
| 必須 | `docs/00-getting-started-manual/specs/08-free-database.md` | 無料枠 baseline / D1 WAL 非対応・PRAGMA 制約の根拠（free-tier セクション） |
| 必須 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | admin gate（`/admin/sync/*` 権限境界）の根拠（secret hygiene セクション） |

## 実行手順

### ステップ 1: free-tier 見積もり

本タスクは docs-only / spec_created であり、`apps/api` / `apps/web` / `wrangler.toml` / `[triggers]` のいずれにも変更を加えない。free-tier baseline は `docs/00-getting-started-manual/specs/08-free-database.md` を根拠とする（D1 WAL 非対応・PRAGMA 制約は同 spec を出典）。よって以下を確認する:

- Workers req/day 増分: **0**（新規 endpoint / cron 追加なし）
- D1 read/write 増分: **0**（migration 追加なし）
- 既存 cron（`*/15 * * * *` + `0 3 * * *` = 97 req/day）への影響: **なし**
- 100k req/day free-tier に対する余裕: 不変

### ステップ 2: secret hygiene チェックリスト

> admin gate（`/admin/sync/schema` / `/admin/sync/responses` の権限境界）は `docs/00-getting-started-manual/specs/13-mvp-auth.md` を根拠とする。本タスクは認可境界を変更しないが、secret 取扱い方針は同 spec の admin gate 前提と整合させる。

| # | 項目 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| 1 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` を本ドキュメントに平文記載しない | `rg -n "@.+\\.iam\\.gserviceaccount\\.com" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | 0 hit |
| 2 | `GOOGLE_PRIVATE_KEY` 値を本ドキュメントに平文記載しない | `rg -n "BEGIN PRIVATE KEY" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | 0 hit |
| 3 | `GOOGLE_FORM_ID` 実値を新規追記しない（既存 CLAUDE.md の固定値以外を参照しない） | 目視 | 既存固定値のみ参照 |
| 4 | wrangler 直接実行を勧めない（`scripts/cf.sh` 経由を明記） | `rg -n "wrangler " docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | `scripts/cf.sh` 経由のみ |
| 5 | `.env` への実値記述を勧めない（`op://` 参照のみ） | 目視 | op 参照のみ言及 |

### ステップ 3: a11y

- 判定: **N/A**
- 理由: docs-only / NON_VISUAL タスクのため UI 変更なし。`artifacts.json.metadata.visualEvidence == "NON_VISUAL"`。
- 代替: ドキュメント品質チェック（ステップ 4）で markdown 構造の読みやすさを担保する。

### ステップ 4: ドキュメント品質チェック

| # | 項目 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| 1 | filename が lowercase + hyphen | `ls docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` 目視 | 全 file lowercase / hyphen |
| 2 | 元仕様が未タスクテンプレ必須 9 セクションを満たす | `audit-unassigned-tasks.js` 実行 | current violations 0 |
| 3 | 仕様書全体に conflict marker が残っていない | `rg -n "^(<<<<<<<\|=======\|>>>>>>>)" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | 0 hit |
| 4 | stale path（`ut-09-sheets-to-d1-cron-sync-job/`）を新規導線として参照していない | `rg -n "ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | 0 hit（言及するなら "stale" 明記時のみ） |

### ステップ 5: 品質ガード（docs-only impactless 記録）

| ガード | コマンド | 期待 | 備考 |
| --- | --- | --- | --- |
| lint | `mise exec -- pnpm lint` | exit 0 | docs-only のため impactless |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 | docs-only のため impactless |
| build | `mise exec -- pnpm build` | exit 0 | docs-only のため impactless |
| audit | `node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | current violations 0 | 主証跡 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定根拠（free-tier / secret / docs quality） |
| Phase 11 | NON_VISUAL evidence の起点となる audit ログを Phase 11 へ引き渡す |
| 上流 03a/03b/04c/09b | 本タスクが既存タスクへ追加負荷を与えないことを示す |

## 多角的チェック観点（不変条件）

- **#5 apps/web → D1 直接禁止**: 本タスクは仕様書のみ更新し apps/web への D1 経路を一切追加しない
- **#6 GAS prototype 昇格しない**: 本タスクで GAS apps script を再導入する記述がないこと
- **#1 schema 固定しすぎない**: 旧 UT-09 由来の Sheets 列固定アサーションを現行タスクへ持ち込まないことを明記
- **#10 Cloudflare 無料枠**: 本タスクの増分 req/day = 0 を確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | free-tier 見積もり | 9 | pending | 増分 0 |
| 2 | secret hygiene 5 項目 | 9 | pending | 0 hit 期待 |
| 3 | a11y N/A 確定 | 9 | pending | 理由明記 |
| 4 | ドキュメント品質 4 項目 | 9 | pending | filename / 9 セクション / conflict / stale path |
| 5 | 品質ガード（impactless 記録） | 9 | pending | lint/typecheck/build/audit |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-09/main.md` | 品質サマリ + 5 ステップ実行結果 |
| ドキュメント | `outputs/phase-09/free-tier-impact.md` | 増分 0 の根拠 |
| ドキュメント | `outputs/phase-09/secret-hygiene-checklist.md` | 5 項目チェック結果 |
| メタ | `artifacts.json` | Phase 9 を completed に更新 |

## 完了条件

- [ ] free-tier 増分 0 確認
- [ ] secret hygiene 5 項目すべて 0 hit
- [ ] a11y N/A 理由が記録されている
- [ ] ドキュメント品質 4 項目 PASS（current violations 0 / conflict marker 0 / stale path 0）
- [ ] 品質ガード 4 種 exit 0（or impactless 記録）

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が completed
- 成果物 4 ファイル配置済み
- `artifacts.json` の phase 9 を completed に更新

## 次 Phase への引き渡し

- 次: 10 (最終レビュー)
- 引き継ぎ事項: free-tier impact / secret hygiene 結果 / docs 品質結果 / audit ログ
- ブロック条件: secret hygiene 1 項目でも hit が出た場合、または audit current violations が 1 件以上ある場合は Phase 10 に進まない
