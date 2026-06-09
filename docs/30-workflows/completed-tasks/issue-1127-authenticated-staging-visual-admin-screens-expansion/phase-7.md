# Phase 7: カバレッジ

> **実装区分: 実装仕様書** — カバレッジ対象範囲を「authenticated staging visual でカバーされる admin 画面の前後比較」と「新規 5 spec のシナリオ網羅」に限定して定義する。

## 7.0 カバレッジの対象範囲（局所明示）

本タスクの **変更ファイルは新規 Playwright spec 5 本のみ**（`apps/web/playwright/tests/visual-staging-authenticated/`）。
したがってカバレッジ評価の対象も、その 5 spec が `staging-visual-authenticated` project に追加する **visual regression coverage の差分** に限定する。

| 区分 | 対象 | カバレッジ評価 |
| --- | --- | --- |
| authenticated staging visual の admin 画面拡張 | 新規 5 spec（audit / requests / identity-conflicts / schema / meetings）| ✅ 本 Phase の対象 |
| 各 spec のシナリオ網羅（read-only 行動カバレッジ）| 5 spec の goto→assert→capture フロー | ✅ 本 Phase の対象 |
| `apps/web/src` の component / page line・branch | プロダクトコード本体 | ❌ **対象外**（理由は §7.3。プロダクトコード不変・AC-6）|
| 各画面の API ハンドラ（`apps/api`）| バックエンド | ❌ 対象外（本タスク非変更）|
| mutation result 状態（post-mutation）| 承認後 / merge 後 / 出席追加後 等 | ❌ 対象外（C-1 系へ委譲・§7.4）|

## 7.1 visual regression coverage の前後比較（authenticated staging visual）

`staging-visual-authenticated` project が認証付き実機で capture する admin 画面の coverage を、本タスク前後で比較する。
**visual baseline が存在する画面 = カバー済み** とみなす（baseline 自体は execution 時に user-gated capture で確定する。spec 設計完了時点は「baseline 取得対象として spec 化済み」を意味する）。

| route | heading | 着手前 baseline | 本タスク後 | 由来 |
| --- | --- | --- | --- | --- |
| `/profile` | （会員プロフィール）| ✅ あり | ✅ 維持（無改修）| issue-901 |
| `/admin` | （ダッシュボード）| ✅ あり | ✅ 維持（無改修）| issue-901 / T-07 |
| `/admin/tags` | （タグキュー）| ✅ あり | ✅ 維持（無改修）| admin-tag-queue-ui-and-404-recovery |
| `/admin/members` | （bulk tag picker）| ✅ あり | ✅ 維持（無改修）| issue-1077 |
| `/admin/audit` | 監査ログ | ❌ なし | 🆕 **追加**（read-only baseline）| **issue-1127（本タスク）** |
| `/admin/requests` | 依頼キュー | ❌ なし | 🆕 **追加**（read-only baseline）| **issue-1127（本タスク）** |
| `/admin/identity-conflicts` | Identity 重複候補 | ❌ なし | 🆕 **追加**（read-only baseline）| **issue-1127（本タスク）** |
| `/admin/schema` | スキーマ差分のレビュー | ❌ なし | 🆕 **追加**（read-only baseline）| **issue-1127（本タスク）** |
| `/admin/meetings` | 開催日 / 出席管理 | ❌ なし | 🆕 **追加**（read-only baseline）| **issue-1127（本タスク）** |

> **coverage 数の差分**: authenticated staging visual の対象画面 = **着手前 4 → 本タスク後 9（+5）**。
> 既存 4 画面の baseline / spec には一切差分を加えない（AC-5・回帰ゼロ）。
> 既存 admin route のうち `/admin` `/admin/tags` `/admin/members` は別タスクで authenticated 化済みのためスコープ除外（Phase 1 §1.2）。

## 7.2 新規 5 spec が網羅すべきシナリオ（read-only 行動カバレッジ）

Playwright E2E は line coverage を測る性質ではないため、ここでは **シナリオ網羅（行動カバレッジ）** を網羅基準とする。
5 spec は同型のシナリオ ID を踏む（route / heading / selector / read-only ガードのみ差分）。

| シナリオ ID | 内容 | 充足手段 | AC 対応 |
| --- | --- | --- | --- |
| SC-AUTH | admin storageState で対象 route に認証到達 | `test.use({ storageState })` + heading visible assert | AC-2, AC-5 |
| SC-RENDER | read-only 初期表示の安定 selector が描画される | `<STABLE_SELECTOR>` visible assert（画面別 §2.3）| AC-2 |
| SC-NO-MUTATION | mutation 完了要素が描画されていない（read-only 証跡）| `toHaveCount(0)` ガード（dialog / modal / toast。audit のみ不要）| AC-3, AC-7 |
| SC-CAPTURE | read-only 状態の fullPage baseline を取得 | `toHaveScreenshot("<screen>-authenticated.png", { fullPage, maxDiffPixelRatio: 0.05, animations: "disabled" })` | AC-2 |
| SC-RECOGNIZE | project / CI が追加 spec を追加設定なしに認識 | `playwright test --project=staging-visual-authenticated --list` に 5 spec 列挙 | AC-4 |

