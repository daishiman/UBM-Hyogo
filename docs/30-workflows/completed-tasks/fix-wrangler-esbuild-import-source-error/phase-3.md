# Phase 3: 設計レビュー

## 3.1 4 条件評価

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | OK | CI/CD の deploy-staging を unblock。production deploy 経路も同時修復 |
| 実現性 | OK | 変更は `package.json` 1 行 + `pnpm-lock.yaml` 再生成 + ローカル検証のみ |
| 整合性 | OK | wrangler / OpenNext の依存範囲交点を採用するため drift しない |
| 運用性 | OK | `cf.sh` の既存運用方針（pnpm.overrides をビルダーに合わせる）に整合 |

## 3.2 因果ループ

強化ループ:
> esbuild override 古い → wrangler 新 API 不認識 → CI fail → fix bump → 新 wrangler 取り込み可 → … (正の修復)

バランスループ:
> esbuild 過剰 bump → OpenNext / 他 dep が breaking → build fail → 戻し → 安定

→ Phase 5 では「最小 bump」を採る。

## 3.3 Go / No-Go 判定

- Phase 4 へ **Go**。
- 前提: Phase 2.4 のバージョン確定手順を Phase 5 冒頭で必ず実行する。
