# Phase 10: 最終レビュー（AC 機械検証 / contracts 依存境界確認 / 未解決事項書き出し）

## メタ情報

| key | value |
|-----|-------|
| Phase | 10 |
| Phase Name | 最終レビュー |
| 作成日 | 2026-05-14 |
| 前 Phase | 9 |
| 次 Phase | 11 |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 関連 AC | AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 全件 |

## 目的

Phase 1..9 の成果物を統合し、AC-1..AC-7 のすべてを **grep / coverage / exit code / 行カウント** といった機械可読手段で再確認する。`packages/contracts` が `zod` のみ依存し shared へ依存していないこと、Phase 3 で却下した simpler alternative が現実装と乖離していないことを最終チェックする。未解決事項は Phase 12 の `unassigned-task-detection.md` に書き出す。

## 判定基準

| 判定 | 条件 | 対応 |
|------|------|------|
| PASS | 全 AC・全レビュー checklist OK / MAJOR・CRITICAL 0 件 | Phase 11 へ進行 |
| MINOR | 軽微な指摘あり / MAJOR 0 件 | 未解決事項に記録後 Phase 11 へ進行 |
| MAJOR | AC のいずれかが未充足 / 機能影響あり | 影響範囲に応じて Phase 6-9 のいずれかへ戻す |
| CRITICAL | 不変条件違反 / 循環参照復活 / hard gate 影響 | Phase 1 に戻し要件再確認 |

## AC 機械検証マトリクス

| AC | 検証手段 | 期待 | 実行コマンド例 |
|----|---------|------|---------------|
| AC-1 (全 endpoint 網羅 / fallthrough 廃止) | mock dispatcher chain grep count = endpoint inventory 行数 | 一致 | 下記 §1 |
| AC-2 (contracts SSOT / safeJson parse) | `grep -nE "schema.parse\|safeJson" scripts/e2e-mock-api.mjs` | 全 dispatcher 行で parse 実行 | 下記 §2 |
| AC-3 (契約テスト Vitest CI 組込) | `mise exec -- pnpm test` の log に contract spec 出現 | 出現あり | `outputs/phase-9/root-test.log` 参照 |
| AC-4 (seed canonical) | `node -e "import('@ubm-hyogo/contracts').then(...)"` で fixture サイズ確認 | member=3 / zone=2 / membership=2 / negative=1 / tagFacet=2 | 下記 §4 |
| AC-5 (readiness wait + log artifact) | `.github/workflows/e2e-tests.yml` grep | `curl -sf .../health` + `upload-artifact@v4` | 下記 §5 |
| AC-6 (regression 不在) | `outputs/phase-9/e2e-desktop.log` の summary | green / 0 failed | Phase 9 log 参照 |
| AC-7 (型・lint・coverage) | Phase 9 QG-1..QG-5 exit / coverage 数値 | すべて PASS / ≥80% | Phase 9 log 参照 |

## レビュー checklist（実行手順）

### §1. AC-1 検証

```bash
# mock dispatcher 行数
DISP=$(grep -nE "pathname === |pathname.startsWith\(|method === " scripts/e2e-mock-api.mjs | wc -l)
# inventory 行数（GET / POST / PATCH の行）
INV=$(grep -cE "^\| (GET|POST|PATCH|DELETE|PUT) " docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-1/endpoint-inventory.md)
echo "dispatcher=$DISP inventory=$INV"
# 期待: $DISP >= $INV

# {ok:true} fallthrough が grep で 0 件
grep -nE "\{\s*ok:\s*true\s*\}" scripts/e2e-mock-api.mjs | grep -v "/__test__\|/health"
# 期待: 0 hit (test hook / health 以外)
```

- [ ] dispatcher count ≥ inventory 行数
- [ ] `{ok:true}` fallthrough が test hook / health 以外で 0 件

### §2. AC-2 検証

```bash
# safeJson ラッパー経由になっていること
grep -nE "safeJson\(" scripts/e2e-mock-api.mjs | wc -l
# parse 失敗時の zodIssues 出力経路
grep -n "zodIssues" scripts/e2e-mock-api.mjs
# 期待: それぞれ 1 件以上
```

