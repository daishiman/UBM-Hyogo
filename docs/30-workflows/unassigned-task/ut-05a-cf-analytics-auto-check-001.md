# UT-05A-CF-ANALYTICS-AUTO-CHECK-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-05A-CF-ANALYTICS-AUTO-CHECK-001 |
| タスク名 | Cloudflare Analytics API automatic threshold check |
| ステータス | 未着手 |
| 優先度 | 低 |
| 起票日 | 2026-04-26 |
| 起票元 | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/unassigned-task-detection.md` |

## 1. なぜこのタスクが必要か（Why）

05a は手動確認を優先しており、通知基盤や API 自動化を導入していない。運用頻度が上がると、手動確認だけでは quota 接近の発見が遅れる可能性がある。

## 2. 何を達成するか（What）

- Cloudflare Analytics API で取得できる指標を整理する
- 05a の閾値表と照合できる最小スクリプト案を設計する
- 新規 secret の要否と保管場所を決める
- 有料監視 SaaS なしで成立する範囲を明確にする

## 3. どのように実行するか（How）

最初は read-only script として設計し、GitHub Actions scheduled workflow へ入れるかは別判断にする。secret 追加が必要な場合は environment-variables 正本へ同期する。

## 4. 実行手順

1. Cloudflare Analytics API の対象 metric と認証要件を確認する
2. Pages / Workers / D1 / R2 / KV の取得可否を分類する
3. read-only check script の入出力契約を定義する
4. secret 追加の要否を判断する
5. 05a runbook の手動運用との併用ルールを作る

## 5. 完了条件チェックリスト

- [ ] API で取得できる指標と取得できない指標が分かれている
- [ ] secret 追加の有無が記録されている
- [ ] 手動確認を置き換えるのか補助するのかが明確
- [ ] 実装する場合は CI 実行コストが 05a の閾値に入っている

## 6. 検証方法

```bash
rg -n "Cloudflare Analytics|quota|threshold|CLOUDFLARE_API_TOKEN" .github apps docs .claude/skills/aiworkflow-requirements/references
```

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 自動確認自体が GitHub Actions minutes を消費する | scheduled run の頻度を月次または週次に制限する |
| API token の権限が広すぎる | read-only scope を優先し、secret 正本へ反映する |

## 8. 参照情報

- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`
- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 9. 備考

05a の初回スコープは手動運用で閉じる。本タスクは運用負荷が増えた時の拡張である。
