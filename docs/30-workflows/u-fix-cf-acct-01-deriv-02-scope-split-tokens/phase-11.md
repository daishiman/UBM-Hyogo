# Phase 11: 手動実機検証（NON_VISUAL）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-11/phase-11.md` |
| visualEvidence | NON_VISUAL |

## 目的
Cloudflare ダッシュボードで 6 Token を発行し、GitHub Secrets に投入、staging で 7 日 green 観測後、production 展開、旧単一 Token を 24h 並行保持で失効させる手動実機検証。

## 参照資料
- `outputs/phase-11/phase-11.md`
- `outputs/phase-12/runbook-token-rotation.md`

## 成果物
- `outputs/phase-11/token-issuance-evidence.json`
- `outputs/phase-11/github-secret-list.json`
- `outputs/phase-11/staging-7day-green-evidence.json`
- `outputs/phase-11/production-deploy-jobs.json`
- `outputs/phase-11/old-token-retirement-evidence.json`

## 完了条件
- staging 7 日 green、production deploy 成功、旧 Token 失効の3点が evidence 付きで記録。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態語彙に従い、本番 24h 並行期間の終了タイミングを記録。

## 実行タスク
- [ ] Token issuance、GitHub Secrets placement、staging green window、production deploy、old token retirement の evidence を取得する。

## 統合テスト連携
- Runtime operation は user approval 後。local cycle では Phase 9 evidence と link checklist を先に閉じる。
