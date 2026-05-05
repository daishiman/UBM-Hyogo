# Phase 8: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (リファクタリング) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

Phase 5 で実装し Phase 6 で異常系を検証した sync layer に対し、`pnpm typecheck` / `pnpm lint` / `pnpm test` / coverage / security review / 不変条件チェックを一括ゲートとして適用する。Phase 9 リファクタリングと Phase 10 ドキュメント整備に進むための「実装は仕様契約と一致し、apps/api 境界・secret hygiene・Workers 互換性を破っていない」という GO 根拠を確立する。

## 実行タスク

1. 静的解析ゲート（typecheck / lint）の実行と PASS 確認
2. 自動テストゲート（unit / integration / contract）と coverage 閾値の検証
3. security review（Sheets API token / Service Account JSON / D1 binding / `scripts/cf.sh` 経路）
4. 不変条件 #1〜#7 の機械的チェック（特に #5 / #1 を重点）
5. 無料枠 / D1 writes 上限の再確認
6. blocker / minor 仕分けと Phase 9 への引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | テスト ID と coverage 閾値 |
| 必須 | outputs/phase-05/runbook.md | 実装範囲と verify コマンド |
| 必須 | outputs/phase-06/main.md | 異常系結果（rate limit / mutex / consent） |
| 必須 | outputs/phase-07/ac-matrix.md | AC × test trace |
| 必須 | `CLAUDE.md` | 不変条件 #1〜#7 / `scripts/cf.sh` 運用ルール |
| 必須 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 writes 100K/day |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Workers / D1 binding |

## 実行手順

### ステップ 1: 静的解析ゲート

| 種別 | コマンド | 期待 | 失敗時の扱い |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | error 0（apps/api 全体） | blocker（Phase 9 前提） |
| lint | `mise exec -- pnpm lint` | error 0、warning は MINOR 化 | error は blocker |
| import boundary | `mise exec -- pnpm lint -- --rule "no-restricted-imports"` | apps/web から `apps/api/src/sync/*` 参照 0、`apps/api/src/sync/*` から `apps/web` 参照 0 | blocker（不変条件 #5） |
| Node SDK 禁止 | `git grep -nE "from ['\"]googleapis['\"]\|require\(['\"]googleapis" apps/api` | 0 件 | blocker（AC-10 / 不変条件 #6） |
| stableKey 直書き禁止 | `git grep -nE "['\"](fullName\|ubmZone\|publicConsent\|rulesConsent)['\"]" apps/api/src/sync/mapping.ts` | mapping.ts のみ許可、他ファイル 0 件 | MINOR（不変条件 #1） |

### ステップ 2: 自動テストゲートと coverage

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| unit | `mise exec -- pnpm test --filter=apps/api -- sync` | green |
| contract test | `mise exec -- pnpm test --filter=apps/api -- sync.contract` | data-contract.md mapping と差分 0 |
| integration（mutex / backoff / audit finalize） | `mise exec -- pnpm test --filter=apps/api -- sync.integration` | green、AC-5 / AC-7 / AC-12 を実証 |
| coverage 集計 | `mise exec -- pnpm test --filter=apps/api -- --coverage` | 閾値達成 |

coverage 閾値（Phase 1 §統合テスト連携 + Phase 4 test-matrix.md と一致）:

| 項目 | 閾値 | 対象 |
| --- | --- | --- |
| Line | 80%+ | `apps/api/src/sync/**` |
| Branch | 60%+ | 同上（mapping.ts と mutex.ts は 70%+ 推奨） |
| Function | 80%+ | 同上 |
| Statement | 80%+ | 同上 |
| API シナリオ正常系 | 100% | manual / scheduled / backfill |
| API シナリオ異常系 | 80%+ | rate limit / mutex / consent unknown / D1 transaction 失敗 |

未達は blocker。`audit.ts` / `mapping.ts` / `mutex.ts` は 90%+ を目標に追試する。

### ステップ 3: security review

