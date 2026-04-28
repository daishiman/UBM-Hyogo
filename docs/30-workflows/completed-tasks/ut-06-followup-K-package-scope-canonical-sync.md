# UT-06 Follow-up K: `@ubm-hyogo/*` package scope 正本同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-K |
| タスク名 | 正本仕様に残る `@repo/*` package scope を `@ubm-hyogo/*` へ同期 |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 作成日 | 2026-04-27 |
| 種別 | docs |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-K |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

UT-06 build / smoke docs は `@ubm-hyogo/api`, `@ubm-hyogo/web`, `@ubm-hyogo/shared` を前提に修正済みだが、一部正本仕様（aiworkflow-requirements references / architecture-monorepo 系）に旧 scope `@repo/shared` が残存。これを `@ubm-hyogo/*` へ同期する。

## スコープ

### 含む

- `.claude/skills/aiworkflow-requirements/references/` 配下の `@repo/*` 言及を `@ubm-hyogo/*` へ置換
- `architecture-monorepo` 系仕様書の package scope 同期
- Phase 12 system-spec-update-summary に記録された drift の解消
- 正本仕様 lint（CI で `@repo/` が引っかかれば fail させる guard）

### 含まない

- パッケージ実体の rename（既に `@ubm-hyogo/*` で稼働中）
- import path の機械置換（コード側は同期済み想定）
- 旧 README の歴史的記述削除（changelog として残す）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06 Phase 12 system-spec-update-summary | drift 検出記録 |
| 関連 | task-specification-creator skill | 正本同期の guard 拡張 |
| 関連 | aiworkflow-requirements skill | references 編集対象 |

## 苦戦箇所・知見

**1. 機械的置換でカバーできない範囲**
`@repo/shared` の内部相対 import 例や、過去 ADR で意図的に旧 scope を引用している箇所は機械置換できない。文脈判断が必要。

**2. lint guard の作成**
今後 drift を防ぐため、`.claude/skills/` 配下を `@repo/` で grep して 0 件が CI 条件、という guard を `task-specification-creator` の lint script に追加する。

**3. 歴史的記述の扱い**
過去 wave の lessons-learned に `@repo/*` が残っていてもそのまま参照価値がある場合は、注釈付きで残す（changelog として）。

## 受入条件

- [ ] `.claude/skills/aiworkflow-requirements/references/` から `@repo/` の生引用が解消（または注釈付きで残置）
- [ ] architecture-monorepo 系仕様書が `@ubm-hyogo/*` で統一
- [ ] CI lint guard が `@repo/` 残存を検出する
- [ ] system-spec-update-summary の drift 項目が closed

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-K |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/system-spec-update-summary.md | drift 記録 |
| 必須 | .claude/skills/aiworkflow-requirements/references/ | 編集対象 |
