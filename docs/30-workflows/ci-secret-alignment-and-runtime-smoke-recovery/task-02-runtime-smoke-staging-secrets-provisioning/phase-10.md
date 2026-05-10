# Phase 10: 最終レビュー（task-02 — GO/NO-GO 判定とロールバック）

| 項目 | 値 |
|------|----|
| 入力 | `phase-9.md` 品質ゲート結果 |
| 出力 | GO/NO-GO 判定 + ロールバック手順 |

---

## 1. 受入基準トレーサビリティ

| AC | 内容 | 検証 phase | 状態 |
|----|------|-----------|------|
| AC-T2-1 | pre-check step が 1 回だけ存在 | phase-6 ST-2 / phase-9 QG-3 | spec |
| AC-T2-2 | secret 未投入で pre-check fail + 4 件列挙 | phase-7 §2 / phase-9 QG-8 | spec |
| AC-T2-3 | runbook が 5 secret 投入手順を持つ | phase-5 §2 / phase-9 QG-5 | spec |
| AC-T2-4 | 実値 grep 0 件 | phase-6 ST-4 / phase-9 QG-4 | spec |
| AC-T2-5 | 投入後の再実行で pre-check 突破 | phase-7 §4 / phase-9 QG-9 | spec |

---

## 2. GO/NO-GO 判定

### 2.1 GO 条件（PR merge 可）

- AC-T2-1..AC-T2-4 が PR diff / CI から機械検証 PASS。
- AC-T2-5 は **ユーザー secret 投入後の事後観測** として残す（PR diff 単体では完了不能）。
- 不変条件 1-5（CONST: secret 実値混入禁止 / smoke スクリプト不変 / 早期 fail / 明示 fail / SLACK は best-effort）が満たされている。

### 2.2 NO-GO 条件

- 上記いずれかが PASS しない。
- runbook §禁止事項 が欠落している。
- workflow YAML に secret 実値 / token らしき文字列が混入している。

---

## 3. ロールバック手順

| 場面 | 手順 |
|------|------|
| pre-check step が誤動作（false positive で smoke を blocking） | `git revert <commit-sha>` で workflow YAML の追加 step のみ revert。runbook と spec は残す |
| runbook に実値が誤って混入 | 該当 commit を `git revert` し、git history rewrite は行わない（履歴改変は CLAUDE.md ポリシー違反）。secret は即時ローテーションする |
| secret 投入後も smoke が常時失敗 | 本 task の rollback ではなく smoke スクリプト本体の調査タスクとして起票 |
| pre-check step 自体を撤回 | `verify required staging secrets` step block を削除する commit を作成。runbook は残置（ドキュメント価値あり） |

### 3.1 rollback で残すもの

- `runbooks/secret-provisioning.md`（運用知識として残す）
- 本 task の Phase 1-13 spec（決定経緯の記録として残す）

### 3.2 rollback で巻き戻すもの

- `.github/workflows/runtime-smoke-staging.yml` の追加 step のみ

---

## 4. レビュー観点（self-review）

| # | 観点 | チェック |
|---|------|---------|
| RV-1 | YAML diff が pre-check step 追加のみで他 step を破壊していない | phase-3 §2.3 の不変箇所表で確認 |
| RV-2 | runbook が「実値」を一切含んでいない | phase-9 QG-4 |
| RV-3 | runbook §禁止事項 に AI への実値投入禁止が明示されている | phase-9 QG-6 |
| RV-4 | smoke スクリプトに git diff がない | phase-9 QG-7 |
| RV-5 | task-01 と path / branch / commit が衝突していない | task-01 は `.github/workflows/web-cd.yml` 編集なのでファイル衝突なし |
| RV-6 | CLAUDE.md シークレット管理セクションと整合 | phase-12 §2 で確認 |

---

## 5. GO 判定（spec 段階）

本 spec は `spec_created` で完了。runtime 観測（phase-11）と PR 作成（phase-13）に進む。