| # | チェック | 確認方法 | 期待 |
| --- | --- | --- | --- |
| S-01 | `GOOGLE_SERVICE_ACCOUNT_JSON` の値がリポに残らない | `git grep -nE "BEGIN PRIVATE KEY\|service_account" -- ':!docs'` | 0 件 |
| S-02 | OAuth / Sheets refresh token をリポ・ログ・テストに混入させない | `git grep -nE "refresh_token\|client_secret" apps/api` | 0 件 |
| S-03 | D1 binding 名 (`DB`) を test fixture から漏らさない | fixture は in-memory D1 / mock のみ | OK |
| S-04 | `wrangler` を直接呼ばない（必ず `scripts/cf.sh` 経由） | `git grep -nE "^\s*wrangler " apps/api scripts docs/30-workflows/u-04-*` | runbook 内も `bash scripts/cf.sh` のみ |
| S-05 | Service Account JWT を Workers 内で生成しキャッシュしない | sheets-client.ts の `crypto.subtle` 経路を review、グローバル変数への保管 0 | OK |
| S-06 | audit row に PII（メール本体 / 個人情報）を書かない | `audit.ts` の columns review、`failed_reason` も汎化文言のみ | OK |
| S-07 | gitleaks scan | `mise exec -- pnpm exec gitleaks detect --no-git -s apps/api` | finding 0 |

`scripts/cf.sh` 必須運用は CLAUDE.md「Cloudflare 系 CLI 実行ルール」と整合させ、Phase 10 runbook にも転記する。

### ステップ 4: 不変条件チェック（#5 / #1 重点）

| 不変条件 | 確認手段 | 期待 | 重点度 |
| --- | --- | --- | --- |
| #1 schema コード固定回避 | `mapping.ts` 以外で stableKey 文字列が直書きされていない / `form_field_aliases` 経由で解決 | grep + unit test | ★★★ |
| #2 consent キー統一 | `git grep -nE "publicConsent\|rulesConsent" apps/api/src/sync` で他キーへの fallback 経路なし | OK | ★★ |
| #3 responseEmail = system | `mapping.ts` で Form 質問外として正規化 | unit test | ★ |
| #4 admin 列分離 | backfill が `member_status.publish_state` / `is_deleted` / `meeting_sessions` を **書かない** | integration test + ESLint custom rule（`no-admin-column-write`） | ★★ |
| #5 apps/web から D1 直接禁止 | `git grep -nE "D1Database\|env\.DB" apps/web` 0 件 / lint `no-restricted-imports` で `@cloudflare/workers-types` の D1 import を apps/web で禁止 | grep + lint | ★★★ |
| #6 GAS prototype 不昇格 / Node SDK 不使用 | `googleapis` 依存 0 / fetch + `crypto.subtle` のみ | grep + package.json review | ★★ |
| #7 Sheets を真として backfill | recovery 手順が outputs/phase-05/runbook.md に明記、test で truncate-and-reload を実証 | runbook + integration test | ★★ |

#5 / #1 は本タスク最重要不変条件。違反検知時は即 blocker。

### ステップ 5: 無料枠 / D1 writes 再確認

| 項目 | 想定（50 名 MVP） | 無料枠 | 結論 |
| --- | --- | --- | --- |
| Workers req（apps/api scheduled） | 24 invoke/day | 100,000/day | OK |
| Workers CPU time（per invoke） | < 50ms 目標、< 10ms 標準 | 10ms（free） / 50ms（paid） | 実測（Phase 5 Q2）で確認、超過時は `ctx.waitUntil` で逃がすか paid plan 検討（MINOR 起票） |
| D1 writes / day | 数百〜数千（hourly sync） | 100,000/day | OK（上限の 1〜3%） |
| D1 reads / day | 数千 | 5,000,000/day | OK |
| Cron Trigger 数 | 1 | 5/account（free） | OK |
| Sheets API read | 24 req/h × n cell | 60 req/min/user, 300/min/project | OK |

### ステップ 6: blocker / minor 仕分け

| 種別 | ID | 内容 | 影響 | 解消 Phase |
| --- | --- | --- | --- | --- |
| blocker（候補） | Q-B-01 | typecheck / lint / test いずれか red | Phase 9 進入不可 | 即修正 → 再実行 |
| blocker（候補） | Q-B-02 | coverage 閾値未達 | 同上 | unit test 追加 |
| blocker（候補） | Q-B-03 | 不変条件 #5 違反検知 | apps/web からの D1 import 等 | 即修正 |
| MINOR | Q-M-01 | warning 残存（lint） | Phase 9 で解消 | Phase 9 |
| MINOR | Q-M-02 | mapping.ts 内 cyclomatic complexity 閾値超過 | 可読性 | Phase 9 で分割 |
| MINOR | Q-M-03 | CPU time が 30ms 超 | 将来上限懸念 | Phase 12 unassigned-task |

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | warning / 複雑度の MINOR を入力としてリファクタ範囲確定 |
| Phase 10 | runbook / docs に security 運用（`scripts/cf.sh` のみ）と不変条件チェック手順を反映 |
| 下流 05b | smoke readiness の前提として本 Phase の green を要求 |
| 下流 09b | Cron 監視設計に CPU time / writes 実測値を渡す |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテストLine | 80%+ | TBD（実行時） |
| ユニットテストBranch | 60%+ | TBD |
| ユニットテストFunction | 80%+ | TBD |
| 結合テストAPI | 100% | TBD |
| 結合テストシナリオ正常系 | 100% | TBD |
| 結合テストシナリオ異常系 | 80%+ | TBD |
| typecheck | error 0 | TBD |
| lint | error 0 | TBD |
| security review | 全項目 OK | TBD |

