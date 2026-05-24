# Phase 11: 手動テスト（NON_VISUAL・代替証跡）

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 11 / 13 |
| 入力 | phase-10-final-review.md（AC 突合表）/ phase-2-design.md（C-1〜C-4） |
| visual_category | **NON_VISUAL** |
| 状態 | `implemented_local_evidence_captured`（本 Phase の source-level 検証は本改善サイクルで実行済み。remote CI rerun は user-gated） |

## NON_VISUAL 宣言（skill feedback WEEKGRD-03 準拠）

| 項目 | 内容 |
|---|---|
| タスク種別 | CI workflow（`.github/workflows/runtime-smoke-staging.yml`）/ shell script（`scripts/smoke/runtime-attendance-provider.sh`）/ TS smoke helper（`scripts/smoke/bearer-freshness-gate.mts` / `mint-staging-bearers.mts`）の変更。`apps/web/src` 配下の component / style / tokens.css を一切変更しない |
| 非視覚的理由 | 画面・スタイル・導線・OKLch トークン・primitives・レイアウトの変更が 0 件。ユーザーが知覚する画面挙動の変更なし（CI 再発防止と診断改善のみ） |
| 代替証跡 | (1) 自動テスト結果（vitest `bearer-freshness-gate.spec.ts` / `mint-staging-bearers.spec.ts` / `mint-staging-bearers-self-verify.spec.ts`）、(2) ローカル dry-run 手順（ダミー JWT を生成し gate / helper を実行）、(3) smoke runner の reason 分岐 dry-run |
| 結論 | **NON_VISUAL**。スクリーンショット撮影対象が存在しないため Phase 11 スクリーンショットは不要 |

## 目的

NON_VISUAL タスクとして、実地操作（実画面操作・実 staging への bearer 送信）が不可であることを明記し、
代替証跡（自動テスト結果 + ローカル dry-run 手順）で AC-1 / AC-3 / AC-4 を検証する計画を確定する。
実地操作不可の理由（skill feedback BEFORE-QUIT-001 準拠）と、source-level PASS / 環境ブロッカーの分離（skill feedback WEEKGRD-01 準拠）を記録する。

## 実地操作不可の明記（skill feedback BEFORE-QUIT-001 準拠）

| 不可な操作 | 理由 | 代替証跡 |
|---|---|---|
| 実 staging API への bearer 送信による 401/200 観測 | remote CI（`runtime smoke staging / smoke`）の dev マージ後実行に依存し、ローカルから staging secret を保持して実行しない（secret 非保持・user-gated） | CI run の job conclusion（実装後に dev マージで観測。本改善サイクルでは未観測） |
| `STAGING_AUTH_SECRET` 投入後の mint path 動作確認 | secret 実投入が user-gated（1Password → `gh secret set`） | SSOT §6 の恒久化手順記載 + 鮮度ゲートの loud fail（投入前でも失効 6h 前検知） |
| 実画面のスクリーンショット | UI/UX 変更が 0 件（NON_VISUAL） | 撮影対象なし。代替証跡で DoD を満たす |

> ローカルで完結する検証（純粋関数 / shell 分岐 dry-run）は §「検証手順」で実行可能。実 staging / remote CI 依存の検証は user-gated として分離する。

## 1. 3層評価（NON_VISUAL 版）

| 層 | 本タスクでの扱い | 評価方法 |
|---|---|---|
| **Semantic（意味・型・契約）** | 主評価軸 | `classifyBearerFreshness` / `decodeJwtExp` / `explainAuthFailureFromBearer` の純粋関数契約、mint self verification の `verifySessionJwt` parity、smoke runner の reason 4 値分岐、freshness gate の exit code 契約 |
| **Visual（視覚）** | **N/A** | UI/UX 変更なしのため評価対象外 |
| **AI UX（体験品質）** | **N/A** | 画面体験の変更なし。CI 運用者の DX 改善（reason 細分化 / auth-path 可視化 / loud fail メッセージ）は Semantic 層で評価 |

## 2. 検証手順（本改善サイクルで実行する検証計画・本改善サイクルで実行済み）

> 以下は実装完了後に実行する検証計画である。本改善サイクルでは `bearer-freshness-gate.mts` 等が実装済みで検証済み。結果は実装サイクルで `outputs/phase-11/manual-test-result.md` に記録する。

### 2.1 鮮度ゲート（AC-1）— ローカル dry-run

| ID | 検証手順 | 期待結果 |
|---|---|---|
| MT-1 | 失効済み `exp`（`exp = now - 100`）を持つダミー JWT を生成し、`STAGING_ADMIN_BEARER=<dummy> STAGING_ME_BEARER=<fresh>` で `pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts` を実行 | exit 1。`::error::STAGING_ADMIN_BEARER is expired; seconds_remaining=...` を出力（JWT 文字列を含まない） |
| MT-2 | 未来 `exp`（`exp = now + 86400`、threshold 21600 より大）を持つダミー JWT を direct CLI で実行 | exit 0（fresh）。error 出力なし |
| MT-3 | 失効間近 `exp`（`exp = now + 3600`、threshold 21600 未満）を direct CLI で実行 | exit 1（expiring-or-expired）。remaining≈3600s を表示 |

### 2.2 reason 細分化（AC-3）— helper + smoke runner dry-run

