# Phase 3: 依存関係と前提条件確認


## 目的

Issue #626 RB-01 の Phase 3 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 3 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 確認項目

| 項目 | 確認コマンド | 期待結果 |
| --- | --- | --- |
| `actions/upload-artifact@v4` SHA pin | `grep -r "actions/upload-artifact" .github/workflows/` | v4 pinned SHA が他 workflow で使われていれば再利用、なければ UT-GOV-007 に従い `actions/upload-artifact@v4` の latest stable SHA を採用 |
| `actions/download-artifact@v4` SHA pin | `grep -r "actions/download-artifact" .github/workflows/` | 同上 |
| Node 24 / pnpm 10 ツールチェーン | `cat .mise.toml` | Node 24.15.0 / pnpm 10.33.2 |
| `lhci autorun` 実行パス | `cat lighthouserc.json` | `lhci` が `apps/web` から `../../lighthouserc.json` を参照 |
| branch protection 不変条件 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'` | current required context が `lighthouse-ci` を含む。`build-test` は `needs` dependency として維持 |
| `pnpm --filter @ubm-hyogo/web start` 起動性 | ローカル `pnpm --filter @ubm-hyogo/web build && pnpm --filter @ubm-hyogo/web start` | `http://localhost:3000` で 200 を返す |

## 外部依存

- なし（GitHub Actions / pnpm / Node / Lighthouse CI はすべて既存導入済）

## 前提

- `apps/web/.next/` を upload する際、内部に secret が含まれない（standalone build と異なり `.next/server/` 内に env が焼かれていないこと）。`grep -rE "(CLOUDFLARE_API_TOKEN|AUTH_SECRET)" apps/web/.next/` で 0 件であることを Phase 6 で確認する。

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 3 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-03.md`
- Phase 3 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] 確認項目テーブルの全行で期待結果が記録された evidence が `outputs/phase-11/preflight/` に保存可能であること（実行は Phase 11）
- SHA pin が確定していること
