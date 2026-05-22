# Phase 9: 最終レビュー（DoD 9 項目チェックゲート）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋なドキュメント作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 最終レビュー（DoD ゲート判定） |
| 作成日 | 2026-05-07 |
| 前 Phase | 8 (品質保証) |
| 次 Phase | 10 (Phase 10 最終レビューゲート → 11 Phase 11 検証) |
| 状態 | completed |
| task_kind | NON_VISUAL（pure-docs） |

## 目的

タスク正本 §8 の **DoD 9 項目**をチェックリスト化し、Phase 5〜8 の成果に対する最終 PASS / MINOR / MAJOR / CRITICAL 判定を実施する。MINOR は追跡テーブルに登録し Phase 11 / 後続 task-20/21/22 完了時に解決確認する。

## 判定基準

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS | 全 9 項目 ✅ | Phase 10 へ進行 |
| MINOR | placeholder link / 軽微な揺れ | MINOR 追跡テーブル記録後、Phase 10 へ進行 |
| MAJOR | DoD 必須項目 ✗（例: 視覚値混入 / a11y 必須欠落） | Phase 5 または 7 へ戻り |
| CRITICAL | primitives.jsx の凍結正本ドリフト / §99 列挙漏れ | Phase 1 へ戻りタスク仕様再確認 |

## 実行タスク

- DoD §8 全 9 項目をチェックリスト化し ✅/✗ 判定
- MINOR 追跡テーブルの作成と解決確認 Phase の固定
- gate-decision.md への判定結果記録
- 後続 task-10（ui-primitives 実装）への handoff 内容明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §8 DoD 正本 |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | 最終成果物 |
| 必須 | outputs/phase-06/grep-gate-result.md | Phase 6 検証ログ |
| 必須 | outputs/phase-08/quality-report.md | Phase 8 link 整合性ログ |

## DoD §8 チェックリスト（タスク正本 §8 完全転記）

- [ ] 1. `09c-primitives.md` が新規作成され 600〜1200 行
- [ ] 2. §1〜§18 + §99 の見出しが揃う（17 primitive + 不採用）
- [ ] 3. 各 §X に X.1 (JSX 転記) / X.2 (props) / X.3 (variants/sizes/states) / X.4 (a11y) / X.5 (token) / X.6 (link) が揃う
- [ ] 4. 全 primitive で token 名のみ使用（HEX / oklch / px 値が §6.2 grep で 0 件）
- [ ] 5. icon-only Button / IconBtn の `aria-label` 必須が §1.4 / 関連 §に明記
- [ ] 6. dialog / drawer / modal で `role="dialog"` + `aria-modal="true"` + focus trap + Esc close が記述
- [ ] 7. §99 に TweaksPanel / data-theme / AvatarStoreProvider#localStorage の 3 件が列挙
- [ ] 8. 09b / 09a / 09e/09f/09g への link が全 primitive で記述
- [ ] 9. markdown lint で error 0

各項目の検証経路（コマンド・参照ファイル）を gate-decision.md に貼付する。

## 実行手順

### ステップ 1: DoD 9 項目の機械検証

| # | 検証コマンド / 確認ファイル |
| --- | --- |
| 1 | `wc -l docs/00-getting-started-manual/specs/09c-primitives.md` → 600〜1200 |
| 2 | `grep -cE '^## [0-9]+\. ' specs/09c-primitives.md` → 19 以上 |
| 3 | 各 §X 配下に X.1〜X.6 が連続して存在することを目視確認 |
| 4 | Phase 6 §6.2 grep gate ログ参照 |
| 5 | `grep -nE 'aria-label' specs/09c-primitives.md` で §1.4 / IconBtn 周辺確認 |
| 6 | `grep -E 'aria-modal\|role="dialog"\|focus trap\|Esc' specs/09c-primitives.md` |
| 7 | `grep -A3 '^## 99\. ' specs/09c-primitives.md` で 3 件確認 |
| 8 | Phase 8 quality-report.md の link 集計 |
| 9 | `mise exec -- pnpm lint:md specs/09c-primitives.md` exit 0 |

