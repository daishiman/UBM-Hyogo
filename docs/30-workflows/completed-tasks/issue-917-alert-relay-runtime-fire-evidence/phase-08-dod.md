---
phase: 8
title: Definition of Done
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 8: DoD — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 本サイクル DoD は (a) runtime evidence 仕様一式の整合 + (b) runtime evidence 取得後の MD・逆参照という 2 段構成。前者は本サイクルで達成、後者は user-gated runtime サイクル完了で達成。元 unassigned-task spec セクション 5 のチェックリストを完全踏襲する。

## 1. 完了条件チェックリスト

### docs（本サイクルで達成）

- [x] `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` 配下に Phase 1-13 + outputs/phase-{11,12} が canonical 9 headings 構造で揃っている
- [x] `artifacts.json` / `outputs/artifacts.json` が同一 metadata で parity を保つ
- [x] `taskType: implementation` / `visualEvidence: NON_VISUAL` / `implementation_mode: runtime_observation` / `github_issue: 917` / `github_issue_state: closed` がすべての metadata 場所で整合
- [x] 親 UT-25-DERIV-02 と上流 issue-857 への back-reference が `index.md` / `SCOPE.md` で文書化されている
- [x] 元 unassigned-task spec への source 参照が metadata に記録されている（consumed 化は本サイクルでは行わない明示）

### 機能要件（runtime evidence 取得サイクルで達成）

- [ ] AC-1: staging で `CF_WEBHOOK_AUTH_SECRET` name presence 確認済み（user-gated）
- [ ] AC-1（任意）: production で同 secret name presence 確認済み（deploy ポリシー次第）
- [ ] AC-2: staging deploy 後 tail で `event: "sheets.auth.alert_relay_skipped"` / `reason: "missing API_INTERNAL_BASE_URL or token"` が消失
- [ ] AC-3: 親 UT-25-DERIV-02 Phase 11 controlled invalidation 手順で SA 資格情報失効 dry-run 実施
- [ ] AC-4: dry-run 状態下で `postAlertRelay()` → `/internal/alert-relay` POST が発火し到達ステータス（200 / 401）を記録
- [ ] AC-5（任意）: 通知先設定済みの場合は Slack / mail 着信を記録
- [ ] AC-5: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` 作成
- [ ] AC-6: issue-857 `outputs/phase-12/implementation-guide.md` の「actual alert receipt」行を `verified` または取得済み MD への相対リンクへ更新
- [ ] AC-6: 親 UT-25-DERIV-02 close-out から evidence MD への逆参照追記

### 品質要件（横断）

- [x] 本仕様書本文に `wrangler` 直接実行コマンドが書かれていない（必ず `bash scripts/cf.sh` 経由）
- [x] 本仕様書本文に実 secret 値・token 値が転記されていない
- [ ] runtime evidence MD で `cf-webhook-auth` header 値が `<redacted>` 表記（runtime サイクル時）
- [ ] runtime evidence MD で secret 値・OAuth トークン値が一切転記されていない（runtime サイクル時）
- [x] PR base = `dev`（Phase 13 で明示）
- [x] issue #917 を `Closes` ではなく `Refs` で扱う

### CI gate（本サイクル）

- [ ] `mise exec -- pnpm gate-metadata:validate`（ERROR 0）
- [ ] `mise exec -- pnpm verify:phase12-compliance`（PASS）
- [ ] `mise exec -- pnpm indexes:rebuild`（1 回目で生成・2 回目で diff なし＝冪等）

## 2. 受け入れ判定

### 本 docs サイクルの完了

上記「docs」「品質要件」セクションと「CI gate（本サイクル）」が全て埋まれば **local observability 完了**。Gate-A/B/C は passed、Gate-D（runtime + commit/PR）は pending のまま許容する。

### runtime evidence 完了

上記「機能要件」セクションが全て埋まれば **runtime verified**。runtime evidence MD 内の secret redact が grep で confirm（Phase 6 §4）された段階で UT-25-DERIV-02 close-out に進める。

## 3. issue #917 完了条件との対応

| issue #917 完了条件（元 unassigned-task spec §5） | 本タスクでの扱い |
| --- | --- |
| staging で `CF_WEBHOOK_AUTH_SECRET` name presence 確認 | AC-1（runtime サイクル） |
| staging deploy 後 tail で no-op reason 消失 | AC-2（runtime サイクル） |
| SA 資格情報失効 dry-run で relay POST 発火と到達ステータス記録 | AC-3 / AC-4（runtime サイクル） |
| 通知先設定済みなら Slack / mail 着信確認 | AC-5（任意・runtime サイクル） |
| production の実施範囲を deploy ポリシーで判断・記録 | NFR-5（runtime サイクル） |
| evidence MD `alert-relay-fire-staging.md` 作成 | AC-5（runtime サイクル） |
| issue-857 implementation-guide「actual alert receipt」更新 | AC-6（runtime サイクル） |
| 親 UT-25-DERIV-02 close-out から evidence MD への逆参照 | AC-6（runtime サイクル） |
| 実 secret 値・tail header を MD / ログに転記しない | NFR-1（本 spec で文書化済み・runtime サイクルで実行担保） |
| `wrangler` 直接実行なし | NFR-2（本 spec で文書化済み） |
