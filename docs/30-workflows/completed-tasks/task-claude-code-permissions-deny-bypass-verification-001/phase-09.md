# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | pending |

## 目的

Phase 1〜8 成果物の **品質を最終確認**し、Phase 10 の最終レビューに進める品質を担保する。
docs-only タスクのため、ここでの QA は **ドキュメント品質 + 機密情報非混入 + skill 準拠** に絞る。

## QA 観点

### QA-1: skill 準拠

| 項目 | チェック |
| --- | --- |
| Phase 1〜13 のファイル名 | `phase-01.md`〜`phase-13.md`（ゼロ詰め 2 桁） |
| 各 Phase メタ情報テーブル | task-specification-creator skill の定義と一致 |
| `artifacts.json` 構造 | 上流タスク（decisive-mode）と互換 |
| `index.md` の AC | 8 項目以上、トレース可能な書式 |

### QA-2: 機密情報非混入

| 検査対象 | 期待 |
| --- | --- |
| 全 phase ファイル | API token / OAuth token / `.env` 実値が含まれない |
| `outputs/phase-*/` | 同上 |
| 検証ログテンプレート | 機密項目のプレースホルダ化が指示されている |

検査コマンド（Phase 11 で実行）:

```bash
grep -rEi "(api[_-]?token|sk-[a-zA-Z0-9]|ANTHROPIC_API_KEY=)" \
  docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/
```

### QA-3: 整合性

| 項目 | チェック |
| --- | --- |
| `index.md` Phase 表 | `artifacts.json` の `phases[]` と一致 |
| 各 phase の `主成果物` | `artifacts.json` の `outputs[]` と一致 |
| 上流タスク参照パス | 実在パスを指している |
| 下流タスク参照パス | 実在しない場合は「未作成」と明記 |

### QA-4: 実行可能性

| 項目 | チェック |
| --- | --- |
| Phase 5 runbook | 第三者が手元で再現可能な詳細度 |
| 安全チェックリスト | 各項目が機械的に確認可能 |
| 観測ログテンプレート | 列定義が一意 |

### QA-5: NON_VISUAL 判定整合

| 項目 | チェック |
| --- | --- |
| `screenshots/` ディレクトリ | 作成されていない（NON_VISUAL のため） |
| `screenshots/.gitkeep` | 存在しない |
| Phase 11 の主証跡 | `manual-smoke-log.md` / `verification-log.md` |

## 不適合発生時の対応

| 不適合カテゴリ | 差戻先 |
| --- | --- |
| skill 準拠 | Phase 8（リファクタ） |
| 機密情報混入 | 即時削除 + Phase 4 / Phase 5 再設計 |
| 整合性 | Phase 7（カバレッジ） |
| 実行可能性 | Phase 5（runbook） |

## 主成果物

- `outputs/phase-9/main.md`（QA チェック結果）

## スコープ外

- コード品質
- 検証実施

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 1〜8 全成果物
- `.claude/skills/task-specification-creator/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] QA-1〜QA-5 のチェック結果が成果物に揃う
- [ ] 不適合 0 件、または差戻先が明示されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
