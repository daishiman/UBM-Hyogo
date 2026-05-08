# Phase 10: 最終レビュー（docs-only 最終ゲート）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋ドキュメント作成 task のため code 変更なし）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（docs-only 最終ゲート） |
| 作成日 | 2026-05-07 |
| 前 Phase | 9（品質保証 / markdown lint・grep gate 検証） |
| 次 Phase | 11（NON_VISUAL 縮約 smoke / grep evidence 採取） |
| 状態 | completed |
| タスク種別 | docs-only / NON_VISUAL |
| implementation_mode | docs |
| visibility | NON_VISUAL |
| workflow_state | spec_created（**本 Phase で completed に書き換えない**） |

## 目的

`docs/00-getting-started-manual/specs/09c-primitives.md`（17 primitive + §99 不採用）の最終レビューを実施し、上流仕様（task-19 正本 §0〜§10）との trace、不変条件 1〜7 の整合、grep gate（HEX / oklch / px / `bg-[`）が `outputs/phase-09/` の QA 結果として 0 件で確定していることを最終確認する。本タスクは **docs-only の最終ゲート**であり、root の `metadata.workflow_state` は `spec_created` の据え置き（completed への書き換え禁止）とする。理由: 09c の実装（task-10 ui-primitives）が未着手のため、workflow 全体としての closure はまだ存在しない。

## docs-only タスクにおける workflow_state ルール

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| `metadata.workflow_state` | `spec_created` 据え置き | 09c は契約仕様のみで実装は task-10 へ委譲 |
| 各 phase artifact status | Phase 1〜10 を completed、Phase 11/12 は本タスクで close、Phase 13 は user-approval gate | docs-only であっても phase 単体の closure は記録する |
| `completed` への昇格 | task-10 完了時または当 task に runtime 実装が紐づくときのみ | 不可逆 API / production state を変更しない |

## 実行タスク

- 09c-primitives.md の §1〜§18 + §99 の **DoD § 8 trace** を確定する。
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）を docs-only 観点で最終判定する。
- task-06（09-ui-ux 契約 index）/ task-07（09a mapping）/ task-08（09b tokens）/ task-10（ui-primitives 実装）/ task-20-22（screen blueprint 採用例）への handoff items を表で固定する。
- MINOR 指摘（表記揺れ / link 補完候補）を未タスク化判定として記録のみ行う。
- gate（PASS / CONDITIONAL_PASS / FAIL）を確定し、`outputs/phase-10/final-review-result.md` に固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | task 正本（§0 自己完結 / §6 grep gate / §8 DoD） |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | 本 task の単一成果物 |
| 必須 | outputs/phase-07/coverage-matrix.md | DoD trace 入力 |
| 必須 | outputs/phase-09/qa-report.md | grep gate / markdown lint 結果 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | JSX 一字一句転記の正本 |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | §6 diff scope 規律 / archive rule |
| 参考 | CLAUDE.md | 不変条件 1〜7 |

## 実行手順

### ステップ 1: DoD § 8 最終トレース

- task 正本 §8 DoD 8 項目（行数 600〜1200 / §1〜§18 + §99 / 各 § X.1〜X.6 完備 / token-only / aria 仕様 / dialog 仕様 / §99 列挙 / link 完備 / lint error 0）を 09c の現物に対して 1:1 で trace する。
- trace 結果を `outputs/phase-10/dod-trace-matrix.md` に固定する（PASS / CONDITIONAL_PASS / FAIL の 3 値）。

### ステップ 2: 4 条件の最終判定

- 価値性: task-10 が「09c §X.Y を読んで 1 ファイル書ける」決定論的状態に到達しているか。
- 実現性: token 名のみで完結し、09b の token 定義集合と矛盾しないか。
- 整合性: 不変条件 1〜7（特に #5 D1 直接アクセス禁止 / #6 GAS prototype 非昇格）と矛盾しないか。
- 運用性: prototype 凍結正本（primitives.jsx）と 09c の行範囲 mapping が grep で再確認可能か。

### ステップ 3: gate 判定 / handoff 確定

- gate を PASS / CONDITIONAL_PASS / FAIL に確定し `outputs/phase-10/final-review-result.md` に記録。
- task-06 / 07 / 08 / 10 / 20 / 21 / 22 への handoff items を表で固定。
- MINOR 指摘は未タスク化として「タスク化しない理由」を併記する。
- `metadata.workflow_state` は `spec_created` 据え置きであることを `final-review-result.md` 末尾に明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | gate 結果と handoff items を NON_VISUAL grep evidence の前提として渡す |
| Phase 12 | aiworkflow-requirements 同期判定 / changelog 入力に使用 |
| Phase 13 | PR body summary の根拠として `final-review-result.md` を引用 |

