# Phase 4: テスト戦略 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 4 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

Phase 1 の AC-1..AC-10 と Phase 2 の関数シグネチャ（`validateInput` / `ensureEvidencePathExists` / `generatePostmortem` / `main`）に対して、**unit テスト最低 8 ケース**と CLI smoke 1 件を採番し、TDD Red → Green の順序で実装可能なレベルまで具体化する。

苦戦箇所 S1（blame 排除）/ S2（evidence path 必須）/ S3（runbook 責務分離）/ S4（冪等性）/ S5（pnpm 統合）はテスト層で構造的に検証できるよう、各 TC に紐付ける。NON_VISUAL タスクのため screenshot は採番しない。

## 実行タスク

1. unit テストファイルの配置を確定する（vitest 配置慣習に従う）。完了条件: 追加テストファイル一覧が表で確定する。
2. TC-U-01..TC-U-08 を採番し、AC-1..AC-10 / S1-S5 と紐付ける。完了条件: TC × AC × S 苦戦箇所のクロスマトリクスが空欄なし。
3. CLI smoke ケース TC-S-01 を採番する（Phase 11 で実行）。完了条件: 実 09c Phase 11 evidence path での実行コマンドが固定される。
4. カバレッジ AC を Phase 9 完了条件と整合させる（`scripts/postmortem` 配下の Statements / Branches / Functions / Lines >=80%）。
5. `bash scripts/coverage-guard.sh` exit 0 を完了条件として明記する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 1 | `outputs/phase-01/main.md` | AC-1..AC-10 / CLI 引数表 |
| Phase 2 | `outputs/phase-02/main.md` | 関数シグネチャ / template 7 見出し |
| Phase 3 | `outputs/phase-03/main.md` | NO-GO ゲート / S1-S5 反映確認 |
| 09c Phase 11 outputs | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` | smoke 入力に使う実 evidence |
| 既存 coverage guard | `scripts/coverage-guard.sh` | 完了条件 exit 0 |
| Phase テンプレ core | `.claude/skills/task-specification-creator/references/phase-template-core.md` | カバレッジ AC |
| coverage standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 基準 |

## 追加テストファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `scripts/postmortem/__tests__/generate-postmortem.test.ts` | vitest unit。`validateInput` / `ensureEvidencePathExists` / `generatePostmortem` / `main` の決定論性・バリデーション・blame 排除 regex assert |
| 参照のみ | `scripts/postmortem/__tests__/fixtures/evidence-ok/main.md` | smoke 用ダミー evidence（`fs.statSync` 通過用・テスト時に作成し teardown で削除する方針 or 固定 fixture） |
| 参照のみ | `scripts/postmortem/__tests__/fixtures/rollback-ok.md` | 空でない rollback evidence |

vitest 配置慣習: `__tests__` ディレクトリ配置（既存 `scripts/coverage-guard.ts` 系と整合）。fixture はテスト内で `os.tmpdir()` 配下に動的生成し、`afterEach` で削除する方式を優先する（リポジトリにダミーファイルをコミットしない）。固定 fixture が必要な場合のみ `__tests__/fixtures/` 配下に配置する。

## Unit Tests 採番

| TC ID | 対象 | ケース | 期待 | AC | S |
| --- | --- | --- | --- | --- | --- |
| TC-U-01 | `generatePostmortem` | 必須 7 見出し（Header / Timeline / Impact / Detection / Response / Root Cause / Prevention / Follow-up Issues）が順序通り存在 | 出力 markdown を行 split し、見出し正規表現が定義順に出現する | AC-2 | S1 |
| TC-U-02 | `generatePostmortem` | release tag / commit / evidence path / rollback evidence path がレンダリングされる | 出力に `--release` `--commit` `--evidence` `--rollback-evidence` 値が文字列として含まれる | AC-2, AC-1 | S2 |
| TC-U-03 | `ensureEvidencePathExists` | 09c Phase 11 evidence path（`--evidence`）欠落時にエラー停止 | `{ ok:false, reason: /not found|missing/ }`、CLI から呼ぶと exit 1 | AC-4 | S2 |
| TC-U-04 | `ensureEvidencePathExists` / `validateInput` | rollback evidence path 欠落時にエラー停止 | `--rollback-evidence` 未指定で `validateInput` が `ok:false`、CLI exit 1 | AC-4 | S2 |
| TC-U-05 | `generatePostmortem` | blame 表現（人名・部署名固有名詞・"責任" / "blame" / "fault" / "responsible" / "誰が"）が出力に含まれない（lint 的 assert） | 正規表現 `/責任|blame|fault|responsible|誰が/i` が 0 hit | AC-3 | S1 |
| TC-U-06 | `generatePostmortem` | 冪等性: 同一 `PostmortemInput` で 2 回呼び出しても文字列が完全一致 | `gen(input) === gen(input)`（`Date.now()` / `Math.random()` を含まないこと） | AC-7 | S4 |
| TC-U-07 | `main`（CLI） | `--out` 指定時にファイル書き出し / 未指定時は標準出力 | `--out <tmpfile>` で `fs.existsSync(tmpfile)` true・内容が `generatePostmortem` 出力と一致。未指定で stdout に出力されたバイト列が同一 | AC-1 | S5 |
| TC-U-08 | `generatePostmortem` / template | follow-up issue セクションに gh CLI 利用ガイド（`gh issue create` 文字列・`[postmortem-followup]` prefix）が含まれる | 出力に `gh issue create` と `[postmortem-followup]` が部分文字列として存在 | AC-8 | S3 |
| TC-U-09（補強） | `validateInput` | release 形式不正（`v1.2` 等）/ commit 形式不正（`zzz` 等）で `ok:false` | 各ケースで `ok:false` + `reason` 非空 | AC-5 | S5 |
| TC-U-10（補強） | `generatePostmortem` | rollback evidence が空文字列でも生成は成功するが、空ファイルパスは Phase 6 異常系として `validateInput` で別途検出される | `ok:true` で markdown 生成、Phase 6 で path 検証側を担保 | AC-2 | S2 |

> **必須 TC 件数**: TC-U-01 〜 TC-U-08 の **8 件**を最低ラインとし、TC-U-09 / TC-U-10 を補強として推奨する。Phase 9 のカバレッジ AC を満たすために必要なら追加 TC を Phase 5 で増やす。

## CLI Smoke 採番

| TC ID | シナリオ | 実行コマンド | 期待 |
| --- | --- | --- | --- |
| TC-S-01 | 実 09c Phase 11 evidence path での CLI 実行 | `mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbeef --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ --rollback-evidence /tmp/rollback-empty.md --occurred-at 2026-05-05T00:00:00Z --out /tmp/postmortem-smoke.md` | exit 0 / `/tmp/postmortem-smoke.md` 生成 / 7 見出し含有 |

E2E は不要（NON_VISUAL / 運用 CLI のため Phase 1 統合テスト連携で確定済み）。

## TC × AC × S クロスマトリクス

| TC ID | AC カバー | S カバー |
| --- | --- | --- |
| TC-U-01 | AC-2 | S1 |
| TC-U-02 | AC-1, AC-2 | S2 |
| TC-U-03 | AC-4 | S2 |
| TC-U-04 | AC-4 | S2 |
| TC-U-05 | AC-3 | S1 |
| TC-U-06 | AC-7 | S4 |
| TC-U-07 | AC-1 | S5 |
| TC-U-08 | AC-8 | S3 |
| TC-U-09 | AC-5 | S5 |
| TC-U-10 | AC-2 | S2 |
| TC-S-01 | AC-1, AC-2, AC-10 | S2, S5 |

> AC-6（pure 関数として unit test 可能）は TC-U-01..TC-U-06 / TC-U-08 が「`generatePostmortem` を直接 import して呼ぶ」形であること自体で証明される。AC-9（runbook 本文置換しない grep gate）は Phase 5 の grep gate で検証する。AC-10（unit 80%+ / smoke 1 件）は Phase 9 / Phase 11 で確定する。

## TDD 順序

1. TC-U-09 → TC-U-03 → TC-U-04（`validateInput` / `ensureEvidencePathExists` の Red → Green）
2. TC-U-01 → TC-U-02 → TC-U-08（template 7 見出し / placeholder 置換 / follow-up gh CLI）
3. TC-U-05（blame regex 0 hit assert）
4. TC-U-06（冪等性: 同一入力 2 回比較）
5. TC-U-07（CLI `main` の stdout / `--out` 分岐）
6. TC-U-10（補強）
7. TC-S-01（Phase 11 で実行）

## カバレッジ AC（CONST_005 / 完了条件）

| メトリクス | 目標 | 対象 |
| --- | --- | --- |
| Statements | >=80% | `scripts/postmortem/**/*.ts`（test を除く） |
| Branches | >=80% | 同上 |
| Functions | >=80% | 同上 |
| Lines | >=80% | 同上 |

> Phase 1 AC-10 は line 80% / branch 60% を最低ラインとして記載していたが、本 Phase 4 のカバレッジ AC は **`scripts/postmortem` 配下に絞った** Statements/Branches/Functions/Lines いずれも 80% 以上を上書き目標とする（small スコープのため達成可能）。Phase 9 で実測値を出し、未達なら追加 TC を投入する。

完了条件として以下を必須とする:

- 上記 4 メトリクスが全て 80% 以上
- `bash scripts/coverage-guard.sh` exit 0
- `mise exec -- pnpm vitest run scripts/postmortem` で TC-U-01..TC-U-08（最低 8 件）が PASS

## ローカル実行コマンド（CONST_005）

```bash
# unit
mise exec -- pnpm vitest run scripts/postmortem
# coverage
mise exec -- pnpm vitest run scripts/postmortem --coverage
# coverage gate
bash scripts/coverage-guard.sh
# smoke (TC-S-01・Phase 11 で実行)
mise exec -- pnpm postmortem:generate -- \
  --release v0.0.0 --commit deadbeef \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/rollback-empty.md \
  --occurred-at 2026-05-05T00:00:00Z \
  --out /tmp/postmortem-smoke.md
