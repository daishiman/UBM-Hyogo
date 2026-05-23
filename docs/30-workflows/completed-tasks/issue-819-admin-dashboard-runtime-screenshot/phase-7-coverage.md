# Phase 7: カバレッジ

## 7.1 結論

本タスクはコード差分ゼロのため、line / branch coverage 変化は **0%（変化なし）**。

## 7.2 確認方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
# 期待: pre-existing coverage と同値
```

## 7.3 coverage-guard hook の挙動

CLAUDE.md「sync-merge (main 取り込み) 時の hook 挙動」セクションに従い、`pre-push coverage-guard` は本タスクでは:

- push 範囲に merge commit を含まない通常 push のため hook は通常通り発火
- ただしコード変更が doc + PNG のみ (`apps/web/**` `apps/api/**` への永続差分なし) のため、`--changed` モードでも変更ファイルが coverage 対象外と判定され pass する想定

万一 false positive で fail した場合は `scripts/coverage-guard.sh` の判定ロジックを確認し、本タスクが該当する例外条件（非コード変更のみ）に該当することをログに残す。
## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

runtime evidence capture が既存 coverage を下げないことを確認する。

## 実行タスク

- 恒久コード変更がないことを確認する。
- focused test と build の維持を確認する。

## 参照資料

- `phase-6-test-additions.md`
- `phase-11-manual-test.md`

## 成果物

- coverage 判断
- no-code-permanent-change の根拠

## 完了条件

coverage 追加より runtime evidence 取得が主目的であることが明確である。

- [ ] runtime evidence 取得が主目的であり coverage 低下がないことを確認できる

## 統合テスト連携

Phase 11 の focused test と build log を coverage 維持の証跡にする。
