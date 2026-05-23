# Phase 7 — workflow 層: rerun → triage → grouping の自動化スクリプト連携

## 目的

baseline → matrix → grouping 採用の流れを 1 コマンドで再現できるように、Phase 6 の helper 運用仕様を Phase 7 で固定する。`scripts/coverage-guard.sh` は threshold guard 責務を持つため、rerun / triage helper との連携は原則不採用とする。

## 入力 / 前提

- Phase 6 の `scripts/api-coverage-rerun.sh`
- 既存 `scripts/coverage-guard.sh`（push 範囲に merge commit 含む時のスキップ仕様。責務確認のみ）

## 想定変更ファイル（採用時のみ）

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `scripts/api-coverage-rerun.sh` | 新規（条件付） | rerun / matrix を直接実行する helper |

## 手順

1. `scripts/api-coverage-rerun.sh` 単独で `baseline --count=3` と `matrix --axis=<axis> --value=<value>` を実行する。
2. 既存 `coverage-guard.sh` の「merge commit を含む push では coverage gate を skip」仕様を壊さない。
3. `coverage-guard.sh` への flag 追加は、Phase 11 実測で helper 単独運用が不十分と分かった場合のみユーザーへエスカレーションして採用する。

## 成果物

- `outputs/phase-07/main.md`（連携設計 + 採用判断 + 不採用時の理由）

## 検証コマンド

```bash
shellcheck scripts/api-coverage-rerun.sh
bash scripts/api-coverage-rerun.sh --help 2>&1 | head -20
```

## 完了条件（DoD）

- [ ] helper 単体運用を第一候補として採用判断が記録されている。
- [ ] `coverage-guard.sh` を編集しない場合、その no-op 判断が Phase 7 output に記録されている。
- [ ] `coverage-guard.sh` への flag 追加が必要な場合は、理由とユーザー承認が記録されている。
