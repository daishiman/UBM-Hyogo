# Phase 12 Task Spec Compliance Check

`task-specification-creator` skill の template 準拠チェック。

| # | 項目 | 期待 | 実績 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | 必須セクション 11 種 | 全 phase に含む | Phase 1〜13 全てに「メタ情報 / 目的 / 実行タスク / 参照資料 / 実行手順 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / 次 Phase」を確認 | **OK** |
| 2 | Phase 別追加セクション | template 通り | Phase 2 Mermaid / Phase 6 失敗ケース / Phase 7 AC matrix / Phase 8 Before/After / Phase 10 GO 判定 / Phase 12 中学生レベル | **OK** |
| 3 | 不変条件番号引用 | 多角的チェック観点に番号付き | #2, #3, #5, #6, #7, #9, #10, #11 が Phase 跨ぎで引用されている | **OK** |
| 4 | outputs path | `outputs/phase-XX/main.md` 必須 | 全 phase で main.md を要求、artifacts.json も整合 | **OK** |
| 5 | user_approval_required | Phase 13 のみ true | artifacts.json 確認、Phase 13 のみ true | **OK** |
| 6 | Mermaid 図 | Phase 2 に含む | architecture.md / admin-gate-flow.md にて Mermaid 含む | **OK** |
| 7 | Before/After 表 | Phase 8 に含む | DRY 化 Before/After 表確認 | **OK** |
| 8 | AC matrix | Phase 7 に含む | `outputs/phase-07/ac-matrix.md` 確認 | **OK** |
| 9 | failure cases | Phase 6 に網羅 | F-01〜F-22 を列挙（F-15 bypass query, F-16 偽造 cookie 含む） | **OK** |
| 10 | GO/NO-GO 判定 | Phase 10 に明記 | 条件付き GO（B-01 / B-03 既知制約付き） | **OK** |
| 11 | implementation flag | metadata に含む | artifacts.json `metadata.taskType: implementation`, `metadata.docs_only: false`。実装差分（apps/api, apps/web, packages/shared）と整合 | **OK** |
| 12 | 並列タスク共有契約 | Phase 2 / 3 に明記 | `GET /auth/session-resolve` を 05b と共有、本 implementation-guide にも記載 | **OK** |
| 13 | 中学生レベル説明 | Phase 12 implementation-guide に Part 1 として含む | Part 1 で日常生活の例え話と専門用語ミニ説明を記載 | **OK** |
| 14 | 技術者レベル説明 | Phase 12 implementation-guide に Part 2 として含む | TS 型定義 / API シグネチャ / エッジケース / 検証コマンド記載 | **OK** |

## 総合判定

**全 14 項目 OK** — `task-specification-creator` skill の template に準拠。Phase 11 の実 OAuth screenshot は staging 接続前のため未取得だが、`smoke-checklist.md` と正式未タスク `05a-followup-001` に委譲済み。

## 補足: 追加で満たした項目

- 接続図（Mermaid sequenceDiagram）を implementation-guide に含めた
- 残課題 R-1〜R-4 を ID 付きで列挙
- Phase 11 の BLOCKED 状態を明記（JWT/session-resolve/admin route tests + checklist で代替）
- root / outputs `artifacts.json` parity を確保（workflow root と `outputs/artifacts.json` を同期）
- 30種思考法 + エレガント検証を `elegant-verification.md` に記録
- 不変条件 #5 / #6 / #9 / #10 / #11 への対応マトリクス
