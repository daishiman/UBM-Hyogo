# Phase 9: 品質保証 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 9 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

本タスクは smoke 中心で実装ファイル変更を伴わないが、`scripts/cf.sh` 経由で 1Password 注入された secret
（`CLOUDFLARE_API_TOKEN` 等）を扱うため、品質保証は以下 4 軸で担保する。

1. **静的検証（typecheck / lint / build）**: コード差分が発生した場合に CI gate と一致した検証を行う
2. **secret hygiene**: staging URL / D1 database id / API token の漏洩防止
3. **free-tier 影響**: D1 reads / Workers requests が無料枠を逸脱しないこと
4. **非対象領域の明示**: a11y / VR / E2E / contract test は scope out として宣言する

参考実装は `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-09.md` を踏襲しつつ、
本タスクでは **静的検証コマンドの必須化** と **CI workflow への影響評価** を追加する。

---

## QA 観点 1: 静的検証コマンドの必須化（最優先）

### 必須実行コマンド（CLAUDE.md「よく使うコマンド」と整合）

実装・evidence 取得時にコード変更が発生した場合は、Phase 11 実施前に以下の **3 コマンドを必ず順に実行** する。
本タスクは仕様書作成 task のため、これらは Phase 11 実施者向けの runbook として記録する。

```bash
mise exec -- pnpm typecheck    # 型チェック（必須）
mise exec -- pnpm lint         # ESLint / Biome（必須）
mise exec -- pnpm build        # 本番 build 通過確認（必須）
```

### 各コマンドの位置づけ

| コマンド | 目的 | 失敗時の戻し先 |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | TS 型整合性確認。`apps/web` ↔ `apps/api` 経路の型契約を担保 | Phase 5 runbook（実装修正） |
| `mise exec -- pnpm lint` | コーディング規約 / unused import / a11y lint 違反検出 | Phase 5 runbook |
| `mise exec -- pnpm build` | `@opennextjs/cloudflare` adapter による Workers build を通過確認。dev では出ない型エラー / SSR エラーを検知 | Phase 5 runbook + Phase 6 異常系 |

### コード変更を伴う場合の追加要件

本 smoke 実施で **コード変更が発生したとき** は、以下を `outputs/phase-09/main.md` に記録する。

#### 変更ファイル一覧（テンプレート）

```
| 変更ファイル | 変更種別 | 理由 | 影響範囲 |
| --- | --- | --- | --- |
| apps/web/... | modify | <理由> | <影響> |
| apps/api/... | modify | <理由> | <影響> |
| scripts/smoke/public-web-real-workers-d1.sh | add (任意) | curl helper 切り出し（Phase 8） | smoke 専用、prod 経路には影響なし |
```

> 仕様書の段階では空テンプレートで OK。Phase 11 実施者が確定値を埋める。

#### test plan（テンプレート）

```
- [ ] `mise exec -- pnpm typecheck` が green
- [ ] `mise exec -- pnpm lint` が green
- [ ] `mise exec -- pnpm build` が green
- [ ] 変更ファイルが test 対象に含まれる場合、関連 vitest が green
- [ ] 変更ファイルが `apps/web` 配下のとき、AC-7（D1 直接 import 0 件）が再確認されている
- [ ] 変更ファイルが `apps/api` 配下のとき、04a contract 担保が壊れていない
```

> コード変更が **発生しない smoke のみ** の場合は、この test plan は適用不要。
> `outputs/phase-09/main.md` には「コード変更なし」と明記する。

---

## QA 観点 2: CI workflow への影響評価

### 評価対象

| workflow | path | 評価結果（仕様書段階） |
| --- | --- | --- |
| typecheck / lint / build CI | `.github/workflows/ci.yml`（または相当） | コード変更がない smoke のみ実施なら影響なし。コード変更時は CI が当該コマンドを実行するため整合 |
| verify-indexes | `.github/workflows/verify-indexes.yml` | `.claude/skills/aiworkflow-requirements/indexes` を変更しない限り影響なし |
| deploy / staging | 09a 関連 workflow | 本タスクは deploy しないため影響なし |

