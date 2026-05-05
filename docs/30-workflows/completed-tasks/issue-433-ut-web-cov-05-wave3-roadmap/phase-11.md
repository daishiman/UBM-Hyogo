# Phase 11: 実測 evidence（NON_VISUAL）

## 目的

NON_VISUAL タスクとして、CI gate `verify-indexes-up-to-date` の green 取得と、roadmap markdown 内の相対リンク健全性、coverage JSON 実体の保持を evidence として固定する。

## evidence 一覧

| ファイル | 内容 |
| --- | --- |
| outputs/phase-11/evidence/verify-indexes-current.md | `verify-indexes-up-to-date` job の最新 run URL / status / commit SHA。未 push の場合は `PENDING_CI_EVIDENCE` として保存し、green とは呼ばない |
| outputs/phase-11/evidence/link-check.md | `wave-3-roadmap.md` 内リンクの存在チェック結果 |
| outputs/phase-05/coverage-summary-*.json | Phase 5 で取得済の coverage JSON（Phase 11 では再保存しない、参照のみ） |

## verify-indexes-up-to-date 取得手順

```bash
gh run list --workflow verify-indexes.yml --branch "$(git branch --show-current)" --limit 5 \
  --json status,conclusion,headSha,url > /tmp/verify-indexes-runs.json
jq . /tmp/verify-indexes-runs.json
```

最新 run の `conclusion: success` を確認できた場合のみ `verify-indexes-current.md` に `CI_GREEN_CONFIRMED` と URL / commit SHA を記録する。push 前、run 未作成、または対象 SHA 不一致の場合は `PENDING_CI_EVIDENCE` と記録し、Phase 12/13 の PASS 根拠にしない。local で保証できるのは Phase 10 の `pnpm indexes:rebuild` exit 0 と indexes drift 0 まで。

## link check 手順

```bash
file=docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md
grep -oE '\(([^)]+\.md)\)' "$file" | sed -E 's/[()]//g' | while read -r link; do
  base=$(dirname "$file")
  target="$base/$link"
  test -f "$target" && echo "OK: $link" || echo "BROKEN: $link"
done
```

すべて `OK:` であることを `link-check.md` に記録する。

## 変更対象ファイル一覧（CONST_005）

なし（evidence markdown のみ outputs に保存）

## 入力 / 出力 / 副作用

- 入力: `wave-3-roadmap.md`、`gh` CLI、`coverage-summary-*.json`
- 出力: `verify-indexes-current.md`、`link-check.md`、`outputs/phase-11/main.md`
- 副作用: なし（read-only）

## テスト方針

- `link-check.md` に `BROKEN:` 行が存在しない
- `verify-indexes-current.md` に `CI_GREEN_CONFIRMED` または `PENDING_CI_EVIDENCE` が明示され、planned/current evidence が混同されていない
- coverage JSON 3 点が outputs/phase-05 に存在（Phase 5 完了の再確認）

## ローカル実行・検証コマンド

```bash
! grep -q 'BROKEN:' docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-11/evidence/link-check.md
grep -Eq 'CI_GREEN_CONFIRMED|PENDING_CI_EVIDENCE' docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-11/evidence/verify-indexes-current.md
for f in coverage-summary-web.json coverage-summary-api.json coverage-summary-packages.json; do
  test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-05/$f
done
```

## 完了条件 / DoD

- [ ] AC-5 local: `pnpm indexes:rebuild` exit 0 と indexes drift 0（Phase 10）
- [ ] AC-5 CI: push 後の `verify-indexes-up-to-date` が最新 run で success。未 push 時は `PENDING_CI_EVIDENCE` として Phase 13 承認後に取得
- [ ] `wave-3-roadmap.md` 内リンクが全件 OK
- [ ] coverage JSON 3 点が引き続き存在

## 出力

- outputs/phase-11/main.md
- outputs/phase-11/evidence/verify-indexes-current.md
- outputs/phase-11/evidence/link-check.md

## 統合テスト連携

NON_VISUAL。UI screenshot 不要。markdown 構造 + indexes drift 0 + CI green の 3 点で gate を担保する。

## 参照資料

- .github/workflows/verify-indexes.yml
- CLAUDE.md「よく使うコマンド」

## メタ情報

- Phase: 11
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- current evidence と pending evidence を分離して保存する。

## 成果物/実行手順

- `outputs/phase-11/main.md` と `outputs/phase-11/evidence/*` を作成する。

## 統合テスト連携

- NON_VISUAL。link check と CI evidence boundary を確認する。
