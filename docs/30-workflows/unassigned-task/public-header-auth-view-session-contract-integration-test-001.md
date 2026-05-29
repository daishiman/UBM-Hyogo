# PublicHeader AuthView session contract integration test - タスク指示書

## メタ情報

```yaml
issue_number: 1010
```

| 項目 | 内容 |
| --- | --- |
| タスクID | public-header-auth-view-session-contract-integration-test-001 |
| タスク名 | PublicHeader AuthView session contract integration test |
| 分類 | 改善 / testing follow-up |
| 対象機能 | `apps/web/src/lib/auth-view/getAuthView.ts` と Auth.js session contract |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `public-header-session-aware-auth-view-base` Phase 10 M-01 / Phase 12 |
| 発見日 | 2026-05-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`public-header-session-aware-auth-view-base` では `AuthView` 型、`resolveAuthView()`、`getAuthView()` を追加し、公開ヘッダーが guest / member / admin の表示を出し分ける基盤を実装した。現在の focused test は `getAuthView()` の mock 経由で fail-closed と member/admin 分岐を確認している。

一方で `getAuthView()` は `getAuth().auth()` の戻り値を `SessionLike | null` として受け、`user.memberId` と `user.isAdmin` だけを利用する。Auth.js 側または `apps/web/src/lib/auth.ts` 側の session shape が変わった場合、mock 単体テストだけでは実際の auth adapter との契約 drift を早期検知しづらい。

### 1.2 問題点・課題

- `getAuthView()` の単体テストは `@/lib/auth` を mock しているため、実際の `getAuth()` export 形状や `auth()` 戻り値との接続を検証していない
- `SessionLike` は最小 contract として意図的に狭く定義されているが、Auth.js session augmentation の変更時に `memberId` / `isAdmin` が欠落しても PublicHeader 側の regression として検出される保証が弱い
- PublicHeader は session 本文を DOM に出さない設計のため、runtime screenshot だけでは session contract drift の原因を切り分けにくい

### 1.3 放置した場合の影響

Auth.js session shape が変わったとき、ログイン済み member/admin が `guest` として表示され、公開ヘッダー上で `マイページ` / `管理画面` 導線が消える可能性がある。fail-closed は安全側の挙動だが、検知が遅れると UI regression として staging 以降で初めて発覚する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`getAuthView()` と実際の auth module contract の間に integration-level regression test を追加し、Auth.js session augmentation / `getAuth()` export 形状の drift をローカル CI で早期検知できるようにする。

### 2.2 最終ゴール

- `getAuth().auth()` 相当の実 session shape から `AuthView` が member/admin に解決される integration test が存在する
- session augmentation が `memberId` / `isAdmin` を欠落させた場合に失敗するテストが存在する
- 既存の fail-closed unit test は維持され、PublicHeader の DOM contract と矛盾しない

### 2.3 スコープ

#### 含むもの

- `apps/web/src/lib/auth-view/` 周辺の integration test 追加
- `apps/web/src/lib/auth.ts` の public export 形状確認を含む contract test
- `AuthView` が使用する session field (`user.memberId`, `user.isAdmin`) の regression assertion
- `public-header-session-aware-auth-view-base` の source follow-up trace 更新

#### 含まないもの

- Auth.js provider 設定変更
- Google OAuth の実ログイン smoke
- staging authenticated runtime screenshot 取得
- `PublicHeader` の UI 変更
- commit / push / PR 作成

### 2.4 成果物

- integration test file（例: `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts`）
- 必要に応じた test helper / fixture
- `public-header-session-aware-auth-view-base` 側の follow-up trace 更新
- focused Vitest 実行ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `public-header-session-aware-auth-view-base` の Phase 1-12 が完了している
- `apps/web/src/lib/auth-view/getAuthView.ts` が `getAuth().auth()` 経由で session を取得している
- `apps/web/src/lib/auth-view/resolveAuthView.ts` の pure contract が既存テストで PASS している

### 3.2 依存タスク