### 影響評価チェックリスト（Phase 11 実施者向け）

- [ ] 本 smoke で `.github/workflows/` 配下を変更したか？ → No であることを確認
- [ ] 本 smoke で `package.json` / `pnpm-lock.yaml` を変更したか？ → 変更時は CI install ステップに影響するため要レビュー
- [ ] 本 smoke で `.claude/skills/**/indexes/` を変更したか？ → No であることを確認
- [ ] CI が要求する secret（`CLOUDFLARE_API_TOKEN` 等）の名前を変更していないか？

### CI と手動 smoke の責務分担

| 検証種別 | 実施場所 | 本タスクでの位置づけ |
| --- | --- | --- |
| typecheck / lint / build | CI（自動） + 手動（Phase 9 必須） | 二重で担保 |
| 4 route family curl smoke | 手動（Phase 11） | CI には組み込まない（free-tier 配慮 + staging URL secret 配慮） |
| Playwright E2E | CI（08b で実装） | 本タスク scope out |
| staging deploy smoke | 09a 別タスク | 本タスク scope out |

---

## QA 観点 3: secret hygiene（重要）

### 出してはいけない値

| 種別 | 値の場所 | 漏洩リスク |
| --- | --- | --- |
| API Token | `op://...` 経由で env injection | log redirect / `printenv` 出力 |
| Account ID | `wrangler.toml` / op | wrangler dump 出力 |
| D1 Database ID | `wrangler.toml` の `database_id` | `d1 list` / `d1 info` 出力 |
| OAuth tokens | `~/.wrangler/config/default.toml`（CLAUDE.md で禁止済み） | wrangler 直接実行による副作用 |
| staging Worker の独自 subdomain | `*.workers.dev` | curl 結果 log への混入 |

### 漏洩防止チェックリスト

- [ ] `local-curl.log` / `staging-curl.log` を保存する前に `grep -E "(token|TOKEN|secret|SECRET|database_id)"` で空ヒット確認
- [ ] D1 database id を含むコマンド出力（`d1 list` 等）を **log に直接 redirect しない**。必要時は database 名のみ抽出して記録
- [ ] staging URL は `evidence` log の中で 1 度だけ出現させる（curl の URL に含まれる範囲は許容）。それ以外の本文では「staging URL」と一般化記述する
- [ ] PR description / commit message に staging URL / D1 id を貼らない
- [ ] スクリーンショット `staging-screenshot.png` 内に Cloudflare ダッシュボードの API token UI / account ID が映り込んでいないことを目視で確認
- [ ] `wrangler` を直接呼び出していないことを Phase 11 実施前にコマンド履歴で確認（CLAUDE.md ルール）

### 自動チェック（手動 smoke 後の最終ゲート）

```bash
# Phase 11 実施直前ゲート
rg -i "(api[_-]?token|database_id|cloudflare_api_token)" outputs/phase-11/evidence/
# 期待: 0 件
```

---

## QA 観点 4: free-tier 影響

| 項目 | 評価 |
| --- | --- |
| D1 read rows | 4 route family / 5 smoke cases × 2 環境 で `/members` を叩く程度のため、無料枠（25M reads/day）に対し誤差レベル |
| Workers requests | smoke 数回 / staging のみ。無料枠（100k/day）に対し影響なし |
| D1 write | 本タスクでは write を行わない（seed は前提条件） |
| 課金ガード | smoke を CI で繰り返し実行する設計にしない（手動 smoke gate のみ） |

結論: **free-tier 逸脱リスクなし**。

---

## QA 観点 5: 非対象領域（明示）

| 領域 | 対象外理由 |
| --- | --- |
| a11y 検証（axe / Lighthouse） | 06a 親タスクの責務、本 followup は smoke 経路の確認のみ |
| visual regression | 同上、screenshot は 1 枚のみで evidence 用途に限定 |
| 04a API contract（zod schema 等） | scope out、04a 親タスクで担保済み前提 |
| Playwright E2E | 08b の責務 |
| パフォーマンス計測 | smoke 範囲外（応答 status のみ確認） |

