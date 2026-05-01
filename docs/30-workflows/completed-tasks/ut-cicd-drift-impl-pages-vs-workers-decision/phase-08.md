# Phase 8: DRY 化 / 仕様間整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-05-01 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

ADR 本文 / `deployment-cloudflare.md` 判定表 / `CLAUDE.md` / `apps/web/wrangler.toml` の 4 ファイルに散在しがちな deploy target 決定の重複記述を削減し、「**ADR を source of truth とし、他 3 ファイルは ADR への参照リンク + 最小要約のみ持つ**」整合方針を確定する。関連タスク（`task-impl-opennext-workers-migration-001` / `UT-GOV-006`）の責務分離記述が ADR / 判定表 / 本タスク index.md で重複していないかも検証する。

## DRY 化方針

### 正本（source of truth）の指定

| ファイル | 役割 | 内容深度 |
| --- | --- | --- |
| **ADR (`docs/00-getting-started-manual/specs/adr/NNNN-...md`)** | source of truth | Context / Decision / Consequences の完全記述 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表 | 実装ガイダンス | 「現状 / 将来」列に Pages or Workers を表記 + ADR への参照リンク |
| `CLAUDE.md` スタック表 | プロジェクト概要 | 1 行表記（Cloudflare Workers/Pages + Next.js）+ 詳細は ADR 参照 |
| `apps/web/wrangler.toml` | 実 deploy 設定 | コードリテラルのみ（Pages 形式 or Workers 形式）+ 冒頭コメントで ADR 参照 |

> **原則**: 決定根拠（why）は ADR のみ。他 3 ファイルは結果（what）+ ADR リンクのみ持つ。

### 重複記述削減マップ

| 重複対象 | 旧状態（drift 前） | DRY 化後 |
| --- | --- | --- |
| 「Pages から Workers 移行の検討経緯」 | judgment table と CLAUDE.md notes の双方に分散記述の可能性 | ADR Context のみ。他は「→ ADR 参照」リンク |
| 「`@opennextjs/cloudflare` 採用理由」 | CLAUDE.md スタック表注記 + judgment table 双方 | ADR Decision のみ。CLAUDE.md は 1 行表記 |
| 「不変条件 #5 維持の理由」 | 本 index.md / phase-01.md / phase-03.md / ADR Consequences の 4 箇所 | ADR Consequences が正本。他はリンクのみ |
| 「関連タスク 2 件との責務分離」 | 本 index.md / phase-03.md / ADR Related の 3 箇所 | ADR Related が正本。本タスク仕様書は「→ ADR Related 参照」 |
| 「base case 採択根拠」 | phase-02.md / phase-03.md / ADR Decision の 3 箇所 | ADR Decision が正本。Phase 仕様書は「Phase 3 で確定 → ADR 参照」 |

## 関連タスク責務分離記述の整合確認

| 記述場所 | 内容 | DRY 化後の状態 |
| --- | --- | --- |
| 本タスク index.md | 関連タスクテーブル（migration-001 / UT-GOV-006） | 「責務 / 依存関係（blocks / related）」の 2 カラムのみ。詳細は ADR Related |
| phase-03.md 軸 C | C-1 採択結果（分離） | 「Phase 3 で C-1 採択 → ADR Related 反映」と末尾 1 行で要約 |
| ADR Related | 責務分離表（本 ADR / migration-001 / UT-GOV-006 の 3 行） | 完全記述 |
| migration-001 起票文書（別タスク） | 本 ADR への参照 + 実 cutover スコープ | 「Refs ADR NNNN」のみ |
| UT-GOV-006 起票文書（別タスク） | 本 ADR を canonical sync 対象に追加 | 「ADR NNNN を sync 対象 list に追加」のみ |

## 同 wave 更新が必要なファイル一覧

Phase 12 documentation-changelog Step 1-A で 1 つの commit / wave で同期更新するファイル群を明文化する。

