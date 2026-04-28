# Skill フィードバックレポート — forms-schema-sync-and-stablekey-alias-queue

## 1. 対象 skill

- `task-specification-creator`（タスク仕様書 13 phases 生成）
- `aiworkflow-requirements`（仕様参照）
- `int-test-skill`（vitest 統合テスト設計）

## 2. 良かった点

| skill | 観点 | 内容 |
| --- | --- | --- |
| task-specification-creator | Phase 構造の明瞭さ | Phase 1〜13 の責務分離が明確、特に Phase 11（smoke）/ 12（doc）/ 13（PR）の分離で「実装→検証→引き継ぎ」が直線的 |
| task-specification-creator | AC マトリクスのテンプレ | Phase 7 ac-matrix.md の AC × 検証 × 実装トレースが下流タスク引き継ぎでそのまま使える |
| aiworkflow-requirements | Progressive Disclosure | 31 項目・formId 等の固定値が CLAUDE.md / specs に集約されており参照コストが低い |
| int-test-skill | Mock 契約テスト | `SchemaSyncDeps` を interface で切ったことで Mock 注入が容易、194 / 194 PASS を高速で達成 |

## 3. 改善提案

### 3.1 task-specification-creator: 並列 Wave 共通モジュールの owner 明示

- **症状**: 03a / 03b は同 wave 並列で `sync_jobs` ledger を共有する設計だが、index.md の dependency matrix に「共有モジュールの owner」列がなく、重複設計の余地が残る。
- **提案**: `index.md` のテンプレに「**並列タスクとの共有モジュール**」セクションを追加し、`_shared/` 配下のファイルごとに owner / consumer を明記する。
- **期待効果**: 並列実装者間で重複モジュール定義が起きるリスクを低減。

### 3.2 task-specification-creator: UI 無しタスクの Phase 11 テンプレ分岐

- **症状**: Phase 11 のテンプレが「Apple UI/UX 視覚的検証」を前提としており、`ui_routes: []` のタスクでは「N/A」を毎回明示する手間がある。
- **提案**: artifacts.json の `ui_routes` が空配列の場合、Phase 11 を **API smoke evidence template** に自動切り替えする分岐をテンプレに追加。
- **期待効果**: API-only タスク（sync / cron 系）の evidence 品質が均質化する。

### 3.3 task-specification-creator: implementation-guide の Part 1/Part 2 構造の標準化

- **症状**: Phase 12 の Part 1（中学生レベル）/ Part 2（技術者レベル）の分離は良いが、章立てが各タスクで揺れがち。
- **提案**: テンプレに章見出し（困りごと → 解決後 → 専門用語 → アーキ → interface → API → エッジケース → 禁止事項 → 運用 → 下流連携）を固定化。
- **期待効果**: PR レビューでの読み出し速度が向上、AI 生成出力のばらつきも減る。

### 3.4 int-test-skill: Cloudflare D1 binding mock の共通化

- **症状**: D1 mock を各 test ファイルで個別に書きがちで、stub 実装が重複する。
- **提案**: `apps/api/test-utils/` に D1 binding mock factory を提供し、int-test-skill から雛形 import を案内する。

## 4. ニュートラル所見

- `task-specification-creator` の「Phase 12 で 6 成果物」というルールは厳格で良いが、本タスクのように **`main.md` 込み 7 成果物** とする運用の方が PR 説明素材として揃う。今回は仕様書通り 7 ファイル生成済み。

## 5. 採否判断（参考）

- 上記 3.1〜3.3 は task-specification-creator 側で取り込み価値が高い。
- 3.4 は int-test-skill の次回更新時に検討推奨。
