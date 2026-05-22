# Phase 10: 監視 / 運用観点

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 区分 | 設計 |
| 想定所要 | 0.05 人日 |

## 目的

本タスクが追加する monitoring / observability 要件を確定する。

## 10.1 監視対象

| 対象 | 既存 / 新規 | 備考 |
| --- | --- | --- |
| `/api/admin/meetings/:id/attendance` POST/DELETE | 既存 | API audit log (`apps/api`) に既に記録される |
| frontend error | 既存 | `apps/web/src/app/error.tsx` boundary が pickup |
| confirm dialog open 回数 | — | metric 追加なし (analytics 未導入のため) |

## 10.2 ログ / audit

attendance.ts は既に audit log を `attendance.add` / `attendance.remove` で書き込む
（`attendance.contract.spec.ts` の `action: "attendance.add"` 行で確認済）。
frontend 側で追加 log は不要。

## 10.3 alert / runbook

| 状況 | 対応 |
| --- | --- |
| 409 多発 | UI 側で `attended` Set が server と乖離している可能性 → `router.refresh()` を促す UI を将来検討 |
| 5xx 多発 | API 側調査 → 本タスク範囲外 |
| dialog 操作で submit 中の hang | submitting=true の解除が来ない場合の対処はユーザがリロード。UI 側で timeout は MVP 範囲外 |

新規 runbook 追加は不要。

## 10.4 SLA

既存 `/admin/meetings` の Playwright smoke route SLA に準拠（dialog 追加で latency が大きく増えないこと）。

## 完了条件

- [ ] 監視追加なしの判定根拠が記録されている
- [ ] audit log の既存対応が記録されている

## リスク

- 将来 confirm dialog の使用回数を計測したくなった場合 → 別タスクで analytics provider を導入