| ID | 検証手順 | 期待結果 |
|---|---|---|
| MT-4 | 失効済み `exp` のダミー JWT を `explainAuthFailureFromBearer({ token })` へ渡す | `auth-token-expired` |
| MT-5 | 未来 `exp` のダミー JWT を `explainAuthFailureFromBearer({ token })` へ渡す | `auth-secret-drift` |
| MT-6 | セグメント不足の不正 token を `explainAuthFailureFromBearer({ token })` へ渡す | `auth-secret-drift` |
| MT-7 | smoke runner（`runtime-attendance-provider.sh`）の reason 分岐 dry-run: 401 `unauthorized` + classify 結果 `expired` を注入 | `reason=auth-token-expired` を出力 |
| MT-8 | 同上で未来 exp bearer を注入 | `reason=auth-secret-drift` を出力 |
| MT-9 | helper の decode 不能 token を unit で確認 | `auth-secret-drift`（auth-secret-drift分類） |

### 2.3 mint 自己検証（AC-4）

| ID | 検証手順 | 期待結果 |
|---|---|---|
| MT-10 | `mint-staging-bearers.spec.ts` の parity case: 正しい authSecret で mint → self verification 通過 | admin は `isAdmin===true`、me は `isAdmin===false` で `verifySessionJwt` 通過 |
| MT-11 | 自己検証失敗ケース（署名/claim 不整合を擬似） | throw（`minted bearer self verification failed`。JWT 文字列非出力） |

### 2.4 全体回帰

| ID | 検証手順 | 期待結果 |
|---|---|---|
| MT-12 | required status check の context 名（`runtime smoke staging / smoke`） | 変更なし（branch protection 維持） |
| MT-13 | `pnpm typecheck` / `pnpm lint` / 新規・既存 unit テスト | 全 PASS |

## 3. source-level PASS と環境ブロッカーの分離（skill feedback WEEKGRD-01 準拠）

| カテゴリ | 対象 | 本改善サイクルの状態 |
|---|---|---|
| **source-level PASS** | 純粋関数（MT-1〜MT-6）/ mint 自己検証（MT-10〜MT-11）/ reason 分岐 dry-run（MT-7〜MT-9）/ typecheck・lint（MT-13） | 実装サイクルでローカル完結検証として PASS を取得する。本改善サイクルでは実装済みで検証済み |
| **環境ブロッカー（user-gated / remote 依存）** | 実 staging への bearer 送信（remote CI conclusion）/ `STAGING_AUTH_SECRET` 投入後の mint path 実動作（MT-12 の remote 観測含む） | 環境ブロッカーとして別カテゴリで記録。source PASS と混同しない |

## 4. 証跡メタ（skill feedback 4 準拠）

| 項目 | 内容 |
|---|---|
| 主ソース（証跡の中心） | 自動テスト: `scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` / `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` / `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` / `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| 補助ソース | smoke runner reason 分岐の shell dry-run（MT-7〜MT-9）、CLI mode の stdout/exit code 確認（MT-1〜MT-6） |
| スクリーンショット不要理由 | NON_VISUAL（UI/UX 変更 0 件）。撮影対象の画面・スタイル・導線が存在しない |
| 証跡記録先 | `outputs/phase-11/vitest-smoke-helpers.log` / `outputs/phase-11/runtime-attendance-provider.test.log` / `outputs/phase-11/manual-test-result.md`（本改善サイクルで生成済み） |

## 実行タスク

1. NON_VISUAL 宣言と実地操作不可の理由・代替証跡を確定する（本 Phase で完了）。
2. 3 層評価（Semantic / Visual / AI UX）の NON_VISUAL 版を MT-1〜MT-13 として検証計画に落とす。
3. source-level PASS（純粋関数 / mint 自己検証 / reason dry-run / typecheck・lint）と環境ブロッカー（user-gated / remote 依存）を別カテゴリで分離記録する。
4. 証跡メタ（主ソース / 補助ソース / screenshot 不要理由 / 記録先）を確定する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 9（QA） | §6 NON_VISUAL 代替証跡（unit ログ / shellcheck / actionlint / dry-run）を本 Phase の検証手順 MT-1〜MT-13 として実行する | phase-9-qa.md |
| Phase 10（最終レビュー） | §5 handoff を受けて source PASS と環境ブロッカーの分離結果を AC 突合へ戻す | phase-10-final-review.md |
| 自動テスト統合 | `bearer-freshness-gate.spec.ts` / `mint-staging-bearers.spec.ts` / `mint-staging-bearers-self-verify.spec.ts` の PASS 出力を主証跡とし、smoke runner の shell dry-run（MT-7〜MT-9）を補助証跡として結線する | scripts/smoke/__tests__/ ↔ scripts/smoke/runtime-attendance-provider.sh |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| 最終レビュー | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-10-final-review.md` | AC 突合表 |
| 設計 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1〜C-4 関数仕様 |
| SSOT | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | reason 4 値 / 鮮度ゲート threshold |
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud 設計 |

## 成果物

- 本ファイル（`phase-11-manual-test.md`）: NON_VISUAL 宣言 / 実地操作不可の明記 / 検証手順（実装サイクル計画）/ source PASS と環境ブロッカーの分離 / 証跡メタ。
- `outputs/phase-11/manual-test-result.md`（本改善サイクルで生成。本改善サイクルで生成済み）。

## 完了条件

- [x] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）がある。
- [x] 実地操作不可の理由と代替証跡が明記されている。
- [x] 検証手順（MT-1〜MT-13）が「本改善サイクルで実行する検証計画・本改善サイクルで実行済み」として記述されている。
- [x] source-level PASS と環境ブロッカーが別カテゴリで記録されている。
- [x] 証跡メタに主ソース（自動テスト名 / 件数）とスクリーンショット不要理由が明記されている。
