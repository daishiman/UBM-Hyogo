# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（failure cases / 検出 / 即時対応 / rollback 判断 / 後続タスク化） |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク状態 | spec_created（GitHub Issue #202 は CLOSED でも仕様書 GO 済み） |
| タスク分類 | implementation / governance / NON_VISUAL（failure analysis） |

## 目的

Phase 5 の正常系 runbook に対し、想定し得る異常系シナリオを **F-1〜F-12 の 12 種類** に MECE で網羅し、各シナリオに対して「検出方法 / 即時対応 / rollback 判断基準 / 後続タスク化判定」の 4 軸を埋める。Phase 3 リスクレジスタ（R-1〜R-8）と整合させ、Phase 13 実 PUT 時に実行者が単一文書で判断できる failure runbook（`outputs/phase-06/failure-cases.md`）を完成させる。本タスクの不変条件（`enforce_admins=true` / dev / main 独立 PUT / rollback payload 再利用 / Secret hygiene / Phase 13 ユーザー承認前提）を、異常系挙動でも維持する設計を Phase 7 の AC マトリクスへ引き渡す。

## 本 Phase でトレースする AC

- AC-6（適用後 GET の集合一致確認 / 不一致時の即時対応）
- AC-7（drift 検出時の対応）
- AC-8（rollback 経路 / payload 再利用原則）
- AC-9（typo / workflow 名混入の検出と対応）
- AC-10（admin block の検出と rollback 担当・経路）

## 実行タスク

1. 異常系シナリオを F-1〜F-12 として MECE で列挙する（完了条件: 認証 / 権限 / rate / スキーマ / typo / 片側部分適用 / 不正書換 / 上流不整合 / admin block / drift / 集合不一致 の 11 軸が網羅）。
2. 各シナリオに「検出方法 / 即時対応 / rollback 判断基準 / 後続タスク化判定」の 4 軸を埋める（完了条件: 12 × 4 = 48 セル空欄なし）。
3. リスクレジスタ R-1〜R-8 と F-1〜F-12 の対応表を作成する（完了条件: 各 R が 1 つ以上の F に紐付く）。
4. rollback payload 再利用原則の維持を全シナリオで明記する（完了条件: 「UT-GOV-001 由来」が必要箇所すべてに登場）。
5. Phase 13 実行者向け一枚 cheatsheet（コマンド + 即時判断 flow）を成果物に含める。
6. 後続タスク化判定が必要なケース（drift / UT-GOV-004 不整合 / GitHub API 仕様変更）を Phase 12 unassigned-task-detection へ引き渡す経路を定義する。
7. 成果物 1 ファイル（`outputs/phase-06/failure-cases.md`）を作成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | 苦戦箇所 1〜8 / AC |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-03.md | リスクレジスタ R-1〜R-8 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-04.md | 失敗時挙動表 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-05.md | runbook 9 ステップ / rollback 3 パターン |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | rollback payload 正本 |
| 必須 | GitHub REST API: branch protection / rate limit doc | HTTP ステータスコード一覧 |
| 必須 | CLAUDE.md（Secret hygiene） | token 漏洩異常系 |

## 異常系シナリオ網羅（F-1〜F-12）

### F-1: GitHub API 認証失敗（401）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | `gh api ... --include` の HTTP `401 Unauthorized`、`x-github-request-id` ヘッダ記録 |
| 即時対応 | PUT に進まない。`gh auth status` を確認。1Password 参照（`op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`）を再注入。token 値は出力に転記しない |
| rollback 判断 | 不要（PUT 未実行） |
| 後続タスク化 | 不要（運用問題） |

### F-2: admin scope 不足（403）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | HTTP `403 Forbidden` / response body の `message: "Resource not accessible by integration"` 等 |
| 即時対応 | PUT 中断。`x-oauth-scopes` ヘッダで scope 不足を確認。admin scope を持つ token に切替 |
| rollback 判断 | 不要（PUT 未実行） |
| 後続タスク化 | scope 管理プロセスの不備として別タスク起票候補（Phase 12） |

### F-3: rate limit（429 / 403 secondary rate limit）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | HTTP `429` または `403` + `x-ratelimit-remaining: 0` / `retry-after` ヘッダ |
| 即時対応 | `retry-after` 秒待機後に再試行。連続失敗時は手作業を 1h 中断 |
| rollback 判断 | dev のみ成功・main rate limit 中断時は main 再試行で完了。完全 rollback は不要 |
| 後続タスク化 | 不要（一時障害） |

