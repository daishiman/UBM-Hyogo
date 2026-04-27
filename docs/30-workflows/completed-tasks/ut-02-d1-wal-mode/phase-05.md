# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |

## 目的

`wrangler.toml` への D1 バインディング追記と、Cloudflare D1 における WAL mode PRAGMA の公式サポート確認手順を runbook に記録する。公式永続サポートが確認できない場合、UT-02 から staging / production の journal mode mutation は行わない。

## 実行タスク

- `apps/api/wrangler.toml` に D1 バインディングを追記する（コメント含む）
- Cloudflare D1 公式ドキュメントで `journal_mode` の compatible PRAGMA / 永続サポート有無を確認する
- 公式サポートがある場合だけ staging で `PRAGMA journal_mode=WAL` を検証する
- 公式サポートが不明または非対応の場合は runtime mitigation を UT-09 へ委譲する
- 実行手順を runbook として記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 binding 設定例・wrangler コマンド |
| 必須 | docs/ut-02-d1-wal-mode/phase-04.md | verify suite 結果・確認済みコマンド |
| 必須 | docs/ut-02-d1-wal-mode/phase-02.md | 設計済みの wrangler.toml・手順 |
| 参考 | docs/completed-tasks/02-serial-monorepo-runtime-foundation/phase-05.md | 組み込み先 Phase（存在する場合） |

## 実行手順

### ステップ 1: wrangler.toml への D1 バインディング追記

`apps/api/wrangler.toml` の `[[d1_databases]]` セクションに以下を追記する。
WAL mode 設定根拠コメントを必ず含めること（AC-1 の要件）。

```toml
# D1 データベースバインディング
# D1 write/read contention policy:
# Do not assume persistent PRAGMA journal_mode=WAL unless Cloudflare D1
# documents support for it. Runtime mitigation is handled in UT-09.
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "<staging-d1-database-id>"  # staging

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "<production-d1-database-id>"  # production
```

### ステップ 2: staging D1 での公式サポート確認

```bash
# staging D1 の現在値を読み取り確認（mutation ではない）
wrangler d1 execute ubm-hyogo-db \
  --env staging \
  --command "PRAGMA journal_mode;"
# 結果は evidence として記録する。wal を期待値として固定しない。
```

### ステップ 3: mutation の実行条件

`PRAGMA journal_mode=WAL` の実行は、Cloudflare D1 公式ドキュメントで永続サポートが確認でき、02-serial runtime execution 側で明示承認された場合に限る。UT-02 docs-only close-out では実行しない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | verify suite の PASS を前提に実行 |
| Phase 6 | 本 Phase の実行結果を異常系検証の前提とする |

## 多角的チェック観点（AIが判断）

- 価値性: AC-1〜AC-5 が全て達成されているか
- 実現性: wrangler.toml の追記と公式サポート確認手順が実行可能な粒度か
- 整合性: staging / production mutation を未検証前提で要求していないか
- 運用性: runbook が次の担当者でも再現できる粒度で記録されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler.toml D1 バインディング追記 | 5 | spec_created | コメント含む・AC-1 |
| 2 | staging journal_mode 読み取り確認手順 | 5 | spec_created | read-only evidence・AC-2 |
| 3 | production mutation 禁止条件の明記 | 5 | spec_created | docs-only safety・AC-2 |
| 4 | runbook 記録 | 5 | spec_created | AC-3 |
| 5 | local 差異の文書化 | 5 | spec_created | AC-4 |
| 6 | 02-serial との AC 整合確認 | 5 | spec_created | AC-5 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | runbook の WAL mode セクション |
| ドキュメント | outputs/phase-05/wal-mode-apply-result.md | WAL mode 適用確認結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] wrangler.toml に D1 バインディングが追記されている（コメント含む）
- staging D1 の `PRAGMA journal_mode;` 読み取り確認手順が記録されている
- production への `PRAGMA journal_mode=WAL` は公式永続サポート確認まで禁止されている
- runbook が outputs/phase-05/ に記録されている
- local との WAL 差異が文書化されている
- AC-1〜AC-5 が全て達成されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- PRAGMA 読み取り確認手順と mutation 禁止条件が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 条件付き WAL 方針と runtime mitigation を異常系検証へ渡す
- ブロック条件: runbook が無条件の production WAL mutation を要求している場合は次 Phase に進まない

## runbook

### WAL mode 設定 runbook

**前提条件:**
- wrangler@3.x 以上がインストール済み
- `wrangler login` が完了している
- D1 インスタンス（ubm-hyogo-db）が作成済み

**実行手順:**

1. wrangler.toml に D1 バインディングと WAL mode 設定根拠コメントを追記する
2. Cloudflare D1 公式ドキュメントで `journal_mode` の compatible PRAGMA / 永続サポートを確認する
3. staging の現在値を読み取り確認する:
   ```bash
   wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"
   # → 結果を evidence として記録
   ```
4. 公式永続サポートが不明または非対応の場合は mutation せず、UT-09 に runtime mitigation を委譲する
5. 公式永続サポートが確認できた場合だけ、02-serial runtime execution の明示承認後に staging から検証する

**rollback 手順:** UT-02 では journal mode mutation を行わないため rollback は発生しない。後続 runtime execution で mutation を承認する場合は、そのタスク内で rollback plan を作成する。

### sanity check

| チェック | コマンド | 期待結果 |
| --- | --- | --- |
| staging journal_mode 確認 | `wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"` | 結果を evidence として記録 |
| production mutation policy 確認 | runbook review | 公式永続サポート確認まで mutation 禁止 |
| wrangler.toml D1 binding 確認 | `grep -A5 "d1_databases" apps/api/wrangler.toml` | binding・database_name・database_id が含まれる |
| WAL 設定根拠コメント確認 | `grep -i "WAL" apps/api/wrangler.toml` | コメント行が含まれる |
