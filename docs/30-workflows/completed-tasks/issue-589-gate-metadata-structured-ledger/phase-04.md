# Phase 4: テストファースト / vitest テストケース列挙 / Fixture 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| Source | `outputs/phase-4/phase-4.md` |
| 区分 | テスト設計（実装は Phase 5。本 Phase でテストケース TC-1..TC-N と fixture を確定） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 1 AC-1..AC-7 と Phase 3 MINOR TEST-M-01 を vitest テストケースに 1:1 マッピングし、テスト fixture（temp dir に書き出す artifacts.json サンプル）を確定する。Phase 5 で RED → GREEN リファクタを進める基準を作る。

## 実行タスク

1. **テストケース TC-1..TC-12（schema.test.ts）**

   | TC | 対象 AC | 入力 | 期待 |
   | --- | --- | --- | --- |
   | TC-1 | AC-1 | 完全な valid entry（status=passed, passed_at 有, evidence_path 有, approver 有） | `parse()` 成功 |
   | TC-2 | AC-1 | `gate_id="gate-a"`（小文字） | `parse()` reject |
   | TC-3 | AC-1 | `gate_id="Gate.A"`（区切りが `.`） | `parse()` reject |
   | TC-4 | AC-1 | `gate_id="Gate-A-RUNTIME"`（拡張階層） | `parse()` 成功 |
   | TC-5 | AC-1 | `status="approved"`（列挙外） | `parse()` reject |
   | TC-6 | AC-1 | `passed_at="2026/05/10"`（非 ISO8601） | `parse()` reject |
   | TC-7 | AC-2 | `status="passed"`, `passed_at=null` | refine reject |
   | TC-8 | AC-3 | `status="pending"`, `passed_at=null` | `parse()` 成功 |
   | TC-9 | AC-3 | `status="failed"`, `passed_at=null` | `parse()` 成功 |
   | TC-10 | AC-3 | `status="waived"`, `passed_at=null` | `parse()` 成功 |
   | TC-11 | AC-1 | `approver="CODEOWNERS:apps-api"` | `parse()` 成功 |
   | TC-12 | AC-1 | `notes` 省略 | `parse()` 成功 |

2. **テストケース TC-13..TC-20（walk.test.ts / CLI 振る舞い）**

   | TC | 対象 AC / MINOR | fixture | 期待 |
   | --- | --- | --- | --- |
   | TC-13 | AC-4 | `metadata.gates` 不在の artifacts.json | WARN ログ + skip + exit 0 |
   | TC-14 | AC-4 | `metadata.gates` が string（配列でない） | ERROR + exit 1 |
   | TC-15 | AC-5 | status=passed, evidence_path 実体不在 | ERROR + exit 1 |
   | TC-16 | AC-5 | status=passed, evidence_path 実体存在 | OK + exit 0 |
   | TC-17 | AC-5 | status=pending, evidence_path 実体不在 | OK（pending は実体確認スキップ） |
   | TC-18 | TEST-M-01 | `evidence_path="../../../etc/passwd"` | ERROR（path traversal 検知） |
   | TC-19 | AC-4 | 複数 artifacts.json（root と outputs/ mirror）両方 OK | exit 0、件数表示 |
   | TC-20 | DOC-M-02 | 任意の混在 fixture | stdout に `OK: N WARN: N ERROR: N` 形式が含まれる |

3. **fixture 設計**

   | fixture | 配置 | 用途 |
   | --- | --- | --- |
   | `valid-passed.json` | テスト内 temp dir | TC-1, TC-16, TC-19 |
   | `valid-pending.json` | 同上 | TC-8, TC-17 |
   | `invalid-gate-id.json` | 同上 | TC-2, TC-3 |
   | `invalid-status.json` | 同上 | TC-5 |
   | `invalid-passed-at-iso.json` | 同上 | TC-6 |
   | `refine-fail-passed-without-time.json` | 同上 | TC-7 |
   | `gates-missing.json` | 同上 | TC-13 |
   | `gates-not-array.json` | 同上 | TC-14 |
   | `evidence-missing.json` | 同上 | TC-15 |
   | `path-traversal.json` | 同上 | TC-18 |

   - fixture は `tmp/` を vitest の `beforeEach` で作成し、`afterEach` で `fs.rm` する。コミットしない。