### F-4: PUT スキーマ違反（422）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | HTTP `422 Unprocessable Entity` / response body の `errors` 配列 |
| 即時対応 | payload 修正（多くは contexts 配列の型不正 / 不変条件 6 値の値型不一致）。Step 4 の dry-run 差分プレビューを再実行 |
| rollback 判断 | 不要（PUT 未確定） |
| 後続タスク化 | 不要（payload 修正で解消） |

### F-5: contexts に typo / 廃止 workflow 名混入

| 軸 | 内容 |
| --- | --- |
| 検出方法 | 静的検証（`.yml` 拡張子検査）/ 適用後 GET と expected-contexts 集合不一致 / open PR の永続的 merge block |
| 即時対応 | UT-GOV-001 rollback payload を該当 branch へ即時 PUT。expected-contexts-{branch}.json の再生成は別タスク起票（UT-GOV-004 へ差し戻し） |
| rollback 判断 | **必須**（admin block 連鎖を防ぐため即時実行） |
| 後続タスク化 | 必要（UT-GOV-004 修正タスクとして Phase 12 で起票） |

### F-6: dev PUT 成功・main PUT 失敗（片側部分適用）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | dev applied JSON が HTTP 200 / main PUT が ≠ 200 |
| 即時対応 | main 側のみ UT-GOV-001 rollback payload を PUT。dev は 2 段階目状態で維持（事故拡大を防ぐ） |
| rollback 判断 | main のみ rollback。dev は維持 |
| 後続タスク化 | main PUT 失敗の根本原因（rate / scope / payload）が特定でき次第、本タスクの再実行スケジュールを Phase 12 へ |

### F-7: main PUT 成功・dev PUT 失敗

| 軸 | 内容 |
| --- | --- |
| 検出方法 | F-6 の鏡像（dev PUT を先に行う runbook では発生しないはずだが、再試行時に発生し得る） |
| 即時対応 | dev のみ rollback。main は維持 |
| rollback 判断 | dev のみ rollback |
| 後続タスク化 | F-6 と同等 |

### F-8: 適用前 GET と適用後 GET で contexts 以外が変化（不正書換）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | `diff <(jq 'del(.required_status_checks.contexts)' current) <(jq 'del(...)' applied)` が 0 行でない |
| 即時対応 | 該当 branch のみ UT-GOV-001 rollback payload を PUT。書換原因を特定（payload 生成バグ / 1 段階目 applied JSON の改変） |
| rollback 判断 | **必須**（不変条件違反） |
| 後続タスク化 | 必要（payload 生成手順の修正タスク） |

### F-9: UT-GOV-004 成果物が未生成 / 不正

| 軸 | 内容 |
| --- | --- |
| 検出方法 | `required-status-checks-contexts.{dev,main}.json` の存在しない / 配列要素が空 / `.yml` 混入 / 重複あり |
| 即時対応 | 本タスクを中断。UT-GOV-004 へ差し戻し。本タスク仕様の Phase 13 を保留 |
| rollback 判断 | 不要（PUT 未実行） |
| 後続タスク化 | 必要（UT-GOV-004 修正タスク。本タスクは UT-GOV-004 完了後に再開） |

### F-10: admin block（contexts 埋めた直後の merge 不能）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | PUT 直後の open PR で merge button 無効 / 期待 contexts に対応する check-run が green でない |
| 即時対応 | 該当 branch のみ UT-GOV-001 rollback payload を即時 PUT。実行者は rollback コマンドを事前にターミナルで開いておく（PUT 直前チェックリスト） |
| rollback 判断 | **必須**（admin 自身の block を放置すると緊急 fix も merge 不能） |
| 後続タスク化 | 必要（PUT 直前チェックリストの強化 / Phase 12） |

### F-11: drift 検出（CLAUDE.md / deployment-branch-strategy.md と GitHub 側）

| 軸 | 内容 |
| --- | --- |
| 検出方法 | `outputs/phase-09/drift-check.md` の 6 値対応表で不一致 |
| 即時対応 | rollback しない（GitHub 側を正本とする原則）。CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の追従更新タスクを別起票 |
| rollback 判断 | 不要 |
| 後続タスク化 | 必要（Phase 12 unassigned-task-detection で起票） |

### F-12: 期待 contexts と適用後 contexts の集合不一致

| 軸 | 内容 |
| --- | --- |
| 検出方法 | `jq -S 'sort'` 同士の `diff` が 0 行でない |
| 即時対応 | 該当 branch のみ UT-GOV-001 rollback payload を PUT。原因（payload 生成 / GitHub 側 silent drop / 入力 contexts 不正）を特定 |
| rollback 判断 | **必須**（governance 不確定状態の継続を許さない） |
| 後続タスク化 | 必要（GitHub silent drop の場合は workflow 名→job 名マッピングの再確認タスク） |

