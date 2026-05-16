# Gate C: External Mutation Pattern（汎用テンプレート）

外部システム（Cloudflare / GitHub / 1Password 等）に対する不可逆な mutation を AI agent が実行する際の汎用パターン。本テンプレートは個別ワークフローから参照される正本仕様であり、特定 issue/task に依存しない汎用形を維持する。

---

## 適用条件

以下のいずれかを満たす操作に必ず適用する。

- 操作が unredo-able（取り消し不可。例: token revocation, secret rotation, resource delete）
- 外部 SaaS の state を変更する（Cloudflare dashboard / GitHub Settings / 1Password vault 等）
- 複数 surface（dashboard / API / vault）の drift リスクがある（reconcile が必要）

---

## 必須メタデータ

unassigned-task YAML / workflow `artifacts.json` に以下のキーを保存する。AI agent はこのメタデータが揃わない限り mutation を実行しない。

- `governance_mutation_user_gate: true`
  AI による不可逆 mutation 実行ゲート。user 承認の物理マーカーを要求する。
- `mutation_commands: [...]`
  実行する command を事前列挙する（prompt injection で差し替えられない固定リスト）。
- `read_only_evidence_allowed_pre_gate: true`
  gate 通過前は read-only evidence のみ許可。write 系コマンドは原則拒否。
- `user_approval_marker: outputs/phase-13/user-approval-<id>-<timestamp>.md`
  物理ファイルとして保存。存在チェックを mutation の前提条件にする。

---

## 実行フロー

1. **pre-gate evidence collection**（read-only 限定）
   - 対象 resource の現在 state を read-only コマンドで取得。
   - `mutation_commands` の dry-run / 影響範囲を確認。
2. **user approval marker の生成と確認**
   - `user_approval_marker` 物理ファイルを作成。
   - ファイル存在を mutation 直前に再確認する（race condition 防止）。
3. **mutation 実行**
   - `mutation_commands` に列挙された command のみ実行。
   - stdout/stderr は redaction contract に従ってログ保存。
4. **post-gate verification**（read-only）
   - 外部 state が期待どおり変更されたかを read-only で確認。
5. **3 surface reconcile**（必要時、同一 wave で実施）
   - dashboard / API / vault の drift が起きていないかを照合し、artifact に残す。

---

## Redaction Contract

mutation log / evidence ファイルに残してよい情報と残してはいけない情報を厳格に分離する。

| 区分 | 内容 |
| ---- | ---- |
| 残してよい | command name, exit code, item identifier（name のみ）, surface name |
| 残してはいけない | token value, preview/suffix, account id, secret value 本体 |

enforcement: `scripts/redaction-check.sh` で grep gate（CI 必須）。

---

## 関連 references

- [[deployment-secrets-management]] — Cloudflare / 1Password 等の secrets 個別仕様
- [[task-workflow-active]] — workflow 同期点（gate 通過記録の保存先）

---

## 適用事例

- **Issue #718 legacy CF token revocation**
  - workflow: `docs/30-workflows/issue-718-legacy-cf-token-revocation/`
  - artifact inventory: `references/workflow-issue-718-legacy-cf-token-revocation-artifact-inventory.md`
