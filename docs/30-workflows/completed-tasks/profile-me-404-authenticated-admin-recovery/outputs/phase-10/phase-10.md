# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 10 / 13 |
| taskType | implementation |
| implementation_mode | `edit`（error-handler / safe-fetch / diagnose-profile-session 編集 + api-cd.yml 新規） |
| visualEvidence | VISUAL_ON_EXECUTION（現象 screenshot はユーザー提供済・復旧後 staging screenshot は user-gated） |
| workflow_state | `implemented_local_runtime_pending` |
| SSOT | `_shared-context.md`（AC-1〜AC-10 / F-1〜F-9 / S1〜S3 / T01〜T04） |

## 目的

AC-1〜AC-10 の充足を、各 AC を担保するタスク・テスト・検査・検証手順と対応付けて最終確認し、blocker の有無を判定する。**本サイクルは `implemented_local_runtime_pending`（ローカル実装・focused証跡完了、staging runtime・PRはuser-gated）。** staging deploy・authenticated runtime screenshot・commit・push・PR はユーザー明示承認後のみ実行する。

## 実行タスク

### 10.1 AC-1〜AC-10 充足判定表

| AC | 内容（要約） | 担保タスク / 手段 | 充足エビデンス（本 wave で取得済み） | 判定（local evidence） |
|----|--------------|------------------|--------------------------------|------|
| AC-1 | 認証済み（valid JWT・identity+consented status あり）の `GET /me` が staging で **200** を返し `/profile` 本体が描画される | T02（api CD で現行ルート deploy）+ Phase 11 RT-A/RT-C | Phase 11 staging 復旧検証（RT-C）+ minted-cookie 認証 smoke（RT-C2） | **local実装・証跡あり** — 実結果は user-gated（Phase 11） |
| AC-2 | `/me` 404 発生時、API ログに `UBM-1404` + 受信 `method`+`path` を構造化出力し data-cause（route 未マッチ / 認証 / data）を**ログのみで切り分け可能** | T01（notFoundHandler 構造化ログ） | Phase 9 L-3（`error-handler.spec.ts`）+ Phase 11 RT-B2 ログ確認 | **local実装・証跡あり** — local specでpayload schema固定 |
| AC-3 | apps/api が dev push で staging、main push で production へ**自動 deploy**され、deploy 後に `/me/healthz` 200 と認証 `/me` 200 の smoke gate が通る | T02（api-cd.yml 新設 + smoke gate） | T02 workflow 構文検証（actionlint/yaml）+ Phase 11 RT-A/RT-C2 | **local実装・証跡あり** — api-cd.yml 設計は web-cd.yml 同型 |
| AC-4 | web 側 `server_fetch_failed` ログが route-404 を transport descriptor 付きで記録（既存 transport ログ schema と整合） | T03（safe-fetch/fetchAuthed ログ強化） | Phase 9 L-3（`safe-fetch.spec.ts`） | **local実装・証跡あり** — 既存 schema 整合を spec で固定 |
| AC-5 | `diagnose-profile-session.sh` が `/me` route 存在 + deploy parity を出力し、secret/cookie/memberId を**一切出力しない** | T04（diagnose script 拡張） | Phase 9 L-4（`bash -n`）+ redaction grep + Phase 11 RT-B | **local実装・証跡あり** — read-only・冪等・redaction を spec で固定 |
| AC-6 | D1 schema・Google Form 仕様・`/me` の path/shape/status 体系・`/profile` UI 文言/分岐を**変更しない** | T01〜T04 共通の非接触規約 | Phase 9 G-1（apps/api `/me` route 差分なし / session-error-display 差分なし grep gate） | **local実装・証跡あり** — NO-GO 監視対象 |
| AC-7 | env 参照はアクセサ経由のみ（`process.env` 直接参照禁止）。認証境界 fail-closed 維持。`wrangler` 直叩き禁止（`scripts/cf.sh` 経由） | T01〜T04 共通規約 | Phase 9 lint + grep（`process.env` 直参照 0 / `wrangler` 直叩き 0） | **local実装・証跡あり** — NO-GO 監視対象 |
| AC-8 | 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`typecheck` / `lint` / focused test 全 green | T01〜T04 | Phase 9 L-1（typecheck）/ L-2（lint）/ L-3（focused vitest） | **local実装・証跡あり** — CI gate 準拠 |
| AC-9 | secret/cookie/JWT/memberId をコード・ログ・ドキュメントに**転記しない**（SSOT の JWT デコードは診断目的の確定事実記録に限る／実 secret 値は非記載） | T01〜T04 + 全 Phase ドキュメント | Phase 9 redaction grep（全成果物 + 実装コード） | **local実装・証跡あり** — 本 Phase 10/11 成果物も実 secret 非記載で準拠 |
| AC-10 | commit / PR / push / deploy はユーザー明示指示まで実行しない（CONST_002） | 運用（全 Phase） | 運用ゲート（user-gated 宣言） | **充足（本 wave で遵守）** — commit / PR / push / deploy は未実行 |

### 10.2 blocker 判定

