# Phase 11 Output: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 |
| 下流 | Phase 12（ドキュメント更新） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ

NON_VISUAL タスクのためスクリーンショットは作成しない。証跡は `manual-smoke-log.md`（主証跡 = AC-8 充足）と `link-checklist.md`（リンク整合）に集約。**TC-01〜TC-04 / TC-F-01/02 / TC-R-01/02 全件 PASS**。

## 1. 証跡構成

| ファイル | 役割 |
| --- | --- |
| `manual-smoke-log.md` | 比較表 / 採用案 / rollback / 他プロジェクト副作用の手動レビューログ（主証跡） |
| `link-checklist.md` | 仕様書内 / 成果物間のリンク整合チェック表 |

> NON_VISUAL のため `screenshots/` ディレクトリは作成しない（`.gitkeep` も置かない）。AC-8 充足の根拠は `manual-smoke-log.md`。

## 2. 実施範囲

| カテゴリ | TC | 結果 |
| --- | --- | --- |
| 主シナリオ | TC-01 / TC-02 / TC-03 / TC-04 | PASS |
| Fail path | TC-F-01 / TC-F-02 | PASS（読み合わせ） |
| 回帰 guard | TC-R-01 / TC-R-02 | PASS |

## 3. 実施日時

2026-04-28（Phase 11 実行時）

## 4. 注意事項（再掲）

- `~/.claude/settings.json` / `~/.zshrc` / `.env` の中身を `cat` / `Read` で開かない
- 実値の転記禁止
- 実書き換え禁止（`task-claude-code-permissions-apply-001` で実施）

## 5. 完了条件チェック

- [x] TC 全件の PASS/FAIL を `manual-smoke-log.md` に記録
- [x] リンク整合を `link-checklist.md` に記録
- [x] AC-8 を PASS として確定

## 6. 次 Phase へのハンドオフ

- Phase 12: 必須 7 種成果物を作成
- Phase 12 `phase12-task-spec-compliance-check.md` で `outputs/phase-11/` の存在確認

## 7. 参照資料

- `phase-11.md`
- `outputs/phase-4/test-scenarios.md`
- `outputs/phase-5/comparison.md`
- `outputs/phase-6/main.md`
