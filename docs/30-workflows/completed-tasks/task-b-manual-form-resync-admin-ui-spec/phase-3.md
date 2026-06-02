# Phase 3 — 設計レビュー（Phase 4 進行判定ゲート）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> Phase 1-2 の設計を 4 条件で評価し、Phase 4 へ進めるかを判定する。

---

## 1. 一次結論（5 項目）

| 観点 | 結論 |
|------|------|
| 真の論点 | 「実装済み sync layer に UI 操作面 + server-only Bearer 注入を与える」で固定済み。landed 実装と一致。 |
| 依存関係・責務境界 | UI / mutation / contract / proxy / backend の 5 層が混在なく分離。backend は不変条件で凍結。 |
| 価値とコストの不均衡 | 価値=CLI 依存解消 / 二重起動防止。最大コスト部品=proxy 認証注入（機密境界）。landed 実装で解決済み。 |
| 改善優先順位 | (1) drift 補正の正本固定 (2) 回帰テスト coverage 写像 (3) 未設定時 fail-fast の検証。 |
| 4 条件評価 | 下表の通り全て PASS。 |

---

## 2. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者の CLI/curl 依存を解消（誰のどのコストを下げるか明確）。AC-B1..B3 に対応。 |
| 実現性 | PASS | landed 済み。新規実装不要・1 サイクル内で回帰確認が完了する（CONST_007）。 |
| 整合性 | PASS | 責務境界・状態所有権・依存関係が矛盾なく閉じる。`apps/api` 差分ゼロ invariant を維持。 |
| 運用性 | PASS | proxy 未設定時 fail-fast（500）/ mutex 409 / disabled の運用が破綻しない。Secrets は user-gated。 |

---

## 3. 因果ループ（最低 1 本ずつ）

- **強化ループ（R）**: UI 操作面の提供 → 管理者が手動 sync 実行 → D1 反映 → `/members` 公開反映 → 運用信頼性向上 → 利用継続。
- **バランスループ（B）**: 二重 sync リスク → クライアント disabled + サーバ mutex 409 → 競合抑制 → リスク減。

---

## 4. KJ 法クラスタ（設計論点の整理）

- **クラスタ A（認証境界）**: proxy Bearer 注入 / env optional / 未設定 fail-fast / Secrets user-gated。
- **クラスタ B（契約再宣言）**: zod 再宣言 / `.strict()` / 409 refine / 不変条件 #5。
- **クラスタ C（UI 状態）**: 2 mutation インスタンス / busy disabled / parseError / inProgress / 結果テーブル。

---

## 5. drift 補正の妥当性確認（Phase 1 §5 → 設計反映）

| drift | 設計上の扱い |
|-------|-------------|
| D2/D3（schema フィールド） | 実 schema（最小フィールド + 409 refine）を contract 正本とし、原タスクの `failed`/`retryCount` 列は採用しない |
| D5/D6（proxy パス / 409 body） | `needsSyncAdminBearer` の current 4 パスと `{ok:false,result:{status:skipped}}` 形を正本とする |
| D7（confirm） | `globalThis.confirm` 直接を採用（test は spy）。自前 dialog は over-scope のため不採用 |

→ drift はすべて landed 実装を正とすることで整合。設計矛盾なし。

---

## 6. 判定

> **判定: PASS — Phase 4 へ進行可**

- blocker: なし
- MINOR: なし（landed 実装が AC を充足済み）
- 留意: Phase 11 runtime screenshot と `SYNC_ADMIN_TOKEN` 投入は user-gated（外部運用）。

---

## 完了条件

- [x] 一次結論 5 項目を提示した
- [x] 4 条件すべてを評価し PASS とした
- [x] 因果ループ（R/B）を各 1 本記述した
- [x] KJ 法クラスタで設計論点を整理した
- [x] drift 補正の設計反映の妥当性を確認した
- [x] Phase 4 進行判定（PASS）を下した
