# Phase 10: ローカル / staging 検証 / dry-run

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| Source | `outputs/phase-10/phase-10.md` |
| 区分 | 検証（fixture-driven） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5-7 の実装を fixture 駆動で E2E 検証し、HIGH alert シナリオの dry-run を 1 件成功させる。

## 実行タスク

1. **vitest 全件 green 確認**
   ```bash
   mise exec -- pnpm --filter @ubm/api test src/audit-correlation
   ```

2. **bats / shellcheck**
   ```bash
   mise exec -- bash scripts/audit-correlation/__tests__/grep-gate.bats
   mise exec -- bash scripts/audit-correlation/__tests__/runner-determinism.bats
   shellcheck scripts/audit-correlation/*.sh
   ```

3. **HIGH alert シナリオ dry-run**
   - 入力: `fixtures/github-org-update-member.json` + `fixtures/cloudflare-login-fail.json`（同一 fingerprint で 5 分以内に発生する synthetic データ）。
   - 期待: `correlate()` 出力 1 件、`severity: 'HIGH'`、`events.length === 2`、両 source のイベントを含む。
   - 検証コマンド:
     ```bash
     mise exec -- bash scripts/audit-correlation/run.sh \
       --github scripts/audit-correlation/fixtures/github-org-update-member.json \
       --cloudflare scripts/audit-correlation/fixtures/cloudflare-login-fail.json \
       --salt test-salt-do-not-use-in-prod \
       --out /tmp/high.json
     mise exec -- node -e "const d=require('/tmp/high.json'); if(d[0].severity!=='HIGH') process.exit(1)"
     ```

4. **grep gate 検証**
   ```bash
   mise exec -- bash scripts/audit-correlation/grep-gate.sh /tmp/high.json
   ```

5. **runbook dry-run**
   - `docs/runbooks/audit-correlation.md` の 6 ステップを fixture 入力で実行し、ステップ間の引き継ぎ（finding ファイル → correlation → grep gate）が破綻なく繋がることを確認。

6. **actionlint**
   ```bash
   mise exec -- pnpm dlx @rhysd/actionlint-runner@latest .github/workflows/audit-correlation-verify.yml
   ```

## 検証マトリクス

| シナリオ | 入力 | 期待 |
| --- | --- | --- |
| HIGH alert | github-org-update-member + cloudflare-login-fail | severity HIGH, 2 events |
| MEDIUM single source | github-org-update-member only | severity MEDIUM, 1 event |
| LOW noise | github-workflow-run-success + cloudflare-token-rotate | severity LOW |
| empty | edge-empty | 出力 [] |
| rate-limit | edge-rate-limit | backoff 後 success |

## 失敗時の trouble-shooting

- vitest 失敗 → Phase 5 実装に戻る。
- bats 失敗 → Phase 6 wrapper を見直す。
- grep gate 検出 → Phase 5 redact ロジックを見直す。
- actionlint 失敗 → Phase 7 workflow を修正。

## 参照資料

- Phase 4-7 outputs

## 成果物

- `outputs/phase-10/phase-10.md`
  - 上記検証マトリクスの実行結果
  - HIGH alert dry-run の出力サンプル

## 完了条件（DoD）

- [ ] vitest / bats / shellcheck / actionlint すべて green。
- [ ] 検証マトリクス 5 シナリオすべて期待通り。
- [ ] runbook dry-run が 6 ステップ通る。
