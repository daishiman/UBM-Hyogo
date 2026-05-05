[実装区分: 実装仕様書]

# Skill Feedback Report

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |

> 本レビューで stale lessons 記述を同 wave 修正対象に昇格した。新規 skill template 追加は行わない。

## 判定

**FEEDBACK_PARTIALLY_PROMOTED**

理由:

- LL-1 は既存 `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-authjs-admin-gate-2026-04.md` に stale Issue #385 記述が存在したため、別タスク化せず同 wave で Plan A / Phase 11 PASS へ更新する
- defer 観察 2 件は将来 skill 改訂時の参考メモとして本 report に残すのみ

## 改善候補

| 観点 | 記録内容 | promotion target / no-op reason | evidence path | 採否 |
| --- | --- | --- | --- | --- |
| lessons-learned promotion (LL-1) | 「next-auth top-level import を避け `getAuth()` lazy factory 化することで Next.js 16 + React 19 prerender 環境での `useContext` null 連鎖を回避できる」を既存 05a lessons に反映 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-authjs-admin-gate-2026-04.md` | `phase-01.md`（真因） / `phase-02.md`（Plan A 採択） / `outputs/phase-12/implementation-guide.md` | **Promote in wave** |
| テンプレート確認 | NON_VISUAL implementation-spec / Phase 12 strict 6 files / lazy factory 系真因の構造的記録が、task-specification-creator 現行テンプレで漏れなく吸収できることを確認 | no-op: 既存テンプレで十分。promotion 不要 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | **Defer**（観察記録のみ） |
| ワークフロー観察 | Issue が CLOSED 状態のまま仕様書化するケース（過去 issue の lessons-learned 化）が Phase 1-13 完全 13 段で成立することを確認 | no-op: 必要時に skill 側で「CLOSED issue 仕様書化」節を追記検討 | 本ワークフロー全体 | **Defer**（観察記録のみ） |

## Plan A 採択経緯から学ぶ patterns

- 「first choice (`"use client"` 撤廃) を実装試行で disprove → 真因の二次仮説 (`next-auth` top-level import) を切り分け実験で確定 → lazy factory による隔離方針へピボット」という 3 段階のプロセスが、Next.js + React 19 のような上流仕様変更の最中で発生する prerender 系不具合の標準的調査ルートになる。task-specification-creator の Phase 1-2 設計レビューに「first choice disprove → 真因再評価」フローの注意書きを足す価値がある。
- prerender 経路と runtime 経路の責務分離（lazy factory）は Next.js App Router 全般に適用可能なリスクヘッジ。skill reference として整理すれば、将来 next-auth 以外の Provider ライブラリ（i18n / theme / tracking）でも再利用できる。

## routing 必須フィールド

| エントリ | promotion target / no-op reason | evidence path | 判定 |
| --- | --- | --- | --- |
| LL-1 | existing stale lessons target updated in wave | implementation-guide.md / phase-01.md / phase-02.md | Promote |
| テンプレート確認 | no-op (既存テンプレ十分) | phase-12-spec.md | Defer |
| CLOSED issue 仕様書化観察 | no-op (将来検討) | 本ワークフロー | Defer |

## まとめ

本タスクから新規 skill template へ即時 promote する変更はない。LL-1 は既存 lessons の stale 記述更新として同 wave に含める。
