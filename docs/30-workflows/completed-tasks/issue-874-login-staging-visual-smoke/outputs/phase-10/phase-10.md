**[実装区分: 実装仕様書]**

# Phase 10: 最終レビュー / AC verdict / blocker 判定

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 1-9 |

## 1. AC 最終 verdict 表

| AC | 内容 | spec 上の verdict | 実測時の確認手段 |
|---|---|---|---|
| AC-1 | staging URL に対し `login-smoke.spec.ts --project=staging --grep 'renders LoginCard\|captures mobile input' --reporter=line` が 0 fail / 0 flaky / 7 passed | spec_created (pre-implementation; superseded by local implementation, Phase 11 で実測) | `outputs/phase-11/staging-smoke.log` に `7 passed` |
| AC-2 | staging evidence 7 PNG が non-empty かつ ≤ 500KB | spec_created | Phase 5 ステップ 6 検証コマンドの exit 0 |
| AC-3 | local baseline との目視 diff で構造的回帰なし | spec_created | `outputs/phase-11/evidence/visual-diff-note.md` の OK 記録 |
| AC-4 | `EVIDENCE_DIR` が env-override 可能・local 既定値は従来通り | spec_created | Phase 5 ステップ 1 diff + Phase 9 #4 local 実行 |
| AC-5 | unassigned-task spec / detection.md の FU-LOGIN-003 consumed | spec_created | Phase 5 ステップ 8 grep 結果 |
| AC-6 | staging deploy は `scripts/cf.sh` 経由・user 承認後の記録あり | spec_created | `outputs/phase-11/evidence/staging-deploy.log` 残存 |
| AC-7 | production smoke は本 task に含めない | spec_created | Phase 12 unassigned-task-detection.md に独立 followup として明記 |

## 2. blocker 判定

| 項目 | blocker か | 備考 |
|---|---|---|
| local 既定値破壊リスク | No | Phase 5 diff で文字列保持を確定 |
| staging session cookie 不整合 | Conditional | Phase 5 §1 で state 再現手段確認を必須化。確認の結果不可なら Phase 5 ステップ 5 で fixture 投入 step を追加（実装中の早期発見で blocker 化を回避） |
| cold start flaky | No | warm-up 手順を Phase 5 §5 で明示 |
| `wrangler` 直接呼び出し混入 | No | helper には含まず、deploy は `cf.sh` 経由 |
| 新規 `.spec.ts` 追加 | No | 既存 spec の env-override のみ |

総合: **blocker 0 件**（conditional 項目は実装時の早期検知で回避可能）。

## 3. 不変条件最終確認

| 不変条件 | 状態 |
|---|---|
| 既存 API endpoint surface のみ | OK（API 改変なし） |
| OKLch token 正本維持 | OK（design token 改変なし） |
| `apps/web` から D1 直接アクセスなし | OK |
| 新規 test ファイル `*.spec.ts` 規約 | OK（新規 test ファイルなし） |
| 親 workflow consumed trace 計画 | OK（Phase 5 §8） |
| Cloudflare CLI は `cf.sh` 経由 | OK |
| production smoke は本 task 外 | OK（Phase 12 で別 followup 化） |

## 4. Phase 10 完了条件

- [x] AC-1〜AC-7 を verdict 表で確認
- [x] blocker 0 件を判定
- [x] 不変条件の最終確認

## 5. 次 Phase への引き継ぎ

Phase 11 は VISUAL タスクの実行 phase。本 Phase の verdict 表を基に、staging deploy → smoke → evidence 取得 → 目視 diff を user-gated で実行し、AC を spec_created から `present` に進める。
