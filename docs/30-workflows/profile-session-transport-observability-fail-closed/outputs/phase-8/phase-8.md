# Phase 8: リファクタリング

## メタ情報
正本: `outputs/phase-8/phase-8.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-2/phase-2.md`（§2 診断メタ生成の一元化方針）/ `../phase-3/phase-3.md`（R2 リテラル gate・整合性 ○ = 唯一の結合点）/ `../phase-4/phase-4.md`（I/O 契約）/ `../phase-7/phase-7.md`（カバレッジ計測対象）/ FB Feedback `RT-03`（対象/Before/After/理由 テーブル形式）

## 目的
GREEN 達成後に、診断メタ生成・env 解決ロジックの重複を解消し、責務境界を一元化する。テストを通したまま（振る舞い不変）リファクタする。本 Phase の核心は **診断メタ生成を `describeTransport` に一元化**して複数レイヤへの drift を防ぐこと（phase-2 §2 / phase-3 整合性論点）と、**`getEnvironment` と `getEnvironmentResolution` の重複ロジックを寄せる**こと。

不変条件: リファクタで新規リテラル（`127.0.0.1` / `localhost` / `8787` / `8888`）を生やさない。公開シグネチャ（`safeServerFetch` / `getEnvironment` / 既存 `FetchAuthedError` constructor）を変更しない（後方互換）。apps/api 非接触。

---

## 1. リファクタリング項目（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RF-1 | `apps/web/src/lib/fetch/authed.ts` の診断ラベル生成 | transport の kind / host 判定を authed.ts 内にインラインで持ち、`FetchAuthedError` と transport failure の両方で重複して組み立てる | `describeTransport(transport)` を 1 回呼び、非2xx では `FetchAuthedError` へ渡す。fetch throw は `fetchViaApiTransport` が同じ descriptor で `ApiTransportError` に wrap する | 生成ロジックの単一化（DRY）。kind/host の対応規則を transport.ts に閉じ、host 抽出方法の drift を防ぐ（phase-2 §2） |
| RF-2 | `baseHost` の URL 抽出 | service-binding / http で別々に host 文字列を組み立てる | `describeTransport` 内の `new URL(...).host` 抽出に一本化（既存定数 `SERVICE_BINDING_ORIGIN` / `t.baseUrl` のみ使用） | 新規リテラルを焼かずに host を導出する規約（R2）を 1 箇所に集約し、リテラル gate 違反の再発面を最小化 |
| RF-3 | `apps/web/src/lib/server-fetch/safe-fetch.ts` の error メタ読み取り | `logServerFetchFailure` 内で error の `transportKind`/`baseHost` を直接プロパティアクセスして条件分岐 | `transportFromError(err)` ヘルパに抽出し、`error.transport` 内の許可キーのみ（`transportKind`/`baseHost`）を返す純関数にする | ログ出力キー契約（許可キーのみ・禁止語非出現）を 1 関数に局所化し、漏洩面を縮小（phase-4 §4・R4） |
| RF-4 | `apps/web/src/lib/env.ts` の environment 解決 | `getEnvironment` と `getEnvironmentResolution` が ENVIRONMENT の読取・enum 判定を別々に持つと二重実装になる | `getEnvironmentResolution` が enum 厳密一致判定の正本を持ち、`getEnvironment` はその `.environment` を返す薄いラッパに寄せる（公開シグネチャ不変） | environment 判定ロジックの単一情報源化。`getEnvironment` と resolution の戻り値が常に同値（phase-4 §2 不変条件・P6-16）であることを構造で保証 |
| RF-5 | error のメタ保持 | `FetchAuthedError` / `ApiTransportError` がそれぞれ直下メタ代入コードを持つ | `ApiTransportDescriptor` を `transport.ts` に定義し、`FetchAuthedError.transport` と `ApiTransportError.transport` が同一型を参照 | 型の重複定義を排し、descriptor（transport.ts）→ error（errors/transport）→ ログ（safe-fetch.ts）で同一型を流す。結合点の型 drift 防止（phase-3 整合性 ○ の補強） |

