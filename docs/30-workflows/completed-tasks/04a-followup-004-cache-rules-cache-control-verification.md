# Cloudflare cache rules による Cache-Control override 検証 - タスク指示書

## メタ情報

```yaml
issue_number: 223
```

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| タスクID     | 04a-followup-004-cache-rules-cache-control-verification       |
| タスク名     | Cloudflare cache rules による Cache-Control override 検証     |
| 分類         | 検証 / 運用                                                   |
| 対象機能     | `/public/stats` / `/public/form-preview` の Cache-Control 整合 |
| 優先度       | 低                                                            |
| 見積もり規模 | 極小                                                          |
| ステータス   | 未実施                                                        |
| 発見元       | 04a Phase 12 unassigned-task-detection (U-4)                  |
| 発見日       | 2026-04-29                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a の Workers 実装は `/public/stats` と `/public/form-preview` に `Cache-Control: public, max-age=60` を返す。一方、Cloudflare 側の cache rules / page rules によっては Worker response の Cache-Control が override / strip される可能性がある。デプロイ後に実機 `curl -I` で必ず確認する必要がある。

### 1.2 問題点・課題

- override されると「想定 max-age=60」のところで edge cache が効かない / 過剰に効く
- `/public/members` / `/public/members/:id` は `no-store` を返すが、cache rules が `*.public.*` パターンで上書きすると leak リスクと整合性 bug を生む

### 1.3 放置した場合の影響

- cache hit/miss の挙動が想定と外れ、D1 read 想定が崩れる（U-2 の判断にも影響）
- `no-store` が override されて公開プロフィール詳細が edge にキャッシュされ、admin 更新が即時反映されない

---

## 2. 何を達成するか（What）

### 2.1 目的

production / staging deploy 後に、4 endpoint の Cache-Control / age / cf-cache-status を実機検証し、想定通りであることを記録する。

### 2.2 完了状態

- 4 endpoint の `curl -I` 実機ログが `phase-11/manual-evidence.md` 相当の場所に保存されている
- override が起きていないか、起きているなら cache rules で原因が特定されている
- 必要であれば cache rules の調整 PR が作成されている

### 2.3 スコープ

#### 含むもの

- production / staging 双方での `curl -I` 実機検証
- Cloudflare dashboard の cache rules / page rules 棚卸し
- 結果記録ファイル作成

#### 含まないもの

- 新規 cache rules の本番反映（必要時に別 PR）

### 2.4 成果物

- `docs/30-workflows/04a-parallel-public-directory-api-endpoints/outputs/phase-11/cache-control-evidence.md`（or 同等）
- 必要なら cache rules 調整 PR

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04a が production deploy 済み
- 該当ドメインの DNS / cache rules を閲覧できる権限がある

### 3.2 実行手順

1. staging で 4 endpoint を `curl -I` し、Cache-Control / cf-cache-status / age を記録
2. production で同じ検証
3. dashboard の cache rules / page rules 一覧を取得し、override 候補を確認
4. 想定との差分があれば原因（rule / Worker / Hono middleware）を特定
5. 調整が必要なら別タスクで rules 修正

### 3.3 受入条件 (AC)

- AC-1: `/public/stats` と `/public/form-preview` で `Cache-Control: public, max-age=60` が edge から返る
- AC-2: `/public/members` と `/public/members/:id` で `Cache-Control: no-store` が edge から返る
- AC-3: 4 endpoint の `cf-cache-status` 観測値（`HIT` / `MISS` / `DYNAMIC` / `BYPASS`）が記録されている
- AC-4: 想定との差分がある場合、原因と対策が記録されている

---

## 4. 苦戦箇所 / 学んだこと（04a で得た知見）

### 4.1 Worker と edge の責務分離

Hono / Worker レイヤで Cache-Control を返しても、edge 側 cache rules で上書きされうる事実は spec に明記されていない場合の見落としが多い。**deploy 後に必ず実機で確認** という運用 step を skill 側のチェックリストに入れるべき。

### 4.2 `no-store` の特別扱い

`no-store` は edge cache を完全に bypass させる意図だが、cache rules で「特定パスは強制 cache」のような rule が存在すると leak リスクに直結する。`/public/members*` が rules に含まれていないかは特に厳しく確認する。

### 4.3 検証コストの最小化

実機検証は手動 `curl -I` で十分だが、再発防止には `scripts/smoke-cache-headers.sh` のような automation を作る選択肢もある（ただし優先度低）。

---

## 5. 関連リソース

- `apps/api/src/routes/public/stats.ts`
- `apps/api/src/routes/public/form-preview.ts`
- `apps/api/src/routes/public/members.ts`
- `apps/api/src/routes/public/member-profile.ts`
- 04a Phase 11 manual-evidence.md
- 04a Phase 12 unassigned-task-detection.md U-4
