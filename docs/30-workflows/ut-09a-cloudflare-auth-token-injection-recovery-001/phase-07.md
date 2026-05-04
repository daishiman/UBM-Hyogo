# Phase 7: AC マトリクス — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 7 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

各 AC が evidence path / 検証 Layer / 異常系ハンドリングと 1 対 1 対応していることをマトリクスで確定する。

## 実行タスク

1. AC-1〜AC-7 を evidence path と対応づける
2. redaction checklist を log evidence の PASS 条件へ接続する
3. PASS / FAIL 判定ロジックを固定する

## 参照資料

- docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/phase-04.md
- docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/phase-05.md
- docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/phase-06.md

## AC マトリクス

| AC | 内容 | 検証 Layer | 主 evidence path | 異常系参照 |
| --- | --- | --- | --- | --- |
| AC-1 | `bash scripts/cf.sh whoami` が exit 0 + account identity を返す | Layer 1 | `outputs/phase-11/whoami-exit-code.log` / `outputs/phase-11/whoami-account-identity.log` | Stage 1 / Stage 2 / Stage 3 系 |
| AC-2 | secret 値が log / artifact に混入していない | Layer 1 + redaction | `outputs/phase-11/redaction-checklist.md` | Secret / 個人情報 露出系 |
| AC-3 | `.env` op 参照キー存在 + 1Password item 存在 | Layer 3 | `outputs/phase-11/env-key-existence.md` | `.env` 系 / 1Password item 系 |
| AC-4 | token scope 点検 PASS | Layer 4 | `outputs/phase-11/token-scope-checklist.md` | Stage 3（scope 不足） |
| AC-5 | 三段ラップの各段切り分け SOP 成立 | Layer 2 | `outputs/phase-11/stage-isolation.md` | Stage 1 / Stage 2 / Stage 3 系 |
| AC-6 | 親タスクへの evidence path handoff 完了 | Layer 6 | `outputs/phase-11/handoff-to-parent.md` | 親タスク handoff 系 |
| AC-7 | `wrangler login` OAuth 残置なし | Layer 5 | `outputs/phase-11/wrangler-login-residue.md` | Stage 3（OAuth 上書き） |

## evidence path 一覧

- `outputs/phase-11/main.md` — Phase 11 集約 placeholder（実測時に PASS / FAIL 集約）
- `outputs/phase-11/whoami-exit-code.log`（AC-1）
- `outputs/phase-11/whoami-account-identity.log`（AC-1）
- `outputs/phase-11/redaction-checklist.md`（AC-2）
- `outputs/phase-11/env-key-existence.md`（AC-3）
- `outputs/phase-11/token-scope-checklist.md`（AC-4）
- `outputs/phase-11/stage-isolation.md`（AC-5）
- `outputs/phase-11/handoff-to-parent.md`（AC-6）
- `outputs/phase-11/wrangler-login-residue.md`（AC-7）

## redaction checklist 接続

evidence は `redaction-checklist.md` の以下を全 PASS にした状態でのみ AC PASS と判定する:

- API Token 値 / OAuth token 値 / cookie 値 が log に残っていない
- 1Password の vault 名 / item 名（具体名）が evidence / 仕様書に転記されていない
- account secret らしき長文字列が log に残っていない
- email / 氏名 / 個人情報 が log に残っていない（CLI 既定の identity 出力に email が含まれる場合は redaction 判断対象とする）

いずれかが NG の場合、当該 evidence は破棄して再取得し、AC は FAIL のまま維持する。

## 完了判定ルール

- AC-1 は exit 0 + identity 行存在 + redaction PASS で PASS
- AC-2 は redaction-checklist 全 PASS で PASS
- AC-3 はキー名存在 + 1Password item 存在で PASS（値は確認しない）
- AC-4 は必要 scope checklist 全 PASS で PASS
- AC-5 は Stage 1 / Stage 2 / Stage 3 の到達状態が明確に分離記録されていれば PASS
- AC-6 は親タスク `ut-09a-exec-staging-smoke-001` Phase 11 から参照可能な path 形式で記録されていれば PASS
- AC-7 は OAuth config 残置なし、または user 明示指示後に除去済みで PASS
- いずれか FAIL の場合、本タスクは **partial completed** とし、Phase 11 集約に FAIL 理由を記述

## 多角的チェック観点

- 「placeholder のまま」を AC PASS と扱わない
- evidence path のファイル存在だけでなく内容妥当性も確認対象に含める
- AC-1 が PASS でも redaction NG なら全体 FAIL

## 統合テスト連携

Phase 11 の必須 outputs は本 AC マトリクスを唯一の evidence contract とする。`artifacts.json` / `outputs/artifacts.json` / `phase-11.md` / `outputs/phase-11/main.md` の path はこの表に揃え、別 contract を追加しない。

## サブタスク管理

- [ ] AC-1〜AC-7 と evidence path の対応を確定
- [ ] redaction checklist 連動を確定
- [ ] PASS / FAIL 判定ロジックを記述
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- AC マトリクスが 1 対 1 で完成している
- evidence path の不在が AC FAIL に直結する判定式である
- redaction checklist が PASS 条件に組み込まれている

## タスク100%実行確認

- [ ] partial completed 時のフォローパスが記述されている
- [ ] AC ↔ evidence path に欠落がない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと判定ロジックを渡す。
