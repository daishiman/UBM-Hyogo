# Phase 10: 最終レビュー — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 1-9 成果物の整合・不変条件・approval gate を最終固定し、Phase 11 (実測) / Phase 12 (ドキュメント) / Phase 13 (PR) へ引き渡すフェーズ。テスト追加実装が後続するため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 10 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Phase 1-9 で確定したテスト設計・実装計画・AC マトリクスの整合最終確認を行い、Phase 11 で実測 evidence を取りに行く前の凍結フェーズであるため。 |

## 目的

Phase 1-9 成果物の整合性チェックを行い、AC（Stmts/Lines/Funcs ≥85% / Branches ≥80%）と Phase 5/6 の実装計画、Phase 7 AC マトリクス、不変条件 #5/#6/#11/#13、approval gate、skill 適合性が一貫していることを最終確認する。残存 blocker / 追加 user approval 必要事項を列挙する。

## 一貫性チェックリスト

### 1. 設計 (Phase 2/3) ⇔ 実装計画 (Phase 5)

| 観点 | チェック内容 |
| --- | --- |
| 対象 13 モジュール | Phase 2 ケース表の 13 モジュールが Phase 5 ランブックの作成順序に全件含まれていること |
| mock 戦略 | Phase 2 mock 表（`next/headers` / `globalThis.fetch` / `vi.stubEnv` / `crypto.randomUUID` / fake timer / `historyImpl`）が Phase 5 の各テストファイル雛形に反映されていること |
| 重複排除 | Phase 2/3 で確定した primitives.test.tsx 縮小方針が Phase 5 の編集対象に明記されていること |
| production code 改変 0 件 | Phase 5 の「変更対象ファイル」一覧に `apps/web/src/**/*.{ts,tsx}`（テスト除く）が一切含まれていないこと |
| `vitest.config.ts` 不改変 | Phase 5 の編集対象に `vitest.config.ts` が含まれていないこと |

### 2. AC マトリクス (Phase 7) ⇔ 実装計画 (Phase 5/6)

| AC 項目 | 実装計画上の対応 | チェック |
| --- | --- | --- |
| 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80% | Phase 5 の 11 新規 + 2 既存拡張ファイル | Phase 7 マトリクスの全行に Phase 5 のファイル ID が紐付いていること |
| admin lib contract test 4 ケース | server-fetch.test.ts (7 ケース) + api.test.ts 拡張 (8 ケース) | authed fetch / error mapping / type guard / network failure の 4 種別が網羅されていること |
| UI primitives 3 ケース最低 | Toast/Modal/Drawer/Field/Segmented/Switch/Search 各テスト | open/close（mount/unmount）/ prop variant / callback invocation を全て満たすこと |
| barrel import smoke | icons.test.ts / index.test.ts | export 群の存在 assert が Phase 5/6 で具体化されていること |
| 既存 web test に regression なし | Phase 9 品質保証で `pnpm vitest run` 全件 PASS | Phase 9 の DoD に「全件 PASS」が含まれていること |

### 3. 異常系 (Phase 6) ⇔ ケース表 (Phase 2)

| 異常系入力 | Phase 2 ケース | チェック |
| --- | --- | --- |
| `res.ok=false` + JSON error body | server-fetch case 6 / api.test 拡張 case 4 | エラーメッセージ展開が両方で検証されること |
| `res.ok=false` + 非 JSON body | api.test 拡張 case 5 | `HTTP ${status}` fallback が固定されていること |
| `fetch` network 例外 | api.test 拡張 case 6 | `{ ok:false, status:0 }` 返却が固定されていること |
| SSR `window` 未定義 | login-state case 3 | `vi.stubGlobal("window", undefined)` で no-op |
| useToast Provider 外利用 | Toast case 1 | throw が assert されること |
| focusable 0 件 Modal | Modal case 6 | `preventDefault` 呼び出し assert |

### 4. 不変条件最終確認

| 不変条件 | 最終確認項目 |
| --- | --- |
| #5 public/member/admin boundary | admin lib テスト内で member 文脈の cookie / header / endpoint が混在しないこと。`/api/admin/...` パス以外を扱う mutation テストが存在しないこと |
| #6 apps/web → D1 直接アクセス禁止 | テストファイル全 13 件で `@cloudflare/workers-types` / D1 binding / Hono backend を import していないこと。`server-fetch.test.ts` は `globalThis.fetch` mock のみ |
| #11 profile 本文編集 mutation 不在 | api.test.ts 既存 1 ケースが保持され、新規ケースで `profileBody` を扱わないこと |
| #13 tag 直接更新 mutation 不在 | `resolveTagQueue` のみ mutation テストに含まれること |

