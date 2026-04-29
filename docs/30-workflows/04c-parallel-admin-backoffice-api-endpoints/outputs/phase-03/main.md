# Phase 3 — 設計レビュー

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|---|---|---|
| 18 endpoint を網羅しているか | PASS | dashboard / members(list+detail) / status / notes(POST+PATCH) / delete+restore / tags(GET+resolve) / schema(GET+aliases) / meetings(GET+POST) / attendance(POST+DELETE) + 既存 sync 2 = 18 |
| 不変条件 #4 #11 #12 #13 #14 #15 を構造で守るか | PASS | profile 編集 endpoint 不在、notes は detail のみ、tag は queue 経由、schema は /admin/schema 集約、attendance は status マップで強制 |
| audit_log を全 mutation で記録するか | PASS | mutation handler の末尾で `auditLog.append` 必須を Phase 2 で規約化 |
| view model 検証を強制するか | PASS | response 直前で `*ViewZ.parse(...)` を経由（AC-11） |
| sync trigger の重複防止 | PASS | 既存 03a / 03b の ConflictError 経路を流用、本タスクは新規 endpoint で重複ロジックを再実装しない |
| adminGate の挿入位置 | PASS | router factory 先頭で `app.use("*", adminGate)`。handler 単位の漏れを構造的に排除 |
| memberId 露出ゼロ（403 時） | PASS | adminGate は `{ok:false, error:'forbidden'}` のみ返却（target を含めない） |

## 残リスク

| # | リスク | 緩和策 |
|---|---|---|
| R-1 | adminGate スタブの actor が null のため audit_log の actor_email が NULL 固定 | 05a で Auth.js + admin_users 照合に差し替え時に `c.get('adminEmail')` から注入。本タスクは null 許容で先行実装 |
| R-2 | AdminMemberDetailView.profile の構築が既存 builder 不在のため重い | MVP として最小フィールド (memberId / responseId / consent / 空 sections) を返し、TODO で後続 wave に詳細構築を委ねる |
| R-3 | dashboard の COUNT が D1 の cold cache で遅延する可能性 | 単純 COUNT のため 5GB / 500k reads 内で問題なし。将来 KV キャッシュ検討 |

## Go / No-Go

→ **GO**: Phase 4（テスト戦略）に進む。設計上の阻害要因なし。
