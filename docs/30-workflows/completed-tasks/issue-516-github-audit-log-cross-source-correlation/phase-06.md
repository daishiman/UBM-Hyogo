# Phase 6: CLI / runbook 統合

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| Source | `outputs/phase-6/phase-6.md` |
| 区分 | 実装（bash + runbook） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5 のコア実装を、ローカル / CI / incident 運用から呼び出すための CLI wrapper と runbook を整備する。

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `scripts/audit-correlation/run.sh` | 新規 | fixture を読み correlation を実行する bash wrapper |
| `scripts/audit-correlation/grep-gate.sh` | 新規 | 出力 JSON を grep gate で検査 |
| `scripts/audit-correlation/fixtures/github-*.json` | 新規 | Phase 4 で定義した fixture |
| `scripts/audit-correlation/fixtures/cloudflare-*.json` | 新規 | 同上 |
| `scripts/audit-correlation/__tests__/*.bats` | 新規 | bats テスト（Phase 4 設計に従う） |
| `docs/runbooks/audit-correlation.md` | 新規 | HIGH alert 時の dry-run runbook |

## 実行タスク

1. `scripts/audit-correlation/run.sh` の CLI 契約を実装する。
2. synthetic fixture loader と deterministic JSON 出力を実装する。
3. `docs/runbooks/audit-correlation.md` に HIGH alert dry-run 手順を追加する。
4. live GitHub audit log 取得手順は appendix に閉じ、実行は follow-up / user gate と明記する。

## CLI 仕様

`scripts/audit-correlation/run.sh`:

```
Usage: scripts/audit-correlation/run.sh \
  --github <github-fixture.json> \
  --cloudflare <cloudflare-fixture.json> \
  --salt <salt-string> \
  [--out <output.json>]
```

- `--salt`: 必須。production では `op run --env-file=.env -- ...` 経由で `AUDIT_CORRELATION_SALT` を渡す。fixture verify では固定 salt `test-salt-do-not-use-in-prod`。
- 内部で `mise exec -- node --import tsx scripts/audit-correlation/runner.ts` を呼び出し、`apps/api/src/audit-correlation/index.ts` の関数を実行。
- 出力: `CorrelatedFinding[]` を JSON stdout（`--out` 指定時はファイルへ）。
- exit code: 0 = success / 1 = correlation 実行失敗 / 2 = 引数不正。

## runbook 仕様（`docs/runbooks/audit-correlation.md`）

以下のセクションを必ず含む:

1. **前提**: Issue #408（`docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`）で HIGH alert を検知 / GitHub Org Owner 権限と PAT が手元にある。
2. **ステップ 1: Cloudflare 側 finding の取得**: `scripts/cf.sh` 経由（Issue #408 の出力を取得）。
3. **ステップ 2: GitHub audit log の取得**:
   ```bash
   bash scripts/audit-correlation/fetch-github.sh --org daishiman --since "$SINCE" --until "$UNTIL" --out gh.json
   ```
   ※ `fetch-github.sh` は本タスクスコープ外（live wiring follow-up）。MVP は手動 `curl` 例を runbook に併記。
4. **ステップ 3: correlation 実行**:
   ```bash
   bash scripts/audit-correlation/run.sh --github gh.json --cloudflare cf.json --salt "$AUDIT_CORRELATION_SALT" --out merged.json
   ```
5. **ステップ 4: grep gate**:
   ```bash
   bash scripts/audit-correlation/grep-gate.sh merged.json
   ```
6. **ステップ 5: severity 評価 + on-call 連絡**: HIGH なら on-call チャネルへ。LOW/MEDIUM は記録のみ。
7. **ステップ 6: evidence 保管**: `outputs/phase-11/incident-YYYYMMDD-HHMM/` に格納。

## ローカル実行コマンド

```bash
mise exec -- bash scripts/audit-correlation/run.sh \
  --github scripts/audit-correlation/fixtures/github-org-update-member.json \
  --cloudflare scripts/audit-correlation/fixtures/cloudflare-login-fail.json \
  --salt test-salt-do-not-use-in-prod \
  --out /tmp/merged.json

mise exec -- bash scripts/audit-correlation/grep-gate.sh /tmp/merged.json

mise exec -- bash scripts/audit-correlation/__tests__/grep-gate.bats
mise exec -- bash scripts/audit-correlation/__tests__/runner-determinism.bats
```

## テスト方針

- bats: `grep-gate.bats`（fixture 入力 → 出力に PII が混入しないことを検証）、`runner-determinism.bats`（2 回 run の diff なし）。
- shellcheck: `shellcheck scripts/audit-correlation/*.sh`。

## 参照資料

- Phase 5 outputs（コア実装の関数）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」

## 成果物

- 上記 5 ファイル（run.sh / grep-gate.sh / fixtures / bats / runbook）
- `outputs/phase-6/phase-6.md`

## 完了条件（DoD）

- [ ] `run.sh` が fixture から correlation を実行し JSON を出力。
- [ ] `grep-gate.sh` が PII 検出時 exit 1。
- [ ] runbook に 6 ステップが記述。
- [ ] bats / shellcheck clean。
