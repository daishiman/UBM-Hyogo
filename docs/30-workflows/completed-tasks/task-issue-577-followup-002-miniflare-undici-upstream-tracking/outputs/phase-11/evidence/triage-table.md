# Upstream triage table — 2026-05-11

## 確認範囲

- since: 直近 release 取得時点（fetched via `gh api repos/{owner}/{repo}/releases`）
- until: 2026-05-11
- 担当: qa-tests / infra-runbook
- 対象 tag 範囲（最新 15 件抜粋）
  - cloudflare/workers-sdk: `wrangler@4.90.0` (2026-05-07) … `miniflare@4.20260507.0` (2026-05-07)
  - nodejs/undici: `v8.2.0` (2026-05-01) … `v8.0.3` (2026-04-12)
  - cloudflare/workerd: `v1.20260511.1` (2026-05-11) … `v1.20260507.1` (2026-05-07)

## triage 結果

| repo | tag | hit kw | PR/commit | 判定 | メモ |
| --- | --- | --- | --- | --- | --- |
| cloudflare/workers-sdk | miniflare@4.20260507.0, miniflare@4.20260507.1, wrangler@4.89.x–4.90.0 | `miniflare`(18), `Miniflare`(6) | Miniflare `TZ=UTC` default / hosted images mock variant names / dependabot bumps | なし | socket pool / agent pool / keep-alive / port reuse / EADDRNOTAVAIL に関連する変更は 0 件。タイムゾーン既定値・mock 動作改善のみ。 |
| nodejs/undici | v8.2.0, v8.1.0, v7.25.0, v6.25.0, v8.0.3 | `socket`(13), `keep-alive`(1) | WebSocket / WebSocketStream / http2 websocket / `track HEAD keep-alive override as boolean` (内部 refactor) | なし | hit はすべて `websocket` / `WebSocket` 系。Agent pool / connection reuse / EADDRNOTAVAIL / TIME_WAIT に対応する fix なし。`keep-alive` 該当も WS upgrade boolean 化のみで Agent 振る舞いを変更しない。 |
| cloudflare/workerd | v1.20260507.1 〜 v1.20260511.1 | `socket`(3) | `[build] Improve test parallelism through custom resource for socket tests` (#workerd 内部 test infra), `fix: populate localAddress on connect handler Socket` | なし | 前者は workerd 側 test の Bazel 並列化、後者は `connect()` handler の `Socket.localAddress` を埋める bug fix。Miniflare 経由 vitest が利用する outbound socket pool / port reuse セマンティクスに影響しない。 |

## 結論

- [x] 改善なし → maxWorkers=1 維持
- [ ] 改善あり → A/B 評価
- [ ] 保留 → 次サイクル

## 根拠

- 全 hit を文脈展開した結果、Issue #577 の `EADDRNOTAVAIL` 発生原因（Miniflare/workerd 経由の短命 outbound socket が `TIME_WAIT` を堆積し ephemeral port を枯渇させる）に対する上流修正は 0 件。
- したがって `apps/api/package.json#test:coverage` の `--maxWorkers=1 --minWorkers=1` は維持し、A/B 実験は本サイクルでは実施しない（AC-3 適用、AC-4 は不適用）。
- 次トリガは「月次再走 or Miniflare メジャー更新」。次回起点 tag: `miniflare@4.20260507.1` / `undici v8.2.0` / `workerd v1.20260511.1`。
