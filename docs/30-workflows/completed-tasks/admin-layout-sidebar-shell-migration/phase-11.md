# Phase 11: manual test / visual evidence

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- task_type: `implementation`
- visualEvidence: `VISUAL`
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- 前 Phase: 10（最終レビューゲート） / 次 Phase: 12（documentation strict 7）
- 作成日: 2026-05-29
- 状態語彙: **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`**（spec contract 完了 / 実コード差分・local visual capture は Gate-B 後）

## タスク種別判定（Phase 11 着手前の再判定）

| 判定軸 | 値 | 根拠 |
| --- | --- | --- |
| タスク種別 | **UI タスク（VISUAL）** | `apps/web/app/(admin)/layout.tsx` を SidebarShell へ移行し admin shell の見た目が変わる |
| `artifacts.json.ui_routes.length` | 9（> 0） | 下表「screenshot 撮影対象」の 9 admin routes |
| 採用テンプレ | UI smoke evidence（screenshot 必須） | `ui_routes.length > 0` のため |
| screenshot mode | `VISUAL`（W1-02b-1） | `phase11-capture-metadata.json` の `taskId` は本タスク ID と一致させる |

> 本タスクは「設計タスク（spec_created）だが UI 実装が後段」という二段構成。**Phase 11 仕様書 contract は本サイクルで完了**するが、
> 実コード差分・dev 起動による screenshot capture は Task A/B 完成と user 承認（Gate-B）後に取得する。
> したがって `outputs/phase-11/main.md` の状態語彙は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とし、`PASS` 単独表記は禁止する。

## 目的

移行後の admin shell（SidebarShell）が AC-5/6/7（全 13 nav item / schema warn badge / DOM contract）と
TECH-M-02（各 admin route の active item ハイライト）を満たすことを、(1) focused vitest の component evidence と
(2) dev 起動 screenshot の visual evidence の 2 系統で確認する evidence セットを定義する。

## 実行タスク

1. 必須 outputs（UI smoke evidence 6 点）を列挙し、各ファイルの役割と PASS 条件を固定する。
2. screenshot 撮影対象（9 admin routes + admin 以外 forbidden redirect）を `screenshot-plan.json` 化する計画を表で確定する。
3. Apple UI/UX 視覚レビュー観点（active state / warn badge / 折り畳み / collapsed sr-only ラベル）を定義する。
4. capture 取得ゲート（Gate-B）と状態語彙の使い分けを明記する。

## 必須 outputs（UI smoke evidence・VISUAL）

| ファイル | 役割 | PASS 条件 |
| --- | --- | --- |
| `outputs/phase-11/screenshot-plan.json` | 撮影対象 route / 状態 / viewport の計画（`mode: "VISUAL"`） | 9 admin routes + forbidden redirect の entry が揃い `taskId` が本タスク ID と一致 |
| `outputs/phase-11/manual-test-result.md` | walkthrough 実行結果（実行日 / branch / 最終状態 / evidence path） | `not_run` を残さない。capture 前は `PENDING_RUNTIME_EVIDENCE`（Gate-B 待ち）を明記 |
| `outputs/phase-11/manual-test-report.md` | 実施概要と所見（component evidence 件数 / 視覚所見サマリ） | focused vitest の PASS 件数と出力 path を記録 |
| `outputs/phase-11/discovered-issues.md` | blocker / note / info の分類（0 件でも実行済みを明記） | 発見事項を `分類 / 対応方針 / evidence_path / checked_at` で記録 |
| `outputs/phase-11/ui-sanity-visual-review.md` | Apple UI/UX 視覚レビュー（下記観点） | active state / badge / 折り畳み / collapsed sr-only を route 単位で記録 |
| `outputs/phase-11/phase11-capture-metadata.json` | capture 実行時の evidence inventory | `taskId` が現行タスク ID と一致（`jq '.taskId'` で preflight 確認） |

> component evidence（focused vitest）は `manual-test-report.md` / `manual-test-result.md` に件数で記録する。
> screenshot capture は Gate-B 後に `outputs/phase-11/screenshots/` へ追加し、`manual-test-result.md` の `PENDING_RUNTIME_EVIDENCE` 行を fresh evidence path へ差し替える。

## 参照資料

- Phase 1（AC-1〜AC-10） / Phase 2（layout 新形・DOM contract） / Phase 3（TECH-M-02 active state 目視）
- 実コード（移行後の正本）: `apps/web/app/(admin)/layout.tsx` / `apps/web/app/(admin)/layout.spec.tsx`
- 依存: `apps/web/src/components/shell/SidebarShell.server.tsx`（Task A・未作成） / `SidebarUserMenu`（Task B・未作成）
- dev 起動: `mise exec -- pnpm --filter @ubm-hyogo/web dev`
- focused test: `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)`

## 実行手順

### ステップ1: component evidence（focused vitest・Gate-B と独立に定義）

- 対象: 書き換え後の `apps/web/app/(admin)/layout.spec.tsx`（4 ケース + admin shell DOM contract）。
- 実行コマンド: `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)`
- 記録先: `manual-test-report.md`（PASS 件数 + 出力 path）。実コード差分着手前は spec 上の期待件数を記載し、実行は Gate-B 後。

### ステップ2: screenshot 撮影計画（`screenshot-plan.json`）

admin アカウントでログインした状態で 9 admin routes を撮影し、加えて admin 以外ロールでの forbidden redirect を 1 件撮影する。

| # | 種別 | route / 操作 | 期待表示（確認内容） |
| --- | --- | --- | --- |
| 1 | admin route | `/admin` | nav に Public 3 + Members 1 + Admin 9 = 全 13 item。`/admin` item が active |
| 2 | admin route | `/admin/dashboard/attendance` | 当該 item が active ハイライト（client `usePathname()` 由来・TECH-M-02） |
| 3 | admin route | `/admin/members` | members item active |
| 4 | admin route | `/admin/tags` | tags item active |
| 5 | admin route | `/admin/schema` | schema item active + queued 件数 > 0 時に warn badge 表示 |
| 6 | admin route | `/admin/meetings` | meetings item active |
| 7 | admin route | `/admin/requests` | requests item active |
| 8 | admin route | `/admin/identity-conflicts` | identity-conflicts item active |
| 9 | admin route | `/admin/audit` | audit item active |
| 10 | forbidden redirect | admin 以外ロールで `/admin` 直叩き | `/login?gate=forbidden` へ redirect（shell が描画されない）|

- viewport: desktop（sidebar 展開）+ 折り畳み（collapsed）の 2 種。collapsed は左下 SidebarUserMenu と nav の sr-only ラベルを確認する。
- 左下 `SidebarUserMenu`（Task B）に「プロフィール / プロフィール編集申請 / 管理者ダッシュボード / ログアウト」の 4 action が出ることを `/admin` で確認する。
- `screenshot-plan.json` には上 10 entry を `route` / `state` / `viewport` / `mode: "VISUAL"` / `taskId` で記述する。

### ステップ3: Apple UI/UX 視覚レビュー観点（`ui-sanity-visual-review.md`）

| 観点 | 確認内容 | 対象 |
| --- | --- | --- |
| active state | 現在 route の nav item のみ active（`aria-current="page"` / `data-active`）。client `usePathname()` 由来で全 9 route が正しく切り替わる（TECH-M-02 目視解決） | 9 admin routes |
| warn badge | schema item の queued 件数 badge が `> 0` のとき表示・`0` / fetch 失敗時は非表示（AC-6 と一致） | `/admin/schema` |
| 折り畳み（collapsed） | sidebar 折り畳み時にラベルが視覚的に隠れても DOM 上は保持され、レイアウト崩れがない | 全 route |
| collapsed sr-only ラベル | collapsed 時も各 nav item の accessible name が `sr-only` で保持され、スクリーンリーダーで読み上げ可能 | 全 nav item |
| user menu | 左下 SidebarUserMenu の 4 action（プロフィール / プロフィール編集申請 / 管理者ダッシュボード / ログアウト）が揃う | `/admin` |
| forbidden | admin 以外で `/admin` → `/login?gate=forbidden`。shell は一切描画されない（情報漏れなし） | redirect |

> active state は server で pathname を解決しない設計（phase-1 乖離補正 #5 / TECH-M-02）。x-pathname は使わない。
> 本観点で全 9 route の active 切替が目視で正しいことを確認し、TECH-M-02 を Phase 11 で解決済みとする。

### ステップ4: capture 取得ゲート（Gate-B）と状態語彙

| 段階 | 内容 | 状態語彙 |
| --- | --- | --- |
| 本サイクル（spec_created） | Phase 11 evidence セットの contract（必須 outputs / screenshot-plan / 視覚レビュー観点）を確定 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| Gate-B（user 承認後） | Task A/B 完成 → 実コード差分着手 → `mise exec -- pnpm --filter @ubm-hyogo/web dev` 起動 → admin ログイン → 10 entry capture | capture 後に `manual-test-result.md` を fresh path で更新 |

- 取得ゲート: 実コード差分・local visual capture・commit・push・PR はすべて **Gate-B / Gate-C の user-gated execution wave**（Phase 13 §三役ゲート）。
- ダミー PNG 作成は禁止（false green 防止）。dev 起動できない worktree 状況では **CAPTURE_BLOCKED** として記録し、component evidence（vitest）を代替 evidence とする。
- 実行されたら fresh screenshot を `outputs/phase-11/screenshots/` に後追い追加し、`phase11-capture-metadata.json` の inventory を同期する。

## 統合テスト連携

- component evidence は `apps/web/app/(admin)/layout.spec.tsx`（4 ケース + DOM contract）。mock は SidebarShellServer / getSession / safeServerFetch / next-navigation redirect（Phase 4 で詳細化）。
- visual evidence は dev 起動 screenshot。両系統を `main.md` から参照リンクで結ぶ。

## 多角的チェック観点（AIが判断）

- `main.md` だけ更新して helper files が `not_run` のまま残る状態は close-out FAIL。`manual-test-result.md` / `discovered-issues.md` を同 wave で同期する。
- screenshot を後続取得する場合は `PASS` 単独表記を使わず `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に留める。
- active state を server で解決しない設計の妥当性（TECH-M-02）は本 Phase の視覚レビューで確定させる。
- forbidden redirect の screenshot は「shell が描画されないこと」を示す negative evidence として撮る。

## サブタスク管理

- 単一責務（admin layout 移行）。サブタスク分割なし。Task A/B/E は別タスクで本タスクの依存ゲート。

## 成果物

- 本 Phase: UI smoke evidence 6 点（上記必須 outputs）と screenshot 撮影計画 10 entry、Apple UI/UX 視覚レビュー観点（本ファイル + `outputs/phase-11/` 配下）。

## 完了条件

- [ ] 必須 outputs 6 点の役割と PASS 条件を定義した
- [ ] screenshot 撮影対象（9 admin routes + forbidden redirect = 10 entry）を計画表で確定した
- [ ] Apple UI/UX 視覚レビュー観点（active / badge / 折り畳み / collapsed sr-only / user menu / forbidden）を定義した
- [ ] capture 取得ゲート（Gate-B）と状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を明記した
- [ ] `PASS` 単独表記を使っていない

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] component evidence（vitest）と visual evidence（screenshot）の責務分離を `main.md` で宣言する設計にした
- [ ] 実在しない関数/header（`x-pathname` / `getSchemaDiffCount`）を撮影観点に持ち込んでいない

## 次Phase

Phase 12（documentation・strict 7）。
