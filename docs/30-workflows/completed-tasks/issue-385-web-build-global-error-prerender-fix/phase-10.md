[実装区分: 実装仕様書]

# Phase 10: 最終レビュー — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 10 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler の `await getAuth()` 経由 + `oauth-client.ts` 動的 import 化）を採る Phase 1〜9 の成果物を 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）で評価し、cross-reference 整合と review checklist を実走する。残課題を Phase 11（実測 evidence）/ Phase 12（ドキュメント更新 + skill index rebuild）/ ブロック対象 follow-up タスクへ引き渡す。本 Phase の PASS は「仕様整合 PASS」であり、実測 evidence による「build 成功 PASS」ではないことを明示する。

## review checklist（Phase 1〜9 横断）

| # | 項目 | 確認内容 | 引用 Phase | 結果（spec_revised 段階）|
| --- | --- | --- | --- | --- |
| C-1 | 真因記述の正確性 | next-auth 5.x の top-level import が Next 16 + React 19 prerender 経路で `useContext` null を引き起こすことが、`package.json` から `next-auth` 除去で再現消失する切り分け実験で確定 | 1 / index.md § 真因 | PASS |
| C-2 | Plan A 採択根拠の網羅性 | (1) lazy factory が prerender 経路から next-auth を完全隔離する構造的根拠 (2) 不採用案 5 件（version bump / serverExternalPackages / pnpm patch / global-error 削除 / upstream 修正待ち）の理由 | 2 / index.md § 解決方針 / 不採用案 | PASS |
| C-3 | AC-1〜AC-9 の test / evidence 担保 | 各 AC に build / typecheck / lint / test / grep いずれかの evidence path が紐付く | 1 / 7 / 9 / 11 | PASS |
| C-4 | export shape 互換維持 | `getAuth()` 戻り値が `handlers` / `auth` / `signIn` / `signOut` を含み、4 route handler の callsite が機能等価 | 2 / 5 / 7 / 8 | PASS（typecheck G-1 で構造的担保）|
| C-5 | 4 route handler 全変更網羅 | `app/api/auth/[...nextauth]/route.ts` / `app/api/auth/callback/email/route.ts` / `app/api/admin/[...path]/route.ts` / `app/api/me/[...path]/route.ts` の 4 ファイルすべてが Plan A 経路に変更される | index.md § 解決方針 / 5 / 8 R-1〜R-4 | PASS |
| C-6 | `oauth-client.ts` dynamic import 適用 | top-level `import { signIn } from "next-auth/react"` が関数内 `await import("next-auth/react")` に置換 | 2 / 5 / 8 DC-6 | PASS |
| C-7 | middleware / next.config / package.json 不変 | 3 ファイルへの差分ゼロ。`apps/web/middleware.ts` は `decodeAuthSessionJwt` 経由のみで next-auth import なし | index.md § 解決方針 / 1 / 9 grep | PASS |
| C-8 | 既存テスト mock 修正案の妥当性 | `vi.mock("@/src/lib/auth", () => ({ getAuth: vi.fn(async () => ({ ... })) }))` 形式で `route.test.ts` 群を統一する方針が明記 | 4 / 9 G-3 | PASS |
| C-9 | DRY 化判定の妥当性 | 4 callsite × `await getAuth()` は素朴な反復を許容（B 採用）。helper 抽象は導入しない | 8 / CLAUDE.md "3 similar lines" 原則 | PASS |
| C-10 | dead code 検出計画 | DC-1〜DC-8 grep で旧経路（直接 re-export / top-level value import / 旧 named export）の残存 0 件を検証 | 8 / 9 | PASS |
| C-11 | `getAuth()` 内部キャッシュ | module-level Promise cache により `NextAuth()` 二重実行を回避 | 8 § 内部キャッシュ方針 | PASS |
| C-12 | type-only import 境界 | value import 禁止 / `import type` 許容 / dynamic import 許容のマトリクスが明文化 | 8 § type import 整理方針 | PASS |
| C-13 | 不採用案の root-cause 文書化漏れチェック | 5 不採用案すべてに「なぜ Plan A より劣るか」が記述（patch 再生成負荷 / ESM 解決破壊 / 修正版未リリース 等） | index.md § 不採用案 | PASS |
| C-14 | lefthook / CI gate 影響 | pre-commit / pre-push hook 通過、verify-indexes / coverage gate への影響評価 | 9 § lefthook / CI gate | PASS |
| C-15 | skill index 影響 | 本タスク追加で indexes drift。Phase 12 で `pnpm indexes:rebuild` 実走を計画 | 9 § skill index 影響 | PASS |
| C-16 | manual smoke runbook 引き継ぎ | Phase 11 へ build-smoke / build-cloudflare-smoke / prerender-output-check / main の 4 evidence file が引き継がれる | 9 § Phase 11 引き渡し | PASS |