## リスクレジスタ × failure case 対応表

| Risk | 対応する Failure |
| --- | --- |
| R-1（typo context） | F-5 / F-12 |
| R-2（dev / main 片側失敗） | F-6 / F-7 |
| R-3（admin block） | F-10 |
| R-4（contexts=[] 残留） | F-9（UT-GOV-004 未完了による）/ F-12（payload bug による） |
| R-5（drift 放置） | F-11 |
| R-6（admin token 漏洩） | F-1 / F-2（運用過程で token を出力に転記する事故） |
| R-7（UT-GOV-004 不整合） | F-9 / F-5 |
| R-8（PR 自動実行による未承認 PUT） | 本仕様書段階で禁止。Phase 13 実行ゲート違反 = 本タスク全体の手順違反 |

## rollback payload 再利用原則の確認

すべての `rollback 必須` ケース（F-5 / F-8 / F-10 / F-12）で、rollback payload は **UT-GOV-001 由来をそのまま再 PUT** することを明記する。本タスクで rollback payload を再生成・上書きしない（AC-8 / 苦戦箇所 #2）。

## Phase 13 実行者向け一枚 cheatsheet

```
[症状] 401  → token 再注入（op run）→ 中断
[症状] 403  → admin scope 確認 → token 切替 → 中断
[症状] 429  → retry-after 待機 → 再試行
[症状] 422  → payload 修正 → 再 PUT
[症状] 200 だが集合不一致 → UT-GOV-001 rollback 即 PUT → 原因解析
[症状] 200 だが contexts 以外も変化 → UT-GOV-001 rollback 即 PUT → payload bug 起票
[症状] open PR が merge 不能 → UT-GOV-001 rollback 即 PUT → 直前チェックリスト見直し
[症状] dev OK / main NG → main のみ rollback / dev 維持
[症状] dev NG / main OK → dev のみ rollback / main 維持
[症状] drift 検出 → rollback 不要 → CLAUDE.md 等の追従タスク起票
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-1〜F-12 とACの対応をmatrixへ渡す |
| Phase 9 | 異常系検出条件をQA観点へ渡す |
| Phase 13 | rollback判断基準として参照する |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 異常系 runbook | outputs/phase-06/failure-cases.md | F-1〜F-12 の 4 軸記述 / R × F 対応表 / cheatsheet |
| メタ | artifacts.json | Phase 6 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] F-1〜F-12 の 12 シナリオが MECE で記述されている
- [ ] 各シナリオに「検出方法 / 即時対応 / rollback 判断基準 / 後続タスク化判定」の 4 軸が埋まっている
- [ ] R-1〜R-8 と F-1〜F-12 の対応表が作成されている
- [ ] rollback 必須ケース（F-5 / F-8 / F-10 / F-12）で UT-GOV-001 rollback payload 再利用が明記されている（AC-8）
- [ ] drift 検出（F-11）の対応が「rollback しない / 別タスク起票」になっている（AC-7）
- [ ] admin block（F-10）の対応に PUT 直前チェックリスト見直しが含まれている（AC-10）
- [ ] typo / workflow 名混入（F-5）の検出と対応が記述されている（AC-9）
- [ ] 集合不一致（F-12）の検出と対応が記述されている（AC-6）
- [ ] Phase 13 実行者向け cheatsheet が記述されている
- [ ] 成果物 `outputs/phase-06/failure-cases.md` が配置設計済み

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-06/` 配下に配置設計済み
- 本 Phase でトレースする AC（AC-6 / AC-7 / AC-8 / AC-9 / AC-10）が完了条件にすべて含まれている
- F-1〜F-12 × 4 軸 = 48 セル空欄なし
- R × F 対応表で R-1〜R-8 すべてが 1 つ以上の F に紐付く
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - F-1〜F-12 の 12 異常系シナリオ確定
  - rollback 必須は F-5 / F-8 / F-10 / F-12（payload は UT-GOV-001 由来再利用のみ）
  - drift（F-11）は rollback せず別タスク起票
  - 後続タスク化対象: F-2 / F-5 / F-6 / F-7 / F-8 / F-9 / F-10 / F-11 / F-12（Phase 12 で整理）
  - cheatsheet を Phase 13 実行ゲート文書に転記する経路
- ブロック条件:
  - F-1〜F-12 のいずれかで 4 軸が埋まっていない
  - rollback payload を本タスクで新規生成する記述が混入している
  - drift で rollback する記述になっている（不変条件違反）
