# Phase 1: 要件定義

> **[実装区分: 実装仕様書]** NON_VISUAL / ci-gate / implementation_mode = `new`

## 1.1 タスク分類（Feedback 1 / Feedback 3）

| 項目 | 値 |
|------|-----|
| タスク種別 | **NON_VISUAL**（CI workflow / Node script / shell のみ。UI/UX 変更なし） |
| 実装区分 | 実装仕様書（コード変更必須） |
| implementation_mode | `new`（current branch に本タスクの実装は未着手。新規 role-scoping / 新規 gate を含む） |
| visualEvidence | NON_VISUAL → Phase 11 は screenshot 不要、自動テスト + actionlint を証跡とする |

## 1.2 真の論点（要件レビュー思考法・5 項目一次結論）

1. **真の論点**: mint-staging-bearers.mts の必須 env 契約が role 単位でないため、admin-only job が me credential 欠落で原理的に落ちる。かつ drift が PR 時点で機械検出されない。
2. **依存・責務境界の問題**: 「どの role の credential が必要か」の決定権が、呼び出す workflow step（admin だけ欲しい）と mint script（常に両方要求）で食い違っている。責務が分裂している。
3. **価値とコストの不均衡**: 現状、bulk-tag job は 0 行の自分の責任でない理由（me secret 未配備）で毎回 fail し CI 全体を止める。修正コストは小（role 引数 + gate）。
4. **改善優先順位**: A（root fix）→ B（drift gate）→ C（provision 整合）→ D（degrade）。A が無いと B/C/D が無意味、B が再発防止の本体。
5. **4 条件**: 価値性=CI 安定（誰=開発者の毎 deploy コスト削減）／実現性=既存 script の最小改修で可能／整合性=role 境界を mint script 内で閉じる／運用性=gate で drift を継続検出。

### 因果ループ

- **バランスループ（解消したい悪循環）**: 「mint 契約変更 → workflow step 未追従 → CI fail → 手動で secret 追加 / step 修正 → また別 job で契約変更」。B の drift gate がこのループを断つ（変更が PR で即検出される）。
- **強化ループ（狙う好循環）**: 「role-scoping で job ごとに最小 env → 不要 secret を provision しない → secret 管理面積が縮小 → 漏れにくい」。

## 1.3 既存コードベース命名規則（FB-01 / FB-SDK-07-4）

| 対象 | 規則 | 例 |
|------|------|-----|
| smoke script ファイル | kebab-case `.mts` / `.sh` | `mint-staging-bearers.mts`, `runtime-tag-bulk.sh` |
| test ファイル | `*.spec.ts`（CLAUDE.md 不変条件 #8。`*.test.ts` 禁止。shell test のみ `*.test.sh`） | `mint-staging-bearers.spec.ts` |
| pure 関数 | camelCase | `mintStagingBearers`, `classifyBearerFreshness` |
| 型 | PascalCase | `MintedBearers`, `JwtFreshness` |
| env 変数 | SCREAMING_SNAKE / `STAGING_` prefix | `STAGING_ADMIN_MEMBER_ID` |
| GitHub Actions workflow | kebab-case `.yml` | `runtime-smoke-staging.yml` |
| 新規 verify gate（本タスク命名）| 既存 `verify-*` workflow 慣習に合わせ `verify-mint-env-contract` | `verify-mint-env-contract.yml`（既存 `verify-hook-integrity.yml` / `verify-indexes.yml` と一貫） |
| 新規 script CLI 引数（本タスク命名）| `--roles` + comma 区切り（既存 `mint-staging-session-cookie.mts` の位置引数 `production` とは別系統だが、複数 role を取れる柔軟性を優先し flag 形式を採用）| `--roles admin` |

> **命名一貫性の決定**: 新 gate 名は `verify-mint-env-contract`（動詞 `verify-` + 対象 `mint-env-contract`）。既存 `verify-hook-integrity` / `verify-indexes` / `verify-design-tokens` と同型。

## 1.4 受入条件（AC-1〜AC-12）

index.md §3 を正本とする。本 phase で AC を明示列挙済み（予告で終わらせない・create-workflow.md ルール遵守）。要約再掲:

- AC-1〜AC-4: mint script role-scoping（A）
- AC-5: bulk-tag job の `--roles admin` 配線（A）
- AC-6〜AC-8: drift 検出 gate（B）
- AC-9: provision script 整合（C）
- AC-10〜AC-11: degrade staging 限定（D）
- AC-12: 既存テスト後方互換（回帰防止）

## 1.5 inventory（artifact 命名 canonical — Feedback 1 で先に確定）

### 変更対象ファイル

| パス | 変更種別 | 対策 |
|------|----------|------|
| `scripts/smoke/mint-staging-bearers.mts` | 編集 | A, D |
| `scripts/smoke/verify-mint-env-contract.mts` | **新規** | B |
| `.github/workflows/runtime-smoke-staging.yml` | 編集 | A, D |
| `.github/workflows/verify-mint-env-contract.yml` | **新規** | B |
| `scripts/smoke/provision-staging-secrets.sh` | 編集 | C |
| `scripts/smoke/README.md` | 編集 | A, B, C, D（doc） |

### テストファイル

| パス | 変更種別 |
|------|----------|
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | 編集（role-scoping ケース追加） |
| `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | **新規** |

### Phase 12 strict outputs（canonical 名・固定）

`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`

### Phase 11 evidence（NON_VISUAL・ファイル名固定 / FB-02）

- `outputs/phase-11/manual-test-result.md`（主証跡）
- `outputs/phase-11/evidence/mint-role-scope-test.log`（vitest 出力）
- `outputs/phase-11/evidence/verify-mint-env-contract-actionlint.log`（actionlint 出力）

## 1.6 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在するか | Yes（automation-30 改善で role-scoping / gate / workflow / provision を実装済み） | Phase 5 以降の実装結果として昇格 |
| upstream（dev/main）にマージ済みか | No | 未マージとして扱う |
| 前提タスク（issue-1081）完了済みか | Yes（bulk-tag runtime smoke 基盤は実装済み） | 依存解消不要。本タスクはその env 契約 drift fix |

→ `implementation_mode: "new"`。Phase 5 は新規実装（RED/GREEN）。

## 1.7 依存タスク

- 親 workflow: `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke`（bulk-tag runtime smoke 基盤）。本タスクはその mint env 契約欠陥を修正する follow-up。

## 1.8 完了条件（Phase 1）

- [x] タスク分類（NON_VISUAL / 実装仕様書 / mode=new）を記録
- [x] 真の論点・因果ループ・4 条件を記録
- [x] 命名規則を分析・記録
- [x] AC-1〜AC-12 を明示列挙
- [x] inventory（変更ファイル・テスト・artifact canonical 名）を確定
- [x] P50 チェック完了
