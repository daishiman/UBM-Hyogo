# Phase 4 — テスト戦略

## 目的

`--recovery-mode` flag 追加 / `recovery-rootcause-helper.ts` 新規 / workflow YAML 編集に対する焦点テストを定義する。

## テスト対象と spec ファイル

| 対象 | spec ファイル | 種別 |
| --- | --- | --- |
| `post-switch-monitor.ts --recovery-mode` 正例 | `scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts` | unit (node:test or vitest) |
| `--recovery-mode` 必須 `--since` 欠落で exit 2 | 同上 | unit (負例) |
| `--recovery-mode` false で従来挙動が壊れていない | 同上 | unit (regression) |
| `recovery-rootcause-helper.ts` の Markdown stub 生成 | `scripts/cf-audit-log/observation/recovery-rootcause-helper.spec.ts` | unit |
| workflow YAML の YAML 構文 / `actionlint` | CI gate (既存 `actionlint` job) | static |

## ケース一覧

1. **TC-RECOVERY-01**: `--recovery-mode --since 2026-05-15T01:00:00Z --input fixtures/recovery-168 --out /tmp/out.json` → `mode: "recovery" / actualSnapshots: 168` を出力
2. **TC-RECOVERY-02**: `--recovery-mode` 指定 + `--since` 未指定 → exit code 2 + stderr に "since is required in recovery-mode"
3. **TC-RECOVERY-03**: `--recovery-mode` 指定 + skeleton-only fixture → exit 1 + `require-non-skeleton` 違反
4. **TC-REGRESSION-01**: 既存 normal mode の fixture を従来 invocation で実行し、出力が親 #586 schema と互換であることを確認
5. **TC-ROOTCAUSE-01**: 欠損 hour 3 件 + production-code 起因の fixture から `recovery-rootcause.md` stub が前段表 / 修正方針セクション付きで生成

## 実行コマンド

```bash
mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts
mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/recovery-rootcause-helper.spec.ts
mise exec -- pnpm exec actionlint .github/workflows/cf-audit-log-7day-summary.yml
```

## 完了条件

- [ ] 5 ケースが phase-06 で実装可能な粒度
- [ ] coverage は対象 spec が touch されることを最低条件とし、global threshold は対象外（CONST: coverage AC 適用外）
