# Phase 10: 最終レビュー — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 10 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜9 の成果を統合し、Phase 11 手動 smoke を実行に移して良いか（GO）または前段に戻るか（NO-GO）の最終判定基準を確定する。
判定は Phase 11 実施 **直前** と **直後** の 2 回適用する。
さらに、依存ブロック先（09a staging deploy smoke / 08b Playwright E2E）への hand-off に必要な evidence と参照リンクを準備する。

参考実装は `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-10.md` を踏襲する。

---

## 1. 仕様書全体クロスチェックリスト

Phase 1〜9 の成果物が揃っており、相互参照が壊れていないことを確認する。

### 1.1 ファイル存在チェック

- [ ] `phase-01.md` 〜 `phase-13.md` がすべて存在
- [ ] `outputs/phase-01/main.md` 〜 `outputs/phase-09/main.md` がすべて存在（Phase 10〜13 は実施タイミング）
- [ ] `index.md` の 13 phases リンクがすべて生きている
- [ ] `artifacts.json` の出力 path が `outputs/phase-NN/main.md` と整合

### 1.2 内容整合チェック

- [ ] AC-1〜7（Phase 7 マトリクス）と各 Phase の参照が一致
- [ ] evidence ファイル命名（Phase 8: `local-curl.log` / `staging-curl.log` / `staging-screenshot.png` および `<route>-<env>-<timestamp>.curl.log`）が Phase 7 / Phase 11 双方で参照されている
- [ ] curl helper 切り出し先 `scripts/smoke/public-web-real-workers-d1.sh`（Phase 8 提案）が Phase 5 / Phase 11 と整合
- [ ] 静的検証 3 コマンド（Phase 9: typecheck / lint / build）が Phase 11 実施前必須として書かれている
- [ ] secret hygiene チェックリスト（Phase 9）が Phase 11 から参照されている
- [ ] 不変条件 #5 / #6 / #8 / #14 が Phase 1 / 3 / 7 / 9 で言及

### 1.3 用語・状態語彙チェック

- [ ] 「未実装」「未実測」「placeholder」「実測 evidence」の使い分けが一貫
- [ ] mock API と real Workers/D1 の境界が明確（Phase 1 / 2 / 7）

---

## 2. AC ↔ evidence ↔ approval gate 対応表

| AC | 評価対象 | evidence path | 期待値 | approval gate | 不変条件 trace |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `scripts/cf.sh` 経由で 2 回連続 fresh 起動が同一結果 | `outputs/phase-11/evidence/local-curl.log`（起動ログ部） | 2 回とも green | user 立ち会い不要、自動再現 | #14 |
| AC-2 | local 4 route family の curl 結果 | `local-curl.log` | `200 / 200 / 404 / 200`（`/`, `/members`, `/members/UNKNOWN`, `/register`） | local 完了で staging へ進める | #5, #6 |
| AC-3 | local `/members` から member id が 1 件以上取得可能 | `local-curl.log`（body section） | items.length >= 1 | seed 不足時は Phase 6 異常系へ戻し | #6 |
| AC-4 | staging 4 route family の curl 結果 | `staging-curl.log` | local と同等の status | staging URL は op 経由のみ | #5, #14 |
| AC-5 | staging で `PUBLIC_API_BASE_URL` が staging API を指している | `staging-curl.log`（vars 確認コメント） | localhost を含まない | secret hygiene 通過必須 | #5 |
| AC-6 | screenshot 1 枚（staging） | `staging-screenshot.png` | 公開 1 ルートの画面 | secret 映り込みなし | （視覚 evidence） |
| AC-7 | `apps/web` 配下に D1 直接 import なし | `local-curl.log`（rg 結果セクション） | 0 件 | 違反検出時は別 followup 起票 | #6 |

> 上記表は Phase 7 AC マトリクス（`outputs/phase-07/ac-matrix.md`）の正本と一致しなければならない。
> 不一致が検出された場合は Phase 7 を正本として更新し、本表も同期する。

---

## 3. GO / NO-GO 判定マトリクス

