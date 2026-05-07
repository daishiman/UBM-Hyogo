# Phase 12 main — 全体総括

owner = 主担当 / co-owner = サブ担当（用語 alias、L-005 引き継ぎ）

## AC 達成状況

| AC | 内容 | 状態 |
| --- | --- | --- |
| AC-1 | ADR-001 runtime SSOT 配置 (apps/api 維持) を spec.md に追記 | ✅ |
| AC-2 | owner 表に sync-jobs-schema.ts 行追加 | ✅ |
| AC-3 | spec.md §2/§3/§5 に owner 表 + SSOT 参照リンク | ✅ |
| AC-4 | contract test の canonical 値網羅 + email 形式値拒否 | ✅ |
| AC-5 | database-schema.md `sync_jobs` 節を `_design/` 参照で統一 | ✅ |
| AC-6 | unassigned-task status: resolved | ✅ |
| AC-7 | indexes drift 0（idempotent rebuild 確認） | ✅ |
| AC-8 | typecheck / lint / vitest 全 PASS | ✅ |

## 4 条件最終再評価
- 価値性: PASS（governance チェーン完結）
- 実現性: PASS（1 PR / 1 サイクルで完了）
- 整合性: PASS（ADR・owner 表・runtime SSOT 1:1）
- 運用性: PASS（後続 wave 追加時 owner 表 1 行 + ADR 1 段落で済む）

## 中学生レベル概念説明

### なぜ runtime SSOT の置き場所を ADR で記録するのか
プログラムで使う「決まった値」を 1 か所に集めるとき、その「1 か所」をどこに置くかには色んな選び方がある。今回は `apps/api` 配下を選んだが、5 年後の人が「なんで `packages/shared` じゃないの？」と疑問に思ったとき、答えがどこにも書かれていないと、また同じ議論を最初からやり直すことになる。ADR は「過去の自分が未来の自分に書き残すメモ」。

### なぜ owner / co-owner を表で決めるのか
1 つのファイルを「誰でも勝手に変えていい」状態にすると、A さんと B さんが同時に違う方向で変えてしまい、つじつまが合わなくなる。owner = 主担当 / co-owner = サブ担当を表で決めておくと、変更前に「相談すべき相手」が一目でわかる。クラスの「学級委員 / 副委員」と同じ役割分担。

### なぜ canonical 値を契約テストで縛るのか
たとえば `SYNC_LOCK_TTL_MS = 10 * 60 * 1000`（10 分）を、誰かが「ちょっと短い気がする」と思って書き換えてしまうと、ロック動作が想定外になる。テストで `expect(SYNC_LOCK_TTL_MS).toBe(600000)` と書いておけば、書き換えた瞬間に CI が赤くなって気づける。「鍵の暗証番号を変えたら警報が鳴る」のと同じ。
