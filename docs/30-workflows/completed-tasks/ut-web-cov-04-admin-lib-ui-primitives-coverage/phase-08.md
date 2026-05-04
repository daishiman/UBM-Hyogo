# Phase 8: DRY 化 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 5/6 で導入した 13 ファイル分のテスト setup を重複検出し、helper 抽出（test code の追加・編集）を伴うため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 8 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Phase 5/6 で書かれた重複 setup を test helper モジュール（実コード）に抽出するため。helper 抽出後も coverage が AC を維持することを Phase 11 で再実測する。 |

## 目的

Phase 5/6 で導入されたテスト群の setup / mock / fixture の重複を検出し、3 ファイル以上で再現する setup を test helper として抽出する。helper 化後も AC（マトリクス A〜E）が維持されること、既存 web test に regression が無いことを Phase 11 で再確認できる体制を整える。

## CONST_005 必須項目

| 項目 | 値 |
| --- | --- |
| 変更対象ファイル | 実装レビュー結果: helper 新設なし。編集対象は 13 テストファイルと stale regression test のみ。production code は不変 |
| シグネチャ | helper 抽出は見送り。`setupUser(options?: Parameters<typeof userEvent.setup>[0])` / `assertBarrelExports(...)` は将来候補として記録するが、本サイクルでは実装しない |
| 入出力 | 入力: Phase 7 マトリクスを通った 13 テストファイル。出力: 対象テスト追加・拡張 + 維持された coverage（再実測） |
| テスト方針 | helper 自体は薄い wrapper のため専用 unit test は作らず、利用側 test がそのまま contract として機能することを採用条件とする。helper 抽出後 `pnpm --filter @ubm-hyogo/web test` で 全件 green、`test:coverage` で AC 維持を確認 |
| 実行コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web test` / `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` |
| DoD | (a) 同一 setup が 3 ファイル以上で出現している重複が helper 呼び出しに置換 (b) helper 抽出後の `pnpm --filter @ubm-hyogo/web test` が全件 green (c) Phase 7 マトリクス A の全 metric が目標以上を維持 (d) 既存 web test に regression なし |

## DRY 化判定基準

| 基準 | 内容 |
| --- | --- |
| 抽出閾値 | 同一 setup（3 行以上のコードブロック）が **3 テストファイル以上** で出現する場合に helper 化 |
| 抽出見送り | 2 ファイル以下の重複 / `beforeEach` 1 行レベルの mock 初期化 / ファイル固有の fixture（特殊 path 値など） |
| 命名規約 | `apps/web/src/test/helpers/*` 配下に `<scope>.ts` で配置。export 名は `setup<Mock> / stub<Env> / mock<Module> / render<Pattern> / use<Timer>` |
| 配置原則 | apps/web に閉じる（packages/_shared には昇格しない。他 app からの再利用が見込めないため） |

## 重複検出観点（Phase 5/6 出力に対し抽出）

| カテゴリ | 想定重複箇所 | 出現ファイル数（想定） | helper 化判定 | 抽出先 |
| --- | --- | --- | --- | --- |
| `next/headers` の `cookies()` mock | server-fetch.test.ts ほか admin lib 系 | 1〜2（server-fetch.test.ts のみ） | 抽出見送り（閾値未満） | — |
| `globalThis.fetch = vi.fn()` の `beforeEach` 初期化 + `afterEach` 復元 | server-fetch.test.ts / api.test.ts | 2 ファイル | 抽出見送り | — |
| `vi.stubEnv("INTERNAL_API_BASE_URL", ...)` / `vi.stubEnv("INTERNAL_AUTH_SECRET", ...)` + `vi.unstubAllEnvs()` | server-fetch.test.ts のみ | 1 | 抽出見送り | — |
| `vi.useFakeTimers() + vi.advanceTimersByTime + vi.useRealTimers` | Toast.test.tsx のみ（他 primitive は不要） | 1 | 抽出見送り | — |
| focus trap 検証用「render 前に sibling button を `document.body` に append → unmount 後 `document.activeElement` を assert」 | Modal.test.tsx / Drawer.test.tsx | 2 | 抽出見送り（境界） | — |
| `@testing-library/user-event` の `userEvent.setup()` 呼び出し | Modal / Drawer / Field / Segmented / Switch / Search / Toast | 7 ファイル | **抽出する** | `ui-primitive.tsx` の `setupUser()` |
| `ToastProvider` で children を wrap して render | Toast.test.tsx / 他 primitive のうち provider 不要なもの除く | 1 | 抽出見送り | — |
| barrel `Object.keys` assert パターン | icons.test.ts / index.test.ts / types.test.ts | 3 | **抽出する** | `apps/web/src/test/helpers/barrel.ts` の `assertBarrelExports(mod, names)` |
| `userEvent.click` + `expect(callback).toHaveBeenCalledWith(...)` の click→assert ペア | Modal / Drawer / Segmented / Switch / Search | 5 | 抽出見送り（個別 assert 値が異なる） | — |

> 上記は「3 ファイル以上の閾値」で抽出するため、最終的に helper 化されるのは **(1) `setupUser()`（ui-primitive.tsx）** と **(2) `assertBarrelExports()`（barrel.ts）** の 2 関数を確実候補とする。fetch mock / focus trap render は 2 ファイル以内のため抽出見送り（過剰抽象化を避ける）。Phase 5/6 実装後に閾値を超えたものが追加発見されれば本表に追記して helper 化する。

## helper 配置仕様

### `apps/web/src/test/helpers/ui-primitive.tsx`（将来候補 / 本サイクル未作成）

```ts
// シグネチャのみ（Phase 8 では宣言・配置先のみ確定。実装は本タスクスコープ）
export function setupUser(
  options?: Parameters<typeof userEvent.setup>[0],
): ReturnType<typeof userEvent.setup>;
```

- 役割: `@testing-library/user-event` の v14 setup を 1 行で呼ぶラッパー。`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` 形のオプション固定が必要なテストでも使えるよう `Partial<Options>` を受け取る。

### `apps/web/src/test/helpers/barrel.ts`（将来候補 / 本サイクル未作成）

```ts
export function assertBarrelExports<T extends Record<string, unknown>>(
  mod: T,
  expectedKeys: readonly (keyof T)[],
): void; // 各 key が undefined でなく typeof === "function" | "object" であることを assert
```

- 役割: barrel ファイル（`components/ui/index.ts`, `components/ui/icons.ts`, `lib/admin/types.ts`）の export 集合 assert を 1 行に統一。

### `apps/web/src/test/helpers/index.ts`（将来候補 / 本サイクル未作成）

- barrel: `export * from "./ui-primitive"; export * from "./barrel";`

## 既存 3 テストファイルとの重複削減方針

| 既存ファイル | 縮小 / helper 利用 |
| --- | --- |
| `apps/web/src/components/ui/__tests__/primitives.test.tsx` | Phase 5 で Toast/Modal/Drawer/Field/Segmented/Switch/Search の describe を個別ファイルへ移譲済み。Phase 8 では残存する Chip/Avatar/Button/Input/Textarea/Select/KVList/LinkPills describe で `setupUser()` 呼び出しを再利用（既存 `userEvent.setup()` 直書きを置換） |
| `apps/web/src/lib/admin/__tests__/api.test.ts` | 既存 fetch mock 直書きパターンと Phase 5 で追加された mutation ケースの fetch mock が同一ファイル内に同居。Phase 8 では同一 `beforeEach` に統合し、describe を跨いだ重複を削除 |
| `apps/web/src/lib/url/login-state.test.ts` | 既存 + 追加 4 ケースで `historyImpl` mock を再利用。`vi.fn()` を beforeEach で 1 回作る形に統合 |

## DRY 化後の coverage 維持確認

1. helper 抽出 PR 作業（Phase 5/6 で先に行う実装）の前後で `apps/web/coverage/coverage-summary.json` を取得し diff
2. helper 自体は `apps/web/src/test/helpers/**` に置くため `vitest.config.ts` の `coverage.include` 既定（src 配下）から除外する必要がある場合は `coverage.exclude` に `src/test/**` を追加する
3. ただし「coverage 数値合わせの exclude 追加禁止（Phase 1 / Phase 3 規約）」との衝突を避けるため、helper を作る場合は `src/__test-helpers__/**` を優先し、production code を exclude しない。本サイクルでは helper 抽出より局所テスト追加を優先し、coverage exclude 変更は行わない
4. helper 抽出後 `pnpm --filter @ubm-hyogo/web test:coverage` を再実行し、Phase 7 マトリクス A の全 metric が目標以上を維持することを Phase 11 evidence に併記

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- #5 public/member/admin boundary: helper も admin / UI primitive の文脈に閉じる
- #6 apps/web → D1 直接アクセス禁止: helper は fetch mock のみ、D1 binding を import しない
- 過剰抽象化を避ける（2 ファイル以下の重複は helper 化しない）
- helper 配置で coverage exclude を悪用しない（数値合わせ目的の exclude 追加は禁止。helper は計測対象外で良いが、production code を exclude しない）

## サブタスク管理

- [ ] Phase 5/6 出力で 3 ファイル以上の重複 setup を抽出する
- [ ] helper 2 件（`setupUser`, `assertBarrelExports`）の配置先・シグネチャ確定
- [ ] 既存 3 テストファイルとの重複削減方針確定
- [ ] coverage 維持の再実測手順を Phase 11 へ引き継ぐ
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- `outputs/phase-08/main.md`: helper 配置案 / DRY 判定基準 / 重複削減方針サマリ

## 完了条件

- 3 ファイル以上の重複 setup が helper 化されている（または「3 ファイル以上の重複は存在しなかった」事実が記録されている）
- helper 抽出後の `pnpm --filter @ubm-hyogo/web test` が全件 green
- Phase 7 マトリクス A の全 metric が目標以上を維持
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] DRY 判定基準（3 ファイル閾値）が明記されている
- [ ] helper 配置先・シグネチャが確定している
- [ ] coverage 維持の再実測手順が Phase 11 へ引き継がれている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ次を渡す: helper 抽出後のテストファイル一覧（13 + helper 2-3）、`pnpm --filter @ubm-hyogo/web test / test:coverage / typecheck / lint / build` の品質ゲート対象、helper 抽出による coverage 変動見込み、既存 3 テストファイルの green 維持確認方針。
