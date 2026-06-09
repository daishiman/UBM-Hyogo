# Phase 8: リファクタ

> **実装区分: 実装仕様書** — 新規 5 spec の構造を、既存 authenticated spec 群と整合する形で設計する。

## 8.0 方針

5 spec は新規ファイルのため「既存コードの書き換え」リファクタは存在しないが、
**最初から重複構造の判断を確定して書く**ことを Phase 8 の責務とする（後から剥がすのではなく、最初から方針を固定する）。
基準は既存 `admin-tags-authenticated.spec.ts` / `admin-dashboard-authenticated.spec.ts` の storageState パターン。

## 8.1 5 spec 間の重複構造の確認

5 spec は雛形（Phase 2 §2.2）を逐語踏襲するため、以下 4 要素が各 spec に同型でインライン重複する。

| 重複要素 | 各 spec での出現形 |
| --- | --- |
| `disableAnimations` 定数 | `"*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }"` を各 spec 冒頭にインライン定義 |
| `storageState` の `test.use` | `test.use({ storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json") })` を各 spec で宣言 |
| `phase11Dir` resolve | `resolve(__dirname, "../../../../../docs/30-workflows/issue-1127-.../outputs/phase-11")` を各 spec で算出 |
| `toHaveScreenshot` オプション | `{ fullPage: true, maxDiffPixelRatio: 0.05, animations: "disabled" }` を各 spec で同一指定 |

## 8.2 対象 / Before / After / 理由

| 対象 | Before（過度な抽象化案）| After（採用形）| 理由 |
| --- | --- | --- | --- |
| `disableAnimations` 定数 | 共通 util（`playwright/helpers/animations.ts` 等）へ抽出し 5 spec から import | **各 spec に同一文字列をインライン定義（雛形踏襲）** | 既存 4 authenticated spec も各自インライン定義しており、抽出すると新 spec だけ異なる構造になりドリフトを生む（YAGNI）|
| `storageState` の `test.use` | 共通 fixture / base test へ集約 | **各 spec で `test.use` 宣言（既存 spec と同一）** | 1 spec 1 責務・storageState 出力先のドリフトを各 spec が自己完結で表明。既存パターンに準拠 |
| `phase11Dir` resolve | 共通 helper で workflow root から解決 | **各 spec で `resolve(__dirname, ...)` をインライン算出** | execution 時のみ使う evidence 出力先。`admin-tags-authenticated.spec.ts` と同型で、helper 化は他 spec を巻き込むため非採用 |
| `toHaveScreenshot` オプション | 共通 const に集約し展開 | **各 spec でオプションリテラルを直書き** | 可読性優先（撮影箇所でオプションが見える）・既存 spec と一貫 |
| screenshot canonical 名 | 動的生成（route から導出）| **各 spec で文字列リテラル直書き**（`admin-<screen>-authenticated.png`）| artifacts ledger（`canonical_screenshots`）との照合を文字列一致で容易にする（命名ドリフト防止）|

## 8.3 共通ヘルパへ抽象化しない判断（YAGNI）

| 共通化候補 | 判断 |
| --- | --- |
| `disableAnimations` 文字列 | **抽出しない**。既存 4 spec が各自インライン定義のため、抽出すると新 5 spec だけ構造が乖離する。共有 util 化は既存 spec も巻き込む別タスクスコープ |
| storageState path（`.auth/admin.storageState.json`）| **抽出しない**。既存 spec も inline のため整合優先 |
| `phase11Dir` resolve / capture ブロック | **抽出しない**。`admin-tags-authenticated.spec.ts` の inline パターンに揃える |
| 5 spec を 1 ファイルの `describe.each` に集約 | **しない**。1 画面 1 spec ファイルが既存規約（`<area>-<feature>-authenticated.spec.ts`）であり、CI `paths` glob / project testDir 自動認識・障害時の切り分け単位とも整合 |

> **結論**: 共有 util / fixture は新設しない。雛形（`admin-tags-authenticated.spec.ts` / `admin-dashboard-authenticated.spec.ts`）と同型の重複は、可読性・1 spec 1 責務・既存 spec との一貫性のため **許容**する。これにより navigation / 構造のドリフトをゼロに保つ。

## 8.4 navigation drift チェック（参照のみ・変更なし）

5 spec の遷移先 route は、admin shell のナビゲーション定義（`apps/web/src/.../shell-config.ts` 等）の項目と一致する必要がある。**本タスクは shell-config を変更しない**ため、整合は参照確認のみ。

| spec route | nav 項目（heading / ラベル）| 整合 |
| --- | --- | --- |
| `/admin/audit` | 監査ログ | ✅ 一致（既存 nav に存在）|
| `/admin/requests` | 依頼キュー | ✅ 一致 |
| `/admin/identity-conflicts` | Identity 重複候補 | ✅ 一致 |
| `/admin/schema` | スキーマ差分のレビュー | ✅ 一致 |
| `/admin/meetings` | 開催日 / 出席管理 | ✅ 一致 |

- 新規ルート追加なし。admin shell / sidebar / route 定義に変更なし（テスト spec のみ追加）。
- → **navigation drift なし**（shell-config の nav 項目と spec route が一致。参照のみ・変更なし）。

## 8.5 完了条件（Phase 8）

- [x] 対象 / Before / After / 理由テーブルが埋まっている
- [x] 5 spec 間の重複 4 要素（disableAnimations / storageState test.use / phase11Dir resolve / screenshot オプション）を確認した
- [x] 雛形と同型の重複を許容する判断（可読性・1 spec 1 責務・既存 spec 一貫）を記録した
- [x] 共有 util への過度な抽象化をしない判断（YAGNI / 既存 4 spec も各自インライン）を明記した
- [x] shell-config の nav 項目と spec route の一致を確認した（navigation drift なし・参照のみ）
