# Phase 6: 異常系検証（failure-cases）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タイトル | 異常系検証 / 苦戦箇所 6 項目の失敗シナリオ |
| 状態 | completed |
| 作成日 | 2026-04-29 |
| 入力 Phase | Phase 3 / Phase 4 / Phase 5 |
| 出力対象 | `outputs/phase-06/failure-cases.md` |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |

## 概要

`index.md` §「苦戦箇所・知見」で挙げた 6 項目を、それぞれ (1) 失敗シナリオ (2) 検出方法 (3) 対処 のテーブル形式で記録する。Phase 4 の TC-1〜TC-8、Phase 7 の AC-1〜AC-10 と防御線で結びつける。再現は `/tmp/ut-gov-005-failure-sandbox/` で行い、本物の `.claude/` / `docs/30-workflows/` を破壊しない。

## FC-A visualEvidence 未設定で縮約テンプレが発火しない

| 区分 | 内容 |
| --- | --- |
| 失敗シナリオ | 新規 docs-only タスクで `artifacts.json.metadata.visualEvidence` を未設定のまま Phase 11 に進み、screenshot 関連 outputs を作ってしまう |
| 検出方法 | `jq -r '.metadata.visualEvidence' artifacts.json` が `null` を返す。SKILL.md タスクタイプ判定フローの「未設定 → 進行不可」ブランチで Phase 1 完了条件 fail-fast |
| 対処 | Phase 1 で `visualEvidence` を `NON_VISUAL` または `VISUAL` に確定 → AC-6 / TC-4-1（`phase-template-phase1.md` の必須入力ルール）で再発防止 |

## FC-B Phase 12 Part 2 必須要件 5 項目のチェック漏れ

| 区分 | 内容 |
| --- | --- |
| 失敗シナリオ | implementation 系タスクの `outputs/phase-12/implementation-guide.md` で型定義のみ書きエラー処理 / 設定値が欠落、close-out 直前まで気付かない |
| 検出方法 | `rg -n "C12P2-[1-5]" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` で 5 件取得し、各項目を guide 側で `rg "エラー処理\|設定"` 検索 → 0 件項目を FAIL 判定 |
| 対処 | C12P2-1〜5 を一対一でチェック項目化（AC-3 / TC-3-1, TC-3-2）。漏れた項目を guide に追記し再判定 |

## FC-C spec_created を誤って completed に書換え

| 区分 | 内容 |
| --- | --- |
| 失敗シナリオ | docs-only タスクの Phase 12 close-out で `index.md` の `状態` を `completed` に書換え、`workflow_state` と Phase 別 `status` の区別が崩れる |
| 検出方法 | `phase-12-completion-checklist.md` docs-only ブランチで「workflow root = `spec_created` 維持 / `phases[].status` のみ `completed`」を要求。`grep -E "^状態: completed" index.md` がヒットしたら FAIL |
| 対処 | `index.md` の `状態` を `spec_created` に戻し、`artifacts.json.phases[].status` のみ `completed` に維持（AC-4 / TC-3-3, TC-3-4）|

## FC-D `.agents/` mirror 同期忘れ

| 区分 | 内容 |
| --- | --- |
| 失敗シナリオ | Phase 5 Step 1〜5 で `.claude/skills/` のみ更新し、Step 6（`.agents/` 同期）をスキップ。`git status` には両 path が tracked で映らないため気付かない |
| 検出方法 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` が 1 行以上を出力（AC-5 / TC-5-1）|
| 対処 | Phase 5 Step 6 の `cp` ループを再実行 → 再度 `diff -qr` で 0 行確認。Phase 5 末 / Phase 9 / Phase 11 の 3 箇所で再検証して多重防御 |

## FC-E 遡及適用判断の運用割れ

| 区分 | 内容 |
| --- | --- |
| 失敗シナリオ | UT-GOV-001 等の進行中 docs-only タスクで Phase 11 着手時に縮約テンプレを適用するか判断が分かれ、人によって 3 点 outputs と screenshot outputs が混在 |
| 検出方法 | Phase 12 documentation の遡及適用方針記述を `rg -n "遡及適用\|新規 Phase 1\|進行中" outputs/phase-12/main.md` で確認。記述不在なら `unassigned-task-detection.md` 行きとして検出 |
| 対処 | TECH-M-03 として「新規タスクは Phase 1 から / 進行中タスクは Phase 11 着手時に再判定」を明文化。影響タスクの `artifacts.json.metadata.visualEvidence` を再判定 |

## FC-F drink-your-own-champagne 循環参照

| 区分 | 内容 |
| --- | --- |
| 失敗シナリオ | 本ワークフロー Phase 11 を Phase 5 完了前に着手し、縮約テンプレが skill 未反映の状態で `outputs/phase-11/` を作る → 「縮約テンプレに従って作った」とラベルしながら正本不在 |
| 検出方法 | Phase 11 着手時に `rg -n "縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md` を実行 → 0 件なら未コミット → 着手中止 |
| 対処 | Phase 2 §7 / Phase 5 自己適用順序ゲートに従い「Phase 5 完了 → Phase 11 着手」の順序を厳守。AC-8 は Phase 11 で初回 GREEN とする |

## 防御線サマリー

| FC | 防御 Phase | 関連 AC / TC | fail-fast 機能箇所 |
| --- | --- | --- | --- |
| FC-A | Phase 1 / 5 | AC-6 / TC-4-1 | Phase 1 完了条件 |
| FC-B | Phase 5 | AC-3 / TC-3-1, TC-3-2 | Phase 12 close-out 前 |
| FC-C | Phase 5 | AC-4 / TC-3-3, TC-3-4 | Phase 12 close-out 判定 |
| FC-D | Phase 5 Step 6 / 9 / 11 | AC-5 / TC-5-1 | 3 箇所の `diff -qr` |
| FC-E | Phase 12 | TECH-M-03 | Phase 12 documentation |
| FC-F | Phase 5 / 11 | 自己適用順序ゲート / AC-8 | Phase 11 着手時の `rg` |

## sandbox 設計

```bash
mkdir -p /tmp/ut-gov-005-failure-sandbox
cp -r .claude/skills/task-specification-creator /tmp/ut-gov-005-failure-sandbox/claude-skill
cp -r docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync /tmp/ut-gov-005-failure-sandbox/workflow
# FC-A〜F を sandbox 内で再現し観察ログを記録
# 完了後: rm -rf /tmp/ut-gov-005-failure-sandbox
```

## 苦戦箇所への inversely 反映

| 苦戦箇所（index.md §） | 対応 FC | Phase 12 documentation 反映先 |
| --- | --- | --- |
| visualEvidence 未設定 | FC-A | `phase-template-phase1.md` 必須入力ルール |
| Part 2 チェック漏れ | FC-B | `phase-12-completion-checklist.md` C12P2-1〜5 |
| spec_created 誤書換え | FC-C | `phase-12-completion-checklist.md` docs-only ブランチ |
| mirror 同期忘れ | FC-D | Phase 5 Step 6 / Phase 9 / Phase 11 の 3 箇所検証 |
| 遡及適用判断 | FC-E | Phase 12 main.md 遡及適用方針 |
| 循環参照 | FC-F | Phase 2 §7 自己適用順序ゲート |

## スコープ外（unassigned-task-detection 候補）

- mirror parity の CI gate 化 → TECH-M-02
- skill-fixture-runner 連携 → TECH-M-04
- 遡及適用方針の他タスクへの一括反映 → TECH-M-03 派生