## 4 条件評価

### (1) 矛盾なし

| 観点 | 確認内容 | 結果 |
| --- | --- | --- |
| 採用方針 | Plan A = lazy factory / 不採用 5 案 | index.md と Phase 2 / 5 / 8 / 9 が一致 |
| AC ↔ evidence | AC-1〜AC-9 すべてに evidence path | index.md と Phase 7 / 9 / 11 が一致 |
| 5 ゲート | G-1〜G-5 が AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-9 を網羅 | Phase 9 表と AC ↔ evidence が一致 |
| DRY 化 | helper 不要（B 採用） | Phase 8 判定と Plan A 最小差分方針が一致 |
| approval gate | dependency bump / deploy / commit-push-PR は user 承認後 | index.md / Phase 9 で一貫 |

### (2) 漏れなし

| 観点 | 確認内容 | 結果 |
| --- | --- | --- |
| 影響ファイル | `auth.ts` / `oauth-client.ts` / 4 route handler / `middleware.ts` / `next.config.ts` / `package.json` | index.md § 解決方針で 9 種すべて判定済 |
| ゲート | typecheck / lint / test / build / build:cloudflare | Phase 9 で 5 ゲート確定 |
| evidence | build-smoke / build-cloudflare-smoke / prerender-output-check / main | Phase 11 で 4 種確定（本 Phase 引き継ぎ） |
| dead code 検出 | DC-1〜DC-8 + middleware grep | Phase 8 / 9 で 8+1 件確定 |
| ブロック対象 | P11-PRD-003 / P11-PRD-004 / wrangler env / 09a / 09c | Phase 11 / 12 follow-up に明示引き継ぎ |
| skill index | indexes rebuild 必須 | Phase 12 で `pnpm indexes:rebuild` 計画 |

### (3) 整合性

| 観点 | 確認内容 | 結果 |
| --- | --- | --- |
| 責務境界 | `apps/web` 内に閉じる（`apps/api` / D1 不変） | 不変条件 #5 PASS |
| 状態所有権 | `getAuth()` が next-auth instance を集中保持 / route handler は callsite のみ | C-4 / C-11 で構造的担保 |
| dependency | `next` / `react` / `react-dom` / `next-auth` 全て据え置き | AC-8 PASS |
| 公式 docs との整合 | Next 16 docs `global-error.js` の `"use client"` 必須要件は維持。Plan A は global-error には触らず next-auth 隔離のみ | 整合 |
| Plan A の本質と DRY 判定 | helper 抽象は次の Plan A 不変条件「prerender 経路に next-auth 経路を持ち込まない」と直交。helper を入れても本質改善はない | 整合 |

### (4) 依存関係整合

| 観点 | 確認内容 | 結果 |
| --- | --- | --- |
| 上流 | issue #385 試行履歴（pre-existing バグ確認 + 切り分け実験 7 件） | index.md § 真因 で記録済 |
| 下流（ブロック対象） | P11-PRD-003 / P11-PRD-004 / wrangler env / 09a / 09c | Phase 11 / 12 申し送りで明示 |
| Phase 間 | Phase 1 → 13 の仕様書と outputs が連続 | `index.md` / root `artifacts.json` / `outputs/artifacts.json` の同期後に cross-reference 確認済 |
| skill index | indexes rebuild が Phase 12 で実走 | Phase 12 計画 PASS |

## Phase 1〜9 cross-reference 整合確認

| 確認項目 | Phase | 引用元 |
| --- | --- | --- |
| 真因（Next 16 prerender × React 19 Dispatcher × next-auth top-level import） | 1 / index.md | § 真因 |
| Plan A = lazy factory | 2 / index.md | § 解決方針 |
| 不採用 (a) version bump / (b) serverExternalPackages / (c) pnpm patch / (d) global-error 削除 / (e) upstream 待ち | 2 / index.md | § 不採用案 |
| 設計レビュー PASS | 3 | Phase 3 outputs |
| テスト戦略（mock 修正方針） | 4 | Phase 4 outputs |
| 実装ランブック（コード差分） | 5 | Phase 5 outputs |
| 異常系検証（fail-fast / cache 失敗時挙動） | 6 | Phase 6 outputs |
| AC-1〜AC-9 evidence path | 7 / index.md | Phase 7 / index.md § AC |
| DRY 化 B 採用 + DC-1〜DC-8 | 8 | Phase 8 § 判定 / dead code 検出計画 |
| 5 ゲート手順 + lefthook + CI + coverage + skill index | 9 | Phase 9 § ゲート別詳細 / 影響評価 |

