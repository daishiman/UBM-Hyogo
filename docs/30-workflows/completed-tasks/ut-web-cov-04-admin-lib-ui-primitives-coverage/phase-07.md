# Phase 7: AC マトリクス — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 5/6 で実装済みのテスト群と AC を紐付け、Phase 11 の実測 evidence で PASS/FAIL を確定するためのマトリクスを定義する（テスト追加は実装行為のため）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 7 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Phase 11 実測 evidence (`apps/web/coverage/coverage-summary.json`) と AC を突合する検証マトリクスを確定するため。 |

## 目的

index.md AC を「(A) 13 モジュール × 4 メトリクス」「(B) admin lib contract 4 ケース」「(C) UI primitives 最低 3 ケース」「(D) barrel import smoke」「(E) 既存 web test regression なし」の 5 グループに分解し、各項目について test ID / metric / evidence path / PASS 条件を 1 表にまとめる。Phase 11 で本表に沿って `coverage-summary.json` 抜粋を埋めれば PASS/FAIL が決定する状態を作る。

## CONST_005 必須項目

| 項目 | 値 |
| --- | --- |
| 変更対象ファイル | docs のみ（Phase 7 段階では production / test code の改変は伴わない）。Phase 11 で参照する evidence path: `apps/web/coverage/coverage-summary.json`、`outputs/phase-11/main.md` |
| シグネチャ | n/a（マトリクス定義 phase） |
| 入出力 | 入力: Phase 1 baseline 表 + index.md AC + Phase 5/6 で追加されたテストファイル一覧。出力: 下記マトリクス 5 表 |
| テスト方針 | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` 実行 → `apps/web/coverage/coverage-summary.json` から 13 パス分の `{statements, branches, functions, lines}.pct` を抽出し、本マトリクスに転記して PASS/FAIL 判定 |
| 実行コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage`（実測は Phase 11） |
| DoD | 5 表すべての行で「PASS 条件」「evidence path」「baseline → 目標」が埋まり、Phase 11 で空欄を実測値に置換するだけで判定が完了する状態 |

## 参照資料

- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`（apps/web lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
- Phase 1 baseline 表 / Phase 2 ケース表 / Phase 3 想定変更ファイル俯瞰

## マトリクス A — 13 モジュール × 4 メトリクス（AC: ≥85% S/L/F / ≥80% B）

evidence: `apps/web/coverage/coverage-summary.json` の各キー直下の `{statements,branches,functions,lines}.pct`。Phase 11 で実測値を「実測」列に転記する。

| # | path | Stmts baseline → 実測 / 目標 (≥85) | Branches baseline → 実測 / 目標 (≥80) | Funcs baseline → 実測 / 目標 (≥85) | Lines baseline → 実測 / 目標 (≥85) | PASS 条件 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | apps/web/src/lib/admin/server-fetch.ts | 12.5 → __ / 85 | n/a → __ / 80 | 0 → __ / 85 | 12.5 → __ / 85 | 4 metric 全て目標以上 |
| 2 | apps/web/src/lib/admin/api.ts | 17.24 → __ / 85 | n/a → __ / 80 | 0 → __ / 85 | 17.24 → __ / 85 | 同上 |
| 3 | apps/web/src/lib/admin/types.ts | 0 → __ / 85 | 0 → __ / 80 | 0 → __ / 85 | 0 → __ / 85 | 同上（型 only のため import smoke で計上） |
| 4 | apps/web/src/components/ui/Toast.tsx | 61.53 → __ / 85 | n/a → __ / 80 | 50 → __ / 85 | 61.53 → __ / 85 | 同上 |
| 5 | apps/web/src/components/ui/Modal.tsx | n/a → __ / 85 | 46.15 → __ / 80 | n/a → __ / 85 | n/a → __ / 85 | 同上 |
| 6 | apps/web/src/components/ui/Drawer.tsx | n/a → __ / 85 | 64.7 → __ / 80 | n/a → __ / 85 | n/a → __ / 85 | 同上 |
| 7 | apps/web/src/components/ui/Field.tsx | n/a → __ / 85 | 50 → __ / 80 | n/a → __ / 85 | n/a → __ / 85 | 同上 |
| 8 | apps/web/src/components/ui/Segmented.tsx | n/a → __ / 85 | n/a → __ / 80 | 50 → __ / 85 | n/a → __ / 85 | 同上 |
| 9 | apps/web/src/components/ui/Switch.tsx | n/a → __ / 85 | n/a → __ / 80 | 50 → __ / 85 | n/a → __ / 85 | 同上 |
| 10 | apps/web/src/components/ui/Search.tsx | n/a → __ / 85 | n/a → __ / 80 | 66.66 → __ / 85 | n/a → __ / 85 | 同上 |
| 11 | apps/web/src/components/ui/icons.ts | 0 → __ / 85 | 0 → __ / 80 | 0 → __ / 85 | 0 → __ / 85 | 同上（barrel／import smoke） |
| 12 | apps/web/src/components/ui/index.ts | 0 → __ / 85 | 0 → __ / 80 | 0 → __ / 85 | 0 → __ / 85 | 同上（barrel／import smoke） |
| 13 | apps/web/src/lib/url/login-state.ts | n/a → __ / 85 | 33.33 → __ / 80 | n/a → __ / 85 | n/a → __ / 85 | 同上 |

> baseline 列の「n/a」は coverage-summary.json で当該 metric の閾値違反は未記録だが branch/function 未網羅シナリオが残っている状態を示す（Phase 1 と同一定義）。Phase 11 の実測時は「実測」列に値を必ず入れ、目標未達があれば PARTIAL 扱いとし、追補テストを Phase 5/6 へ差戻す（CONST_007 単サイクル完了原則）。

### 抽出方針（diff evidence）

- evidence は `apps/web/coverage/coverage-summary.json` を `git diff` で 2026-05-01 baseline と Phase 11 実測の 2 点を比較して残す。
- Phase 11 では `jq '.["apps/web/src/lib/admin/server-fetch.ts"]'` 形式で 13 パス分を抜粋し `outputs/phase-11/main.md` に転記する。
- 全体 lines (39.39 baseline) も併記し、apps/web 全体の上昇傾向を補助 evidence とする。

## マトリクス B — admin lib contract test 4 ケース（AC: 4 ケース充足）

evidence: `apps/web/src/lib/admin/__tests__/server-fetch.test.ts` および `apps/web/src/lib/admin/__tests__/api.test.ts` の test 名 / 件数。

| ケース | 対応テスト ID | PASS 条件 |
| --- | --- | --- |
| (B1) authed fetch | `server-fetch.test.ts > "GET 時に accept/x-internal-auth/cookie ヘッダが組み立てられる"` および `"POST + body 時に content-type と JSON.stringify が送られる"` | header 3 種 + body のいずれも assert される |
| (B2) error mapping | `api.test.ts > "res.ok=false + JSON body で AdminMutationErr.error が文字列展開"` および `"非 JSON body で HTTP {status}"` | status / body 双方の error mapping ケースが green |
| (B3) type guard / mutation list | `api.test.ts > "mutation 8 種の URL/method/body"` | 8 mutation 全 path が assert される |
| (B4) network failure | `api.test.ts > "fetch throw 時に { ok:false, status:0, error }"` | network error path が green |

## マトリクス C — UI primitives 最低 3 ケース（AC: open/close, prop variant, callback invocation）

evidence: `apps/web/src/components/ui/__tests__/<Primitive>.test.tsx` の describe ブロック。

| primitive | (C1) open/close または mount/unmount | (C2) prop variant | (C3) callback invocation | PASS 条件 |
| --- | --- | --- | --- | --- |
| Toast | Provider 外 throw / 3000ms で消える | aria-live=polite で複数積み | toast(message) 呼び出し後 role=status 出現 | 3 ケース以上 green |
| Modal | open=false で null / open=true で role=dialog | aria-labelledby / focus trap forward + backward | Escape で onClose / close 時 previousFocus 復元 | 3 ケース以上 green（実際は 7 ケース） |
| Drawer | open=false / open=true | aria-labelledby="drawer-title" / focus trap | Escape で onClose / focus restore | 3 ケース以上 green |
| Field | hint なしで `<p>` 出ない | hint ありで `<p id="${id}-hint">` 出る | label[htmlFor] === id | 3 ケース以上 green |
| Segmented | role=radiogroup / option=radio | value と一致 option のみ aria-checked=true | onChange(opt.value) | 3 ケース以上 green |
| Switch | role=switch / aria-checked | disabled=true で disabled 属性 | click で onChange(!checked) | 3 ケース以上 green |
| Search | value=""でクリアボタン非表示 | value 反映 / placeholder 反映 | 入力で onChange / クリアで onChange("") | 3 ケース以上 green |

## マトリクス D — barrel import smoke（AC: 関数存在 assert）

evidence: `apps/web/src/components/ui/__tests__/icons.test.ts` および `index.test.ts`。

| 対象 | テスト ID | 検証方法 | PASS 条件 |
| --- | --- | --- | --- |
| `components/ui/icons.ts` | `icons.test.ts > "IconName list を satisfies で固定"` | `import * as Icons from "../icons"` で全 named export を `Object.keys` 確認 + 値 expression 1 行 | 全 export key が空配列でないこと |
| `components/ui/index.ts` | `index.test.ts > "barrel re-export 15 件が値として参照可能"` | `import * as UI from "../index"` で `Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills` 15 export の `typeof` を assert | 15 export 全て `function` または `object` |
| `lib/admin/types.ts` | `types.test.ts > "AdminAuditFilters 等が値として satisfies"` | 値 expression 1 行 + `satisfies` | 型 import 行が v8 coverage に計上される |

## マトリクス E — 既存 web test regression なし（AC: 既存 green 維持）

evidence: `pnpm --filter @ubm-hyogo/web test` の standard output（成功 / 失敗件数）。

| 既存テストファイル | Phase 5 後の状態 | PASS 条件 |
| --- | --- | --- |
| `apps/web/src/components/ui/__tests__/primitives.test.tsx` | 縮小（Toast/Modal/Drawer/Field/Segmented/Switch/Search describe を移譲）後も green。Chip/Avatar/Button/Input/Textarea/Select/KVList/LinkPills の describe は保持 | 全 describe green |
| `apps/web/src/lib/admin/__tests__/api.test.ts` | 既存 3 ケース（不変条件 #11 / #13 / 関数 export 一覧）を保持し新規ケースを追記 | 既存 3 + 追加全件 green |
| `apps/web/src/lib/url/login-state.test.ts` | 既存 2 ケースを保持し 4 ケース追記 | 既存 2 + 追加 4 件 green |
| その他 apps/web 既存テスト全件 | 影響なし | 全件 green |

確認手順:
1. `mise exec -- pnpm --filter @ubm-hyogo/web test` を Phase 9 / Phase 11 で実行
2. Phase 5 着手前の test 件数（baseline）を `pnpm --filter @ubm-hyogo/web test --reporter=json | jq '.numTotalTests'` で取得
3. Phase 11 後の test 件数 ≥ baseline + 追加ケース数 となること（既存ケースが消えていないことの担保）
4. 失敗件数 = 0

## PARTIAL → PASS 昇格条件

| 状態 | 条件 |
| --- | --- |
| PARTIAL | マトリクス A のいずれかの metric が目標未達、または B/C/D/E のいずれかが未充足 |
| PASS | A 13 行 × 4 metric = 52 セル全てが目標以上 / B 4 ケース全 green / C primitive 7 種 × 3 ケース以上全 green / D barrel 3 件全 green / E 既存全 green かつ件数非減少 |

## 計測コマンド（Phase 11 実行）

```bash
# coverage 実測（apps/web に閉じる）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# 既存 regression 確認
mise exec -- pnpm --filter @ubm-hyogo/web test