### 5. skill 整合

| skill | 整合確認 |
| --- | --- |
| task-specification-creator | 13 phase 全件が CONST_005 必須項目（変更対象 / シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD）を埋めていること。Phase 12 が中学生レベル概念説明セクションを含む計画になっていること |
| aiworkflow-requirements | テスト配置（`apps/web/src/**/__tests__/*.test.{ts,tsx}`）/ vitest 環境（jsdom）/ coverage provider (v8) / coverage exclude 不変更が遵守されていること |

## approval gate / 自走禁止操作（最終）

| 操作 | 自走可否 | 備考 |
| --- | --- | --- |
| テストファイル新規追加 11 件・既存拡張 2 件 | 自走可 | Phase 5 ランブック準拠。production code 不改変が前提 |
| `apps/web/src/**` の production code 改変 | 要 user approval | scope out。AC 達成不可と判明した場合のみ起票検討 |
| `vitest.config.ts` の include / exclude / threshold 編集 | 要 user approval | coverage 数値操作とみなされるため |
| `apps/web/src/components/ui/__tests__/primitives.test.tsx` の縮小 | 要 user approval | 既存テスト削除を伴うため、移植先で同等以上のケース数を担保したことを Phase 9 で確認後に user approval |
| commit / push / PR 作成 | 要 user approval | Phase 13 で diff-to-pr フロー時のみ |
| Cloudflare deploy / wrangler 系 | 禁止 | scope out |

## 残存 blocker / リスク（凍結時点）

| 項目 | 状態 | 対応 |
| --- | --- | --- |
| jsdom 環境での `crypto.randomUUID` | 緩和済 (Phase 3) | `vi.stubGlobal` / `vi.spyOn` で確実に固定 |
| Modal/Drawer focus trap flakiness | 緩和済 (Phase 3) | `previousFocus` を render 前に append し unmount 後に assert |
| `types.ts` / `icons.ts` 型 only | 緩和済 (Phase 2) | `satisfies` で値 expression を 1 行入れる |
| `INTERNAL_AUTH_SECRET` 実値混入 | 緩和済 (Phase 3) | `vi.stubEnv` でダミー固定。実値・op:// 参照を test fixture に書かない |
| 並列 Phase 4-9 成果物との整合 | 推定整合 | Phase 11 実測時に Phase 7 AC マトリクス・Phase 9 品質ゲート結果と再突合 |

## 参照資料

- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`（lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
- `vitest.config.ts`
- `.claude/commands/ai/diff-to-pr.md`
- skill: `task-specification-creator`, `aiworkflow-requirements`

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/`
- 本フェーズはレビュー記述のみ。ファイル新規作成・production code 変更・deploy・commit・push・PR は行わない。
- Phase 11 で実測 evidence を採取し、AC 未達の場合は Phase 5 へ回帰する（Phase 11 で rollback ループ手順を定義）。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 / #11 / #13 適合
- 未実装 / 未実測を PASS と扱わない（実測 evidence は Phase 11）
- placeholder（baseline 表）と実測値を分離する
- Phase 1-9 成果物に矛盾がない（CONST_005 全項目充足）
- skill (task-specification-creator / aiworkflow-requirements) 規約逸脱なし

## サブタスク管理

- [ ] 一貫性チェックリスト 5 ブロックを通読し未充足を洗い出す
- [ ] approval gate / 自走禁止操作の最終表を確定する
- [ ] 残存 blocker / リスクを記録する
- [ ] outputs/phase-10/main.md を作成する

## 成果物

- `outputs/phase-10/main.md`: 最終レビュー結論と blocker サマリ

## 完了条件

- Phase 1-9 成果物の整合チェック結果が記録されている
- AC ⇔ Phase 5/6 実装計画の相互参照表が確定している
- 不変条件 #5 / #6 / #11 / #13 適合が再確認されている
- approval gate / 自走禁止操作の最終表が確定している
- 残存 blocker と緩和済リスクが分離されている

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] 5 ブロックの一貫性チェックリストが完備
- [ ] approval gate が表で整理されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ次を渡す: 確定した AC マトリクス（Stmts/Lines/Funcs ≥85% / Branches ≥80% / contract test 4 ケース / UI 3 ケース / barrel smoke / regression 0）、approval gate 最終表、残存 blocker 表、evidence 配置先（`outputs/phase-11/coverage-before.json` / `coverage-after.json` / `coverage-diff.md` / `manual-smoke-log.md` / `link-checklist.md`）、AC 未達時の Phase 5 回帰条件。