> RF-4 は「`getEnvironment` を薄いラッパに寄せる」変更だが、**戻り値・例外挙動は不変**（既存 env.spec の `getEnvironment`/`getEnv` 系全ケースが green のまま）。内部の単一化のみで外部契約は変えない。仮に既存 `getEnvironment` の実装移譲がリスクと判断される場合は、RF-4 を「`getEnvironmentResolution` 内で `getEnvironment` を内部利用し、explicit 判定だけ独自に行う」最小形（phase-4 §2 の許容形）に留め、`getEnvironment` 本体は触らない（rollback 容易な代替）。

---

## 2. リファクタの安全性チェック（振る舞い不変の保証）

| 項目 | 確認方法 |
|------|----------|
| 振る舞い不変 | RF-1〜RF-5 の各ステップ後に focused vitest（T1-T5 + P6-1〜P6-16）を再実行し全 green |
| カバレッジ非劣化 | Phase 7 の `--coverage.include` 実測を再取得し、変更ブロックの line/branch が劣化しないこと |
| リテラル gate | `bash scripts/verify-no-localhost-bake.sh --src-only` green（RF-2 の host 抽出が新規リテラルを生まない） |
| 公開シグネチャ | `safeServerFetch` / `getEnvironment` / 既存 `FetchAuthedError(status, bodyText)` の呼出元が無変更でビルドできる（`pnpm typecheck`） |
| 漏洩面 | RF-3 後に P6-11/P6-12（禁止語・bodyText 非出現）が green |

---

## 3. rollback 手順

各 RF は独立コミット粒度で適用し、問題発生時は当該コミット単位で戻す。リファクタは GREEN 後の振る舞い不変変更のため、rollback してもテストは green を維持する。

| ケース | rollback 手順 |
|--------|----------------|
| 単一 RF の不具合 | 当該 RF のコミットのみ `git revert <sha>`（他 RF は独立しているため波及しない） |
| RF-4（env 単一化）が既存 env.spec を壊した | §1 注記の最小形（`getEnvironment` 本体不変・resolution 内で内部利用）へ差し替え。最悪は RF-4 を取り消し、`getEnvironmentResolution` を独立実装のまま残す（重複は許容・機能は維持） |
| リファクタ全体を巻き戻す | リファクタコミット群を `git revert` し、Phase 5/6 完了時点（GREEN 達成・純関数化前）の実装に戻す。機能（観測性 + fail-closed）と全テストは維持されるため DoD は満たし続ける |
| 想定外の回帰 | focused vitest を RED 判定の基準に使い、RED を出したコミットを特定して revert。再度 §2 の安全性チェックを通してから再適用 |

> rollback は実コードに対する操作のため、本 Phase（仕様書）では手順の記述に留める。実行は実装フェーズ（commit/PR は user-gated）で行う。

---

## 統合テスト連携
リファクタ後も Phase 4 の I/O 契約・Phase 6 の追加ケースは不変の合格基準として機能する。診断メタ生成が `describeTransport`（生成）→ errors/transport（保持）→ `transportFromError`（読取）の一方向に整流されることで、Phase 9 の `verify-no-localhost-bake --src-only` と漏洩検査（P6-11/12）が安定して green になる。

## 参照資料
- `../../_shared-context.md`（SSOT §2 既存資産 / §5 シグネチャ / §6 不変条件）
- `../phase-2/phase-2.md`（§2 一元化）/ `../phase-3/phase-3.md`（整合性論点・R2）/ `../phase-4/phase-4.md`（結合点契約）/ `../phase-7/phase-7.md`（カバレッジ計測）
- FB Feedback `RT-03`（対象/Before/After/理由 テーブル形式）

## 成果物
- `outputs/phase-8/phase-8.md`

## 完了条件
- [x] 対象/Before/After/理由 テーブル形式（RF-1〜RF-5）でリファクタ項目を定義した（FB RT-03）。
- [x] 診断メタ生成の `describeTransport` 一元化を明示した。
- [x] `getEnvironment` と `getEnvironmentResolution` の重複ロジック寄せ（RF-4）と最小形フォールバックを定義した。
- [x] 振る舞い不変の安全性チェックを定義した。
- [x] RF 単位 / 全体の rollback 手順を記述した。
