# Phase 12: 未タスク検出（unassigned-task-detection）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

元タスク仕様書のスコープ外事項、Phase 3-10 の MINOR 指摘、Phase 11 発見事項、コードコメント TODO を確認し、本サイクルで起票すべき未タスクを検出する。0 件でも出力する。

## 検出ソースと結果

### 1. 元タスク仕様書のスコープ外（index.md「既知のスコープ外」）

| 事象 | 候補化 | 起票判定 |
| --- | --- | --- |
| `Permissions-Policy: browsing-topics` 警告 | 候補外 | Chromium 標準警告・自社外・起票しない |
| `content.js POST http://127.0.0.1:8888 ERR_CONNECTION_REFUSED` | 候補外 | ブラウザ拡張由来・自社外・起票しない |
| `[Sentry] Sentry.init() in a browser extension` | 候補外 | ブラウザ拡張バンドル由来・自社外・起票しない |
| staging デプロイ齟齬（旧 bundle 残存）の運用是正 | 候補外 | 本 WF の統合テスト + 末尾スラッシュ許容で再発検知/緩和。デプロイ操作は user-gated・新規未タスク不要 |

### 2. Phase 3-10 の MINOR 指摘

Phase 3 設計レビューの 4 条件評価は全 PASS。代替案 B/C は不採用理由が確定済（ハードコード増 / 副作用）であり、MINOR 候補として残るものは検出されない。

| 指摘 | 検出 |
| --- | --- |
| Phase 3-10 MINOR | 0 件（4 条件 PASS・代替案は不採用理由確定済） |

### 3. Phase 11 発見事項

Phase 11 は implemented_local_evidence_captured のため focused Vitest と static UI contract screenshot は実行済み。staging runtime 検証は user-gated。実行由来の新規発見は無い。

| 発見 | 検出 |
| --- | --- |
| Phase 11 実行発見 | 0 件（focused Vitest + static UI contract screenshot 実行済み） |

### 4. コードコメント TODO

対象実装ファイル（trailing-slash.ts は新規・他 4 ファイルは編集）に本タスク由来の新規 TODO/FIXME を残さない方針。既存 TODO の検出は無い。

| TODO | 検出 |
| --- | --- |
| 新規 TODO/FIXME | 0 件 |

## 別観点候補（起票しない・スコープ外理由を明記）

| 候補 | 内容 | 今回スコープ外理由 |
| --- | --- | --- |
| Auth.js JWT cookie chunk 対応 | セッション JWT が大きい場合の cookie chunk 分割対応 | 現状再現（`/me/` 404）に直結する証跡が無く別観点。本不具合はルート解決層の末尾スラッシュ問題であり JWT サイズとは独立 |
| JWT サイズ削減 | セッション JWT のペイロード削減 | 同上。現状再現に直結する証跡が無く別観点。必要時に別ワークフローで扱う |

> これら 2 候補は index.md「既知のスコープ外」に記録済みの別観点。現状再現に直結する証跡が無いため **起票しない**。

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| current（本サイクルで完結） | T01（apps/api trailing-slash + 統合テスト）/ T02（web proxy 修正）/ T03（防御的 UX + `SectionError` 拡張）。先送り・別 PR・バックログ送りは無し |
| baseline（既存・本サイクル対象外） | Auth.js JWT cookie chunk / JWT サイズ削減（別観点・証跡なし）。staging デプロイ運用是正（user-gated 運用） |

## 重複チェック

| 確認項目 | 結果 |
| --- | --- |
| 既存 issue との重複 | 別観点 2 候補は起票しないため重複の発生なし |
| 兄弟ワークフローとの重複 | 本 WF の T01/T02/T03 は新規（`/me/` 末尾スラッシュ 404 を扱う既存 WF は無し）。重複なし |
| 本サイクル内タスク間の重複 | T01（API ルーティング）/ T02（web proxy）/ T03（web UI）は関心分離済・重複なし |

## 検出結果サマリ

**新規未タスク: 0 件。新規 Issue: 0 件。** current 3 タスクは本サイクルで完結。別観点 2 候補（JWT 関連）は証跡無しのため起票しない。

## 完了条件

- [x] スコープ外/MINOR/Phase11発見/TODO の 4 ソースを確認
- [x] JWT cookie chunk / サイズ削減を別観点候補として記録（起票しない理由を明記）
- [x] current / baseline を分離
- [x] 重複チェック欄を設置
- [x] 検出 0 件として出力

## 成果物

- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）

## 参照資料

- `index.md`（既知のスコープ外）
- `outputs/phase-3/phase-3.md`（4 条件評価・代替案）