- [ ] `safeJson` 利用回数が dispatcher と整合
- [ ] `zodIssues` を含む 500 エラーレスポンス path 存在

### §3. AC-3 検証

```bash
# contracts package が zod 以外の依存を持たず、shared を参照しないこと
cat packages/contracts/package.json | grep -A 5 '"dependencies"'
rg -n '@ubm-hyogo/shared' packages/contracts
# 期待: dependencies は zod のみ / rg は 0 hit
```

- [ ] `packages/contracts/package.json#dependencies` は `zod` のみ
- [ ] `packages/contracts/` 配下に `@ubm-hyogo/shared` 参照が 0 hit
- [ ] root `pnpm test` で contract spec が拾われ exit 0（Phase 9 QG-8）

### §4. AC-4 検証

```bash
mise exec -- node -e "
import('@ubm-hyogo/contracts').then(m => {
  const f = m.fixtures;
  const r = {
    members: f.members.length,
    zones: new Set(f.members.map(x => x.zone)).size,
    membership: new Set(f.members.map(x => x.membershipType)).size,
    negative: f.negativeQuery,
    tagFacets: Object.keys(f.tagFacets ?? {}).length,
  };
  console.log(JSON.stringify(r));
});
"
# 期待: members=3 / zones=2 / membership=2 / negative='zzz_no_match_zzz' / tagFacets=2
```

- [ ] fixture が AC-4 で定義した canonical 値と完全一致

### §5. AC-5 検証

```bash
grep -nE "curl -sf.*health|upload-artifact@v4|retention-days" .github/workflows/e2e-tests.yml
```

期待: readiness wait の `curl -sf .../health` + `upload-artifact@v4` + `retention-days: 7` の 3 hit。

- [ ] readiness wait step が存在
- [ ] log upload step が存在（retention 7 日）

### §6. AC-6 検証

```bash
grep -E "passed|failed" outputs/phase-9/e2e-desktop.log | tail -5
```

- [ ] `failed: 0` / 既存 spec すべて green

### §7. AC-7 検証

- [ ] Phase 9 QG-1..QG-5 すべて exit 0
- [ ] contracts coverage S/B/F/L ≥80%
- [ ] mock contract coverage S/B/F/L ≥80%

### §8. 不変条件 grep 確認（CLAUDE.md UI alignment 不変条件）

```bash
# apps/web の 127.0.0.1:8787 焼き込みが grep で 0 件（task-18 gate 維持）
grep -rn "127\.0\.0\.1:8787\|127\.0\.0\.1:8888" apps/web/src 2>/dev/null
# 期待: 0 hit
```

- [ ] task-18 grep gate（`127.0.0.1:8787` 焼き込み禁止）維持

### §9. contracts 依存境界確認

- [ ] Phase 9 §contracts 依存境界確認結果が `completed (local evidence)`
- [ ] `packages/contracts/` に `@ubm-hyogo/shared` 参照が 0 件
- [ ] 循環参照が typecheck で検出されていない

### §10. simpler alternative 整合確認

Phase 3 で却下した 5 案について、現実装が「採用案」に沿っていることを確認:

| Phase 3 却下案 | 採用案 | 確認方法 |
|---------------|--------|----------|
| `apps/api/src/contracts/` 配下に置く | `packages/contracts/` 新設 | `ls packages/contracts` で存在 |
| mock 内 inline zod | 外部 SSOT | mock 冒頭 `import { schemas } from '@ubm-hyogo/contracts'` |
| Playwright で契約テスト | Vitest | `scripts/__tests__/*.spec.ts` 存在 |
| `wait-on` npm | `curl --retry` / bash loop | workflow YAML 参照 |
| Slack 通知 | `upload-artifact` | workflow YAML 参照 |

- [ ] 5 案すべて却下方針通り

### §11. レビュー checklist（最終）

