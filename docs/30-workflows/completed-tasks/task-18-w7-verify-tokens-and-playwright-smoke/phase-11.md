# Phase 11: Evidence 収集（NON_VISUAL 縮約テンプレ）

## 目的

`visualEvidence: NON_VISUAL` に従い、`references/phase-11-non-visual-alternative-evidence.md` の縮約テンプレで evidence を canonical path に固定する。

## 11.1 canonical evidence paths

```
outputs/phase-11/
├── evidence/
│   ├── typecheck.txt                       # Phase 8 §8.1
│   ├── lint.txt                            # Phase 8 §8.1
│   ├── test.txt                            # vitest C1-C7
│   ├── build.txt                           # apps/web build
│   ├── verify-tokens.txt                   # design tokens in sync
│   ├── e2e-smoke.txt                       # 17 PASS
│   ├── e2e-visual.txt                      # 4 PASS
│   ├── grep-gate.txt                       # token leak / placeholder
│   ├── branch-protection-main-before.json  # Phase 10 §10.2
│   ├── branch-protection-dev-before.json   # Phase 10 §10.2
│   └── playwright-version.txt              # `playwright --version`
├── canonical-paths.json                    # Issue #590 schema
└── main.md                                 # 本 Phase の summary
```

`canonical-paths.json` は `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json`（Issue #590）に準拠。

## 11.2 evidence 取得コマンド統合

```bash
mkdir -p outputs/phase-11/evidence
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck                                          2>&1 | tee outputs/phase-11/evidence/typecheck.txt
mise exec -- pnpm lint                                               2>&1 | tee outputs/phase-11/evidence/lint.txt
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts    2>&1 | tee outputs/phase-11/evidence/test.txt
mise exec -- pnpm --filter @ubm-hyogo/web build                      2>&1 | tee outputs/phase-11/evidence/build.txt
mise exec -- pnpm verify:tokens                                      2>&1 | tee outputs/phase-11/evidence/verify-tokens.txt
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke                  2>&1 | tee outputs/phase-11/evidence/e2e-smoke.txt
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual                 2>&1 | tee outputs/phase-11/evidence/e2e-visual.txt
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version  > outputs/phase-11/evidence/playwright-version.txt
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/evidence/branch-protection-main-before.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-11/evidence/branch-protection-dev-before.json
```

## 11.3 evidence 検証 gate

| evidence | PASS 判定 |
| --- | --- |
| typecheck.txt | `error TS` を含まない |
| lint.txt | exit 0 |
| test.txt | `7 passed` を含む |
| build.txt | exit 0 / `.open-next` / build success line |
| verify-tokens.txt | `design tokens in sync` を含む |
| e2e-smoke.txt | `19 passed` を含み、`failed: 0` |
| e2e-visual.txt | `4 passed` を含み、`failed: 0` |
| grep-gate.txt | `FAIL:` 行を含まない |
| branch-protection-*-before.json | `enforce_admins.enabled: true`、`required_pull_request_reviews: null` |

## 11.4 状態語彙

本 Phase 完了時点の状態は **`pass_boundary_synced_runtime_pending`**（references/workflow-state-vocabulary.md）。

- spec contract 完了 + ローカル PASS 5-set 取得
- CI runtime（GitHub Actions 上での green）と branch protection 反映は Phase 13 で user approval 後に確定

`PASS` 単独表記は禁止。

## 11.5 main.md 雛形（`outputs/phase-11/main.md`）

```markdown
# Phase 11 Evidence Summary — task-18-w7

## State
pass_boundary_synced_runtime_pending

## Evidence inventory
| path | PASS judgement |
| --- | --- |
| evidence/typecheck.txt | PASS |
| evidence/lint.txt | PASS |
| evidence/test.txt | PASS (7) |
| evidence/build.txt | PASS |
| evidence/verify-tokens.txt | PASS (N tracked) |
| evidence/e2e-smoke.txt | PASS (17/17) |
| evidence/e2e-visual.txt | PASS (4/4) |
| evidence/grep-gate.txt | PASS (token leak 0, placeholder 0) |
| evidence/branch-protection-main-before.json | required_pull_request_reviews=null confirmed |
| evidence/branch-protection-dev-before.json | required_pull_request_reviews=null confirmed |

## Pending
- CI green on PR
- branch protection PUT (3 contexts added) — Phase 13 user approval required
```

## 完了条件

- [ ] 11 evidence file が tracked path に存在
- [ ] §11.3 すべての判定 PASS
- [ ] main.md / canonical-paths.json が存在
- [ ] artifacts.json の phase 11 status を `completed_local_evidence` に更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 8 の実行結果を tracked `.txt` / `.json` evidence として収集する。

| Task | 内容 |
| --- | --- |
| 11-A | tracked `.txt` evidence と branch protection before JSON を収集する |
| 11-B | `canonical-paths.json` を schema に準拠して作成する |
| 11-C | validator 互換の `main.md` / `manual-smoke-log.md` / `link-checklist.md` を配置する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| schema | `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json` | canonical path schema |
| Phase 8 | `phase-08.md` | evidence 取得コマンド |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| summary | `outputs/phase-11/main.md` | Evidence summary |
| smoke log | `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL validator 互換 summary |
| link checklist | `outputs/phase-11/link-checklist.md` | evidence path existence |
| manifest | `outputs/phase-11/canonical-paths.json` | canonical evidence manifest |

## 統合テスト連携

Phase 11 は Phase 8 で実行した local integration test の保存地点。`.gitignore` 対象の `.log` は PASS 根拠にせず、tracked `.txt` / `.json` のみを canonical evidence とする。
