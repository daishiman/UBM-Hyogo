> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

# Phase 9: 静的検証 / Lint / 型 / grep gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3 |
| 実行種別 | sequential |
| Phase 番号 | 9 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | 8（統合テスト計画） |
| 下流 Phase | 10（ビルド & SSR 検証） |
| 状態 | completed |

## 目的

`window` 素手参照の **構造的撲滅**を CI で恒久化する。具体的には ESLint `no-restricted-globals`、`tsc --noEmit`、`rg` ベースの grep gate を 3 段重ねで構成し、それぞれが意図通り fail / pass することを手順で確認する。

## 実行タスク

1. ESLint `no-restricted-globals` の効きを赤緑両方で検証する手順
2. `apps/web/eslint.config.mjs` の overrides 意図と false positive 抑制
3. grep gate コマンドの最終版確定（CLAUDE.md / 元仕様 §8 を踏襲）
4. TypeScript 型チェックコマンド
5. 文字列 / コメント / JSDoc 中の `window` リテラルの扱い
6. CI ワークフロー（typecheck / lint / window-grep）の job 一覧化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md §4.3 / §6 / §8 | ESLint 抜粋 / 検出手順 |
| 必須 | apps/web/eslint.config.mjs | 既存 lint 設定 |
| 必須 | apps/web/tsconfig.json | strict / paths |
| 推奨 | CLAUDE.md「solo 運用ポリシー」 | required_status_checks に追加する gate |

## ESLint `no-restricted-globals` 検証手順

### 9.1 ルール導入確認（green）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

期待: 違反 0 件で exit 0。本タスクの修正コミット時点で grep 0 件と整合。

### 9.2 違反導入で red（手動 smoke）

```ts
// apps/web/src/lib/__probe__/eslint-probe.ts（コミットしない）
const w = window.innerWidth;
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint
# 期待: error  Use isBrowser() from @/lib/is-browser instead of bare window reference.
#       no-restricted-globals
```

確認後 `eslint-probe.ts` を必ず削除。コミット履歴に残さないこと。

### 9.3 overrides の意図

| ignores 対象 | 理由 |
| --- | --- |
| `src/lib/is-browser.ts` | `typeof window !== 'undefined'` 集約点（典型的に唯一の例外） |
| `src/instrumentation-client.ts` | Sentry browser SDK init は `window` 直接参照が必須（task-03 §0.6） |
| `src/**/__tests__/**` | jsdom 環境内のテストアサーション |
| `src/lib/sentry/**` | runtime 判定 `typeof window !== 'undefined'` を使う（typeof は no-restricted-globals 検出対象外だが、誤検出回避のため明示除外） |

> file 単位の `eslint-disable` コメントではなく `overrides`（flat config の独立 block）方式を取る。grep diff を最小化し、disable コメントの増殖を防ぐため（元仕様 §0.6）。

### 9.4 false positive 抑制

| パターン | 扱い |
| --- | --- |
| 文字列リテラル `"window"` を含むメッセージ | `no-restricted-globals` は **識別子参照のみ**を見るため検出されない（追加対応不要） |
| JSDoc / コメント内の `window.xxx` | 同上、parser が識別子として扱わない |
| `typeof window !== 'undefined'`（typeof 演算子経由） | ESLint コアルール仕様で対象外。誤検知ゼロ |
| `globalThis.window` | 検出されない。導入する場合は `no-restricted-properties` を別途検討（本タスク非ゴール） |

## grep gate コマンド（最終確定）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | (! grep .)
```

| 行 | 説明 |
| --- | --- |
| `rg -n '\bwindow\.'` | 単語境界 `\b` で `Window`（型名）を除外。`.` 続きで identifier アクセスのみ検出 |
| `grep -v 'is-browser.ts'` | 集約点を除外 |
| `grep -v 'instrumentation-client.ts'` | Sentry browser init を除外 |
| `(! grep .)` | 検出 0 件で exit 0（パイプ反転）。CI gate に直結可能 |

> ESLint がカバーする範囲とほぼ重複するが、ESLint がパース失敗するファイル（生成物 / 一時ファイル）に対して **二重防御**として機能する。両方が pass することを DoD とする。

## TypeScript 型チェック

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
```

