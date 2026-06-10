> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — 未タスク検出

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本ファイルは未タスク検出結果を記録する。0 件でも出力は必須。current（本 wave で新たに検出したもの）と
baseline（元タスク時点で既知の構造的境界）を分離して記録する。**新規 GitHub Issue は起票しない。**

## 検出サマリ

| 区分 | 件数 | 判定 |
| --- | --- | --- |
| current（本 wave で新規検出） | **0 件** | 起票なし |
| baseline（既知の構造的境界） | 2 件 | いずれも意図的スコープ外・YAGNI / 規約化候補・**起票しない** |

## current（本 wave で新規検出した未タスク）

**0 件。**

根拠:

- 本タスクは「2 段階削除の 2 段目」であり、`grep -rln 'PUBLIC_API_BASE_URL' apps/`（NEXT_PUBLIC_ 除外）で
  確定した **全 19 ファイルを今回サイクル内で完了**できる小規模スコープである（CONST_007・Phase 1 §8）。
  旧キーを全走査で 0 件にできる前提が満たされており、先送り・将来タスク分離は発生しない。
- 削除順序（Step 1→2）により、最重要 struggle point（public.ts の `?? env.PUBLIC_API_BASE_URL` 取りこぼし）は
  typecheck で機械検出される設計（Phase 2 §5）。仕様レベルの未決事項が残らない。
- `getApiBaseEnv()` / `ApiBaseEnv` の production consumer 0 件は grep 確認済みで、削除に伴う隠れた依存は無い（AC-2）。
- 変更は env キーの削除 / rename のみで、公開 API / D1 / Google Form / 認証境界 / UI に波及しない。横断的な未解決依存も生じない。
- Phase 1-3 の spec に TODO / skip / 保留事項は無い。よって current 未タスクは 0 件。

## baseline（既知の構造的境界 — 起票しない）

| ID | 内容 | 扱い |
| --- | --- | --- |
| B-1 | `INTERNAL_API_BASE_URL` / `AUTH_URL` 等、他 env キーの整理・命名見直し | 本タスクで**意図的スコープ外**（index.md §5）。本タスクは `PUBLIC_API_BASE_URL` 単一化に限定。他キーは現時点で二重化・dead path の兆候が無く、整理する価値が立っていない（**YAGNI**）。**起票しない**。 |
| B-2 | env 命名規約（`NEXT_PUBLIC_` / `INTERNAL_` 接頭辞のルール）のドキュメント化 | 本タスクで grep gate（AC-7）を `apps/` 全体に置くことで命名重複は機械監査可能になる。規約の明文ドキュメント化は将来の enhancement 候補だが、現状 1 命名へ収束した時点で必要性が薄く、今起票する根拠が無い（**規約化候補・将来**）。**起票しない**。 |

baseline 2 件はいずれも「本タスクのスコープ外として最初から切り出された境界」であり、本タスクの未達・取りこぼし
ではない。新規未タスク化の対象ではない。

## 関連タスク差分確認（重複起票防止）

- **起点 `staging-api-url-and-session-recovery`**（`docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`）:
  これが「2 段階削除の 1 段目」で旧キーを残置した起点 workflow。本タスクはその 2 段目であり、起点の残課題を回収する
  もの。同一主題の重複起票はしない。
- **元 unassigned spec `staging-api-url-and-session-recovery-followup-001-public-api-base-url-schema-removal`**:
  本タスク（issue #1145）はこの followup spec を現行コードへ最適化し apps/og を編入したもの。followup spec の scope を
  本タスクが包含・拡大しており、別 Issue として新規起票すると重複になる。**起票しない**。
- **issue #1145（CLOSED）**: 本仕様書が #1145 の現行コード最適化版である。#1145 自体は CLOSED のまま扱い、
  本 wave での新規重複 Issue 起票はしない。再 OPEN は user-gated。
- 本 wave で `apps/api` / D1 / Google Form / 認証境界 / UI への変更は無く、それらに紐づく派生未タスクも無い。

## 結論

current 未タスク **0 件**（全 19 ファイルを今回サイクルで完了予定・CONST_007）。baseline 2 件はいずれも意図的
スコープ外（B-1 YAGNI / B-2 将来の規約化候補）のため起票しない。本ファイルでの **新規 GitHub Issue 起票は行わない**。