4. **coverage 目標**
   - `packages/shared/src/gate-metadata/schema.ts`: Statements / Branches / Functions / Lines >= 80%。refine ロジックの両分岐を TC-7（fail）と TC-1（success）で網羅。
   - `scripts/gate-metadata/validate.ts`: glob 走査 / parse / evidence 確認 / 集計 stdout の 4 経路を TC-13..TC-20 で網羅。

5. **テスト実行コマンド（Phase 5 で実装後）**
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/shared test gate-metadata
   mise exec -- pnpm vitest run scripts/gate-metadata
   mise exec -- pnpm --filter @ubm-hyogo/shared test --coverage
   ```

6. **テストファースト順序**
   - Step 1: schema.test.ts に TC-1..TC-12 を RED で追加（schema.ts 未実装で全 fail を確認）。
   - Step 2: schema.ts 最小実装で TC-1..TC-12 を GREEN 化。
   - Step 3: walk.test.ts に TC-13..TC-20 を RED で追加。
   - Step 4: validate.ts 最小実装で TC-13..TC-20 を GREEN 化。
   - Step 5: refactor + coverage 確認。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `packages/shared/src/gate-metadata/__tests__/schema.test.ts` | 新規 | TC-1..TC-12 |
| `scripts/gate-metadata/__tests__/walk.test.ts` | 新規 | TC-13..TC-20 |

## 入出力・副作用

- 入力: Phase 1 AC-1..AC-7 / Phase 3 MINOR TEST-M-01 / DOC-M-02。
- 出力: `outputs/phase-4/phase-4.md`（TC 表 + fixture 表 + coverage 目標 + テストファースト順序）。Phase 5 で実テストファイル新規追加。
- 副作用: 本 Phase ではコード追加なし（TC リストのみ）。

## テスト方針

TC-1..TC-20 を RED で開始 → Phase 5 GREEN 化 → coverage AC 達成。

## ローカル実行・検証コマンド

```bash
# vitest 設定確認
test -f packages/shared/vitest.config.ts && echo OK || echo "WARN: check workspace vitest config"
mise exec -- pnpm vitest --help > /dev/null && echo OK
```

## 統合テスト連携

- Phase 5 は本 Phase の TC-1..TC-20 を 1:1 で実装する（追加・省略禁止）。
- Phase 7 はコードレビュー時に TC vs AC の対応を再確認。
- Phase 9 は coverage AC が達成されているか workspace-wide 確認。

## 多角的チェック観点（AIが判断）

- **TC vs AC の網羅性**: AC-6（CI workflow trigger）と AC-7（#549 backfill）は vitest では検証せず、Phase 8 actionlint と Phase 6 ローカル backfill 検証で担保する。
- **fixture の現実性**: TC-18 path traversal は `evidence_path` を文字列として schema 通過後に CLI 側で検知するため、schema.test.ts ではなく walk.test.ts に配置。

## サブタスク管理

- ST-1: TC-1..TC-12 列挙
- ST-2: TC-13..TC-20 列挙
- ST-3: fixture 設計表
- ST-4: coverage 目標明文化
- ST-5: テストファースト順序確定

## 成果物

- `outputs/phase-4/phase-4.md` に TC 表 / fixture 表 / coverage 目標 / 順序を記録。

## 完了条件（DoD）

- [ ] TC-1..TC-20 が AC / MINOR と紐づけて表化されている。
- [ ] fixture 10 件が temp dir 配置で設計されている（コミット禁止が明記）。
- [ ] coverage AC（Statements/Branches/Functions/Lines >= 80%）が目標として記載されている。
- [ ] テストファースト順序（Step 1..5）が明文化されている。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-4/phase-4.md` 生成済み
- [ ] Phase 5 着手 GO 判定済み

## 次Phase

[Phase 5: コア実装](phase-05.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- Phase 1 / Phase 2 / Phase 3 outputs and decisions