### ステップ 2: MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| MIN-19-01 | 09e/09f/09g 未完成箇所の placeholder link | task-20/21/22 完了時 | Phase 11（手動確認） | 並列 wave 末尾で resolve |
| MIN-19-02 | 09b token 名 alias の旧名残存 | task-08 完了時 | Phase 11 | task-08 確定後に sed |
| (動的追加) | … | … | … | … |

### ステップ 3: 判定記録と handoff

- 判定結果を `outputs/phase-09/gate-decision.md` に記録（PASS / MINOR / MAJOR / CRITICAL）
- 後続 task-10（ui-primitives 実装）に対する handoff:
  - 入力: `09c-primitives.md`（本 task 成果物）
  - 期待: 各 §X.Y を読んで apps/web 配下に primitive を 1 ファイル実装可能
  - blocker: なし（task-10 は本 task PASS のみで開始可能）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 / Phase 8 | 検証ログをエビデンスとして再利用 |
| Phase 10 | ゲート判定結果を最終レビューゲートに引き継ぎ |
| Phase 11 | placeholder link の解決確認 |
| 後続 task-10 | 本 task PASS で開始条件成立 |

## 多角的チェック観点（AIが判断）

- 完全性: DoD §8 全 9 項目を漏れなく検証したか
- 厳密性: MAJOR と MINOR の境界が判定基準に従っているか
- 追跡性: MINOR が解決確認 Phase まで紐付いているか
- 連鎖性: 後続 task-10 が決定論的に着手できる handoff になっているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | DoD 1〜3 行数 / 章構成 | 9 | pending | wc / grep |
| 2 | DoD 4 視覚値 0 件 | 9 | pending | Phase 6 ログ |
| 3 | DoD 5〜6 a11y 必須 | 9 | pending | aria-* grep |
| 4 | DoD 7 §99 3 件 | 9 | pending | 内容確認 |
| 5 | DoD 8 link 整合性 | 9 | pending | Phase 8 ログ |
| 6 | DoD 9 markdown lint | 9 | pending | exit 0 |
| 7 | MINOR 追跡テーブル | 9 | pending | 解決 Phase 固定 |
| 8 | gate-decision.md 出力 | 9 | pending | 判定記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レビュー結果 | outputs/phase-09/gate-decision.md | PASS/MINOR/MAJOR/CRITICAL 判定 |
| 追跡テーブル | outputs/phase-09/minor-tracker.md | MINOR ID と解決確認 Phase |
| メタ | artifacts.json | Phase 9 状態更新 |

## 完了条件

- [ ] DoD §8 全 9 項目に判定（✅ / ✗）が記録されている
- [ ] MINOR は全て追跡テーブルに登録され、解決確認 Phase が固定されている
- [ ] MAJOR / CRITICAL がある場合、戻り Phase に差し戻し済み
- [ ] gate-decision.md に最終判定（PASS or MINOR）が記録されている
- [ ] 後続 task-10 への handoff 内容が明記されている
- [ ] coverage AC 適用外（pure-docs / 実装テスト発生せず）

## タスク100%実行確認【必須】

- [ ] 8 サブタスク全て completed
- [ ] 全 DoD 項目に検証エビデンス（コマンド出力 / ファイル参照）が紐付く
- [ ] 全完了条件にチェック
- [ ] 不変条件 §0.5（1〜7）を最終確認
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の Phase 9 を reviewed に更新

## 次 Phase

- 次: 10 (最終レビューゲート)
- 引き継ぎ事項: PASS / MINOR 判定結果と MINOR 追跡テーブルを Phase 10 ゲートに渡す
- ブロック条件: MAJOR または CRITICAL 判定の場合、戻り Phase（5 / 7 / 1）の修正完了まで Phase 10 に進まない
