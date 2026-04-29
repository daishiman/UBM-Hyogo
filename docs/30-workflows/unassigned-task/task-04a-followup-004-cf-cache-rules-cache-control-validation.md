## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | task-04a-followup-004-cf-cache-rules-cache-control-validation |
| タスク名     | Cloudflare cache rules による Cache-Control override 検証 |
| 分類         | 運用検証 / smoke |
| 対象機能     | `/public/*` の Cache-Control header |
| 優先度       | 中 |
| 見積もり規模 | 極小 |
| ステータス   | 未実施 |
| 発見元       | 04a Phase 12 |
| 発見日       | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a 実装で `/public/stats` と `/public/form-preview` には `public, max-age=60`、`/public/members*` には `no-store` を Workers 側で設定した。ただし Cloudflare zone 側の cache rules が override していないことを deploy 後に確認する必要がある。

### 1.2 問題点・課題

- Cloudflare zone settings によっては Workers の Cache-Control が上書きされる可能性がある。
- staging / production 両方での実機確認が必要。

### 1.3 放置した場合の影響

- `/public/members/:id` が誤って edge cache に乗り、leak リスクが出る（個人プロフィールが他人に表示される）。
- 逆に `/public/stats` が cache されず、D1 / WAE コストが増加する。

---

## 2. 何を達成するか（What）

### 2.1 目的

deploy 後に `curl -I` で Cache-Control header を実機確認し、Workers 側の設定が zone cache rules で override されていないことを保証する。

### 2.2 スコープ

- staging / production 両 env での `curl -I https://<host>/public/stats` 等の 4 endpoint チェック
- 結果を該当 deploy タスクの `manual-smoke-log.md` に記録

---

## 3. どのように実行するか（How）

### 3.1 推奨アプローチ

```bash
for path in /public/stats /public/members /public/members/<sample-id> /public/form-preview; do
  curl -sI "https://<host>${path}" | grep -i cache-control
done
```

期待値:
- `/public/stats`: `public, max-age=60`
- `/public/members`: `no-store`
- `/public/members/:id`: `no-store`
- `/public/form-preview`: `public, max-age=60`

---

## 4. 完了条件チェックリスト

- [ ] 4 endpoint × 2 env の Cache-Control header が期待値と一致
- [ ] 不一致時、Cloudflare cache rules を修正
- [ ] `manual-smoke-log.md` に結果を記録

---

## 5. 参照情報

- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/unassigned-task-detection.md`（U-4）
- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
