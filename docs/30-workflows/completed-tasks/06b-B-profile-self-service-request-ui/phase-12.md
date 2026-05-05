# Phase 12: ドキュメント更新 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 12 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial） |
| 作成日 | 2026-05-02 |
| taskType | feature-spec / VISUAL_ON_EXECUTION |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/profile` に追加する公開停止/再公開申請 UI と退会申請 UI の実装内容を、正本仕様書 (`05-pages.md` / `07-edit-delete.md` / `09-ui-ux.md`) と実装ガイドへ反映する。中学生レベルの概念説明 (Part 1) と開発者レベルの技術的詳細 (Part 2) を `implementation-guide.md` に書き、PR 本文の元ネタとなる構造に揃える。

## 事前チェック【必須】

Phase 12 実行前に、以下の既知の落とし穴を確認する。

1. P1: LOGS.md 2ファイル更新漏れ
2. P2: topic-map.md 再生成忘れ
3. P3: 未タスク管理の3ステップ不完全
4. P29: SKILL.md 変更履歴更新漏れ
5. FB-UT-UIUX-001: UI/UX 変更タスクで Phase 11 スクリーンショット証跡が揃っているかをハードゲートで確認する

## 実行タスク

| Task | 内容 | 主成果物 |
| ---- | ---- | -------- |
| Task 12-1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術詳細） | `outputs/phase-12/implementation-guide.md` |
| Task 12-2 | システム仕様書 (`05-pages.md` / `07-edit-delete.md` / `09-ui-ux.md`) を更新 | `outputs/phase-12/system-spec-update-summary.md` |
| Task 12-3 | ドキュメント更新履歴を作成 | `outputs/phase-12/documentation-changelog.md` |
| Task 12-4 | 未タスク検出（pending banner sticky 化 / admin queue 再設計の繰り越し可否） | `outputs/phase-12/unassigned-task-detection.md` |
| Task 12-5 | スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` |
| Task 12-6 | Task 12-1〜12-5 の準拠確認 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

