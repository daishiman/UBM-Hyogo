# Phase 6: リスク / rollback / feature flag 不要根拠

## 1. リスク一覧

| # | リスク | 影響 | 確度 | 対策 |
|---|---|---|---|---|
| R-1 | A-3 primitive 置換で既存 e2e selector が壊れる | playwright fail | 中 | data-* 属性 (`data-conflict-id`, `data-candidate-id`) を必ず維持。role-based selector を優先 |
| R-2 | A-4 modal 再構成で focus trap / ESC close が退行 | a11y 退行 | 中 | 既存 admin modal primitive を流用し、focus management のロジックを書き換えない |
| R-3 | B-3 H1 hit で staging 再 deploy したら他 WIP も巻き込む | 意図しない staging 変更 | 中 | `origin/dev` HEAD を確認後にデプロイ。事前に `git log origin/dev --oneline -20` を user に提示し承認後実行 |
| R-4 | B-3 H3 hit で D1 migration 適用が forward-only ゆえ失敗時の復旧コスト大 | staging DB データ影響 | 低 | 適用前に `bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output backup-<ts>.sql` でバックアップ取得（Gate-C step に含める） |
| R-5 | B-3 H5 hit で proxy patch を当てたら他 admin endpoint が壊れる | 全 admin が 404 | 中 | `proxy-path.spec.ts` で identity-conflicts 以外（members, tags, meetings 等）の路由テストも追加し回帰を防ぐ |
| R-6 | A-2 list wrapper 置換で `next page` リンクの a 要素が壊れる | pagination 不能 | 低 | snapshot + playwright で next page link の存在を assert |
| R-7 | A-3 token 置換で contrast 退行 | a11y AA 不達 | 低 | members alignment と同じ token mapping を踏襲（`--ubm-color-text-primary` on `--ubm-color-surface-panel`）。axe 検証は Phase 7 で定義 |
| R-8 | B-4 復旧後に再発 | 信頼性低下 | 低 | Phase 11 で復旧後 24h 程度の経過観察（user に runbook で依頼）。tail コマンドを runbook に明示 |

## 2. Rollback 戦略

### 2.1 A 系統 (UI alignment)

- PR 単位での revert で完結（`git revert <merge-commit>` を `dev` ブランチで実行 → Cloudflare staging 自動 redeploy）
- feature flag は **不要**。理由は `/admin/identity-conflicts` は admin only、本番ユーザー（一般会員）には露出しない。alignment の見た目変更で fail しても影響範囲は admin operator のみ
- DB schema 変更 0 件、新規 endpoint 0 件のため schema rollback 不要

### 2.2 B 系統 (404 復旧)

| hit | rollback |
|---|---|
| H1 deploy | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env staging`（deploy 直前の version id を Gate-C 直前に記録） |
| H2 env patch | `git revert <wrangler.toml commit>` + `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| H3 D1 migration | 事前 backup から `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --file backup-<ts>.sql`（user 操作で復旧） |
| H4 session | rollback 不要（user 再 sign-in のみ） |
| H5 proxy patch | `git revert <commit>` + `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |

## 3. Feature Flag 不要根拠

| 観点 | 判定 |
|---|---|
| 露出範囲 | admin only（一般会員には露出しない） |
| 業務クリティカリティ | merge / dismiss は admin 操作。実行は user 明示操作（modal 二段階確認）。誤動作で本番データを壊しても reason audit log で追跡可能 |
| API contract 変更 | 0 件（A は UI のみ、B は ops 主体） |
| D1 schema 変更 | 0 件 |
| visual 差分の不可逆性 | revert で完全に旧 UI に戻せる |
| 結論 | **feature flag は不要**。PR 単位の revert で 100% rollback 可能 |

## 4. Branch 戦略 / マージ戦略

- 作業ブランチ: `feat/admin-identity-conflicts-prototype-alignment`（dev 派生）
- PR base: `dev`（CLAUDE.md ブランチ戦略既定）
- main への merge は dev → main の通常リリースサイクルで実施（本 workflow から直 main へは PR しない）
- A と B は 1 PR にまとめる（CONST_007）。H5 hit で proxy patch が入る場合も同 PR

## 5. 観測 / アラート

- 復旧後の常時観測アラートは別 issue（#922 production admin runtime smoke gate 関連）の枠で扱う。本 workflow では Phase 11 evidence 取得のみ
