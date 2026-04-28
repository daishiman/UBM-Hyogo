# Phase 3: alternatives

## 検討した代替案
### A. ORM (Drizzle / Kysely) 採用
- 利点: 型安全な query builder
- 不採用理由: 依存追加でバンドルサイズ増。Workers 動作実績の確認コスト。直接 `D1Database.prepare` で十分薄い
### B. attendance / tagQueue を共通 base クラス化
- 利点: 状態遷移コード DRY
- 不採用理由: 02a / 02c との相互依存を作りやすく、不変条件 #5 boundary の維持が複雑化
### C. tagQueue 状態遷移を bidirectional 許可
- 不採用: 不変条件 #13 で resolve は不可逆運用。仕様書 AC-4 に違反

## 採用案
- 各 repository は関数 export + `DbCtx` 注入の最小設計
- 状態遷移は per-repository に明示テーブル
