# Phase 9: 品質検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 | Phase 8（e2e PASS）|

## 目的

実装 PR 提出前に、(1) 静的品質ゲート、(2) 7 日 baseline 学習成果のレビュー、(3) コスト見積り、(4) セキュリティレビュー の 4 軸で本タスクの品質を検証する。

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-9/phase-9.md` | 本 index |
| `outputs/phase-9/quality-checklist.md` | 4 軸品質ゲートのチェックリスト |
| `outputs/phase-9/baseline-review-template.md` | 7 日 baseline 学習結果のレビューテンプレ |

## 4 軸サマリ

### 軸 1: 静的品質ゲート

| ゲート | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | exit 0 |
| lint | `pnpm lint` | exit 0 |
| focused unit test | `pnpm vitest run scripts/cf-audit-log` | all green、Phase 6/7 で確定した coverage 閾値（fetcher / analyzer に限定 80%）達成 |

### 軸 2: 7 日 baseline 学習結果レビュー

- `scripts/cf-audit-log/baseline.ts` が 7 日間 shadow alerting モードで稼働
- 学習完了後、閾値 JSON を `outputs/phase-11/baseline-7day-thresholds.json` 相当でリポジトリにコミット
- shadow 期間中の判定ログをレビューし **誤検知率 ≤ 5%** であることを確認
- レビュー手順は `outputs/phase-9/baseline-review-template.md` に記載

### 軸 3: コストチェック

| 観点 | 見積り | 上限 |
| --- | --- | --- |
| D1 行数（30 日 TTL 後） | 1h × 24h × 30 day × ~50 events ≈ 36,000 行 | D1 free tier 5GB に対して KB 単位、十分余裕 |
| D1 read/write/月 | ~720 write batches + analyze read 720 回 | free tier 25M reads / 50K writes 内 |
| GitHub Actions 分/月 | 主 workflow 1h × 24 × 30 ≈ 720 run × ~30s ≈ 6h ＋ watchdog 360 run × 15s ≈ 1.5h | public repo 無制限。private 換算でも 2,000min/月 free 枠内 |

### 軸 4: セキュリティレビュー

- 監視 Token (`CF_AUDIT_TOKEN_PROD`) の scope が `Account > Audit Logs:Read` のみであることを Cloudflare Dashboard で再確認
- deploy Token (`CLOUDFLARE_API_TOKEN`) の scope に変更がないことを `bash scripts/cf.sh whoami` 相当で確認
- workflow の `permissions:` が最小（`issues: write` のみ）であること
- secret value / token / 個人情報 が log / artifact / Issue body に出力されない設計であること（Phase 5 実装レビュー）

## DoD

- [ ] 軸 1 の 3 コマンドすべて green
- [ ] 軸 2 で baseline JSON がコミット済 + 誤検知率 ≤ 5%
- [ ] 軸 3 のコスト試算が文書化済
- [ ] 軸 4 で監視 Token / deploy Token の scope 不変が確認済
- [ ] `outputs/phase-9/quality-checklist.md` の全項目が check 済

## 関連

- `outputs/phase-9/quality-checklist.md`
- `outputs/phase-9/baseline-review-template.md`
- 上流: `outputs/phase-8/`
- 下流: `outputs/phase-10/`
