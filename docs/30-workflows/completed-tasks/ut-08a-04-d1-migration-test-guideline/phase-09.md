# Phase 9: 品質保証

## 実行コマンド一覧

```bash
# 1. bats 新規 + 既存全体
bats scripts/d1/__tests__/migration-guideline-presence.bats
bats scripts/d1/__tests__/*.bats

# 2. YAML lint（actionlint がローカルにある場合）
actionlint .github/workflows/d1-migration-verify.yml

# 3. typecheck / lint（本タスクは TS 変更なしだが回帰確認）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. 文書 link 確認
grep -F "d1-migration-test-guideline.md" apps/api/migrations/README.md
test -f docs/30-workflows/runbooks/d1-migration-test-guideline.md

# 5. apps/web への変更ゼロ確認（D1 不変条件 #5）
git diff --stat dev...HEAD -- apps/web | wc -l  # 0 を期待

# 6. CI comment 独立性確認
grep -F "always() && github.event_name == 'pull_request'" .github/workflows/d1-migration-verify.yml
grep -F "continue-on-error: true" .github/workflows/d1-migration-verify.yml
```

## ゲート

- bats 全 pass
- typecheck / lint green（既存と回帰差なし）
- 文書 link 検証 OK
- apps/web 変更ゼロ
- CI comment step が verify 結果から独立している

## 失敗時の対応

- bats fail → Phase 5 の文書 / bats 内容を見直し再修正
- typecheck / lint fail → 本タスクのスコープ外の変更が混入していないか確認、必要なら最小修正
- link broken → Phase 5 step 2 の相対パスを再計算
- CI comment 独立性 grep fail → Phase 2/5 の snippet と workflow 実装を同期

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 9 |
| status | completed |

## 目的

実装後の品質ゲートをコマンドとして固定する。

## 実行タスク

- bats、lint、typecheck、link check、CI comment static check を実行する。
- 失敗時の修正先を明確化する。

## 参照資料

- `phase-04.md`
- `phase-05.md`

## 成果物/実行手順

実行ログを Phase 11 evidence として保存する。

## 完了条件

- ゲート項目がすべて green または明示的な `runtime_pending` 理由付きで分離されている。

## 統合テスト連携

`bats scripts/d1/__tests__/*.bats` と repository-wide `pnpm typecheck` / `pnpm lint` に接続する。
