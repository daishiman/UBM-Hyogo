# Phase 4 — テスト作成（5 spec の assert / expected result 定義）

> **実装区分: 実装仕様書** — 本タスクの「テスト」は Playwright visual spec そのもの（spec 自体がテスト本体）。
> 新規 5 spec のコード追加を伴う（CONST_004）。本 Phase では各 spec が「何を assert し、何を撮るか」の
> expected result を 5 画面分テーブル化し、命名規則整合と実行コマンドを確定する。

---

## 4.0 テストの位置づけ — visual regression と TDD

このタスクのテストは通常のユニットテスト（red→green）ではなく **visual regression baseline テスト**である。
visual baseline は「初回 baseline 生成 → 以降は baseline との差分検出」という 2 段階で機能するため、
red→green の TDD とは手順が異なる。

| ステップ | 内容 | 実行タイミング |
| --- | --- | --- |
| baseline mint（初回・**user-gated**） | `--update-snapshots` で `*-snapshots/*.png` を新規採取。比較ではなく「採取」。生成画像を目視レビューし、5 画面の read-only 初期表示が期待通り（heading 描画 / container 描画 / mutation 要素は撮るが操作していない）であることを確認 | execution wave（user 承認後）|
| 比較（以降の CI 実行） | `--update-snapshots` 無しで baseline と差分比較。`maxDiffPixelRatio: 0.05` 以内で PASS。差分が出たら diff 画像で原因判定（意図的レイアウト変更なら再 mint、回帰なら修正）| CI（自動）|

> implemented_local_runtime_pending 時点では baseline 未生成のため、visual evidence は **n/a**（VISUAL_ON_EXECUTION）。
> 実 capture は user-gated（CONST_002）。

snapshot だけでは「空ページ / login 画面を撮る」退行を検出できないため、
各 spec は **非 snapshot assertion（heading visible / container visible / read-only ガード count 0）を
snapshot 比較の前段に置き**、期待状態に到達できたことを構造的に保証する（詳細は Phase 6 §6.1）。

---

## 4.1 検証コマンド suite と expected result

| # | コマンド | 期待結果 | gate |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | exit 0（新 5 spec の型エラーなし）| 必須 |
| 2 | `mise exec -- pnpm lint` | exit 0（HEX 直書き 0 / lint 違反 0）| 必須 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list` | 新 5 spec が project に列挙される（追加設定なしで testDir + glob 認識 = AC-4）| 必須（read-only / 副作用なし）|
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots` | baseline 5 枚生成（初回）。再実行で比較 PASS | **user-gated runtime** |

> コマンド 1〜3 は通常実行可（実 staging 到達なし）。コマンド 4 は実 staging への到達・snapshot 生成・
> 認証 storageState mint を伴うため user 承認後の execution wave で実施する（CONST_002）。

---

## 4.2 spec 別 expected result（5 画面）

各 spec は唯一の `test()` 内で「到達待機 → container 確認 → read-only ガード → アニメ抑止 → screenshot」の順に検証する。
expected result は次の 5 行（Phase 3 §3.1 / Phase 5 §5.3 の正本と逐語整合）。

| route | heading（role=heading name） | 安定 container selector | read-only ガード assertion | screenshot `{arg}` |
| --- | --- | --- | --- | --- |
| `/admin/audit` | `監査ログ` | `[data-component="admin-audit"]` | （mutation 要素なし: pure read-only。検索/リセットは GET のみ）| `admin-audit-authenticated.png` |
| `/admin/requests` | `依頼キュー` | heading 主待機（container は補助）| `getByRole("dialog").toHaveCount(0)`（承認/却下を非クリック）| `admin-requests-authenticated.png` |
| `/admin/identity-conflicts` | `Identity 重複候補` | `section[data-route="admin"]` | `getByRole("dialog").toHaveCount(0)`（merge/別人マーク非クリック）| `admin-identity-conflicts-authenticated.png` |
| `/admin/schema` | `スキーマ差分のレビュー` | `[data-page="admin-schema"]` | `getByTestId("bulk-resolve-modal").toHaveCount(0)` / `getByTestId("bulk-rollback-modal").toHaveCount(0)` | `admin-schema-authenticated.png` |
| `/admin/meetings` | `開催日 / 出席管理` | `[aria-label="開催 KPI"]` | `getByTestId("attendance-toast").toHaveCount(0)` | `admin-meetings-authenticated.png` |

