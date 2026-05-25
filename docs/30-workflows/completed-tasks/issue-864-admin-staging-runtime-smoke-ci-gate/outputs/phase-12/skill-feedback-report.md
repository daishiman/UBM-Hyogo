# Skill Feedback Report — issue-864-admin-staging-runtime-smoke-ci-gate

> 改善点なしでも出力必須。

## task-specification-creator skill への feedback

| # | 観点 | 内容 | 提案 |
| - | ---- | ---- | ---- |
| FB-1 | 既存 root の自動 gate 昇格 | 親タスクの Phase 11 が「手動 `cf.sh tail` + curl」止まりで、参照する CLI subcommand が未実装のまま放置されていた。手動手順を spec に書く際は「その手順が依存する CLI/script の存在確認」を Phase 11 で必須化すると、本件のような gap の早期検出につながる | Phase 11 テンプレに「参照する CLI/script の存在確認」チェック項目を追加 |
| FB-2 | 2 層認証 probe の設計分岐 | Server Component を runtime probe するタスクでは「middleware と layout の token 復号方式が同一か」を Phase 1 実測必須にすべき。本件は `signSessionJwt`(HS256) と Auth.js session の互換性が未確定点として最大リスクだった | `server-component-e2e-pattern.md` に「edge gate / route gate の token 互換性確認」項目を追記 |

## 所有スキルファイルへの反映方針

- FB-1 は本 wave で `references/phase-template-phase11.md` の `Runtime smoke manual-command promotion gate` へ昇格済み。
- FB-2 は本 wave で `references/server-component-e2e-pattern.md` の `Server Component runtime smoke token-compatibility gate` へ昇格済み。
- task-specification-creator `SKILL-changelog.md` に `v2026.05.24-issue864-admin-runtime-smoke-gate` として履歴化済み。