## 不変条件チェックリスト

| # | 不変条件 | 確認項目 | 結果 |
| --- | --- | --- | --- |
| #5 | D1 access boundary（`apps/api` のみで D1 アクセス） | 本タスクは `apps/web` のみ。D1 / `apps/api` 変更ゼロ | PASS |
| #14 | Cloudflare 無料枠 | 新規 KV / D1 / cron / Service Binding 追加なし。`.open-next/worker.js` サイズは Phase 11 で `ls -la` 確認 | PASS（spec 段階）|
| #16 | secret values never documented | build / test ログから secret 文字列を evidence に転記しない | PASS |
| #6 | GAS prototype を本番仕様に昇格させない | 本タスクと無関係 | N/A |
| #1〜#4 / #7 | フォーム / consent / responseEmail / admin-managed / MVP form 再回答 | 本タスクと無関係 | N/A |

## 残課題と引き渡し先

| 残課題 | 引き渡し先 | 内容 |
| --- | --- | --- |
| R-1 | Phase 11 | 5 ゲート実測（build-smoke.md / build-cloudflare-smoke.md / prerender-output-check.md / main.md）。spec 段階では `evidence: PENDING_IMPLEMENTATION_FOLLOW_UP` |
| R-2 | Phase 12 | 修正方針の implementation-guide.md（Part 1 中学生レベル「next-auth を後から読み込ませる」/ Part 2 技術詳細「lazy factory + 内部 Promise cache + 4 callsite」） |
| R-3 | Phase 12 | システム正本仕様（specs/02-auth.md）への影響なしの記録 + lazy factory パターンを lessons-learned に追加するか判定 |
| R-4 | Phase 12 | `mise exec -- pnpm indexes:rebuild` 実走 + drift 確認 + 必要差分のコミット |
| R-5 | follow-up（実装後） | P11-PRD-003 fetchPublic service-binding 経路書き換え（本 build 緑化が前提） |
| R-6 | follow-up（実装後） | P11-PRD-004 `/privacy` `/terms` ページ実装（本 build 緑化が前提） |
| R-7 | follow-up（実装後） | `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 反映（本 build 緑化が前提） |
| R-8 | 条件付き監視メモ（unassigned ではない） | G-5 のみ失敗時の `@opennextjs/cloudflare` patch upgrade 評価。実測されるまで formalize しない |
| R-9 | 長期監視メモ（unassigned ではない） | next-auth 5.x 系 / Next 16.x 系のリリースで本症状が公式 fix され lazy factory が不要になるかの追跡。公式 fix 確認まで formalize しない |

## `spec_revised` 境界

### (a) 本タスクの達成範囲（spec_revised 完了で達成）

- 真因の構造化 + 切り分け実験 7 件記録（index.md § 真因）
- Plan A 採用方針の確定（lazy factory / 不採用 5 案、Phase 2 / index.md）
- 設計レビュー PASS（Phase 3）
- テスト戦略 + mock 修正方針（Phase 4）
- 実装ランブック + コード差分（Phase 5）
- 異常系検証（Phase 6）
- AC ↔ evidence path 対応（Phase 7 / index.md）
- DRY 化 B 採用 + dead code 検出計画 DC-1〜DC-8（Phase 8）
- 5 ゲート手順 + lefthook + CI + coverage + skill index 影響（Phase 9）
- 4 条件レビュー + review checklist C-1〜C-16（本 Phase）
- Phase 11 evidence 構成 + Phase 12 ドキュメント更新 / indexes rebuild 計画

### (b) 本タスクの非達成範囲（実装着手以降）

- 実コード変更（`auth.ts` lazy factory 化 / 4 route handler / `oauth-client.ts`）
- 5 ゲート実走（G-1〜G-5）
- build-smoke / build-cloudflare-smoke / prerender-output-check の実測値
- 既存テスト mock 修正の実コミット
- `pnpm indexes:rebuild` 実走と drift コミット（Phase 12）
- ブロック対象 follow-up（R-5 / R-6 / R-7）の着手
- commit / push / PR

> **境界宣言**: 本 Phase の PASS は「仕様整合 PASS」であり、「build 成功 PASS」ではない。実測 evidence は Phase 11 / 実装後 follow-up で取得する。

## Phase 11（実測）への移行ゲート

Phase 10 PASS の上で Phase 11 へ移行する条件:

| ゲート | 条件 | 確認方法 |
| --- | --- | --- |
| MG-1 | review checklist C-1〜C-16 が全 PASS | 本 Phase の表で確認済 |
| MG-2 | 4 条件評価が全 PASS | 本 Phase § 4 条件評価 |
| MG-3 | 残課題 R-1〜R-9 が引き渡し先に分配されている | 本 Phase § 残課題と引き渡し先 |
| MG-4 | Phase 11 evidence file 4 件の構成が確定している | Phase 9 § Phase 11 引き渡し |
| MG-5 | dead code 検出 grep が Phase 9 でコピペ実行可能になっている | Phase 9 § DRY 化崩れ / dead code 検出 grep |
| MG-6 | user approval が Phase 5 着手 / Phase 12 indexes rebuild / Phase 13 PR 作成について整理されている | 本 Phase § user approval gate |

5 ゲート全てが満たされたら Phase 11（実装 + 実測 evidence 収集）へ移行可能。

## レビュー結果サマリ

| 項目 | 結果 |
| --- | --- |
| review checklist C-1〜C-16 | 全 PASS |
| 4 条件評価 | 全 PASS（矛盾なし / 漏れなし / 整合性 / 依存関係整合）|
| Phase 1〜9 cross-reference | 一貫性 PASS |
| 不変条件 #5 / #14 / #16 | 全 PASS（spec 段階）|
| 残課題 | R-1〜R-7 を Phase 11 / Phase 12 / formal follow-up に分配。R-8 / R-9 は条件付き監視メモとして分離 |
| `spec_revised` 境界 | (a) 達成 / (b) 非達成を分離 |
| Phase 11 移行ゲート MG-1〜MG-6 | 全 PASS |

## user approval gate 一覧

| # | 操作 | 承認主体 | 承認証跡 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/lib/auth.ts` / `oauth-client.ts` / 4 route handler の実コード変更 | user | Phase 5 実装着手承認 |
| 2 | 既存 test mock の `getAuth()` 形式への書き換え | user | Phase 5 実装着手承認に含む |
| 3 | `@opennextjs/cloudflare` patch upgrade 評価（G-5 のみ失敗時） | user | G-5 失敗時に user 承認 |
| 4 | `mise exec -- pnpm indexes:rebuild` の実走と drift コミット | user | Phase 12 実走時 |
| 5 | commit / push / PR 作成 | user | Phase 13 PR 作成承認 |
| 6 | staging / production deploy | user | 本タスク範囲外。下流 09a / 09c で実施 |

