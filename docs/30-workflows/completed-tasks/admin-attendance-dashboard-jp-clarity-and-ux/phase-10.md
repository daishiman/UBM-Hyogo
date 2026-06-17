# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 9（品質保証） |
| 下流 | Phase 11（手動テスト・VISUAL screenshot） |
| 関連 issue | なし（staging 観察起点・relatedIssue=null） |
| 状態 | spec_created |

## 目的

Phase 9 までで確定した品質状態に対し、受入条件 AC-1〜AC-10 の最終充足確認と、Phase 3 で登録された MINOR M-1〜M-4 の解決確認を行う。GO/NO-GO を 4 条件（価値性 / 実現性 / 整合性 / 運用性）＋ AC 全充足 ＋ token gate PASS ＋ 英語・専門語残存ゼロ ＋ 既存機能温存の合議で判定し、Phase 11（手動テスト・VISUAL screenshot）へ進む条件、および Phase 13（PR 作成）を blocked に維持する条件を確定する。あわせて、未解決の MINOR を **unassigned-task 化対象** として確認する（[unassigned 連携]）。本 Phase は判定 Phase であり、コード変更・commit・PR は一切行わない。

## 実行タスク

1. **AC 最終確認観点の固定**: AC-1〜AC-10 の各受入条件に対し「確認手段（focused vitest / token gate / 残存 grep / 構造アサーション / 視覚証跡）」「blocker 判定基準」を `outputs/phase-10/main.md` に表で固定する。VISUAL タスクのため AC-1〜AC-4（日本語見出し / 専門語消失 / 見やすさ）は Phase 11 screenshot canonical 名へのマッピングを併記する。
2. **MINOR 解決確認**: M-1（ZONE_HELP 変更で Playwright T-06 が壊れる）/ M-2（visual snapshot baseline 差分）/ M-3（`延べ` の扱い）/ M-4（`くわしい一覧` 内の「テーブル」残存）の解決状態を確認し、未解決があれば戻り先 Phase または unassigned-task 化対象を明記する。
3. **GO/NO-GO 判定基準の確定**: 4 条件 ＋ AC 全充足 ＋ `verify-design-tokens` PASS ＋ 英語・専門語残存ゼロ ＋ 既存機能温存を GO 条件として `outputs/phase-10/go-no-go.md` に固定する。
4. **Phase 11 進行条件 / Phase 13 blocked 条件の確定**。

## 実行手順

### ステップ 1: AC 最終確認観点の固定

- AC-1〜AC-10 を `outputs/phase-10/main.md` の「AC 最終確認表」に列挙し、各 AC に「確認手段」「blocker 判定」を割り当てる。
- AC-1（英語→日本語）/ AC-2（セッション→開催回）/ AC-3（専門語平易化）/ AC-4（見やすさ微調整）を Phase 11 の 6 canonical screenshot へマップする。

### ステップ 2: MINOR 解決確認

- M-1〜M-4 の解決状態を `outputs/phase-10/main.md` の「MINOR 解決確認表」に記録する。
- M-1（T-06 追従）は同一 wave 実施で解決。M-2（visual baseline）は user-gated で Phase 11/13 に申し送り。M-3/M-4 は任意改善のため未実施なら unassigned-task 化対象として記録する。

### ステップ 3: GO/NO-GO 判定

