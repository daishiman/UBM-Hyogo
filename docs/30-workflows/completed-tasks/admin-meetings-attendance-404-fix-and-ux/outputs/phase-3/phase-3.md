# Phase 3: 設計レビュー（ゲート）

**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

Phase 4 へ進めてよいかを判定する。

## 3.1 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|---|---|---|
| **価値性** | ✅ | 開催日追加が staging で完全ブロック（運用不能）→ 404 修正で運用開始可能。出席管理の発見性向上で「使えない画面」を解消。誰の（admin の）どのコスト（運用ブロック）を下げるか明確 |
| **実現性** | ✅ | apps/web の 4 ファイル編集 + テスト。proxy 修正は `server-fetch.ts` の実証済みパターン移植。新 API/新 hook/新 primitive ゼロ。1 サイクルで実装可能 |
| **整合性** | ✅ | transport 選択は route handler に閉じ、env アクセサに漏らさない（状態所有権明確）。IA は meeting→attendance の FK 従属に沿った Master-Detail 統合で責務境界が閉じる。分析（read）と登録（write）を分離 |
| **運用性** | ✅ | `logAdminTransport` で transport 観測可能。DoD に staging 実測 + 全 admin mutation 回帰を含む。再発防止 = HTTP 値依存を排除 |

## 3.2 因果ループ（強化 / バランス）

- **バランスループ（解消）**: proxy が binding 経路へ統一 → GET/POST が同一 api に到達 → 404 解消 → 開催日が作れる → 出席 UI に到達できる → 出席管理が機能する。
- **強化ループ（リスク）**: もし binding 取得を誤ると全 admin mutation が一斉に壊れる（proxy は全 admin API の単一経路）。→ §3.3 リスクで緩和。

## 3.3 リスクと緩和

| リスク | 影響 | 緩和（仕様での対策） |
|---|---|---|
| transport 切替で全 admin mutation を巻き込む | 高（単一経路） | AC-A5 で tags/member-status/requests の回帰を必須化。Phase 4 で binding 優先・HTTP fallback・500 の 3 分岐を unit test 化 |
| binding 不在の local dev で動かなくなる | 中 | AC-A2 で HTTP fallback を保持。`getAuthEnv().API_SERVICE` が undefined のとき従来 HTTP 経路 |
| `getAuthEnv()` が binding 未公開だと修正不能 | （解消済み） | env.ts:136-141 で公開済みを確認済み。新アクセサ不要 |
| 出席人数バッジが stale（初期 attendance に依存） | 中 | §2.3 で `attended` state 由来のカウントを timeline に渡す設計に固定。`MeetingItem.attendance` 非依存 |
| OKLch トークン違反（バッジ色 HEX 直書き） | 中（CI gate fail） | AC-B5 + Phase 8/9 で token 準拠確認。`verify-design-tokens` 対象 |
| staging で 404 が proxy 以外（api 未デプロイ等）由来 | 低〜中 | DoD で staging 実測。万一 binding 統一後も 404 なら api デプロイ/INTERNAL_API_BASE_URL を別途確認（index スコープ外注記済み） |

## 3.4 真因の確実性レビュー（推測でなく事実か）

| 主張 | 確実性 | 検証済み根拠 |
|---|---|---|
| GET は service binding 経由 | **確実** | `server-fetch.ts:554-558` `if (binding) binding.fetch(...)` |
| POST proxy は HTTP のみ | **確実** | `route.ts:100` `fetch(target, init)`、binding 参照なし |
| `getAuthEnv()` が binding 公開 | **確実** | `env.ts:139-141` |
| api に POST /admin/meetings あり | **確実** | `meetings.ts:138` + `index.ts:278` |
| 出席追加パスは api と一致 | **確実** | `api.ts:556` 複数形 = `meetings.ts:200` 複数形 |

→ 真因は推測でなくコードベースで確定。修正方針（binding 統一）は最小・堅牢。

## 3.5 ゲート判定

**PASS** — Phase 4 へ進む。

- 設計の曖昧点なし（transport 3 分岐・state 引き渡し・IA 境界が確定）。
- 1 サイクル完了スコープ（CONST_007）を満たす。先送り項目なし（インフラ実値確認は DoD に内包）。
- 不変条件（#1/#2/#5/#8/#9/#10）と整合。