各 spec が SC-AUTH..SC-CAPTURE を 1 test 内で順次踏み、5 spec 横断で SC-RECOGNIZE を満たすことで、AC-2/3/4/5/7 を行動カバレッジとして満たす。
AC-1（5 spec の物理追加）は変更ファイル一覧（Phase 5 §5.1）で、AC-6（プロダクトコード不変）は git diff スコープで別途担保する。

### 画面別 read-only ガードの網羅

| route | SC-NO-MUTATION ガード | 根拠 |
| --- | --- | --- |
| `/admin/audit` | ガードなし（mutation 要素なし。検索/リセットは GET のみ）| Phase 2 §2.3 |
| `/admin/requests` | `getByRole("dialog")` count 0（承認/却下の確認ダイアログ非表示）| Phase 2 §2.3 |
| `/admin/identity-conflicts` | `getByRole("dialog")` count 0（merge/別人マークの確認フロー非表示）| Phase 2 §2.3 |
| `/admin/schema` | `bulk-resolve-modal` / `bulk-rollback-modal` count 0 | Phase 2 §2.3 |
| `/admin/meetings` | `attendance-toast` count 0（出席 drawer 未操作）| Phase 2 §2.3 |

## 7.3 プロダクトコード line/branch を対象外とする根拠

5 新 spec の visual capture は、対象 5 画面の component / page の line・branch カバレッジを測る責務を持たない。理由:

1. **本タスクは visual regression（描画回帰）専用**: capture するのは read-only 初期表示の見た目であり、ロジック分岐の網羅は目的でない。
2. **プロダクトコード不変（AC-6）**: `apps/web/src` / `apps/api` / D1 を一切変更しないため、新たに line/branch を増やしておらず、既存の unit / component spec の coverage が変わらない。
3. **二重計測の回避**: 同一描画ロジックを jsdom component spec と staging E2E の双方で line 計測しても冗長で、staging D1 副作用を生む。

→ 結論: 各画面の component/page の line/branch は **既存の unit/component spec で充足済みとして対象外** と明記する。

## 7.4 mutation result 状態を coverage 対象外とする境界

各画面の **mutation 後の result 状態**（承認後の completed 表示 / merge 後 / 再集計後 / 出席追加後 等）の visual baseline は、本タスクの coverage 対象外である。

- これは「先送り」ではなく、issue #1127 §2.3 が定義する **恒久的なアーキテクチャ境界**。read-only 初期表示 capture（本タスク）は storageState のみで成立するが、post-mutation result capture は staging 共有 D1 への seed/cleanup SQL + `trap cleanup` + 残存 0 検証を要し、必要インフラが根本的に異なる（issue-1125 系列 / C-1 系 mutation baseline）。
- mutation 分岐の機能担保は各画面の既存 component spec が持ち、本 spec は read-only 描画回帰のみを担う。

## 7.5 カバレッジ計測方法

| 対象 | 計測 | 実行タイミング |
| --- | --- | --- |
| authenticated visual 画面拡張（+5）| §7.1 前後比較表（baseline 存在 = カバー）| Phase 11 runtime（user-gated capture）|
| 5 spec シナリオ網羅 | SC-AUTH..SC-RECOGNIZE の行動カバレッジチェックリスト | spec 設計（本 Phase）+ Phase 11 runtime |
| 既存 4 spec 回帰 | `--list` 列挙 + 既存 baseline 無改修（diff ゼロ）| local 検証 |

E2E に line-coverage instrumentation は導入しない（staging 実機 build への計測は既存 visual project でも非採用）。

## 7.6 完了条件（Phase 7）

- [x] authenticated staging visual の admin 画面 coverage を着手前（4）→ 本タスク後（9 / +5）で前後比較表化した
- [x] 各画面の read-only 表示状態が回帰検出対象になることを記録した（baseline 存在 = カバー）
- [x] coverage 対象範囲を「新規 5 spec 追加のみ・既存 spec/プロダクトコードは不変」に局所明示した
- [x] SC-AUTH..SC-RECOGNIZE のシナリオ網羅を AC にマップした
- [x] mutation result 状態を C-1 系へ委譲する恒久境界（coverage 対象外）を根拠付きで記録した