- Task 12-1: 実装ガイド作成（Part 1 / Part 2 二段構成）
- Task 12-2: システムドキュメント更新（仕様書 3 種 + 必要なら `apps/web/app/profile/README.md`）
- Task 12-3: ドキュメント更新履歴作成
- Task 12-4: 未タスク検出
- Task 12-5: スキルフィードバックレポート作成
- Task 12-6: phase12-task-spec-compliance-check

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 受入条件 | `outputs/phase-01/main.md` |
| Phase 2 設計 | `outputs/phase-02/main.md` |
| Phase 11 evidence | `outputs/phase-11/main.md`, `outputs/phase-11/screenshots/` |
| 公開仕様（ページ） | `docs/00-getting-started-manual/specs/05-pages.md` |
| 公開仕様（編集/削除） | `docs/00-getting-started-manual/specs/07-edit-delete.md` |
| 公開仕様（UI/UX） | `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| profile README（任意） | `apps/web/app/profile/README.md`（存在する場合のみ） |
| API 契約 | `apps/api/src/routes/me/index.ts`, `apps/api/src/routes/me/schemas.ts` |
| diff-to-pr | `.claude/commands/ai/diff-to-pr.md` |

## 実行手順

### Task 12-1: 実装ガイド作成【必須・2 パート構成】

`outputs/phase-12/implementation-guide.md` を 2 パート構成で作成する。

#### Part 1: 中学生レベル概念説明

以下 3 トピックを平易な日本語で順序固定で書く。`たとえば` を最低 1 回使い、「なぜ必要か」→「何をするか」の順を維持する。

1. 「公開停止申請とは何か」
   - 例え: 学校の連絡網で「自分の名前を一旦載せないでほしい」と先生にお願いするようなもの
   - なぜ必要か: 仕事や家庭の事情で一時的に名前を出したくない時期がある
   - 何をするか: マイページのボタンから「公開を止めて」と申請し、管理者が確認してから本当に止める
2. 「退会申請とは何か」
   - 例え: 図書館の利用カードを返すようなもの
   - なぜ必要か: 会から離れる時に、データを残したままにせずきれいにしたい
   - 何をするか: マイページから「退会したい」と申請し、管理者が手続きを確定する
3. 「なぜ二重申請を防ぐのか」
   - 例え: 同じ宅配便を 2 回頼むと配達員が混乱するのと同じ
   - なぜ必要か: 同じ申請が 2 件入ると管理者がどちらを処理して良いか分からなくなる
   - 何をするか: 既に処理待ちの申請があれば、2 回目のボタン押下に対して「もう受け付けています」とやさしく伝える

#### Part 2: 開発者レベル技術詳細

| 項目 | 内容 |
| --- | --- |
| Summary | `/profile` に `RequestActionPanel` を 1 つ差し込み、公開停止/再公開と退会の 2 dialog + 2 client helper + 2 API call を追加 |
| 追加ファイル | `apps/web/app/profile/_components/{RequestActionPanel,VisibilityRequestDialog,DeleteRequestDialog,RequestPendingBanner,RequestErrorMessage}.tsx`、`apps/web/src/lib/api/me-requests.ts`、`apps/web/src/lib/api/me-requests.types.ts` |
| 変更ファイル | `apps/web/app/profile/page.tsx`（panel 差し込みのみ） |
| API contract | `POST /me/visibility-request`（body: `{ desiredState: "hidden" \| "public", reason?: string }`）／`POST /me/delete-request`（body: `{ reason?: string }`）／成功 202 `{ queueId, type, status: "pending", createdAt }` |
| Test coverage | unit (Vitest) for helper / dialog、integration for `RequestActionPanel` 表示分岐、E2E (Playwright) で S1/S2/S3/S4 シナリオ |
| Screenshots | `outputs/phase-11/screenshots/` の `TC-01-request-panel-default-public-light.png` / `TC-02-request-panel-default-hidden-light.png` / `TC-03-visibility-dialog-open-light.png` / `TC-04-delete-dialog-open-light.png` / `TC-06-duplicate-409-light.png`（実測時に出力。dark mode は N/A） |
| Invariants | #4 (本文編集禁止) は dialog から本文 input を排除して構造で担保、#5 (D1 直接禁止) は `apps/web` で `cloudflare:d1` を import しない、#11 (self-service 境界) は URL を `/me/...` に固定 |
| Out of scope | プロフィール本文のアプリ内編集 UI、admin request queue 再設計、即時反映の楽観的更新 |
| Error 処理 | `RequestErrorCode` を `DUPLICATE_PENDING_REQUEST / INVALID_REQUEST / RULES_CONSENT_REQUIRED / RATE_LIMITED / UNAUTHORIZED / NETWORK / SERVER` の 7 種に固定し UI 文言と 1:1 対応 |
| 設定可能パラメータ | reason 最大長 500（client zod / server zod 両方）、再試行は user 操作のみ（自動 retry なし） |

Part 2 必須 5 項目チェック:

- C12P2-1 型定義: `VisibilityRequestInput` / `DeleteRequestInput` / `QueueAccepted` / `RequestErrorCode` / `RequestResult`
- C12P2-2 API シグネチャ: `requestVisibilityChange()` / `requestDelete()`
- C12P2-3 使用例: `RequestActionPanel` から `useTransition` で呼び出すコード例
- C12P2-4 エラー処理: `FetchAuthedError.status` → `RequestErrorCode` 変換表
- C12P2-5 設定値: reason 最大長 / endpoint URL 定数

### Task 12-2: システム仕様書更新

| 対象ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` ページの構成図に `RequestActionPanel` を追記、Google Form 再回答 CTA との並列関係を明記 |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 公開停止 / 退会の正式入口を「マイページから申請」と正本化し、Google Form 経路は補助扱いに記述変更 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | dialog の a11y 要件（focus trap / role=dialog / aria-describedby）と error mapping 表を追記 |
| `apps/web/app/profile/README.md` | 存在する場合のみ、新規 component の責務表を追記。存在しなければ作成しない |

ドキュメント drift チェック手順:

```bash
# 旧文言（Google Form 経路のみ）が残っていないことを確認
rg -n "Google Form のみ|Form 再回答のみ" docs/00-getting-started-manual/specs/

# 新規 component 名が仕様書に出現することを確認
rg -n "RequestActionPanel|VisibilityRequestDialog|DeleteRequestDialog" docs/00-getting-started-manual/specs/
```

### Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録する。

