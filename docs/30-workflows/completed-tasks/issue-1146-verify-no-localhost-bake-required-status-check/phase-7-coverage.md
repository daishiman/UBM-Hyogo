# Phase 7: カバレッジ確認

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**
**対象 Issue: #1146 [FU-SASR-002]（CLOSED 維持・`Refs #1146` のみ）**

## 1. 対象範囲

| 変更箇所 | カバレッジ対象か | 理由 |
| --- | --- | --- |
| `.github/workflows/verify-no-localhost-bake.yml`（`on.pull_request.paths` 除去） | カバレッジ計測対象外 | CI 設定（YAML trigger）であり実行可能コードのカバレッジ単位ではない |
| `scripts/verify-no-localhost-bake.sh`（grep LOGIC） | 無変更 | `scripts/verify-no-localhost-bake.spec.ts` が dirty/clean/allow 経路をカバー済 |

> 本タスクで増減する**実行コード行は 0**（yml trigger の paths 行群の除去のみ）。
> したがって line/branch coverage の新規計測対象は生じない。

## 2. grep LOGIC のカバレッジ（既存・無変更）

`scripts/verify-no-localhost-bake.spec.ts` は次を通じて `verify-no-localhost-bake.sh` の主要分岐をカバーする。

| カバー対象 | テストケース |
| --- | --- |
| 違反検出 path（PATTERN ヒット → STATUS=1 → exit 1） | TC-VNLB-01（dirty fixture） |
| allowlist path（`localhost-allow:local-fallback` で continue → exit 0） | TC-VNLB-02（allow fixture） |
| clean path（ヒットなし → exit 0） | スクリプト内蔵 `--self-test` の clean fixture |

> yml trigger 変更はこの LOGIC を一切触らないため、coverage 観点で**既存の保護で十分**。

## 3. 変更行（paths ブロック除去）に対する保護

yml の paths 除去は実行コードでないため line coverage では守れない。代替として次の 2 点で保護する。

| 保護手段 | 内容 |
| --- | --- |
| self-test PASS | `verify-no-localhost-bake.spec.ts` が CI（yml の self-test step）とローカルで PASS = gate 機能の非退化を担保 |
| trigger 構造 assert | Phase 4 §2.3 の grep assert（`paths:` 不在 / `branches:[main,dev]` 保持）+ actionlint = trigger 変更の正しさを担保 |

## 4. coverage-gate（既存 required check）への影響

本変更は `apps/web` / `apps/api` / `packages` のソースを触らないため、`coverage-gate` shard の計測値に
影響を与えない。coverage-guard の閾値は据え置きで PASS を期待する。

## 5. 検証コマンド

```bash
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts   # grep LOGIC カバレッジ（既存）
bash scripts/verify-no-localhost-bake.sh --self-test                    # clean/dirty/allow 3 経路
```

## 完了条件（Phase 7）

- [x] 変更が yml trigger 1 箇所のみ・`.sh` grep LOGIC 無変更であることを明示した
- [x] `verify-no-localhost-bake.spec.ts` が grep LOGIC をカバーし、yml trigger 変更は計測対象外である旨を整理した
- [x] paths 除去に対する保護 =「self-test PASS + trigger 構造 assert」と定義した
- [x] coverage-gate（既存 required）への影響なしを確認した
