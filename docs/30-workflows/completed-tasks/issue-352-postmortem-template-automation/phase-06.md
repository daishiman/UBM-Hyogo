# Phase 6: 異常系検証 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 6 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

CLI `pnpm postmortem:generate` の運用時に発生する **失敗ケース最低 6 種** を仕様化し、検出方法 / mitigation / fallback 手順を確定する。production rollback 直後の担当者が、CLI が失敗してもパニックせず手書き postmortem に fallback できる経路を担保する。

苦戦箇所 S2（evidence path 必須）/ S3（runbook 責務分離）/ S4（冪等性）を異常系層で再確認する。9c Phase 6 の production rollback procedures との接続点を明示する。

## 実行タスク

1. ER-01..ER-06 の 6 ケース（最低）を採番し、検出方法 / 期待 exit code / mitigation / fallback を表で確定する。
2. 09c Phase 6 rollback 4 種（worker / pages / D1 / cron）との連携点を明記する。
3. fallback 手順（CLI 失敗時の手書き postmortem）を template.md と同等の構造で確定する。
4. 異常系を unit test で捕捉している箇所（Phase 4 の TC ID）と紐付ける。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 1 | `outputs/phase-01/main.md` | exit code 表 |
| Phase 2 | `outputs/phase-02/main.md` | `ensureEvidencePathExists` 仕様 |
| Phase 4 | `outputs/phase-04/main.md` | TC-U-03 / TC-U-04 / TC-U-09 |
| Phase 5 | `outputs/phase-05/main.md` | grep gate / 検証コマンド |
| 09c Phase 6 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md` | rollback 4 種の手順 |
| 09c Phase 11 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md` | manual evidence 仕様 |

## 異常系シナリオ（最低 6 種）

| ID | シナリオ | 入力例 | 検出方法 | 期待 exit code / 出力 | mitigation | fallback |
| --- | --- | --- | --- | --- | --- | --- |
| ER-01 | `--evidence` で指定された 09c Phase 11 evidence path が存在しない | `--evidence /tmp/nonexistent/` | `ensureEvidencePathExists` の `fs.statSync` で `ENOENT` | exit 1 / stderr: `evidence path not found: /tmp/nonexistent/` | 担当者は 09c の `outputs/phase-11/` の path を再確認し、正しい絶対 / 相対 path を渡す | 09c が completed-tasks に未移動なら `docs/30-workflows/<wave>/outputs/phase-11/` を一時的に指す |
| ER-02 | `--evidence` で指定した path は存在するが読み取り不可（permission denied） | `chmod 000 /tmp/evidence-locked/` 後に渡す | `fs.statSync` で `EACCES`（または `main.md` 配下 read 不可） | exit 1 / stderr: `evidence path not readable: /tmp/evidence-locked/` | 担当者は `ls -ld <path>` で permission を確認し `chmod` で修復 | 別ユーザでの実行 / sudo 不要な location にコピーしてから再実行 |
| ER-03 | `--release` が空文字列 / 形式不正（`v1.2` / `1.0.0` / 空文字） | `--release ""`、`--release v1.2` | `validateInput` の正規表現 `/^v\d+\.\d+\.\d+/` 不一致 | exit 1 / stderr: `invalid release: <value> (expected vX.Y.Z)` | release tag を `git tag --list` 等で確認し、`vX.Y.Z` 形式で渡す | tag 未生成なら `v0.0.0` 等のダミーで先行生成し、tag 確定後に再生成（冪等性のため上書き安全） |
| ER-04 | `--commit` が無効形式（短すぎ・hex 以外） | `--commit zzz`、`--commit 123`（7 桁未満） | `validateInput` の正規表現 `/^[0-9a-f]{7,40}$/` 不一致 | exit 1 / stderr: `invalid commit: <value> (expected 7-40 hex chars)` | `git rev-parse HEAD` で 40 桁取得して再実行 | rollback 時の commit が手元に無ければ Cloudflare dashboard / GitHub Actions の deploy log から取得 |
| ER-05 | `--out` が読み取り専用ディレクトリ / write 失敗 | `--out /readonly-dir/postmortem.md` | `main` 内 `fs.writeFileSync` の `EACCES` / `ENOENT` を catch | exit 2 / stderr: `failed to write: /readonly-dir/postmortem.md (<reason>)` | write 可能な directory を選び直す（推奨: `outputs/incident/<date>/` 配下） | `--out` を外して stdout 出力 → `pbcopy` / `tee` 経由で別 path に保存 |
| ER-06 | `--rollback-evidence` が空ファイル（path は存在するが 0 byte） | `: > /tmp/empty.md` 後に渡す | `validateInput` で必須引数として通過するが、生成された postmortem の Response セクションで rollback evidence link が空ファイルを指す | exit 0（CLI は通る）/ ただし運用上は警告を stderr に出す: `warning: rollback-evidence is empty: <path>` | 担当者は rollback 実施記録（最低限: 実行コマンド・結果・実施時刻）を path に書き込んでから再生成（S4 冪等性により上書き安全） | 09c Phase 6 の rollback 手順をそのまま記録に転記し、CLI を再実行 |

> **必須最低 6 種**は ER-01..ER-06 で充足。Phase 4 TC との紐付けは下表参照。

## 異常系 TC 紐付け（Phase 4）