- `outputs/phase-10/go-no-go.md` に GO 条件（4 条件 ＋ AC 全充足 ＋ token gate PASS ＋ 英語残存ゼロ ＋ 既存機能温存）を固定する。
- いずれか 1 つでも未充足なら NO-GO とし、戻り先 Phase を明記する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md（§5 AC / §9 メタ情報） | AC-1〜AC-10 / 裏取り確定表 |
| 必須 | phase-03.md / outputs/phase-03/main.md | MINOR M-1〜M-4 の登録元 |
| 必須 | outputs/phase-09/main.md / token-audit.md | 品質保証結果（型/lint/build/token/英語残存ゼロ） |
| 必須 | outputs/phase-07/ac-matrix.md | AC↔テスト対応 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 文言の分かりやすさ最終評価根拠 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | ダッシュボード情報設計の妥当性 |
| デザイントークン正本 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | AC-5 token gate 根拠 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を受けて VISUAL screenshot capture（user-gated）へ進む。AC-1〜AC-4 を 6 canonical 名にマップ |
| Phase 12 | MINOR 解決結果を documentation-changelog / unassigned-task-detection に申し送り |
| Phase 13 | GO 判定が出ても commit / PR は user 承認後のみ。承認まで blocked 維持 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 3 | `outputs/phase-03/main.md` | MINOR M-1〜M-4 の登録元 |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | AC↔テスト対応の最終確認基準 |
| Phase 9 | `outputs/phase-09/{main,token-audit}.md` | 品質保証 全 PASS を GO 入力にする |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 英語→日本語の完了 | AC-1 | 画面表示に PRIMARY/TREND/DETAIL/TOP10/ADMIN/CSV 等が 0 件（残存 grep PASS） |
| セッション→開催回 | AC-2 | 画面表示・aria・テスト名に「セッション」0 件 |
| 専門語の平易化 | AC-3 | トレンド/ユニーク/KPI/区画/帯/pt が平易日本語へ置換 |
| 見やすさ微調整 | AC-4 | 要フォロー行・長い文言のはみ出しが改善・DOM 構造/testid/href 不変 |
| token 正本 | AC-5 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件・新規 token 0（`verify-design-tokens` PASS） |
| primitive 非追加 | AC-6 | `components/` / attendance 配下への新規追加 0 件 |
| データ層不変 | AC-7 | `apps/api` / `packages/shared` の diff 0 件 |
| DOM contract | AC-8 | testid/role/aria キー保持（aria-label 値の変更は意図的） |
| テスト追従 | AC-9 | T-01〜T-06 追従済み・回帰テスト追加済み・focused vitest PASS |
| 機能温存 | AC-10 | フィルタ / 書き出し / drilldown modal / SafeResult degrade が挙動不変 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC 最終確認表 | 10 | spec_created | main.md |
| 2 | MINOR M-1〜M-4 解決確認 | 10 | spec_created | main.md（unassigned 化対象の確認含む） |
| 3 | GO/NO-GO 判定基準 | 10 | spec_created | go-no-go.md |
| 4 | Phase 11 進行条件 | 10 | spec_created | go-no-go.md |
| 5 | Phase 13 blocked 条件 | 10 | spec_created | go-no-go.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC 最終確認表 + MINOR 解決確認表（unassigned 化対象含む） |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定基準・Phase 11 進行 / Phase 13 blocked 条件 |
| メタ | artifacts.json | Phase 10 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-10/main.md` に AC-1〜AC-10 の最終確認表（確認手段 + blocker 判定）が固定されている
- [ ] MINOR M-1〜M-4 の解決確認が記録され、未解決時の戻り先 Phase または unassigned-task 化対象が明記されている
- [ ] `outputs/phase-10/go-no-go.md` に GO 条件（4 条件 + AC 全充足 + token gate PASS + 英語残存ゼロ + 既存機能温存）が固定されている
- [ ] Phase 11 進行条件と Phase 13 blocked 条件が明記されている
- [ ] artifacts.json の Phase 10 ステータスが spec_created に整合している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-10/{main,go-no-go}.md` が実体ファイルとして配置済み
- [ ] AC-1〜AC-10 すべてに確認手段が割り当てられている（未割当 0 件）
- [ ] MINOR 4 件すべてに解決状態が記録されている（未記録 0 件）
- [ ] GO 条件のいずれかが未充足の場合は NO-GO と戻り先が明記されている
- [ ] blocker なしの場合は MINOR の未タスク化対象が unassigned 連携として確認されている

## 次Phase

- 次: Phase 11（手動テスト・VISUAL screenshot）
- 引き継ぎ事項: GO 判定 / AC↔screenshot マッピング / MINOR 解決結果（unassigned 化対象含む）
- ブロック条件: GO 条件のいずれかが未充足の場合は該当戻り先 Phase（機能=Phase 5 / テスト=Phase 6 / token=Phase 9 / 設計=Phase 2）へ戻る
