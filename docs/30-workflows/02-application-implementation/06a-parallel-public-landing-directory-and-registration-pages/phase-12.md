# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

実装ガイド / 仕様差分 / 変更履歴 / 未割当課題 / スキル feedback / 仕様準拠の 6 種を生成し、後続タスクと運用に渡す。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. implementation-guide.md
2. system-spec-update-summary.md
3. documentation-changelog.md
4. unassigned-task-detection.md
5. skill-feedback-report.md
6. phase12-task-spec-compliance-check.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-05/runbook.md | 実装手順 |
| 必須 | outputs/phase-07/ac-matrix.md | AC |
| 必須 | outputs/phase-09/main.md | 品質結果 |
| 必須 | outputs/phase-11/main.md | smoke 結果 |
| 参考 | doc/00-getting-started-manual/specs/05-pages.md | URL contract |

## 実行手順

### ステップ 1: implementation-guide.md

| 章 | 内容 |
| --- | --- |
| 概要 | apps/web の 4 公開ルート責務 |
| ディレクトリ | `apps/web/app/(/, /members, /members/[id], /register)` 構成 |
| URL contract | `q/zone/status/tag/sort/density` zod schema |
| fetcher | `apps/web/lib/fetch/public.ts` の使い方 |
| ESLint rule | window.UBM / stableKey 直書き禁止 |
| revalidate | `/`: 600s, `/members`: 60s, `/members/[id]`: 60s, `/register`: 86400s |
| 拡張ガイド | density 追加時の手順、tag chips の追加位置 |

### ステップ 2: system-spec-update-summary.md

| spec | 差分 | 反映 |
| --- | --- | --- |
| specs/05-pages.md | URL contract 4 種を fix | 必要時に PR |
| specs/12-search-tags.md | density 値を `comfy/dense/list` に固定 | 反映済み |
| specs/16-component-library.md | `MemberCard` の props 確定 | 反映済み |

### ステップ 3: documentation-changelog.md

| 日付 | 変更 | 理由 |
| --- | --- | --- |
| 2026-04-26 | 06a 仕様書 13 phase 完成 | application-implementation Wave 6 |
| 2026-04-26 | URL query zod schema を確定 | 不変条件 #8 |
| 2026-04-26 | `/no-access` 不採用を再宣言 | 不変条件 #9 |

### ステップ 4: unassigned-task-detection.md

| ID | 観点 | 担当候補 |
| --- | --- | --- |
| U-01 | i18n（ja のみ） | 将来 wave |
| U-02 | OGP / sitemap | 09a / 09b |
| U-03 | analytics（Cloudflare Web Analytics） | 09a |
| U-04 | tag 5 件 truncate UI 改良 | 06a 後続 |
| U-05 | mobile FilterBar 折り返し改善 | 09c |

### ステップ 5: skill-feedback-report.md

| 観点 | 内容 |
| --- | --- |
| 役立ったスキル | spec 駆動開発 / RSC + Cache-Control / zod |
| 困難 | density の用語統一に時間 |
| 改善案 | spec 用語辞書を common doc に |

### ステップ 6: phase12-task-spec-compliance-check.md

| チェック | 結果 |
| --- | --- |
| 13 phase 構成 | OK |
| 共通必須セクション | OK |
| 不変条件 #1, #5, #6, #8, #9, #10 への明示 | OK |
| AC-1〜AC-12 トレース | OK |
| 6 種ドキュメント生成 | このファイル含め OK |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description で 6 種を紹介 |
| 後続 Wave | unassigned-task を引き取り |

## 多角的チェック観点

- 不変条件 #1: stableKey 参照ルールがガイドに含む
- 不変条件 #5: D1 直接禁止がガイドに含む
- 不変条件 #6: window.UBM / localStorage 不採用が変更履歴に
- 不変条件 #8: URL query 正本がガイドに
- 不変条件 #9: `/no-access` 不採用が変更履歴に
- 不変条件 #10: revalidate 戦略がガイドに

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | 7 章 |
| 2 | system-spec-update-summary | 12 | pending | 3 spec |
| 3 | documentation-changelog | 12 | pending | 3 行 |
| 4 | unassigned-task-detection | 12 | pending | 5 件 |
| 5 | skill-feedback-report | 12 | pending | - |
| 6 | phase12-compliance-check | 12 | pending | self check |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | 実装ガイド |
| 差分 | outputs/phase-12/system-spec-update-summary.md | spec 差分 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| 課題 | outputs/phase-12/unassigned-task-detection.md | 未割当 |
| feedback | outputs/phase-12/skill-feedback-report.md | feedback |
| 自己点検 | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 種すべて生成
- [ ] 不変条件 #1, #5, #6, #8, #9, #10 への記述あり
- [ ] AC-1〜AC-12 がガイドに反映

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- 6 種ドキュメント配置
- 不変条件への明示
- 次 Phase で承認 gate を通す準備完了

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 6 種ドキュメントを PR description に
- ブロック条件: ドキュメント不足なら進まない
