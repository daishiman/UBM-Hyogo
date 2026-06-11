# Phase 11: 手動テスト結果（NON_VISUAL 証跡メタ）

## NON_VISUAL 宣言（FB Feedback 4 準拠）

| 項目 | 値 |
|------|------|
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 変更は fetch/transport 層のコードと構造化ログのみ。UI 表現（文言・色・レイアウト・DOM）を変更しない。ユーザー向け `/profile` 表示は既存 `session-error-display.ts`（dev 取込済）のまま不変 |
| 代替証跡 | focused tests（T1〜T5）の名前と件数 + staging 実機の `server_fetch_failed` ログ（`{transportKind, baseHost, status}`） |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused vitest 完了。staging deploy・wrangler tail は user-gated） |

## 1. 証跡の主ソース（focused test 名 / 件数 = T1〜T5）

local 実装後に RED → GREEN で取得した。期待値は `../phase-4/phase-4.md` §6（T1-1〜T5-5）がグラウンドトゥルース。

| 主ソース | テストファイル | 追加ケース（件数） | 観点 |
|----------|----------------|--------------------|------|
| T1 | `apps/web/src/lib/fetch/transport.spec.ts` | 6（T1-1〜T1-6） | fail-closed（R-7 throw）+ describeTransport host 抽出 + 後方互換 |
| T2 | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` | 2（T2-1/T2-2・回帰） | service-binding 優先で localhost 不到達 |
| T3 | `apps/web/src/lib/fetch/authed.spec.ts` | 6（T3-1〜T3-6） | FetchAuthedError/ApiTransportError の診断メタ + fail-closed 配線 + 回帰 |
| T4 | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 4（T4-1〜T4-4） | ログに transportKind/baseHost、メタ無し回帰、漏洩検査 |
| T5 | `apps/web/src/lib/__tests__/env.spec.ts` | 5（T5-1〜T5-5） | getEnvironmentResolution の explicit 判定 |

> focused 実走結果は 5 files / 70 tests PASS。既存ケース（transport/transport-select/authed/safe-fetch/env の現行テスト）は後方互換で回帰ゼロを維持した（AC-8）。

## 2. スクリーンショットを作らない理由

- 本タスクは UI 表現（文言・色・レイアウト・DOM 構造）を一切変更しない NON_VISUAL タスクである。変更箇所は (a) `server_fetch_failed` ログに出る診断メタ（画面に出ない）と (b) `resolveApiFetch` の fail-closed throw 経路（既存 error boundary が補足し、表示自体は既存のまま）に閉じる。
- したがって視覚差分が存在せず、スクリーンショットは証跡価値を持たない。代替として focused tests（構造・型・ログ shape を検証）と staging 実機ログ（transport 解決先の実機証明）を一次証跡とする。
- `outputs/phase-11/screenshots/` は空のまま保持する（PNG 0 枚）。

## 3. 実施情報

| 項目 | 値 |
|------|------|
| 実施 wave | `implemented_local_evidence_captured`（実コード・focused tests 完了。staging deploy・wrangler tail・commit・PR は user-gated） |
| ブランチ | `fix/profile-session-staging-localhost-endpoint`（起点 `origin/dev` d0dd40069） |
| 対象環境 | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止） |

## 4. 仕様判断根拠

- 現象（ログイン済みでも `/profile` が「セッション情報を取得できません」バナーを出す）はユーザー報告で受領済み。これは `/profile` のデフォルト失敗分岐（非 401・非 404）であり、真因は C1（410）/ C2（5xx）/ C3（transport 失敗）に絞られる（SSOT §3・phase-1 §3）。
- 401 は `/login` redirect されバナーにならない（C5 除外）。localhost 参照（C4）はコード読解で否定済み（app fallback は 8787・8888 はコード 0 件・server fetch は service-binding）。本タスクはこの C4 否定を**実機ログで証明可能化**し、構造的に不可能化（fail-closed）する。
- ユーザー向け表示は既存のまま安全側を維持し、開発者が `server_fetch_failed` ログの `transportKind`/`baseHost`/`status` で真因を切り分けられるようにする。memberId / cookie / secret はログに出さない（不変条件 #11・AC-3）。

## 5. 実行記録

| 区分 | 項目 | 状態 |
|------|------|------|
| 自動テスト | T1〜T5 focused vitest（RED → GREEN） | **PASS（5 files / 70 tests）** |
| gate | `bash -n scripts/diagnose-profile-session.sh` | **PASS** |
| gate | `apps/api` diff 空 | **PASS（apps/api source diff なし）** |
| 実機 | MT-A staging deploy（`cf.sh deploy`） | **pending（user-gated）** |
| 実機 | MT-B `wrangler tail` で `server_fetch_failed` 観測（`cf.sh tail`） | **pending（user-gated）** |
| 実機 | MT-C `baseHost=service-binding.local`（localhost でない）確認 | **pending（user-gated）** |
| 実機 | MT-D 真因ステータス（410/5xx/transport）確定 + diagnose script 突合 | **pending（user-gated）** |
| 外部運用 | commit / push / PR | **pending（user-gated）** |

## 完了条件

- [x] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を明記した。
- [x] 証跡の主ソース（focused test 名 T1〜T5 / 件数）を記録した。
- [x] スクリーンショットを作らない理由を明記した。
- [x] 実施情報・仕様判断根拠を記録した。
- [x] local 実行記録と staging user-gated 境界を分離して記録した。

## 成果物
- `outputs/phase-11/manual-test-result.md`（本ファイル）

## 参照資料
- `phase-11.md`（MT-A〜MT-D 手順）
- `../phase-4/phase-4.md` §6（テスト期待値 T1-1〜T5-5）
- `../../_shared-context.md` §9（DoD）

## 統合テスト連携
focused tests（T1〜T5）の green と staging 実機ログ（MT-A〜MT-D）の真因収束が AC-1/AC-2 の証跡正本。Phase 12 implementation-guide / unassigned-task-detection / compliance へ引き継ぐ。