> heading は `AdminPageHeader` 由来で常時描画されるため安定待機の主とする。一覧/リスト container は
> D1 データ有無で empty state に切り替わるため補助とする（Phase 3 §3.1 注記）。

共通 screenshot オプション（5 spec 一律）: `{ fullPage: true, maxDiffPixelRatio: 0.05, animations: "disabled" }`。

---

## 4.3 テストケース表（TC-ID / route / 操作 / 期待 / 副作用なし確認）

5 画面 × 3 観点（到達 / read-only ガード / screenshot）で展開する。各段は前段の前提を引き継ぐ。

### TC: 到達（authenticated render）

| TC | route | 操作（read-only） | 期待 | 副作用なし確認 |
| --- | --- | --- | --- | --- |
| TC-AUDIT-01 | `/admin/audit` | `goto(..., networkidle)` → heading 待機 | `getByRole("heading",{name:"監査ログ"})` が `toBeVisible({timeout:10_000})` + `[data-component="admin-audit"]` visible | GET のみ・mutation 要素を操作しない |
| TC-REQ-01 | `/admin/requests` | `goto(..., networkidle)` → heading 待機 | `getByRole("heading",{name:"依頼キュー"})` が visible | GET のみ |
| TC-IDC-01 | `/admin/identity-conflicts` | `goto(..., networkidle)` → heading 待機 | `getByRole("heading",{name:"Identity 重複候補"})` visible + `section[data-route="admin"]` visible | GET のみ |
| TC-SCHEMA-01 | `/admin/schema` | `goto(..., networkidle)` → heading 待機 | `getByRole("heading",{name:"スキーマ差分のレビュー"})` visible + `[data-page="admin-schema"]` visible | GET のみ |
| TC-MTG-01 | `/admin/meetings` | `goto(..., networkidle)` → heading 待機 | `getByRole("heading",{name:"開催日 / 出席管理"})` visible + `[aria-label="開催 KPI"]` visible | GET のみ |

### TC: read-only ガード（mutation 非実行の機械的保証 / AC-3）

| TC | route | ガード assertion | 期待 | 遮断する mutation |
| --- | --- | --- | --- | --- |
| TC-AUDIT-02 | `/admin/audit` | （ガード不要・pure read-only）| ─（検索/リセットは GET のみで副作用なし）| なし |
| TC-REQ-02 | `/admin/requests` | `getByRole("dialog").toHaveCount(0)` | dialog 0 件 = 承認/却下の確認ダイアログ未オープン | 承認/却下（POST resolve）|
| TC-IDC-02 | `/admin/identity-conflicts` | `getByRole("dialog").toHaveCount(0)` | dialog 0 件 = merge/別人確定の確認フロー未進入 | merge / 別人マーク |
| TC-SCHEMA-02 | `/admin/schema` | `getByTestId("bulk-resolve-modal").toHaveCount(0)` / `getByTestId("bulk-rollback-modal").toHaveCount(0)` | modal 0 件 = Bulk Resolve / Bulk Rollback 未オープン | alias 割当 / Bulk Resolve / rollback / Bulk Rollback / 再集計 |
| TC-MTG-02 | `/admin/meetings` | `getByTestId("attendance-toast").toHaveCount(0)` | toast 0 件 = 出席操作未発火（drawer 未操作）| 開催日作成・更新・削除 / 出席追加・削除・更新 |

### TC: screenshot（visual baseline）

