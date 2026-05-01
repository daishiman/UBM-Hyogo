# Phase 8 主成果物 — DRY 化

> 仕様: `phase-08.md`

## 単一参照点（DRY 原則）

本タスク関連の正本は以下に集約する。`02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` から **重複転記せず参照リンクのみ**。

| 単一正本 | 物理位置 | 参照される側 |
| --- | --- | --- |
| OAuth redirect URI 表 | `outputs/phase-02/oauth-redirect-uri-matrix.md` | `02-auth.md`（参照リンク） |
| Secrets 配置表 | `outputs/phase-02/secrets-placement-matrix.md` | `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` |
| Consent screen 仕様 | `outputs/phase-02/consent-screen-spec.md` | verification 関連の運用ドキュメント |
| 段階適用 runbook | `outputs/phase-05/implementation-runbook.md` | 本番リリース手順書 |
| Phase 11 evidence | `outputs/phase-11/staging/*` / `production/*` | 05a `outputs/phase-11/main.md`（placeholder 上書き） |

## 重複検出と排除

| 重複源候補 | 排除策 |
| --- | --- |
| 過去の 05a Phase 11 placeholder（`outputs/phase-11/screenshots/spec-created-placeholder.png`） | Phase 12 で本タスク evidence link に上書き、placeholder.png は削除 |
| `wrangler.toml` 内の AUTH_URL 平文 | secrets-placement-matrix の `vars` 列に集約 |
| 02-auth.md 内の secrets 列挙 | 配置表へのリンクに置換 |

## DRY 化方針（Phase 12 で適用）

1. `02-auth.md` の secrets セクションを「`secrets-placement-matrix.md` を参照」のリンク方式に変更
2. `13-mvp-auth.md` の B-03 セクションに本タスク Phase 11 evidence link を追加
3. `environment-variables.md` から secrets-placement-matrix.md への双方向リンク

## 違反検出

```bash
# 配置表が複数箇所に重複していないか
git grep -n "AUTH_SECRET" docs/00-getting-started-manual/specs/ \
  | grep -v "secrets-placement-matrix"
# → 出力されたら matrix 単一参照に統合
```

## 完了条件

- [ ] 5 単一正本がすべて 1 箇所に存在
- [ ] `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` から重複転記が排除（Phase 12 実施）
- [ ] 違反検出 grep でマッチ 0