### 3.1 GO 条件（すべて満たすこと）

| # | 条件 | 確認手段 |
| --- | --- | --- |
| G-1 | Phase 1〜9 のすべての `phase-NN.md` が存在し、`outputs/phase-NN/main.md` も揃っている | `ls outputs/phase-{01..09}/main.md` |
| G-2 | AC-1〜7 が Phase 7 マトリクスで verify / evidence / 不変条件 / 戻し先 まで埋まっている | `outputs/phase-07/ac-matrix.md` を Read で確認 |
| G-3 | local + staging 両方が green（AC-2 / AC-4 が `200 / 200 / 404 / 200`） | `local-curl.log` / `staging-curl.log` 末尾 |
| G-4 | evidence 3 ファイル（`local-curl.log` / `staging-curl.log` / `staging-screenshot.png`）が揃っている | `ls outputs/phase-11/evidence/` |
| G-5 | secret hygiene 自動チェック（Phase 9）が 0 件 | `rg -i "(api[_-]?token\|database_id)"` |
| G-6 | 不変条件 #6 が AC-7 で 0 件確認済み | `local-curl.log` 末尾の rg 結果 |
| G-7 | `wrangler` 直接呼び出しが Phase 11 実施履歴に存在しない | shell history / runbook trace |
| G-8 | staging URL / API token / D1 id が PR description / commit message に含まれていない | Phase 13 PR template 確認時 |
| G-9 | 静的検証 3 コマンド（typecheck / lint / build）が green（コード変更があった場合のみ） | Phase 9 記録 |
| G-10 | CI workflow 影響評価が「影響なし」または「対応済み」 | Phase 9 チェックリスト |

### 3.2 NO-GO 条件（いずれか 1 つでも該当したら NO-GO）

| # | 条件 | 戻し先 |
| --- | --- | --- |
| N-1 | AC-1 が再現せず esbuild mismatch が発生 | Phase 5 runbook → Phase 6 異常系 |
| N-2 | local smoke で `/members` が空配列 + seed なし（AC-3 不成立） | Phase 6 異常系（D1 migration 確認） |
| N-3 | staging `PUBLIC_API_BASE_URL` が localhost を指している | Phase 2 設計 / Phase 5 runbook |
| N-4 | secret pattern hit が 1 件以上 | Phase 9 / Phase 11 evidence の sanitize |
| N-5 | `apps/web` 配下に D1 直接 import が存在（AC-7 違反） | **本タスク scope out**（別 followup として切り出し）／一旦 NO-GO |
| N-6 | evidence 3 ファイルのいずれかが欠損 | Phase 11 再実施 |
| N-7 | `wrangler` 直接実行の痕跡が残っている | CLAUDE.md ルール再徹底 → Phase 5 |
| N-8 | typecheck / lint / build のいずれかが fail（コード変更時） | Phase 5 runbook（実装修正） |

### 3.3 判定タイミング

| 判定回 | タイミング | 主な確認対象 |
| --- | --- | --- |
| 第 1 回 | Phase 11 着手 **直前** | G-1 / G-2 / G-9 / G-10（仕様の完備）、N-3 / N-7 / N-8（前提逸脱） |
| 第 2 回 | Phase 11 完了 **直後** | G-3〜G-8（実 evidence の検証）、N-1 / N-2 / N-4 / N-5 / N-6 |

---

## 4. レビュー観点（横串）

1. **目的整合**: 「mock では検出不能領域の smoke」という purpose に対して local + staging 両 green 以外で GO はあり得ない
2. **不変条件**: #5 が単なる文書宣言ではなく AC-7 の rg 結果として 0 件確認できているか
3. **secret hygiene**: 1Password 注入経路を逸脱していないか（`wrangler login` の OAuth トークン残存禁止）
4. **scope 維持**: AC-7 が違反した場合に「本タスクで実装修正を始めない」境界を死守（別 followup へ切り出す）
5. **evidence 形式**: 系統 A 3 ファイル固定 + 系統 B 派生命名（Phase 8）が守られているか
6. **再現性**: AC-1 の 2 回連続 fresh 起動が観測されているか
7. **静的検証**: コード変更時に typecheck / lint / build 3 コマンドを実行したか