- 親実装: `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/`
- 親 workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/`

### 3.3 必要な知識

- Auth.js v5 の `auth()` session contract
- Vitest module mocking と integration test の境界
- Next.js App Router server component の public header rendering contract

### 3.4 推奨アプローチ

`resolveAuthView()` の pure unit test は維持し、追加テストでは `getAuthView()` が依存する auth module boundary をできるだけ実際の export 形状に近い形で検証する。実 OAuth や cookie を使わず、session object fixture で `memberId` / `isAdmin` の contract を固定する。

---

## 4. 実行手順

### Phase構成

小規模 testing follow-up として、Phase 1-4 の短縮構成で実施する。

### Phase 1: 現状 contract 確認

#### 目的

`getAuthView()` が依存している auth module と session field を確定する。

#### 手順

1. `apps/web/src/lib/auth-view/getAuthView.ts` と `apps/web/src/lib/auth.ts` を読む
2. `SessionLike` が参照する field を `memberId` / `isAdmin` に限定していることを確認する
3. 既存 `getAuthView.spec.ts` が mock-only であることを確認する

#### 成果物

- contract 確認メモ（テスト PR の説明または workflow Phase 1）

#### 完了条件

- 実 session contract と test gap が明文化されている

### Phase 2: integration test 追加

#### 目的

AuthView session contract drift を検出する test を追加する。

#### 手順

1. `authViewSessionContract.integration.spec.ts` を追加する
2. member session fixture が `{ kind: "member", profileHref: "/profile" }` へ解決されることを検証する
3. admin session fixture が `{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }` へ解決されることを検証する
4. `memberId` 欠落時は `{ kind: "guest" }` へ fail-closed することを既存 unit test と重複しすぎない形で確認する

#### 成果物

- integration spec

#### 完了条件

- focused Vitest が PASS する

### Phase 3: 回帰ゲート接続確認

#### 目的

追加 test が通常の web test 実行経路で拾われることを確認する。

#### 手順

1. focused test を実行する
2. 必要なら `package.json` / test glob に追加不要で拾われることを確認する
3. `pnpm typecheck` で型 drift がないことを確認する

#### 成果物

- focused test log
- typecheck log

#### 完了条件

- test / typecheck が exit 0

### Phase 4: ドキュメント同期

#### 目的

親 workflow の FU-001 が消化されたことを記録する。

#### 手順

1. 親 workflow の Phase 12 unassigned-task detection または対応 workflow に consumed trace を追加する
2. 必要に応じて aiworkflow-requirements の active ledger を更新する

#### 成果物

- follow-up trace 更新

#### 完了条件

- `public-header-session-aware-auth-view-base` Phase 10 M-01 との対応が辿れる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] member session fixture が member AuthView に解決される
- [ ] admin session fixture が admin AuthView に解決される
- [ ] `memberId` 欠落時は guest fail-closed になる

### 品質要件

- [ ] focused Vitest が PASS する
- [ ] `pnpm typecheck` が PASS する
- [ ] 既存 PublicHeader / resolveAuthView / getAuthView unit test を壊さない

### ドキュメント要件

- [ ] 親 workflow の FU-001 trace が consumed または linked 状態になる
- [ ] 実行ログに test command と結果が記録される

---

## 6. 検証方法

### テストケース

- TC-AVSC-01: member session contract
- TC-AVSC-02: admin session contract
- TC-AVSC-03: missing `memberId` fail-closed
- TC-AVSC-04: existing `getAuthView.spec.ts` regression

### 検証手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts
mise exec -- pnpm typecheck
```

期待:

- Vitest が exit 0
- typecheck が exit 0
- `AuthView.kind` は `guest | member | admin` 以外を出さない

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 実 OAuth を使う integration test に拡大して flaky になる | 中 | 中 | 本タスクは session object contract に限定し、OAuth runtime smoke は含めない |
| 既存 mock unit test と重複し価値が薄くなる | 中 | 中 | `apps/web/src/lib/auth.ts` export shape と session augmentation field を検証対象に含める |
| Auth.js 型に直接依存しすぎて minor upgrade で過剰に壊れる | 中 | 低 | PublicHeader が必要とする app-level contract (`memberId`, `isAdmin`) だけを assertion する |
| parent workflow 移動後に参照 path が変わる | 低 | 中 | 移動前後の workflow root を確認して trace を更新する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/phase-10-final-review.md`
- `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/phase-12-documentation.md`
- `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/specs/02-auth.md`

### 参考資料

- `apps/web/src/lib/auth-view/getAuthView.ts`
- `apps/web/src/lib/auth-view/resolveAuthView.ts`
- `apps/web/src/lib/auth-view/types.ts`
- `apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | `getAuthView()` は Auth.js 依存を薄い `SessionLike` に閉じ込める設計のため、mock unit test だけでは実 auth module との contract drift を見落としやすい |
| 原因 | PublicHeader の安全性を優先して fail-closed guest に倒す実装にしたため、session shape が壊れても UI 上は「ログイン」表示として成立し、原因が runtime visual だけでは分かりにくい |
| 対応 | `memberId` / `isAdmin` の app-level session contract を integration-level test で固定し、OAuth runtime smoke とは分離する |
| 再発防止 | Auth.js session augmentation や `apps/web/src/lib/auth.ts` を変更するタスクでは、この contract test を必ず focused gate に含める |

### レビュー指摘の原文（該当する場合）

```text
M-01 | getAuth().auth() の戻り値型が変わった場合の早期検知に integration test 追加余地 | 未タスク（FU-001 候補）— 本タスクは契約面で型を SessionLike に閉じているため即時影響なし
```

### 補足事項

staging authenticated runtime screenshots は Phase 13 / user-gated boundary のため、本タスクでは扱わない。