確認観点:

- `apps/web/src/lib/logger.ts` の `Logger` 型が `apps/web/src/lib/sentry/capture.ts` の `captureException` シグネチャと整合する（task-03 §0.7）
- `LogFields` の `[key: string]: unknown` index signature が `event: string` の type narrowing を阻害しないこと
- `Promise<void>` を返す capture の戻り値を `void` 演算子で明示破棄しているため `no-floating-promises`（task-03 で導入）にも抵触しない

## 文字列 `'window'` を含む resource の扱い

| 種別 | 例 | 対応 |
| --- | --- | --- |
| エラーメッセージ | `"Use isBrowser() instead of bare window"` | そのまま許容 |
| JSDoc | `/** browser window 環境のみ */` | そのまま許容 |
| i18n 文言（将来） | `"ウィンドウサイズを変更"` | 該当 ASCII `window` を含まないため非該当 |
| migration / SQL | 該当なし | N/A |

## CI gate 一覧（本タスクが触る分）

| job | コマンド | 失敗時の意味 |
| --- | --- | --- |
| typecheck | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` | logger / capture の型不整合 |
| lint | `pnpm --filter @ubm-hyogo/web lint` | `no-restricted-globals` 違反 |
| test (unit + integration) | `pnpm --filter @ubm-hyogo/web test` | logger の振る舞い壊れ |
| window-grep | 上記 grep gate one-liner | ESLint をすり抜けた未ガード `window.` |
| build | Phase 10 で扱う | SSR / Workers 互換 |

> CLAUDE.md「solo 運用ポリシー」に従い `required_status_checks` に上記 4 つ（typecheck / lint / test / window-grep）を追加することを task-18 regression smoke で確定する。本 phase では **gate コマンド本体のみ確定**し、GitHub branch protection 反映は task-18 に委譲する。

## CONST_005 該当項目

- **CONST_005-1（既存 API のみ接続）**: lint / grep gate は新 endpoint を要求しない。
- **CONST_005-2（OKLch トークン正本化）**: 本 phase で HEX 直書き / `bg-[#xxx]` の検査追加は行わない（task-18 で別 gate）。
- **CONST_005-3（プロトタイプ正本順位）**: lint で primitives 違反は扱わない。
- **CONST_005-4（D1 直接アクセス禁止）**: lint rule 追加対象外（既存 API レイヤ規律で担保）。
- **CONST_005-5（secret 不混入）**: lint で `process.env` 直接参照を別途規制する余地はあるが本タスク非ゴール（task-02 / task-18 で扱う）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | ESLint 赤緑検証手順 | 9 | completed |
| 2 | overrides 意図テーブル化 | 9 | completed |
| 3 | grep gate one-liner 確定 | 9 | completed |
| 4 | tsc コマンド & 型観点 | 9 | completed |
| 5 | CI gate 一覧 | 9 | completed |
| 6 | outputs/phase-09/phase-09.md 配置 | 9 | completed |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | docs/30-workflows/task-04-w3-window-guard-and-logger/phase-09.md |
| ドキュメント | docs/30-workflows/task-04-w3-window-guard-and-logger/outputs/phase-09/phase-09.md |

## 完了条件

- [ ] ESLint 違反 0、grep 0、tsc 0 error が同時成立
- [ ] overrides の意図がテーブル化されている
- [ ] CI gate 4 件（typecheck / lint / test / window-grep）が一覧化されている
- [ ] false positive パターンが明記されている

## 次 Phase

- 次: Phase 10（ビルド & SSR 検証 / Workers ランタイム）
- 引き継ぎ事項: window-grep gate の one-liner、`overrides` 確定差分
- ブロック条件: ESLint flat config と既存設定の merge 不整合
