# Phase 5: 安全装置・rollback 設計

## 5.1 削除前 pre-flight check (CONST_005 安全装置)

| Gate | 条件 | 失敗時アクション |
| --- | --- | --- |
| G1 | `rg CLOUDFLARE_PAGES_PROJECT .github/` が hit 0 | 中断。参照箇所を先に除去 |
| G2 | `gh auth status` が `daishiman/UBM-Hyogo` に有効 | `gh auth refresh -s repo` 実行 |
| G3 | environment scope (`staging`/`production`) に同名 variable が存在しない | 存在時は本タスク中断 + 別 issue 採番 |
| G4 | Issue #331 PR (`web-cd.yml` Workers cutover) が `dev`/`main` にマージ済 | `git log origin/main` で確認 |
| G5 | 削除前 evidence (`before.json`) が正常取得できる | API/auth エラーを先に解消 |
| G6 | `outputs/phase-11/evidence/user-approval-marker.md` に削除 command / rollback command / commit-push-PR 承認範囲が記録済み | 未承認なら DELETE / POST / commit / push / PR を実行しない |

すべての Gate を通過してから Phase 7 Step 5 (DELETE 実行) に進む。G1-G5 は read-only preflight として AI が取得可能、G6 以降は user-gated mutation として扱う。

## 5.2 Rollback 手順

万一削除後に「やはり必要だった」場合の復元手順。これも GitHub API mutation なので、削除時と同じく user approval marker 更新後にのみ実行する:

```bash
# value=ubm-hyogo-web で再作成
gh api -X POST repos/daishiman/UBM-Hyogo/actions/variables \
  -f name=CLOUDFLARE_PAGES_PROJECT \
  -f value=ubm-hyogo-web
```

- 復元値の正本: 本 spec の Phase 2 evidence (`before.json` 内 `value: "ubm-hyogo-web"`)
- 復元判断条件: 何らかの workflow / script で `vars.CLOUDFLARE_PAGES_PROJECT` 参照が新規追加された場合
- 復元時の追加作業: 復元 evidence を `outputs/phase-11/restore.json` に追記し、本仕様の DoD 状態を `runtime_pending (restored after approval)` または `completed (restore verified)` に更新

## 5.3 削除操作の冪等性

| 状況 | DELETE 実行結果 | 扱い |
| --- | --- | --- |
| variable 存在 | HTTP 204 | 成功 |
| variable 既削除 | HTTP 404 | 成功扱い（冪等性確保） |
| 認証不足 | HTTP 401/403 | エラー → Gate G2 へ |
| API 障害 | HTTP 5xx | リトライ（指数バックオフ 1m → 5m → 30m） |

実行スクリプトは HTTP 204 / 404 を共に成功として扱い、その他はエラーで中断する設計とする。

## 5.4 リスク再評価 (Phase 1 から更新)

| リスク | 緩和状態 |
| --- | --- |
| `.github/` 以外で参照 | 解消（Phase 2 hit 0 確認） |
| environment scope 誤削除 | Gate G3 で防止 |
| Issue CLOSED 誤認 | PR 本文に明記（Phase 13） |
| GitHub API 障害 | リトライ手順を Phase 5.3 で定義 |
| audit log への記録漏れ | GitHub Audit log は自動記録（追加対応不要） |