```

## モック / fixture 戦略

- `fs.statSync` の存在確認は **実ファイル fixture** を `os.tmpdir()` 配下に動的作成して検証する（`vi.mock('node:fs')` を多用しない方針 — pure 関数 `generatePostmortem` には fs を使わないため、mock 対象は `ensureEvidencePathExists` の test と CLI `main` の test に限定）。
- `--out` 書き出しテストは `os.tmpdir()` + `randomUUID` で衝突を避け、`afterEach` で `fs.rmSync(..., { force: true })` する。
- 09c Phase 11 evidence の実 path に依存する TC は TC-S-01 のみ（Phase 11 で手動実行）。unit テストは `os.tmpdir()` 配下のダミーディレクトリ + `main.md` を作って `ensureEvidencePathExists` の通過を検証する。

## DoD（Phase 4 テスト戦略）

- [ ] TC-U-01..TC-U-08（最低 8 件）が採番されている
- [ ] TC-U-09 / TC-U-10 補強案が記載されている
- [ ] TC-S-01 の CLI smoke 実行コマンドが固定されている
- [ ] AC-1..AC-10 全てが少なくとも 1 つの TC でカバーされている
- [ ] S1-S5 全てが少なくとも 1 つの TC でカバーされている
- [ ] カバレッジ AC（Statements/Branches/Functions/Lines >=80%）が `scripts/postmortem` 配下に明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 が完了条件に含まれる
- [ ] vitest 配置（`scripts/postmortem/__tests__/generate-postmortem.test.ts`）が確定

## 多角的チェック観点

- **S1 blame 排除**: TC-U-05 の regex に `/責任|blame|fault|responsible|誰が/i` を全て含めているか
- **S2 evidence 必須**: `--evidence` 不在 / `--rollback-evidence` 不在の双方が個別 TC（TC-U-03, TC-U-04）で検証されているか
- **S3 runbook 責務分離**: TC-U-08 で gh CLI guide のみ確認し、incident response 手順を含めていないこと
- **S4 冪等性**: TC-U-06 が同一 input オブジェクトで 2 回呼び比較する形になっているか（`Date.now()` 混入を構造的に弾く）
- **S5 pnpm 統合**: TC-S-01 を `mise exec -- pnpm postmortem:generate` 経由で実行する形になっているか
- pure 関数化: TC-U-01..TC-U-06 / TC-U-08 が `generatePostmortem` を直接 import して呼ぶ（CLI を経由しない）構造になっているか（AC-6 構造的証明）

## サブタスク管理

- [ ] TC-U-01..TC-U-10 採番完了
- [ ] TC-S-01 採番完了
- [ ] AC × TC × S クロスマトリクス埋め
- [ ] vitest 配置確定
- [ ] カバレッジ AC を 80% 4 メトリクスで固定
- [ ] `coverage-guard.sh` exit 0 を完了条件に追加
- [ ] `outputs/phase-04/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| テスト戦略 | `outputs/phase-04/main.md` | TC ID / TDD 順序 / カバレッジ AC / 追加テストファイル一覧 |

## 完了条件

- [ ] 8 件以上の unit TC + 1 件の CLI smoke が採番されている
- [ ] AC-1..AC-10 が TC で漏れなくカバー
- [ ] S1-S5 が TC で漏れなくカバー
- [ ] カバレッジ AC（80% / 4 メトリクス）と `coverage-guard.sh` exit 0 が完了条件として明記
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] テストコードを実装していない（採番のみ）
- [ ] commit / push / PR を実行していない
- [ ] 09c Phase 11 evidence の本文・構造を変更していない
- [ ] スクリプト本体（`scripts/postmortem/generate-postmortem.ts`）を作成していない

## 次 Phase への引き渡し

Phase 5 へ、TC-U-01..TC-U-10 / TC-S-01 の TC ID リスト、TDD 順序、追加テストファイル一覧、カバレッジ AC（80% / 4 メトリクス + coverage-guard exit 0）、blame 排除 regex 候補語（`/責任|blame|fault|responsible|誰が/i`）を渡す。
