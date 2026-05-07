# Phase 10: 最終レビュー — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 9 の品質ゲート結果と、Phase 5-8 で確定した実装差分（manifest schema 拡張・diagnostics 構造化ログ・contract test・CI gate・retirement 条件 spec 反映）を、不変条件 / 後方互換 / future-proof / operability の 4 観点で self-review し、Phase 11 evidence 取得の GO/NO-GO を判定する。実コード成果物のレビュー判定であり commit 直前 gate のため CONST_004 区分で実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| phase | 10 / 13 |
| 目的 | 不変条件 / 後方互換 / retirement operability / contract test future-proof を self-review し GO/NO-GO 判定 |
| 依存 phase | 9（品質保証 GREEN） |
| 成果物 | `outputs/phase-10/main.md` |
| user_approval_required | false |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 9 の機械的品質ゲート（typecheck / lint / test / verify / determinism / coverage）通過後に、機械検証だけでは漏れる「設計意図の保持」「不変条件抵触の有無」「将来 03a 完成時の retirement 経路」「manifest schema 後方互換」を reviewer 観点で self-review し、Phase 11 evidence 取得・Phase 12 ドキュメント更新・Phase 13 PR 作成可否を確定する。

> **reviewer scope**: solo dev のため必須レビュアー数 0（CLAUDE.md「solo 運用ポリシー」）。本 Phase は **self-review チェックリスト**として機能し、Claude Code 自身が機械的に判定する。

## 実行タスク

- 不変条件、後方互換、retirement operability、future-proof 性を self-review する
- blocker を hard / soft / note に仕分けし、GO / NO-GO を判定する
- Phase 11 evidence 取得に渡す記録を保存する

## reviewer self-review チェックリスト

### A. 不変条件遵守

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| A1 | 不変条件 #1（実フォーム schema をコードに固定しすぎない） | `metadata.ts` / `builder.ts` の diff レビュー、追加された hardcoded schema 行を grep | manifest 経由以外の section/field 定義をコードに増やしていない |
| A2 | 不変条件 #5（apps/api に D1 直接アクセスを閉じる / apps/web から D1 直アクセス禁止） | `git diff main...HEAD --name-only` で apps/web 配下に diagnostics import が混入していないか確認 | apps/web 側 0 件 |
| A3 | 不変条件 #14（Cloudflare free-tier） | 追加された Workers ランタイム呼び出しは `logWarn` 1 経路のみ。requests / D1 reads が増えていない | logWarn 追加のみ・新規 D1 query 0 件 |
| A4 | 本タスク固有 #1: 03a 本体実装の混入禁止 | `alias-queue-adapter.contract.test.ts` が `vi.fn()` ベース fake のみで構成され、D1 binding / fetch を import していない | grep で `D1Database` / `fetch(` import 0 件 |
| A5 | 本タスク固有 #2: 決定論性 | `regenerate-static-manifest.mjs` 内に `Date.now()` / `Math.random()` / `crypto.randomUUID()` 等の非決定 source 不在 | grep 0 hit |
| A6 | 本タスク固有 #3: redaction 不要性 | manifest と diagnostics ログが PII を含まないことを目視確認（schema label / stableKey のみ） | PII source 0 件 |

### B. 後方互換性（manifest schema 拡張）

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| B1 | 既存 manifest 読み込み側（`metadata.ts`）が `sourceSpecHash` 不在時にも壊れない | `metadata.ts` の manifest load 部に `sourceSpecHash` 必須 assertion を入れていない（optional 読み込み） | optional 読み込みで GREEN |
| B2 | 既存フィールド（`generatedAt` / `regenerateCommand` / `retirementCondition`）が維持されている | `git diff` で削除フィールドなし | 削除 0 件 |
| B3 | manifest JSON のキー順序が安定（行差分が最小） | `regenerate-static-manifest.mjs` がキー順を固定している（alphabetical or 設計確定順） | キー順固定 |
| B4 | 旧読み込み経路の test がそのまま GREEN | `metadata.test.ts` の既存ケースに変更なし | 既存ケース無改変で PASS |

### C. retirement 条件の operability

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| C1 | `docs/00-getting-started-manual/specs/01-api-schema.md` に retirement 条件が追記されている | grep で "retirement" / "static manifest" 該当節を確認 | 1 節以上存在 |
| C2 | retirement の発火条件が機械的に判定可能な記述になっている | 「03a alias queue adapter が D1-backed 実装に差し替わった時」のような明確な trigger 記述 | trigger 1 文以上で明示 |
| C3 | retirement 実行手順（manifest 削除 + verify gate 撤去 + contract test 実装側差し替え）が記述されている | spec 内に手順リスト存在 | 手順 3 ステップ以上 |
| C4 | retirement 後の責務移譲先（D1 `schema_questions` populate 経路）が `08-free-database.md` 参照リンクで示される | `08-free-database.md` への相互参照あり | リンク存在 |

### D. contract test future-proof 性

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| D1 | `AliasQueueAdapter` interface が public export されている | `apps/api/src/repository/_shared/` 内に interface 定義 + index 経由 export | export 確認 |
| D2 | contract test が dryRun success / failure / unknownStableKey transit / 未注入 の 4 ケースを最低カバー | test ファイル内 `it(...)` 件数を grep | 3 件以上（最低）/ 4 件推奨 |
| D3 | fake adapter は in-memory のみで `D1Database` モック / `fetch` モックを使わない | test ファイル grep | 直接 D1/fetch 0 件 |
| D4 | 03a 完成後に test を変更せず実装側だけ差し替え可能（test が interface 契約のみに依存している） | テスト assertion が interface signature に閉じている（D1 row shape 等の実装内部詳細に依存していない） | implementation detail 依存 0 件 |