## 変更対象ファイル一覧

| ファイル | 本 Phase での変更 |
| --- | --- |
| 仕様書 | `outputs/phase-10/main.md` のみ追加 |
| 実装ファイル | なし |

## 関数 / コンポーネントシグネチャ

本 Phase では新規定義なし。Phase 2 / 5 / 8 / 9 で確定済の `getAuth()` シグネチャを再掲しない。

## ローカル実行コマンド

本 Phase は文書レビューのみ。実行コマンドはなし。Phase 9 / Phase 11 で実走するコマンド一覧は当該 Phase を参照。

## 実行タスク

1. review checklist C-1〜C-16 を実走する。完了条件: 16 項目すべてに引用 Phase と結果が記載される。
2. 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）で評価する。完了条件: 各条件に確認項目と結果が記載される。
3. Phase 1〜9 cross-reference 整合を確認する。完了条件: 10 件以上の引用元が phase 番号付きで列挙される。
4. 不変条件 #5 / #14 / #16 / #6 / #1〜#4 / #7 を確認する。完了条件: 全項目に PASS / N/A が付く。
5. 残課題 R-1〜R-9 を引き渡し先（Phase 11 / Phase 12 / follow-up / 監視メモ）に分配する。完了条件: すべての残課題に引き渡し先と内容が記載される。
6. `spec_revised` 境界（達成 / 非達成）を分離する。完了条件: (a) (b) 両方に項目が列挙される。
7. Phase 11 移行ゲート MG-1〜MG-6 を確定する。完了条件: 6 ゲートに条件と確認方法が記載される。
8. user approval gate を 6 件以上列挙する。完了条件: 操作・承認主体・承認証跡が表で揃う。

## 参照資料

