# Phase 11 発見事項（discovered-issues）

> タスク: sidebar-footer-pinning-and-account-popover-ux / implemented_local_evidence_captured / 2026-06-02

## スコープ内（本サイクルで解消）

| ID | concern | 内容 | 対応 |
|----|---------|------|------|
| C1 | footer 固定 | sidebar `min-height:100vh` で nav 超過時に下部領域が fold 下 | Phase 5 で `height:100dvh` + aside 2 段 flex |
| C2 | collapse はみ出し | 4rem 幅でアイコン左寄せ + badge 溢れ | Phase 5 で overflow-hidden + justify-center + badge ドット |
| C3 | popover dismiss | `<details>` 外側クリックで閉じない | Phase 5 で browserDocument 経由 listener |
| C4 | footer sticky | PublicFooter が短コンテンツで最下部に張り付かない | Phase 5 で main flex-col + margin-top:auto |

## スコープ外の発見（未タスク候補・Phase 12 で整理）

| ID | 内容 | 判定 |
|----|------|------|
| TECH-M-02 | 外側クリック dismiss を汎用 hook（`useDismissable`）へ抽出 | 未タスク候補（formalize せず）。再利用需要が出たら抽出 |
| OBS-01 | `globals.css` の `[data-shell="sidebar"]` 重複 3 ブロック（1417/1547/2010）の構造的整理 | 既存 drift。本タスクは値整合のみ。統合は別タスク候補 |
| OBS-02 | `legacy-public.css` の `public-footer` 重複 2 ブロック（716/1186）整理 | 同上 |

## HIGH 問題（自動 unassigned-task 生成対象）

なし（implemented_local_evidence_captured 段階。実装済みの Phase 11 実走で再評価する）。