| TC | route | capture | snapshot arg | 副作用なし確認 |
| --- | --- | --- | --- | --- |
| TC-AUDIT-03 | `/admin/audit` | `addStyleTag`(アニメ抑止) → `toHaveScreenshot(...)` | `admin-audit-authenticated.png` | screenshot は read-only |
| TC-REQ-03 | `/admin/requests` | 同上 | `admin-requests-authenticated.png` | 同上 |
| TC-IDC-03 | `/admin/identity-conflicts` | 同上 | `admin-identity-conflicts-authenticated.png` | 同上 |
| TC-SCHEMA-03 | `/admin/schema` | 同上 | `admin-schema-authenticated.png` | 同上 |
| TC-MTG-03 | `/admin/meetings` | 同上 | `admin-meetings-authenticated.png` | 同上 |

> 各 spec は最後に execution 時のみ Phase 11 evidence を二重 capture する
> （`mkdirSync(phase11Dir)` → `page.screenshot({ path: join(phase11Dir, "<name>.png") })`）。Phase 5 §5.3 正本参照。

---

## 4.4 命名規則整合チェック（current 規約との照合）

5 spec の spec 名・screenshot 名が既存規約に逐語整合することを明記する（Phase 1 §3 / Feedback 1 命名ドリフト防止）。

| チェック項目 | current 規約 | 5 spec の整合 |
| --- | --- | --- |
| spec ファイル名 | `<area>-<feature>-authenticated.spec.ts`（kebab-case）| `admin-audit-authenticated.spec.ts` 他 5 本すべて整合 |
| test suffix | `*.spec.ts` のみ（CLAUDE.md 不変条件 #8。`*.test.ts` 禁止）| 全 5 本 `.spec.ts` |
| screenshot `{arg}` | `<screen>-authenticated.png` | `admin-audit-authenticated.png` 他、route 名と 1:1 |
| snapshotPathTemplate 展開 | `{arg}` → `*-authenticated-staging-visual-{platform}.png`（既存 project 設定で自動展開）| 5 spec とも同テンプレート経由（Phase 5 §5.2）|
| 配置ディレクトリ | `apps/web/playwright/tests/visual-staging-authenticated/` | 5 本すべて同ディレクトリ（testDir + glob 自動認識 = AC-4）|

> 新しい命名パターン・新しい primitive を生やさない。既存 4 spec の規約を逐語踏襲する。

---

## 4.5 失敗時の切り分け（spec 設計観点の先取り）

| 症状 | 想定原因 | 対応 |
| --- | --- | --- |
| 認証失敗（login 画面が撮れる）| storageState 未 mint / 非 admin | setup project（`setup.staging-auth.ts`）の依存解決を確認（CI では自動）。Phase 6 §6.1 FP-01 で早期 fail 化 |
| heading 未到達（timeout）| route が描画されない / 認証境界で弾かれる | heading の role=name 一致を確認。10s timeout で fail（Phase 6 §6.1 FP-02）|
| read-only ガード count ≠ 0 | mutation 要素を誤操作 / 想定外の dialog/modal/toast | ガード assertion が fail = read-only 違反検出（Phase 6 §6.2）|
| baseline diff 過大 | フォント/アニメ未制御 | `addStyleTag` のアニメ無効化適用と `animations:"disabled"` 併用を確認 |

---

## 4.6 Phase 4 完了条件

- [x] visual regression の TDD 位置づけ（baseline mint → 比較）を §4.0 で定義した
- [x] 検証コマンド suite（typecheck / lint / --list / --update-snapshots）と expected result / gate を §4.1 に固定した
- [x] 5 画面の spec 別 expected result（heading / container / read-only ガード / screenshot 名）を §4.2 にテーブル化した
- [x] テストケース表（TC-ID × 到達/read-only ガード/screenshot）を 5 画面分作成し副作用なし確認を併記した（§4.3）
- [x] spec 名・screenshot 名が current 規約に整合することを §4.4 で照合した
- [ ] （execution 時）`--list` で 5 spec 認識を確認し `--update-snapshots` で baseline 5 枚を mint → **user-gated**