## 多角的チェック観点

- 不変条件 #1: stableKey 直書きを mapping.ts 以外で禁止し grep 0 件を必須ゲート化
- 不変条件 #2: consent enum (`consented` / `declined` / `unknown`) のみ受理、他値は `unknown` フォールバック
- 不変条件 #3: `responseEmail` が system field として小文字正規化されているか unit test で証明
- 不変条件 #4: backfill の admin 列 untouched を integration test で実証（D1 row diff で確認）
- 不変条件 #5: lint `no-restricted-imports` + grep の二重ゲートで apps/web → D1 を遮断
- 不変条件 #6: `package.json` に `googleapis` が無いことを CI で確認
- 不変条件 #7: recovery 手順（Sheets を真として再 backfill）が runbook と test の双方に存在
- secret hygiene: S-01〜S-07 全件 PASS、`scripts/cf.sh` 必須運用を runbook に反映
- DI 境界: `AuditDeps` / `SheetsClientDeps` を mock 化した unit test で coverage を稼ぐ

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 静的解析ゲート | 8 | pending | typecheck / lint / import boundary / Node SDK 禁止 / stableKey 直書き |
| 2 | 自動テストゲートと coverage | 8 | pending | unit / contract / integration / coverage 閾値 |
| 3 | security review | 8 | pending | S-01〜S-07 |
| 4 | 不変条件チェック | 8 | pending | #1〜#7（#5 / #1 重点） |
| 5 | 無料枠 / writes 再確認 | 8 | pending | 6 項目 |
| 6 | blocker / minor 仕分け | 8 | pending | Q-B-01〜03 / Q-M-01〜03 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 品質ゲート結果 + security review + 不変条件チェック |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] typecheck / lint / unit / contract / integration の全てが PASS
- [ ] coverage 閾値（Line 80% / Branch 60% / Function 80%）達成
- [ ] security review S-01〜S-07 すべて OK
- [ ] 不変条件 #1〜#7 のチェック結果が表化されている（#5 / #1 は重点 PASS）
- [ ] 無料枠 / D1 writes 見積もりが上限内
- [ ] blocker / minor が Phase 9 / 10 / 12 に引き継ぎ済み
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-08/main.md 配置
- typecheck / lint / test の実行ログを `outputs/phase-08/` 配下にエビデンスとして保管
- 不変条件 #5 / #1 が PASS であることを明記
- `scripts/cf.sh` 経由運用が confirmed であることを明記
- 次 Phase へ MINOR（Q-M-01〜03）と TECH-M-01〜04（Phase 3 起票）の解消ポイントを引き継ぎ
- artifacts.json の phase 8 を completed に更新

## 次 Phase

- 次: 9 (リファクタリング)
- 引き継ぎ事項:
  - lint warning / cyclomatic complexity 超過箇所を Phase 9 入力に
  - TECH-M-01（mutex race）/ TECH-M-02（同秒取りこぼし）/ TECH-M-03（running 漏れ）/ TECH-M-04（shared 化判断）の解消可否確認
  - security review で挙がった `scripts/cf.sh` 必須事項を Phase 10 docs に転記
- ブロック条件: typecheck / lint / test いずれか red、coverage 未達、不変条件 #5 / #1 違反、security finding 残存のいずれかが残るなら進まない

## NO-GO 条件（Phase 9 進入阻止）

| 条件 | 影響 |
| --- | --- |
| typecheck error 残存 | 型契約破綻 |
| lint error 残存 | 命名 / boundary 規約破綻 |
| unit / integration / contract いずれか red | AC 充足不能 |
| coverage 閾値未達 | テスト品質保証不能 |
| 不変条件 #5 違反（apps/web → D1 直接 import） | アーキ境界破綻 |
| 不変条件 #1 違反（stableKey 直書きの拡散） | schema 改訂耐性喪失 |
| security review S-01 / S-02 / S-04 いずれか fail | 機密漏洩リスク |