### E. Phase 9 品質ゲート結果との整合

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| E1 | Q1-Q6 / Q8 / Q9 / Q11 / Q12 の hard ゲートがすべて PASS | `outputs/phase-09/main.md` の表 | 該当 cell 全 PASS |
| E2 | Q7 coverage の SOFT-PASS 理由が妥当（テスト追加で改善可能なら本 Phase で起票） | `outputs/phase-09/main.md` の理由列 | 妥当性 OK |
| E3 | Q10 depcruise の境界違反 0 | 同上 | 違反 0 |

### F. governance / naming

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| F1 | branch / PR タイトル命名規約 | branch 名が `feat/issue-373-` 系で始まる、PR タイトル < 70 字 | 規約一致 |
| F2 | CODEOWNERS governance path 維持 | `.github/CODEOWNERS` の `apps/api/**` / `.github/workflows/**` owner 表記が変わっていない | 維持 |
| F3 | branch protection drift 0 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` | drift 0 |

## レビュー実施手順

### Step 1: self-review（1 周目）

1. Phase 9 `outputs/phase-09/main.md` の Q1-Q12 判定結果を確認
2. 本 Phase の A1〜F3 を順に PASS / FAIL / N/A 判定
3. PASS の根拠は `git diff` 範囲 / 該当ファイル行番号 / grep 結果で明示
4. FAIL は blocker として一覧化

### Step 2: blocker 仕分け

| blocker 種別 | 分岐先 |
| --- | --- |
| 不変条件抵触（A 系列） | Phase 5 実装ランブックに戻して修正 |
| 後方互換違反（B 系列） | manifest schema 拡張方法を見直し（optional 化など） |
| retirement spec 不備（C 系列） | Phase 12 ドキュメント更新で扱うのではなく本 Phase で `01-api-schema.md` を直接補強 |
| contract test future-proof 違反（D 系列） | Phase 5 の test 設計に戻し、implementation detail 依存を除去 |
| Phase 9 結果との不整合（E 系列） | Phase 9 に戻して再実行 |
| governance（F 系列） | branch / PR title 命名見直し、CODEOWNERS 復元 |

CONST_007: 「Phase 11 で対応」「Phase 12 で記録」型の先送り禁止。本 Phase で blocker をいずれかの分岐先に必ず割り当てる。

### Step 3: GO / NO-GO 判定

- A1〜F3 すべて PASS（または妥当な N/A） → **GO**
- 1 つでも hard FAIL → **NO-GO**（Step 2 で分岐先を確定し、本 Phase を再実施）

### Step 4: レビュー記録の保存

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-10/main.md` | A〜F の判定結果、blocker 一覧、GO/NO-GO、Phase 11 evidence 取得可否 |

## 多角的チェック観点

- 不変条件 #1 / #5 / #14 + 本タスク固有 #1-#3 が A 系列で機械的に確認される
- manifest schema 拡張の後方互換が B 系列で確認される（既存ケース無改変・optional 読み込み）
- retirement 条件の operability が C 系列で実行可能性まで確認される
- contract test future-proof 性が D 系列で 03a 差し替え経路まで確認される
- Phase 9 結果との二重整合が E 系列で確認される
- governance（branch / CODEOWNERS / branch protection）が F 系列で確認される
- CONST_007 の先送り表現が混入していない（Phase 9 Q12 と本 Phase で二重確認）

## サブタスク管理

- [ ] A1〜F3 を順に判定
- [ ] blocker を Step 2 のいずれかの分岐先に割り当て
- [ ] GO / NO-GO 判定を確定
- [ ] `outputs/phase-10/main.md` を作成

## 成果物

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-10/main.md`

## 完了条件 / DoD

- [ ] reviewer checklist A1〜F3 すべてに PASS / FAIL / N/A の判定が付いている
- [ ] すべての FAIL に分岐先（Phase 5 戻し / spec 補強 / Phase 9 戻し）が割当済
- [ ] GO / NO-GO 判定が記録されている
- [ ] Phase 11 evidence 取得可否が明記されている
- [ ] retirement 条件が `01-api-schema.md` に追記されており、03a 完成後の削除手順が機械的に追跡可能
- [ ] manifest schema 拡張が後方互換（既存読み込み側を破壊しない）

## タスク 100% 実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007 違反（先送り表現）がない
- [ ] solo-dev branch protection 不変条件（F3）を侵していない
- [ ] secret / PII の plaintext を本仕様書に書いていない

## 次 Phase（Phase 11 evidence 取得）への引き継ぎ事項

- GO 判定結果と PASS/FAIL チェック表
- NO-GO の場合の戻し先 phase 一覧
- evidence 取得時に再度確認する hard ゲート（A1-A6 / D1-D4）
- retirement 条件記載箇所（`01-api-schema.md` 該当節 anchor）
- contract test 4 ケースの test ID 一覧（Phase 11 evidence で test log として保存する対象）

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-03.md`（設計 GO 判定）
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-09.md`（品質ゲート）
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `generated/static-manifest.json`
- `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md` / `08-free-database.md`
- `.github/workflows/ci.yml`
- `CLAUDE.md`（不変条件 / solo 運用 / branch protection）
- `.github/CODEOWNERS`