## 5. エスカレーション基準

- N-5（D1 直接 import 検出）: 本タスクは smoke のみのため修正範囲外。別 followup 起票して GO 判定は「本 smoke の範囲では GO だが、不変条件 #6 違反検出という追加成果あり」として記録
- N-3（PUBLIC_API_BASE_URL 誤設定）: staging deploy 設定の根本問題。09a deploy gate へ即時連携
- N-4（secret hit）: evidence の即時 sanitize + git 履歴に未 push 段階で fix（push 済みの場合は別途 secret rotate 検討）
- N-8（静的検証 fail）: コード変更を伴うため、Phase 5 runbook に戻して修正後に Phase 9 → Phase 10 を再実施

---

## 6. 依存ブロック先への hand-off チェックリスト

本タスクは `09a staging deploy smoke` と `08b Playwright E2E` をブロックしている。
完了後、以下を hand-off として整える。

### 6.1 09a staging deploy smoke への hand-off

- [ ] `outputs/phase-11/evidence/staging-curl.log` の path を 09a タスク仕様書に参照リンクとして追加可能な状態にする
- [ ] AC-4 / AC-5 の判定結果を 09a の前提条件として記録（staging URL / `PUBLIC_API_BASE_URL` の値検証は 09a に委ねず、本タスクで完結）
- [ ] secret hygiene 自動チェック結果（rg 0 件）を 09a へ引き継ぐ
- [ ] 残課題（NO-GO で別 followup 化したもの）があれば 09a 実施前に解消するか、09a の前提に明記
- [ ] `staging-screenshot.png` を 09a の visual evidence の参考として参照可能にする

### 6.2 08b Playwright E2E への hand-off

- [ ] 4 route family の URL 構造（`/`, `/members`, `/members/[id]`, `/register`）が安定していることを `local-curl.log` で確認
- [ ] AC-3 で取得した seeded member id を 08b の test fixture seed として共有可能な形（id 値のみ。secret ではない）で記録
- [ ] AC-2 の期待 status（`200 / 200 / 404 / 200`）を 08b の assertion ベースラインとして提示
- [ ] real Workers/D1 経路で動作することが確認済みである旨を 08b 前提に明記（mock 前提の E2E 設計を回避）

### 6.3 06a 親タスクへの evidence link trace 更新

- [ ] 06a 親タスクの「未実測 / deferred」状態を解消したことを記録
- [ ] 親タスク側 follow-up gate の close 条件として、本タスクの `outputs/phase-11/evidence/` 配下を参照リンクで貼る

---

## 7. GO 判定書式（Phase 11 完了後に記録）

判定結果は `outputs/phase-10/main.md` の末尾に以下フォーマットで記録する。

```
判定: GO / NO-GO
判定者: <ユーザー>
判定日時: YYYY-MM-DD HH:MM JST
G 条件達成状況: G-1 ✓ / G-2 ✓ / ... / G-10 ✓
N 条件触れ: なし / N-X 該当（詳細）
静的検証: typecheck=green / lint=green / build=green （or N/A: コード変更なし）
hand-off: 09a へ参照リンク準備済み / 08b へ fixture 共有済み
追記事項: <特記>
```

---

## 8. 横断確認: Phase 1〜9 との整合

| Phase | 整合確認 |
| --- | --- |
| Phase 1 要件 | AC-1〜7 が確定し、本判定 G-2 で参照可能 |
| Phase 2 設計 | local + staging 二段網羅が GO 条件 G-3 と直結 |
| Phase 3 設計レビュー | 案 B 採用（local 省略不可）が GO 条件の前提 |
| Phase 4 テスト戦略 | curl matrix が ac-matrix.md と整合 |
| Phase 5 runbook | N-1 / N-2 / N-7 の戻し先 / curl helper 擬似形式の source of truth |
| Phase 6 異常系 | esbuild mismatch / migration 未 apply 時のリカバリ手順を保持 |
| Phase 7 AC マトリクス | G-2 の正本 |
| Phase 8 DRY 化 | evidence 系統 A 3 ファイル + 系統 B 派生命名が G-4 / N-6 の前提 |
| Phase 9 QA | 静的検証 3 コマンド・secret hygiene が G-5 / G-9 / G-10 / N-4 / N-8 / G-8 の前提 |