## 多角的チェック観点（AIが判断）

- 価値性: task-10 着手者が外部資料に遡らず実装判断できる「自己完結 contract」になっているか。
- 実現性: HEX / oklch / px の 0 件が grep evidence で再確認できるか。
- 整合性: primitives.jsx 凍結正本と JSX 一字一句が drift していないか。
- 運用性: 09b（token 値）/ 09a（mapping）/ 09e/09f/09g（採用例）への link 切れが 0 件であるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | DoD § 8 trace 確定 | 10 | pending | 8 項目すべて PASS or 理由付き CONDITIONAL_PASS |
| 2 | 4 条件最終判定 | 10 | pending | docs-only 観点 |
| 3 | handoff items 確定 | 10 | pending | task-06 / 07 / 08 / 10 / 20 / 21 / 22 |
| 4 | MINOR 未タスク化判定 | 10 | pending | 起票しない理由を併記 |
| 5 | gate 確定 / workflow_state 据え置き明記 | 10 | pending | spec_created 据え置き |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/dod-trace-matrix.md | task-19 正本 §8 DoD 8 項目 trace |
| ドキュメント | outputs/phase-10/final-review-result.md | gate（PASS / CONDITIONAL_PASS / FAIL）+ workflow_state 据え置き宣言 |
| メタ | artifacts.json | Phase 状態と outputs の記録（root state は spec_created 維持） |

## 完了条件

- [ ] DoD § 8 の 8 項目すべてが PASS または CONDITIONAL_PASS（理由付き）として trace 済み
- [ ] 4 条件すべて判定済み（TBD なし）
- [ ] gate が確定し `final-review-result.md` に記録
- [ ] handoff items（task-06 / 07 / 08 / 10 / 20 / 21 / 22）が表で固定
- [ ] MINOR 指摘が未タスク化として記録済み
- [ ] `metadata.workflow_state = spec_created` の据え置きを明記

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（grep gate 残存 / JSX drift / link 切れ）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を completed に更新（**root workflow_state は変更しない**）

## 次 Phase

- 次: 11（NON_VISUAL 縮約 smoke / grep evidence 採取）
- 引き継ぎ事項: gate 結果 + handoff items を Phase 11 の grep evidence 採取の前提として渡す。
- ブロック条件: gate=FAIL、または DoD § 8 のいずれかに未解消の違反が残る場合は Phase 11 に進まない。

## handoff items（downstream）

| 受け手 task | 渡す output | 前提条件 | 未解消事項 |
| --- | --- | --- | --- |
| task-06（09-ui-ux 契約） | 09c-primitives.md / final-review-result.md | 09c の §1〜§18 見出しが grep 可能 | 09-ui-ux.md からの index link 追加は task-06 側で確定 |
| task-07（09a mapping） | 09c の各 §X.1 行範囲 | primitives.jsx の行番号が drift していない | 09a 側 mapping 表の最終確定は task-07 で実施 |
| task-08（09b tokens） | 09c §X.5 token 参照名一覧 | `--ubm-*` prefix で統一 | token 値の最終決定は task-08 で実施 |
| task-10（ui-primitives 実装） | 09c 全体 | DoD § 8 全項目 PASS | 実装本体は task-10 で着手 |
| task-20 / 21 / 22（screen blueprints） | 09c §X.6 採用例 link slot | 09e / 09f / 09g の §X 番号確定後に逆 link を貼る | 採用例の §番号確定は task-20-22 で実施 |

## blocker 一覧

| ID | blocker | 解消条件 |
| --- | --- | --- |
| B-01 | grep gate に視覚値が残存 | Phase 9 へ差し戻し、HEX / oklch / px / `bg-[` を 0 件にする |
| B-02 | JSX 転記が primitives.jsx と drift | Phase 5 / 6 へ差し戻し、行範囲を再 transcribe |
| B-03 | §99 不採用 primitive が 3 件未満 | TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage の 3 件を §99 に列挙 |

## MINOR 指摘の未タスク化判定

| ID | 指摘 | 重大度 | 未タスク化理由 |
| --- | --- | --- | --- |
| M-01 | 表記揺れ（"primitive" / "Primitive"） | MINOR | docs-only で次回 spec sync 時に吸収可能 |
| M-02 | 09e/09f/09g の §X 番号未確定（採用例 link が予約状態） | MINOR | task-20-22 完了後に逆 link が確定するため、本 task で先行解決しない |

## Phase 11 進行 GO / NO-GO

- GO: gate=PASS、または gate=CONDITIONAL_PASS かつ blocker が docs-only で吸収可能。
- NO-GO: gate=FAIL、または primitives.jsx 凍結正本との drift が残る。