| 観点 | blocker か | 根拠 |
|------|-----------|------|
| サブ原因の網羅性（S1〜S3） | 非 blocker | SSOT §2 で「S1/S2 はいずれも T01〜T04 で復旧、S3 のみスコープ外（#1192/#1234 委譲）」を確定。サブ原因がどれでも復旧する／格下げ判断できる設計（Phase 3 §3.5）。 |
| api CD 新設の契約侵襲（AC-3/AC-6） | 非 blocker（実装時に要厳格確認） | api-cd.yml は web-cd.yml 同型・`scripts/cf.sh deploy` 経由・`apps/api` のコード surface 不変。smoke gate は既存 `scripts/smoke/*` 資産流用。崩れたら blocker → Phase 9 G-1 / yaml 構文で検知。 |
| notFound ログの payload 漏洩（AC-2/AC-9） | 実装時に要厳格確認 | ログに secret/cookie/memberId を載せたら blocker。`error-handler.spec.ts` で payload key を allowlist 固定 + redaction grep で検知。 |
| apps/api `/me` route 非接触（AC-6・NO-GO 条件） | 実装時に要厳格確認 | `/me` の path/shape/status に diff が出たら blocker。Phase 9 G-1（grep gate）で検知し revert。T01 の変更は notFoundHandler に限定。 |
| 認証境界 fail-closed（AC-7） | 実装時に要厳格確認 | `process.env` 直参照・`wrangler` 直叩き・fail-open が出たら blocker。lint + grep で検知。 |

判定: **blocker 0 件**。実装着手後は AC-6（apps/api `/me` 非接触）と AC-7（fail-closed / アクセサ経由）を最優先で監視し、Phase 9 の L-1〜L-4 全 PASS + G/Q 違反 0 をもって AC-2〜AC-9 の設計充足、Phase 11 の RT-A〜RT-D 完了をもって AC-1/AC-3 の実結果（復旧 + data-cause 確定）とする。

### 10.3 MINOR 追跡テーブル（→ 未タスク化方針）

| ID | MINOR 指摘 | 区分 | 追跡 / 未タスク化方針 |
|----|------------|------|----------------------|
| MINOR-1 | `diagnose-profile-session.sh` の旧 probe（web `/me` 直叩き）は route 不在で常に 404 系になる誤誘導出力 | T04 で是正必須（仕様書内で確定） | `outputs/phase-5/task-04-*.md` で `/me/healthz` vs `/me` の route 存在差分 + deploy parity 出力へ是正（AC-5）。Phase 11 RT-B で出力確認。**未タスク化不要**（今サイクル内で是正）。 |
| MINOR-2 | api-cd.yml の smoke gate が依存する staging session secret（minted-cookie 用）が未設定環境では gate 無効化し得る | prereq skip で緩和 | secret 未設定時は `::notice::` で skip 可視化し fail させない設計（Phase 3 §3.5）。staging secret 設定の最終確認は Phase 11 で **user-gated タスク化**。恒久 secret 運用が未整備なら `unassigned-task/` へ formalize（Phase 12 連動）。 |
| MINOR-3 | S3（data-cause が 401/410）と確定した場合、本 WF のコード変更（T01〜T04）は復旧に直接寄与しない | スコープ外委譲 | data-cause 確定後 S3 なら #1192（admin `/profile` UX）/ #1234（FU-001 environmentExplicit）へ委譲し `unassigned-task/` に格下げ記録（Phase 12 unassigned-task-detection）。**ただし T01 の観測性・T02 の CD 根治は S1/S2 に有効で無駄にならない**。 |

> MINOR は 3 件とも追跡先が仕様書内 / Phase 11 / Phase 12 で確定しており、blocker ではない。今サイクルで是正できない事象（MINOR-2/MINOR-3 の一部）は Phase 12 の未タスク formalize（`unassigned-task/`）へ送り、本 WF を肥大化させない。

### 10.4 VISUAL エビデンス取扱い

- 現象 screenshot は**ユーザー提供済み**（2026-06-13 10:38 JST・staging `/profile`・`MEMBER_SESSION_404`「セッション情報を取得できませんでした / アカウント情報を確認できませんでした。再ログインしてください。」+ CTA「再ログイン」）。Phase 11 で文中参照する（リポジトリには配置しない）。
- コード変更自体は API ログ / CI/CD / 診断 script / web transport ログ層に閉じ、UI 描画は不変（SSOT §0・§4）。実装時の一次証跡は focused vitest（T01〜T04 の unit/spec）。
- 復旧後の staging runtime screenshot `outputs/phase-11/screenshots/profile-me-404-recovery-staging.png` は認証必須のため **user-gated**（`implemented_local_runtime_pending` では未取得・pending）。

## 完了条件

- [x] AC-1〜AC-10 を担保タスク・手段・充足エビデンスと対応付け（implemented_local_runtime_pending 判定 = 仕様充足計画の定義）
- [x] blocker 判定（blocker 0 件）と NO-GO 監視対象（AC-6 apps/api `/me` 非接触 / AC-7 fail-closed・アクセサ経由）を明示
- [x] MINOR 追跡テーブル（MINOR-1: task-04 是正 / MINOR-2: Phase 11 user-gated secret / MINOR-3: S3 時スコープ外委譲）を設置し、未タスク化方針を記録
- [x] VISUAL エビデンス（現象=ユーザー提供 / 復旧後 staging runtime=user-gated pending）の取扱いを記録

## 統合テスト連携

AC-1/AC-3 を担保する Phase 11 の staging 復旧検証（RT-A〜RT-D・user-gated）が復旧結論と data-cause 確定の正本。AC-2/AC-4〜AC-9 の focused 自動テスト PASS と合わせ、Phase 12 で実装ガイド・未タスク formalize（S3 確定時の #1192/#1234 委譲・MINOR-2 secret 運用）・compliance へ引き継ぐ。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | AC-1 の 401/410 境界・fail-closed 根拠 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | AC-6 の `/me` shape / path / status 体系不変基準 |

- `_shared-context.md` §6（AC-1〜AC-10 正本）/ §1（F-1〜F-9）/ §2（S1〜S3）
- `outputs/phase-3/phase-3.md` §3.5（リスク緩和）/ §3.6（Phase 11 特化宣言）
- `outputs/phase-9/phase-9.md`（L/G/Q ゲート — local verification と staging user-gated 境界の正本）

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）
