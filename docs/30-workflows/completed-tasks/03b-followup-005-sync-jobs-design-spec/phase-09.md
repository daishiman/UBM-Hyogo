# Phase 9: indexes 再生成 + drift 検証 + typecheck / lint / test 実行

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 9 / 13 |
| Phase 名称 | indexes 再生成 + drift 検証 + typecheck / lint / test |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 8 (`database-schema.md` 参照更新) |
| 次 Phase | 10 (レビュー + 整合確認) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

Phase 6-8 の変更を踏まえ、`pnpm indexes:rebuild` で skill indexes を再生成して drift を解消し、`typecheck` / `lint` / `test` を全件実行して AC-9 / AC-10 / AC-6 の最終 PASS を確認する。

## 実行タスク

1. `mise exec -- pnpm install`（zod 追加した場合や lock 同期確認）
2. `mise exec -- pnpm indexes:rebuild` 実行
3. `git status .claude/skills/aiworkflow-requirements/indexes` で drift 0 件を確認
4. drift があれば commit に含める
5. `mise exec -- pnpm typecheck` 全件 PASS
6. `mise exec -- pnpm lint` 全件 PASS
7. `mise exec -- pnpm --filter @ubm-hyogo/api test` 全件 PASS
8. 出力ログを `outputs/phase-09/main.md` に保存

## 実行コマンド一覧

```bash
mise exec -- pnpm install
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

## 期待結果

| コマンド | 期待 |
| --- | --- |
| `pnpm indexes:rebuild` | 正常終了 |
| `git status .../indexes` | 出力 0 行 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm --filter @ubm-hyogo/api test` | 全テスト PASS |

## 失敗時の分岐

| 失敗 | 対応 |
| --- | --- |
| indexes drift 残存 | 差分を本 PR に含める |
| typecheck fail | Phase 7 の差し替え漏れを Phase 5 grep で再確認 |
| lint fail | `pnpm lint --fix` 適用 → 残違反は手修正 |
| 既存テスト fail | INV-5 違反、Phase 7 ロールバック判定 |

## DoD

- [ ] indexes drift 0 件
- [ ] typecheck PASS
- [ ] lint PASS
- [ ] test 全 PASS
- [ ] 出力ログが `outputs/phase-09/main.md` に保存されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 各コマンドの実行ログ |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 統合テスト連携

- 本 Phase が de facto 全体統合テスト
- Phase 11 evidence で同コマンドを再実行し PASS を確証

## 完了条件

- [ ] AC-6 / AC-9 / AC-10 が PASS
- [ ] 失敗があった場合の対応が記録されている

## 次 Phase

- 次: 10（レビュー + 整合確認）
- 引き継ぎ事項: 全 PASS 状態
- ブロック条件: drift / fail が解消できない
