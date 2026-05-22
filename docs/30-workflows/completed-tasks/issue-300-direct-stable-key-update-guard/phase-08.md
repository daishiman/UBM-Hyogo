[実装区分: 実装仕様書]

# Phase 8: docs 同期（database-implementation-core.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-08/main.md` |

## 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | modify | Schema Alias Resolution Contract に guard 実装パスを追記 |

## 追記内容（既存 § Schema Alias Resolution Contract セクション末尾）

```md
### Static guard

- `scripts/lint-stable-key-update.mjs` が以下を CI / pre-commit で拒否する:
  - `UPDATE schema_questions SET stable_key` を含む SQL リテラル / template literal（multiline 含む）
  - `.update(schemaQuestions).set({ stable_key | stableKey })` 形式の drizzle / builder 呼び出し
- 例外許可: `migrations/`, `**/__fixtures__/**`, `**/__tests__/**`, `**/*.spec.{ts,tsx,mjs,js}`
- CI gate: `.github/workflows/verify-stable-key-update.yml`
- pre-commit: `lefthook.yml` `block-stable-key-update`
- 詳細仕様: `docs/30-workflows/issue-300-direct-stable-key-update-guard/`
```

## index 再生成

`mise exec -- pnpm indexes:rebuild` を Phase 8 完了時に実行し、`.claude/skills/aiworkflow-requirements/indexes/` を最新化する。

## 統合テスト連携

Phase 12 documentation-changelog.md にて canonical absolute path として列挙する。

## 完了条件

- [ ] database-implementation-core.md に guard 実装パスが記載
- [ ] `pnpm indexes:rebuild` 実行計画が明記
- [ ] system-spec-update-summary.md からの参照経路が確定

## 次Phase

Phase 9（品質検証）