---

## 実行タスク

1. 仕様書全体クロスチェックリスト（§1）を Phase 11 着手前に実施する。完了条件: チェック項目が all green。
2. AC ↔ evidence ↔ approval gate 対応表（§2）を Phase 7 と整合させる。完了条件: 不一致なし。
3. GO / NO-GO 判定マトリクス（§3）を Phase 11 着手前 / 完了後の 2 回適用する。完了条件: 判定結果が `outputs/phase-10/main.md` 末尾に記録。
4. hand-off チェックリスト（§6）を依存ブロック先（09a / 08b / 06a 親）に渡す準備として埋める。完了条件: 3 系統の hand-off 項目がすべて埋まる。
5. user approval が必要な操作（PR 作成、別 followup 起票）を分離する。完了条件: 自走禁止操作が明記。

## 参照資料

- docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-10.md
- docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
- CLAUDE.md
- 本タスク phase-01〜09 / phase-11〜13

## 実行手順

- 対象 directory: docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- GO/NO-GO 判定の **記録自体** は Phase 11 実施者が行うが、判定 **基準** は本 Phase 10 で固定する。
- 第 1 回判定で GO が出ない限り Phase 11 に進まない運用を明文化する。

## 統合テスト連携

- 上流: 04a public API, 06a public web implementation, Cloudflare D1 binding
- 下流: 09a staging deploy smoke, 08b Playwright E2E
- 06a 親タスクの follow-up gate を close する evidence link trace を本 Phase で確定。

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。
- GO 条件未達成の段階で Phase 11 に進まない。

## サブタスク管理

- [ ] 仕様書全体クロスチェックリスト（§1）を埋める
- [ ] AC ↔ evidence ↔ approval gate 対応表（§2）を Phase 7 と整合
- [ ] GO / NO-GO 判定マトリクス（§3）を Phase 11 前後に適用
- [ ] hand-off チェックリスト（§6: 09a / 08b / 06a 親）を準備
- [ ] GO 判定書式（§7）テンプレートを `outputs/phase-10/main.md` に配置
- [ ] outputs/phase-10/main.md を作成する

## 成果物

- outputs/phase-10/main.md（クロスチェックリスト / AC-evidence-approval 対応表 / GO・NO-GO 判定 / hand-off チェックリスト / 判定書式 を含む）

## 完了条件

- local real Workers/D1 smoke の curl log が保存されている
- staging real Workers/D1 smoke の curl log が保存されている
- 少なくとも公開4 route family の screenshot または HTML evidence が保存されている
- mock API ではなく apps/web -> apps/api -> D1 経路であることが evidence に明記されている
- 仕様書全体クロスチェックリスト（§1）が all green
- AC ↔ evidence ↔ approval gate 対応表（§2）が Phase 7 と整合
- GO / NO-GO 判定基準（§3）が Phase 11 前後 2 回適用可能な形で記録
- 09a / 08b / 06a 親タスクへの hand-off 項目（§6）がすべて埋まる
- 第 1 回判定で GO 未達なら Phase 11 を開始しない運用が明文化
- N-5 のような scope 越境ケースで「本タスクで修正しない」境界が明示

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] §1〜§8 の全セクションが具体値で埋まっている
- [ ] GO 条件 G-1〜G-10 / NO-GO 条件 N-1〜N-8 が網羅されている
- [ ] hand-off 3 系統（09a / 08b / 06a 親）のチェック項目が記述されている
- [ ] 判定書式（§7）テンプレートが用意されている

## 次 Phase への引き渡し

Phase 11 へ、AC、blocker、evidence path（系統 A / B）、approval gate、
GO/NO-GO 判定基準（第 1 回 / 第 2 回）、hand-off 準備状況を渡す。