| ER ID | 紐付く Phase 4 TC | カバー区分 |
| --- | --- | --- |
| ER-01 | TC-U-03 | unit |
| ER-02 | TC-U-03（拡張ケース） / 運用時のみ実環境発生 | unit + 運用 |
| ER-03 | TC-U-09 | unit |
| ER-04 | TC-U-09 | unit |
| ER-05 | TC-U-07（書き出し）の負ケース拡張 | unit |
| ER-06 | TC-U-10 補強 / 運用警告は Phase 5 ステップ 5 に追加 | unit + 運用警告 |

## 09c Phase 6 production rollback procedures との連携

09c Phase 6（`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md`）は rollback 4 種（worker / pages / D1 / cron）の手順を持つ。本タスクの postmortem 生成は **rollback 実行後** の流れに接続する:

| 順序 | フェーズ | 担当 | アクション |
| --- | --- | --- | --- |
| 1 | incident 検知 | 担当者 | 09c Phase 6 の判断フローで rollback 種別を選択 |
| 2 | rollback 実行 | 担当者 | `bash scripts/cf.sh rollback ...` 等を実行し、結果を `outputs/incident/<date>/rollback.md` に記録 |
| 3 | evidence 確認 | 担当者 | 09c Phase 11 evidence path（`docs/30-workflows/completed-tasks/09c-.../outputs/phase-11/`）が存在することを確認 |
| 4 | postmortem 生成 | 担当者 | `mise exec -- pnpm postmortem:generate -- --release ... --commit ... --evidence <09c phase-11> --rollback-evidence <step 2 path> --occurred-at ... --out outputs/incident/<date>/postmortem.md` |
| 5 | 人手記入 | 担当者 | Timeline / Impact / Root Cause / Prevention を記入（template の固定見出しに従う） |
| 6 | follow-up issue 起票 | 担当者 | README の `gh issue create` スニペットで Prevention 項目を Issue 化 |

> **連携点での注意（S3）**: 本タスクは 09c Phase 6 rollback 手順の本文を**置換しない**。連携は手順の前後関係のみで、テキスト共有は行わない。

## fallback 手順（CLI 失敗時の手書き postmortem）

CLI が ER-01..ER-05 のいずれかで起動できない場合、担当者は以下の fallback を取る:

1. `docs/30-workflows/runbooks/postmortem/template.md` を `cp` で `outputs/incident/<date>/postmortem.md` にコピーする。
2. `{{release}}` `{{commit}}` `{{occurredAt}}` 等の placeholder を手動で置換する（vim/編集エディタで `:%s/{{release}}/v0.3.1/g` 等）。
3. 残り（Timeline / Impact / Root Cause / Prevention）は通常通り記入する。
4. CLI 修復後に `--out` を別 path にして再生成し、手書き版と diff を取って漏れを検出する（S4 冪等性により上書き安全）。

これにより「CLI が壊れていても 1 時間以内に postmortem を起こす」運用が成立する。

## 異常系の grep gate（運用検査）

```bash
# fallback で誤って blame 表現を入れていないか
rg -i "責任|blame|fault|responsible|誰が" outputs/incident/  # 0 hit を期待

# evidence link が空文字列のまま放置されていないか
rg "Evidence path: \`\`" outputs/incident/  # 0 hit を期待

# rollback evidence が "(記入)" のまま残っていないか
rg "Rollback evidence: \`\(記入\)\`" outputs/incident/  # 0 hit を期待
```

## 多角的チェック観点

- **S2**: ER-01 / ER-02 で `ensureEvidencePathExists` が必ず exit 1 を返すか
- **S3**: 9c Phase 6 本文を本タスクで編集していないこと（連携は手順順序のみ・diff 0 件）
- **S4**: ER-06（空 rollback evidence）で再生成しても出力が決定論的に同一であること
- exit code の使い分け（バリデーション失敗 = 1 / I/O 失敗 = 2）が ER-05 / その他で守られているか
- fallback 手順で blame 表現を含めない教育が README に記載されているか（Phase 5 ステップ 3 と整合）
- a11y / UI 影響: NON_VISUAL タスクのため対象外

## サブタスク管理

- [ ] ER-01..ER-06 を採番（最低 6 種）
- [ ] Phase 4 TC との紐付け
- [ ] 09c Phase 6 連携手順を表で確定
- [ ] fallback 手順（手書き postmortem）を確定
- [ ] 異常系 grep gate を確定
- [ ] `outputs/phase-06/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 異常系仕様 | `outputs/phase-06/main.md` | ER-01..ER-06 / 09c 連携 / fallback 手順 |

## 完了条件

- [ ] ER-01..ER-06 が記載され、検出方法・期待 exit code・mitigation・fallback が空欄なし
- [ ] Phase 4 TC との紐付けが空欄なし
- [ ] 09c Phase 6 production rollback procedures との連携が手順表で示される
- [ ] CLI 失敗時の手書き fallback 手順が確定
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] 09c Phase 6 / Phase 11 本文を編集していない（連携は手順順序のみ）
- [ ] 新 error code を追加していない（exit code 0 / 1 / 2 のみ）

## 次 Phase への引き渡し

Phase 7 へ、AC × TC × ER の 3 軸入力を渡す。Phase 7 では AC-1..AC-10 を verification step（コマンド・期待値）と 1:1 対応させ、NON_VISUAL のため screenshot 列を「N/A: NON_VISUAL（runbook + script test で代替）」と明記する。
