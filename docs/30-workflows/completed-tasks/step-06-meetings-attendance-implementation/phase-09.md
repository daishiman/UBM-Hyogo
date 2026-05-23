# Phase 9: 移行 / Rollout 戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 区分 | 設計 |
| 想定所要 | 0.1 人日 |

## 目的

本タスクの rollout を、既存運用画面に影響を出さずに反映する戦略を確定する。

## 9.1 影響範囲

| 範囲 | 影響 |
| --- | --- |
| `/admin/meetings` 一覧 | confirm dialog が出席解除 / 開催日削除に追加される (UX 変更) |
| `/admin/meetings/[id]` 詳細 | 出席登録の HTTP 経路が `useAdminMutation` 経由になる (内部実装) |
| 他 admin 画面 | 影響なし (`useConfirmDialog` は本タスクで自 import するのみ) |
| API | 変更なし (既存 `/attendance` を使う) |
| D1 schema | 変更なし |

## 9.2 rollout 戦略

| 段階 | 内容 | 検証 |
| --- | --- | --- |
| 1. local | Phase 5/6 を完了 | local typecheck / lint / test / smoke |
| 2. preview deploy | `dev` への PR 作成で Cloudflare preview deploy | preview URL で 6.3 手動シナリオを実行 |
| 3. staging deploy | merge to `dev` → staging に自動 deploy | staging /admin/meetings 動線で smoke |
| 4. production deploy | `dev → main` PR 作成 → merge | production smoke (admin login 後の出席解除動線) |

feature flag は不要（UI 変更のみ / 完全に後方互換 / 段階公開の必要なし）。

## 9.3 rollback 戦略

| 種別 | 手順 |
| --- | --- |
| code rollback | `git revert <PR merge commit>` → 再 PR |
| Cloudflare rollback | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env production` |

D1 schema 変更がないため DB rollback は不要。

## 9.4 後続タスクへの bridge

- step-07 (requests approve/reject) は `useConfirmDialog` を **import して再利用** する。本タスクの PR merge 後に step-07 を着手する。
- `useConfirmDialog` の signature は step-07 完了までは破壊的変更しない (semver: minor 追加のみ)。

## 完了条件

- [ ] rollout 戦略 4 段階が明記されている
- [ ] rollback 手順が明記されている
- [ ] step-07 への signature 凍結が明記されている

## リスク

- preview deploy で /admin/meetings が壊れる → preview URL 取得後 6.3 を手動実行して fail-fast 検知
- staging deploy 後の運用ユーザ向け影響は最小（confirm dialog 追加のみ、誤操作削減方向）