# evidence 抽出例
jq '.["apps/web/src/lib/admin/server-fetch.ts"]' apps/web/coverage/coverage-summary.json
```

> `pnpm -r test:coverage` や `scripts/coverage-guard.sh` は他パッケージへ波及するため本タスクの evidence には用いない（apps/web 単体に閉じる）。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- #5 public/member/admin boundary: マトリクス B は admin 文脈のみで構成
- #6 apps/web → D1 直接アクセス禁止: contract test は `globalThis.fetch` mock のみ
- 未実装 / 未実測を PASS と扱わない: 「実測」列が空欄なら PARTIAL
- placeholder と実測 evidence の分離: baseline 列と「実測」列を別管理

## サブタスク管理

- [ ] マトリクス A 13 行を Phase 1 baseline と照合確定
- [ ] マトリクス B 4 ケースの test ID を Phase 2 ケース表と照合確定
- [ ] マトリクス C 7 primitive × 3 ケース以上を確定
- [ ] マトリクス D 3 件の検証方法を確定
- [ ] マトリクス E 既存 green 維持の確認手順を確定
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- `outputs/phase-07/main.md`: マトリクス A〜E のサマリと PARTIAL→PASS 昇格条件

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%（マトリクス A）
- admin lib: contract test 4 ケース（マトリクス B）
- UI primitives: 最低 3 ケース × 7 primitive（マトリクス C）
- barrel import smoke（マトリクス D）
- 既存 web test に regression なし（マトリクス E）

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] マトリクス A〜E の 5 表が揃っている
- [ ] PARTIAL → PASS 昇格条件が明記されている
- [ ] 計測コマンドが apps/web に閉じている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ次を渡す: マトリクス C で要件化された primitive 7 種の test setup 重複箇所、admin lib mock setup（fetch / cookies / env）の重複箇所、DRY 化候補の helper 配置先案（`apps/web/src/test/helpers/admin.ts`, `ui-primitive.tsx`）。