- [ ] mock dispatcher chain の grep count = endpoint inventory 行数
- [ ] `{ok:true}` fallthrough が grep で 0 件
- [ ] `packages/contracts` で zod 以外の runtime 依存がない
- [ ] `apps/web` の `127.0.0.1:8787` 焼き込みが grep で 0 件（task-18 gate 維持）
- [ ] readiness wait と log upload が e2e-tests.yml に存在
- [ ] contract test が `.github/workflows/ci.yml` の test job または root `pnpm test` から実行されている（glob 確認）
- [ ] AC-1..AC-7 すべて PASS
- [ ] contracts 依存境界確認済み
- [ ] Phase 3 却下案がすべて却下のまま

## 未解決事項の書き出し

未解決指摘・追加の MINOR / 改善余地は本 Phase で発見した場合 `outputs/phase-10/unresolved-items.md` に記録し、Phase 12 の `unassigned-task-detection.md` 生成入力とする。

`outputs/phase-10/unresolved-items.md` の最小 schema:

```markdown
# Unresolved items (Phase 10 review)

| ID | 内容 | 影響 | 想定対応 Phase / Workflow |
|----|------|------|--------------------------|
| U-1 | ... | minor | next workflow / Phase 12 unassigned |
```

該当なしの場合は「該当なし」と明記し空テーブルを残す（drift gate 用）。

## 統合テスト連携

- 本 Phase は Phase 7（統合テスト）/ Phase 8（perf）/ Phase 9（品質）の成果物を再確認するメタ Phase
- 失敗時の戻し先は判定基準テーブル参照
- 未解決事項の書き出しは Phase 12 connectivity を支える

## 多角的チェック観点（AI が判断）

- [ ] §1..§11 すべて実行され記録されているか
- [ ] §10 simpler alternative の 5 案がすべて採用案通りに実装されているか
- [ ] §8 不変条件 grep で task-18 gate を破っていないか
- [ ] AC 機械検証マトリクスのすべての行が evidence path 付きで埋まっているか
- [ ] 未解決事項が「該当なし」でも空テーブルが残されているか（drift gate）
- [ ] 判定（PASS / MINOR / MAJOR / CRITICAL）の根拠が `outputs/phase-10/final-review-result.md` に明記されているか
- [ ] PII redact 観点（Phase 9 §PII）が CRITICAL に該当する取りこぼしを残していないか

## サブタスク管理

| ID | サブタスク | 状態 |
|----|-----------|------|
| ST-10-1 | §1..§7 AC 機械検証 | 未着手 |
| ST-10-2 | §8 不変条件 grep | 未着手 |
| ST-10-3 | §9 contracts 依存境界確認 | 未着手 |
| ST-10-4 | §10 simpler alternative 整合 | 未着手 |
| ST-10-5 | §11 レビュー checklist | 未着手 |
| ST-10-6 | 未解決事項 unresolved-items.md 作成 | 未着手 |
| ST-10-7 | final-review-result.md 判定記録 | 未着手 |

## 成果物

- `outputs/phase-10/final-review-result.md`（判定 / 根拠 / 各 §1-§11 結果）
- `outputs/phase-10/ac-verification-matrix.md`（AC-1..AC-7 evidence 集約）
- `outputs/phase-10/unresolved-items.md`（未解決事項。0 件でも空テーブル必須）

## 完了条件（coverage AC 必須）

- [ ] AC-1..AC-7 すべて PASS 判定
- [ ] §1..§11 全 checklist 完了
- [ ] contracts 依存境界確認済み
- [ ] Phase 3 却下 simpler alternative 5 案がすべて採用案通り
- [ ] coverage 4 指標 ≥80% を本 Phase で再確認（Phase 9 数値の引用 + 検算）
- [ ] task-18 grep gate（`127.0.0.1:8787` 焼き込み 0 件）維持
- [ ] 判定が PASS（または MINOR）であり、MAJOR / CRITICAL は 0 件
- [ ] 成果物 3 ファイル作成済み

## タスク100%実行確認【必須】

- [ ] サブタスク ST-10-1..ST-10-7 全完了
- [ ] §1..§11 全コマンド実行ログが `outputs/phase-10/` 配下に保存
- [ ] 未解決事項が Phase 12 入力として確定

## 次 Phase

Phase 11: 手動テスト検証 / runbook 実行確認
