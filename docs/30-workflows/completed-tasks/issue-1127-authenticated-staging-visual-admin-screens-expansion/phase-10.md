# Phase 10: 最終レビュー

> **実装区分: 実装仕様書** — acceptance criteria の充足見込み判定・blocker 判定・未タスク化候補・4 条件最終評価を確定する。

## 10.0 レビュー対象

- workflow: `issue-1127-authenticated-staging-visual-admin-screens-expansion`
- 実装物（本サイクルで追加する正本）: 新規 Playwright spec 5 本
  `apps/web/playwright/tests/visual-staging-authenticated/{admin-audit,admin-requests,admin-identity-conflicts,admin-schema,admin-meetings}-authenticated.spec.ts`
- 本タスクの成果（このサイクル）: **implemented_local_runtime_pending**（Phase 1〜12 仕様完成 + 5 Playwright spec local 実装）。staging 実 capture / baseline / commit は user-gated。
- 親 workflow: `issue-1077-bulk-tag-authenticated-staging-visual`（authenticated staging visual 基盤の所有者・不変）。

## 10.1 受け入れ基準の充足見込み判定

| ID | 受け入れ基準 | 充足手段（Phase 参照）| 判定 |
| --- | --- | --- | --- |
| AC-1 | 5 spec を `visual-staging-authenticated/` に新規追加 | 変更ファイル一覧（P5 §5.1）+ 実ファイル（P5 §5.3）| ✅ local 実装済 |
| AC-2 | storageState 読込 → route 遷移 → read-only 初期表示を `toHaveScreenshot` | 雛形踏襲（P2 §2.2）+ 正本コード（P5）| ✅ 設計確定（baseline 生成は user-gated）|
| AC-3 | mutation トリガーを一切クリックしない（防御 assertion）| read-only ガード `toHaveCount(0)`（P2 §2.3 / P5）| ✅ 構造的に充足 |
| AC-4 | `--list` に 5 spec 列挙（project / CI 認識）| 基盤自動認識（P2 §2.1 実証）| ⏳ execution 時に確定 |
| AC-5 | 既存 4 spec 無改修（回帰ゼロ）| git diff = 新 spec 5 本のみ（P9 §9.4）| ✅ 充足見込み |
| AC-6 | `apps/web/src` / `apps/api` / D1 非変更 | スコープ宣言（P9 §9.1）| ✅ 充足見込み |
| AC-7 | read-only / mutation 副作用境界を画面別に根拠付き記録 | P2 §2.3 + spec コメント + ガード assertion | ✅ 充足 |

## 10.2 blocker 判定

| 候補 | 判定 |
| --- | --- |
| 認証基盤の不在 | **blocker でない**（`staging-visual-authenticated` project / `mint-staging-storage-state.ts` / setup・teardown project / `playwright-staging-visual-authenticated.yml` が issue-1077 で landed 済み・既存 4 spec で実証済み）|
| project / CI が新 spec を認識しない | **blocker でない**（testDir + glob 自動認識を P2 §2.1 で実証。新規 project / workflow 不要）|
| セレクタ不在 | **blocker でない**（5 画面の heading / 安定 selector / read-only ガード testid を apps/web 実コードで確認済み・P2 §2.3 / P5）|
| staging seed 不足で空 baseline | **潜在リスク（blocker でない）**。heading / selector の visible assert（timeout 付き）が baseline 生成段階で安全に明示 fail させる |
| 誤 mutation による staging D1 汚染 | **blocker でない**（read-only ガード + mutation 非クリック設計で構造的に遮断・AC-3）|

→ **技術的 blocker なし**。spec は実装可能な状態で設計完成している。

### user-gated 項目（承認後に実施）

- staging baseline 初回生成（`--update-snapshots` / staging 認証 secret 必須）
- commit / push / PR 作成（CONST_002）

## 10.3 MINOR 指摘 → 未タスク化候補（Phase 12 入力）

`outputs/phase-12/unassigned-task-detection.md` への入力候補:

| ID | 指摘 | 区分 | 推奨対応 |
| --- | --- | --- | --- |
| MINOR-01 | mutation result 状態（承認後 / merge 後 / 再集計後 / 出席追加後 等）の staging 実機 baseline は本タスク非取得 | スコープ外（C-1 系・恒久境界）| **新規未タスク化しない**。issue #1127 §2.3 / Phase 1 §2.3 が定義する恒久的アーキテクチャ境界として **既に追跡済み**（C-1 系 mutation baseline / issue-1125 系列 seed-cleanup runner パターン）。read-only capture とはインフラが根本的に異なる独立タスク族のため、本タスクからの再起票は重複となる |
| MINOR-02 | baseline 初回生成の運用手順（storageState mint → `--update-snapshots` → baseline コミット → CI 緑化）が spec 横断で口伝になりがち | improvement / low | **検討候補**。authenticated staging visual の baseline 生成手順を 1 箇所に runbook 化する程度の軽微改善。本タスクの GO は妨げない。横展開 spec が増えた今こそ手順ドキュメント化の費用対効果が出る |

> MINOR-01 は既追跡境界のため新規起票しない。MINOR-02（baseline 初回生成の運用手順ドキュメント化）のみを Phase 12 未タスク化の検討入力とする。いずれも **本タスクの GO を妨げない**。

## 10.4 4 条件最終評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | ○ | authenticated staging 実機での visual 回帰検出を admin 4 画面 → 9 画面（+5）へ拡張。レイアウト崩れ / OKLch トークン回帰 / 認証境界描画差分を 5 画面で実機検出可能に |
| 実現性 | ○ | 既存基盤の testDir + glob 自動認識により spec 5 本追加のみ。雛形コピー + selector / heading / read-only ガード差し替えで完結。新規 project / CI 不要 |
| 整合性 | ○ | 命名規約（`*-authenticated.spec.ts`）・storageState パターン・screenshot オプション・OKLch / D1 直接アクセス禁止の各不変条件に整合。既存 4 spec 無改修（AC-5）|
| 運用性 | ○ | ファイル追加で CI が自動認識。read-only 限定で staging 共有 D1 へ副作用ゼロ。mutation result は C-1 系の恒久境界として分離済み |

## 10.5 最終判定

| 項目 | 判定 |
| --- | --- |
| spec 完成度 | Phase 1〜12 仕様完成・実装可能・blocker なし |
| AC 充足見込み | AC-1/2/3/5/6/7 = 充足見込み（設計確定）/ AC-4 = execution 時確定 |
| **最終判定** | **GO（implemented_local_runtime_pending 完成）** |
| staging baseline 生成 / commit / PR | **user-gated**（承認後実施）|
| GitHub issue #1127 | **CLOSED 維持**（reopen しない・refs-only）|

> 本サイクルの成果は「実装仕様書と新規 Playwright spec 5 本の local 実装、および doc QA / spec 規約 QA PASS」。認証付き staging Playwright 実行・baseline 生成 / commit・PR 作成は user 承認後に委ねる。

## 10.6 完了条件（Phase 10）

- [x] AC-1..AC-7 の充足見込みを個別判定した（設計確定分は PASS / staging 実 capture 系は user-gated pending）
- [x] 技術的 blocker なしを根拠付きで判定し、user-gated 項目を列挙した
- [x] MINOR-01（C-1 系・既追跡境界・新規未タスク化しない）/ MINOR-02（baseline 生成手順ドキュメント化）を Phase 12 入力として記録した
- [x] 4 条件（価値性 / 実現性 / 整合性 / 運用性）を評価した
- [x] 最終判定 = GO（implemented_local_runtime_pending 完成 / runtime user-gated）を確定した
