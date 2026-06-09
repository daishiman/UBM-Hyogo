# Phase 12: skill feedback report

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

task-specification-creator / aiworkflow-requirements の運用で得た、テンプレート観点・ワークフロー観点・ドキュメント観点の気づきを記録する。改善点なしでも出力する。

## テンプレート観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| implemented_local_evidence_captured × VISUAL の Phase 11 証跡分離 | VISUAL タスクでも implemented_local_evidence_captured 段階では PNG を取得できない。`screenshot-plan.json` / `phase11-capture-metadata.json` の status を `staging_visual_pending_user_gate` とし、`screenshots/.gitkeep` を作らず（PNG 0 件ディレクトリで validator error 回避）、manual-test-result.md に二段境界（implemented_local_evidence_captured 未撮影 / staging 認証 user-gated）を明記すると compliance check の Phase 11 inventory で `present`（メタ） / `pending`（PNG）の整合が取りやすい | 本 WF 内に反映済（改善は WF 内で吸収・新規テンプレート要求なし） |
| fail-soft 純関数ガードのデフォルト戦略 | WEEKGRD-02 のとおり純粋関数ガード（`normalizeTagSource`）は例外を投げず防御的に既知値へ畳む設計が、view builder の 500 を最小ブラスト半径で解消できた。union を拡張せず `.catch("manual")` で zod の最終防壁を二重化する two-layer 防御が再利用価値あり | 既存 lessons（WEEKGRD-02）で十分カバー済・新規追記不要 |

## ワークフロー観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| 非対称な fail-soft の発見手順 | 「同一データで一覧は 200・詳細は 500」という非対称から、ハンドラの 404/500 分岐ではなく**値ドメイン検証層（zod safeParse）**を真因として特定できた。一覧側が `parseTagsJson` で source を参照せず握る一方、詳細側が `TagSourceZ` で厳格検証する非対称が論点だった。「同データで挙動が割れたら検証層の厳格度差を疑う」診断手順が有効 | 本 WF の implementation-guide / compliance check に反映。汎用 reference 追記は今回必須ではない |
| DB CHECK 制約なしカラムの view 層吸収パターン | DB が任意文字列を許す（CHECK 制約なし）カラムを enum 検証する view 層では、DB ↔ enum 間に正規化純関数を必須で挟むパターンが横断的に有効。今回は `member_tags.source` だが `field_source` 等にも同型リスクがある | baseline として記録（起票しない）。横断監査は別ワークフロー候補 |

## ドキュメント観点

| 気づき | 内容 | アクション |
| --- | --- | --- |
| 不変条件の逐条引用が有効 | index.md / _shared-context.md が CLAUDE.md 不変条件（#1 schema 固定回避 / #5 D1 直接禁止 / OKLch トークン / *.spec.* のみ）を逐条引用しており、Lane B の「新規 primitive を生やさない」「HEX 直書きしない」判断の根拠が追いやすかった | 既存運用が良好・新規改善要求なし |

## 改善要求サマリ

- **緊急の skill 改善要求: なし。** 本 WF は既存テンプレート・既存パターン（implemented_local_evidence_captured × VISUAL の Phase 11 扱い / WEEKGRD-02 純関数ガード）で完結する。
- **将来提案: なし。** 今回検出した気づきは本 wave 内で implementation-guide / unassigned-task-detection / compliance check に反映済み。

## 完了条件

- [x] テンプレート/ワークフロー/ドキュメントの 3 観点で記録
- [x] 非対称 fail-soft の真因特定手順・DB CHECK 制約なしカラムの view 層吸収パターンを記録
- [x] 改善要求サマリ（緊急なし・将来提案なし）を記録

## 成果物

- `outputs/phase-12/skill-feedback-report.md`（本ファイル）

## 参照資料

- `outputs/phase-2/phase-2.md`（再利用判定・責務境界）
- `_shared-context.md` §1（真因・非対称の論点）