- 変更ファイル一覧（仕様書 3 種 + 実装ガイド + artifacts.json + index.md）
- `current` (今回更新) と `baseline` (既存) の境界
- validator 結果（typecheck / lint / `validate-phase12-implementation-guide.js`）
- artifacts.json と outputs/artifacts.json の同期結果

### Task 12-4: 未タスク検出

最低限以下 2 候補をチェック対象とする。

| 候補 | 判定 | placement |
| --- | --- | --- |
| pending banner の sticky 化（reload で消えない） | open（MVP では client local state 限定なので follow-up 起票） | `docs/30-workflows/unassigned-task/` |
| admin request queue 再設計（管理画面側の状態遷移 UI） | baseline（既知 backlog、本タスクの差分起因ではない） | 起票見送り、`unassigned-task-detection.md` に理由記録 |

0 件でも summary を残す。SF-03 4 パターンとの照合結果も記載する。

### Task 12-5: スキルフィードバック

- `task-specification-creator`: VISUAL_ON_EXECUTION の Phase 12 で「Phase 11 evidence path をどこまで具体化すべきか」のテンプレ追補が有用かを記録
- `aiworkflow-requirements`: `09-ui-ux.md` の error mapping 表を共通テーブルとして追加すべきか
- 改善点なしでも「なし」と理由を書く

### Task 12-6: phase12-task-spec-compliance-check

- Task 12-1〜12-5 全完了確認
- planned wording (`計画`/`予定`/`TODO`/`保留として記録`) が `outputs/phase-12/` に残っていないことを `rg` で確認
- artifacts.json / index.md の Phase 12 status と outputs 実体の整合確認

## 統合テスト連携

- 上流: 04b /me self-service API, 06b profile page, 06b-A me API Auth.js session resolver
- 下流: 06b-C profile logged-in visual evidence, 08b profile E2E full execution

## 多角的チェック観点

- #4 profile body edit forbidden（dialog field 監査）
- #5 apps/web D1 direct access forbidden（`cloudflare:d1` import 0 件）
- #11 member self-service boundary（URL 固定）
- VISUAL_ON_EXECUTION のスクリーンショット 5 点が Phase 11 で揃っているか
- 未実装/未実測を PASS と扱わない
- プロトタイプと仕様書の採用/不採用を混同しない

## サブタスク管理

- [ ] Part 1 / Part 2 を含む `implementation-guide.md` を作成
- [ ] 仕様書 3 種を更新
- [ ] `documentation-changelog.md` に変更ファイルと validator 結果を記録
- [ ] `unassigned-task-detection.md` に pending banner sticky 化など 2 候補を記録
- [ ] `skill-feedback-report.md` を作成
- [ ] `phase12-task-spec-compliance-check.md` を作成
- [ ] `outputs/phase-12/main.md` を作成
- [ ] artifacts.json と index.md の outputs リストを同期

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | ---- |
| 集約サマリー | `outputs/phase-12/main.md` | 任意 |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | ✅ |
| 仕様更新サマリー | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 更新履歴 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | ✅ |
| スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | ✅ |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

## 完了条件

- [ ] Part 1（中学生レベル）と Part 2（技術詳細）の両方を含む `implementation-guide.md` が存在する
- [ ] `05-pages.md` / `07-edit-delete.md` / `09-ui-ux.md` の差分が記録されている
- [ ] AC（公開停止/再公開申請を送れる、退会申請を送れる、二重申請 409 を表示、本文編集 UI を追加しない、スクリーンショット/E2E evidence path が runtime capture gate へ接続される）と evidence path が 1:1 対応している
- [ ] `unassigned-task-detection.md` が 0 件でも作成されている
- [ ] `skill-feedback-report.md` が改善点なしでも作成されている
- [ ] artifacts.json の `phases.12.status` と outputs 実体が同期している
- [ ] planned wording が `outputs/phase-12/` 内に残っていない
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装コード作成、deploy、commit、push、PR を実行していない
- [ ] FB-UT-UIUX-001 ハードゲート（screenshot 5 点）が満たされている前提を Phase 11 evidence path と紐付けて記載している

## 次 Phase への引き渡し

Phase 13 へ、PR title 案、PR body セクション構成、approval gate、Phase 12 で確定した implementation-guide.md path を渡す。