---

## QA 観点 6: 再現性 / 冪等性

- `scripts/cf.sh` 経由起動は 2 回連続 fresh で同一結果（AC-1）
- D1 binding seed の差分による `/members` 件数の揺らぎは AC-3 で「1 件以上」と緩く設定し冪等性を担保
- staging への副作用なし（read-only smoke）

---

## QA 観点 7: 不変条件 trace 再確認

| # | QA での担保 |
| --- | --- |
| #5 | AC-7 の `rg` 0 件 + 経路自体の 3 層分離 |
| #6 | smoke ルートに GAS endpoint を含めない |
| #14 | free-tier 影響評価（観点 4） |

---

## レビュー結論

- 静的検証 3 コマンド（typecheck / lint / build）を Phase 11 実施前必須に格上げ
- secret hygiene チェックリストを Phase 11 実施前 / 実施後の 2 回適用
- CI workflow への影響は「コード変更を伴わない smoke のみなら影響なし」
- free-tier 影響なし
- a11y / VR / contract / E2E は明示的に scope out として記録
- 自動チェック（rg による secret pattern 検出）を最終ゲートに採用

---

## 実行タスク

1. 静的検証 3 コマンドを Phase 11 runbook と整合させる。完了条件: 3 コマンドが必須として `outputs/phase-09/main.md` に記録。
2. CI workflow 影響評価を行う。完了条件: 影響評価チェックリストが空ヒットで埋まる、または影響項目が記録される。
3. secret hygiene チェックリストを Phase 11 へリンクする。完了条件: チェックリスト 6 項目が `outputs/phase-09/main.md` に転記される。
4. free-tier / 非対象領域 / 不変条件 trace を再確認する。完了条件: 観点 4〜7 がすべて埋まる。
5. コード変更が伴う場合の変更ファイル一覧 / test plan テンプレートを記録する。完了条件: テンプレートが `outputs/phase-09/main.md` に存在する。

## 参照資料

- docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/phase-09.md
- docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
- CLAUDE.md（よく使うコマンド / secret 管理 / `scripts/cf.sh`）
- `.github/workflows/`

## 実行手順

- 対象 directory: docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 静的検証 3 コマンドの実行自体も Phase 11 実施者の責務であり、本仕様書作成では実行しない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 04a public API, 06a public web implementation, Cloudflare D1 binding
- 下流: 09a staging deploy smoke, 08b Playwright E2E
- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。
- typecheck / lint / build を bypass しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] 静的検証 3 コマンドを必須として記録する
- [ ] CI workflow 影響評価チェックリストを埋める
- [ ] secret hygiene チェックリスト 6 項目を転記する
- [ ] free-tier / 非対象領域 / 不変条件 trace を埋める
- [ ] コード変更時の変更ファイル一覧 / test plan テンプレートを記録する
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md（静的検証 / CI 影響 / secret hygiene / free-tier / scope out / 変更ファイル & test plan テンプレートを含む）

## 完了条件

- local real Workers/D1 smoke の curl log が保存されている
- staging real Workers/D1 smoke の curl log が保存されている
- 少なくとも公開4 route family の screenshot または HTML evidence が保存されている
- mock API ではなく apps/web -> apps/api -> D1 経路であることが evidence に明記されている
- `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` の 3 コマンドが Phase 11 実施前必須として記録されている
- CI workflow への影響評価が完了している（影響なし／影響あり項目を明示）
- secret hygiene 自動チェック（rg）が 0 件で通る前提が記録されている
- 非対象領域 5 項目が明示されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] 静的検証 3 コマンド（typecheck / lint / build）が必須として明記されている
- [ ] CI workflow 影響評価チェックリストが用意されている
- [ ] コード変更時の変更ファイル一覧 / test plan テンプレートが用意されている
- [ ] secret hygiene 6 項目が転記されている

## 次 Phase への引き渡し

Phase 10 へ、AC、blocker、evidence path、approval gate、静的検証 3 コマンドの実行結果（実施時）、
CI 影響評価結果、secret hygiene チェック結果を渡す。
