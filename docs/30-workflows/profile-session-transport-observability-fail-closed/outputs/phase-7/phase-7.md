# Phase 7: カバレッジ確認

## メタ情報
正本: `outputs/phase-7/phase-7.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-6/phase-6.md`（追加ケース P6-1〜P6-16）/ `../phase-4/phase-4.md`（I/O 契約・解決順序表 R-1〜8）/ FB Feedback `BEFORE-QUIT-002` / `BEFORE-QUIT-005`（全体一律でなく変更ブロックに限定した実測を残す方針）

## 目的
カバレッジ目標を**変更ブロック（本タスクで新規追加・改修した関数 / 分岐）に限定**して定義する。全体一律カバレッジ閾値を引き上げるのではなく、変更した関数のみの line/branch を実測し、未到達分岐があれば Phase 6 のケースで埋める（FB BEFORE-QUIT-002/5）。本タスクは観測性 + fail-closed の小さな差分であり、リポジトリ全体の coverage gate（≥80%）はベースラインを維持するだけでよい。

不変条件: カバレッジ取得のために本体コード / テストへ `127.0.0.1` / `localhost` / `8787` / `8888` の新規リテラルを書かない。apps/api は非接触（計測対象外）。

---

## 1. 計測対象（変更ブロックのみ）

| 対象シンボル | ファイル | 種別 | line 目標 | branch 目標 | 主担当ケース |
|--------------|----------|------|-----------|-------------|--------------|
| `resolveApiFetch` の新分岐（step4 の `environmentExplicit === true` 制限 / step5 fail-closed 到達） | `apps/web/src/lib/fetch/transport.ts` | 改修 | 100% | 新規分岐 100%（step4 許可 / step4 skip→step5 throw の両側） | P6-1, P6-2, T1-2, T1-3, T1-4 |
| `describeTransport`（新規純関数） | `apps/web/src/lib/fetch/transport.ts` | 新規 | 100% | service-binding / http の 2 分岐 100% | T1-5, T1-6（D-1, D-2, D-3） |
| `getEnvironmentResolution`（新規） | `apps/web/src/lib/env.ts` | 新規 | 100% | explicit=true（enum 3値）/ explicit=false（未注入・typo）の両側 100% | P6-13, P6-14, P6-15, P6-16, T5-1〜T5-5 |
| `transportFromError`（新規ヘルパ） | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 新規 | 100% | メタ有り / メタ無し の両側 100% | P6-10, P6-11, T4-1, T4-2, T4-3 |
| `logServerFetchFailure` のメタ条件付き spread（改修分岐） | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 改修 | 100% | メタ spread 有 / 無（キー非出現）の両側 | P6-7, P6-8, P6-10 |
| `ApiTransportError` constructor / プロパティ保持（新規クラス） | `apps/web/src/lib/fetch/transport.ts` | 新規 | 100% | transport/cause の付与有無 | P6-4, P6-5, P6-6 |
| `FetchAuthedError` の診断メタ optional 引数（改修） | `apps/web/src/lib/fetch/errors.ts` | 改修 | 100% | transport 省略（後方互換）/ transport 付与の両側 | T3-1, T3-2, "FetchAuthedError は status / bodyText を保持"（既存・省略側） |
| authed.ts の transport 解決 + 診断メタ付与配線（改修ブロック） | `apps/web/src/lib/fetch/authed.ts` | 改修 | 100% | 非2xx→FetchAuthedError / fetch throw→ApiTransportError / fail-closed throw の 3 経路 | P6-3, P6-4, P6-5, T3-1〜T3-3, T3-6 |

`scripts/diagnose-profile-session.sh`（F6）はシェルスクリプトで vitest カバレッジの対象外。Phase 9 で `bash -n`（構文検査）により health を担保する。

---

## 2. カバレッジ取得コマンド（変更ブロックに限定した実測）

focused run に `--coverage` を付け、対象ファイルのみを `--coverage.include` で絞って実測する。全体閾値は変えず、出力された変更ファイルの行・分岐をレビューする。

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  --coverage \
  --coverage.include='apps/web/src/lib/fetch/transport.ts' \
  --coverage.include='apps/web/src/lib/fetch/errors.ts' \
  --coverage.include='apps/web/src/lib/fetch/authed.ts' \
  --coverage.include='apps/web/src/lib/env.ts' \
  --coverage.include='apps/web/src/lib/server-fetch/safe-fetch.ts'
```

> 注: `--coverage.include` で対象を限定することで「変更ブロックの実測」を残す（FB BEFORE-QUIT-002）。全体 coverage gate（リポジトリ標準 ≥80%）は別途 CI の通常 run が担保し、本タスクで閾値を引き上げない（FB BEFORE-QUIT-005）。

---

## 3. 未到達分岐が出た場合の対応

| 想定未到達 | 原因 | 対応ケース |
|------------|------|------------|
| `resolveApiFetch` step5（fail-closed throw）が未到達 | `environmentExplicit:false` × binding/baseUrl 無 の入力が無い | P6-1 を追加（必須） |
| `describeTransport` の http 分岐が未到達 | http baseUrl 入力が無い | T1-6（D-2）/ D-3 を追加 |
| `getEnvironmentResolution` の explicit=false 側が未到達 | 未注入 / typo 入力が無い | P6-13〜P6-15 を追加 |
| `transportFromError` のメタ無し側が未到達 | 診断メタ無し error 入力が無い | P6-7, P6-8 を追加 |
| `ApiTransportError` の cause 無し constructor が未到達 | cause を渡さない生成経路が無い | クラス単体テスト or P6-6 で補完 |
| `FetchAuthedError` の meta 省略側が未到達 | 既存 `new FetchAuthedError(status, bodyText)` 経路が消えた | 既存「FetchAuthedError は status / bodyText を保持」を回帰 guard として残す（meta 省略側を踏む） |

各未到達は**全体閾値の引き上げではなく、対象ケースの追加**で埋める。Phase 6 の表に対応 ID が存在することを確認する。

---

## 統合テスト連携
本 Phase で「変更ブロックの line/branch を 100% 近傍で実測する」目標を固定した。Phase 8 のリファクタリング（診断メタ生成の純関数一元化）後も同じ focused + `--coverage.include` で再実測し、純関数化により分岐が `describeTransport` / `transportFromError` に集約されてカバレッジが安定することを確認する。Phase 9 で focused vitest を gate として最終実行する。

## 参照資料
- `../../_shared-context.md`（SSOT §7 テスト方針 / §8 実行コマンド）
- `../phase-6/phase-6.md`（P6-1〜P6-16）/ `../phase-4/phase-4.md`（R-1〜8 解決順序）
- FB Feedback `BEFORE-QUIT-002`（変更ブロック限定の実測）/ `BEFORE-QUIT-005`（全体一律閾値を上げない）

## 成果物
- `outputs/phase-7/phase-7.md`

## 完了条件
- [x] 計測対象を変更ブロック（新規 / 改修関数）に限定して列挙した。
- [x] 各対象の line/branch 目標と主担当ケースを対応付けた。
- [x] 変更ブロックに限定した `--coverage.include` 実測コマンドを定義した（全体閾値非引き上げ・FB BEFORE-QUIT-002/5）。
- [x] 未到達分岐が出た場合の埋め戻しケースを表で示した。