- index.md § 真因 / 解決方針 / 不採用案 / Scope / AC
- Phase 1（要件 / AC ↔ evidence path / approval gate）
- Phase 2（採用方針 Plan A / 評価マトリクス）
- Phase 3（設計レビュー）
- Phase 4（テスト戦略）
- Phase 5（実装ランブック）
- Phase 6（異常系検証）
- Phase 7（AC マトリクス）
- Phase 8（DRY 化 B 採用 / dead code 検出計画 DC-1〜DC-8 / type import 整理方針）
- Phase 9（5 ゲート手順 / lefthook / CI / coverage / skill index 影響 / Phase 11 引き渡し）
- CLAUDE.md § 重要な不変条件 / "3 similar lines" 原則

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit、push、PR、dependency 更新を行わない
- 本 Phase の PASS を「production 実測 PASS」と誤読させない記述を outputs に残す

## 統合テスト連携

- 上流: Phase 1〜9
- 下流: Phase 11（実測 evidence contract）/ Phase 12（implementation-guide.md / indexes rebuild / close-out 記録）/ formal follow-up（R-5〜R-7）/ 条件付き監視メモ（R-8〜R-9）

## 多角的チェック観点

- 不変条件 #5 / #14 / #16 を spec 段階で構造的に確認
- CONST_004: 本タスクは実装区分=実装仕様書。本 Phase は文書レビューのみ
- CONST_005: review checklist は単一サイクル内で完結（追加サイクル不要）
- CONST_007: 本タスク内で最終レビュー → Phase 11 移行ゲート確定まで完結
- 未実装 / 未実測を PASS と扱わない: 本 Phase の PASS は仕様整合のみ
- pre-existing バグの恒久解消が責務: workaround ではなく構造的修正（lazy factory による prerender 隔離）であることを再確認
- 不採用案の root-cause 文書化漏れチェック: 5 不採用案すべてに「なぜ Plan A より劣るか」の理由が記録されていること

## DoD（Definition of Done）

- review checklist C-1〜C-16 が全 PASS で記録されている
- 4 条件評価が全 PASS で記録されている
- Phase 1〜9 cross-reference 整合が確認されている
- 不変条件 #5 / #14 / #16 が PASS で記録されている
- 残課題 R-1〜R-7 が Phase 11 / Phase 12 / formal follow-up に分配され、R-8〜R-9 が条件付き監視メモとして分離されている
- `spec_revised` 境界 (a) / (b) が分離されている
- Phase 11 移行ゲート MG-1〜MG-6 が確定している
- user approval gate が 6 件以上列挙されている
- `outputs/phase-10/main.md` が作成されている

## サブタスク管理

- [ ] review checklist C-1〜C-16 を実走した
- [ ] 4 条件評価を実施した
- [ ] Phase 1〜9 cross-reference を確認した
- [ ] 不変条件チェックリストを確認した
- [ ] 残課題 R-1〜R-9 を分配した
- [ ] `spec_revised` 境界を分離した
- [ ] Phase 11 移行ゲート MG-1〜MG-6 を確定した
- [ ] user approval gate を列挙した
- [ ] outputs/phase-10/main.md を作成した

## 完了条件

- review checklist C-1〜C-16 と 4 条件評価が全 PASS で記録されている
- 残課題が漏れなく Phase 11 / Phase 12 / formal follow-up / 条件付き監視メモに引き渡されている
- 仕様整合 PASS と実測 PASS の境界が明文化されている
- Phase 11 移行ゲートが 6 件すべて確認可能な状態になっている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値を記録していない

## 次 Phase への引き渡し

Phase 11（手動 smoke / 実測 evidence）へ次を渡す:

- review checklist C-1〜C-16 結果（全 PASS）
- 4 条件評価結果（全 PASS）
- 残課題 R-1（実測 4 ファイル）の構成
- `spec_revised` 境界（仕様整合 PASS ≠ build 成功 PASS）
- Phase 11 移行ゲート MG-1〜MG-6
- approval gate（実コード変更 / @opennextjs/cloudflare patch 評価 / indexes rebuild）

Phase 12（ドキュメント更新）へ次を渡す:

- 残課題 R-2（implementation-guide.md Part 1 / 2）
- 残課題 R-3（システム正本仕様への影響なしの記録 + lazy factory lessons-learned 判定）
- 残課題 R-4（`pnpm indexes:rebuild` 実走 + drift 確認）
- ブロック対象 follow-up（R-5 / R-6 / R-7）の unassigned-task-detection.md 候補。R-8 / R-9 は条件付き監視メモとして formalize 対象外