| # | ファイル | 更新内容 | 必須 |
| --- | --- | --- | --- |
| 1 | `docs/00-getting-started-manual/specs/adr/NNNN-...md`（新規） | ADR 本文（Phase 5 runbook 適用） | ✅ |
| 2 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 判定表「現状 / 将来 / 根拠リンク / 更新日」 | ✅ |
| 3 | `CLAUDE.md` | スタック表 1 行（base case 別） | ✅ |
| 4 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/index.md` | ステータス `spec_created` → 維持（Phase 12 完了時に Phase 一覧の status カラム更新） | ✅ |
| 5 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/artifacts.json` | `phases[*].status` 同期 + workflow_state | ✅ |
| 6 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/artifacts.json`（生成時） | task root artifacts.json と parity | ✅ |
| 7 | `.claude/skills/aiworkflow-requirements/LOGS.md` | Phase 12 close-out 記録 | ✅ |
| 8 | `.claude/skills/task-specification-creator/LOGS.md` | Phase 12 close-out 記録 | ✅ |

> **[FB-04] 対応**: backlog ledger / completed ledger / lane index / workflow artifacts / skill artifacts の 5 点同期チェックを Step 1-A 開始時に実施する。

## 完了条件チェックリスト

- [ ] source of truth 指定が 4 ファイルすべてに付与
- [ ] 重複記述削減マップが 5 項目以上識別
- [ ] 関連タスク責務分離記述の整合表が 5 ファイル分記述
- [ ] 同 wave 更新ファイル一覧が 8 ファイル
- [ ] [FB-04] 5 点同期チェックの実行ルールが Step 1-A に紐付け
- [ ] DRY 化原則「why は ADR のみ / 他は what + リンク」が冒頭で宣言

## 実行タスク

1. `outputs/phase-08/main.md` に DRY 化方針 + source of truth 指定を記述。
2. `outputs/phase-08/dry-consolidation-map.md` に重複削減マップ 5 項目 + 関連タスク責務分離整合表 + 同 wave 更新ファイル一覧を記述。
3. [FB-04] 同期チェックを Phase 12 Step 1-A の必須前提として明記。

## 多角的チェック観点

- **DRY ≠ 削除**: 各ファイルの **役割**を残しつつ「決定根拠」だけを ADR に集約する。判定表自体は削らない。
- **リンクの方向**: 他 3 ファイルから ADR への片方向リンク。ADR から他ファイルへの双方向リンク化は drift の温床になるため避ける。
- **責務侵食ゼロ**: 関連タスク 2 件の起票文書を本 Phase で書き換える指示を含めない（別タスクの責務）。
- **同 wave 強制**: Phase 12 の Step 1-A で 8 ファイル同期を **個別 wave 不可**として固定。
- **wrangler.toml 冒頭コメント**: コード変更ではないが、コメント 1 行追加（「→ ADR NNNN 参照」）を Phase 12 の cutover stub に含める。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | source of truth 指定（4 ファイル） | 8 | pending |
| 2 | 重複削減マップ 5 項目 | 8 | pending |
| 3 | 関連タスク責務分離整合表 | 8 | pending |
| 4 | 同 wave 更新ファイル一覧 8 件 | 8 | pending |
| 5 | [FB-04] 5 点同期チェック紐付け | 8 | pending |
| 6 | DRY 化原則宣言 | 8 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化方針 + source of truth |
| ドキュメント | outputs/phase-08/dry-consolidation-map.md | 重複削減マップ + 整合表 + 同 wave ファイル |
| メタ | artifacts.json | Phase 8 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- source of truth 指定が 4 ファイル分
- 重複削減マップが 5 項目以上
- 同 wave 更新ファイル 8 件が列挙
- [FB-04] 5 点同期チェックが Step 1-A 必須前提化
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き継ぎ事項:
  - DRY 化方針（Phase 9 でリンク死活確認時に ADR 中心構造を検証）
  - 同 wave 更新ファイル 8 件リスト（Phase 12 Step 1-A の必須前提）
  - [FB-04] 同期チェック手順
- ブロック条件:
  - source of truth が ADR 以外に分散
  - 重複削減マップが 3 項目未満
  - 同 wave 更新リストが Phase 12 で消費可能な粒度に達していない

## 参照資料

- `outputs/phase-08/dry-consolidation-map.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`

## 統合テスト連携

DRY 統合はドキュメント上の source of truth 整理に限定する。実 runtime 統合テストは対象外。
