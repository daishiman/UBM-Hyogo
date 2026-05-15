[実装区分: 実装仕様書]

# Phase 6: テスト拡充

## 目的

17 routes 各画面で flaky 要因となる動的要素を特定し、`data-visual-mask` 属性または `mask` selector の追加で安定化する。auth-required routes は既存 auth helper で確認する。

---

## 入力

- `outputs/phase-5/implementation-notes.md`
- 51 baseline 初回生成結果

---

## 1. data-testid / data-visual-mask 安定性確認チェックリスト

| route | 動的要素候補 | 対応 |
|-------|--------------|------|
| `/` | 直近活動の `time` | `time` element mask（spec で対応済み） |
| `/(public)/members` | 会員数カウンター（リアルタイム） | カウント要素に `data-visual-mask` 追加 |
| `/(public)/members/[id]` | 最終更新時刻 | `time` mask |
| `/(public)/register` | CSRF トークン hidden input | hidden は visible でないため影響なし |
| `/privacy` / `/terms` | なし | — |
| `/login` | なし | — |
| `/profile` | 最終ログイン時刻 | `time` mask |
| `/(admin)/admin` | KPI 数値 (member count 等) | `data-visual-mask` 追加 |
| `/(admin)/admin/members` | 一覧件数 / pagination | `data-visual-mask` 追加 |
| `/(admin)/admin/tags` | tag count | `data-visual-mask` |
| `/(admin)/admin/meetings` | 直近 meeting 日時 | `time` mask |
| `/(admin)/admin/schema` | schema バージョン | `data-visual-mask` |
| `/__not_found_canary` | なし | expected status 404 の not-found 表示を固定 |
| `/(admin)/admin/requests` | 申請件数 / `time` | mask |
| `/(admin)/admin/identity-conflicts` | conflict count | `data-visual-mask` |
| `/(admin)/admin/audit` | 監査ログ `time` カラム | `time` mask |

> `data-visual-mask` 追加は本タスクでは **ソースコード側に最小限**（admin 数値 KPI のみ）に留め、それ以外は `time` element mask で吸収する。Phase 8 リファクタで再評価。

---

## 2. auth fixture 確認

W7 で導入済みの `playwright/fixtures/auth.ts` を再利用する。現行リポジトリには `setup-auth-member` / `setup-auth-admin` project や `storageState` 生成ファイルは存在しないため、本タスクでは新規 setup project を追加しない。

| helper | 認証ロール | 用途 |
| --- | --- | --- |
| `memberLogin(context)` | member（一般会員） | `/profile` の visual route |
| `adminLogin(context)` | admin | `/admin*` の visual route |

`visual-full-chromium-*` 3 project は route の `auth` 値に応じて spec 内で helper を呼び分ける。

---

## 3. テスト追加項目

| 項目 | 内容 |
|------|------|
| baseline 命名検証 | Phase 7 で 51 件存在チェック script を導入 |
| auth fixture 有効性 | spec 実行時に `memberLogin(context)` / `adminLogin(context)` が cookie を注入することを確認 |
| route 到達可能性 | 各 spec test で `expect(page).toHaveURL(route.path)` を追加（リダイレクト検出） |

---

## 4. spec 追加 assertion（オプション）

`full-visual.spec.ts` 内で screenshot 直前に以下を追加:

```ts
// route 到達可能性チェック
const expectedPath = route.path.split('?')[0]
expect(page.url()).toContain(expectedPath)
```

これにより auth 失敗時に `/login` へリダイレクトされた場合を flaky ではなく明示的 fail として扱う。

---

## 5. DoD

1. 17 routes すべてで動的要素特定が完了
2. `data-visual-mask` 追加対象のコンポーネント（admin KPI 等）が明示されている
3. `visual-full` spec が既存 auth helper を使い、存在しない setup project に依存していない
4. route 到達可能性 assertion が spec に追加されている

---

## 6. 成果物

- `outputs/phase-6/test-additions.md`
