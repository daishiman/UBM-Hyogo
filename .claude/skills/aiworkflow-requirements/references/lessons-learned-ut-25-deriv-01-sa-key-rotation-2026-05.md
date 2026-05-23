# Lessons Learned — UT-25-DERIV-01 SA Key Rotation SOP

## L-UT25SAK-001: secret 値は stdin パイプ専用、shell 履歴は併用抑止する

`scripts/cf-rotate-sa-key.sh` は `op read "op://<Vault>/<Item>/<Field>" | scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON ...` の **stdin パイプ専用** とし、引数経由・`echo`・`<<<` here-string を一切受け付けない。さらに `set +o history` と `HISTFILE=/dev/null` を helper 冒頭で強制し、tmux/screen のスクロールバッファ消去手順を SOP に同梱する。stdin 強制のみだと shell の line history に key 値そのものは残らなくても、helper を呼んだ command line（`op read ... | ...`）が残るため、history 抑止と併用しないと油断事故が起きる。

## L-UT25SAK-002: state guard でローテーション順序を物理的に強制する

staging→production の順序は人手 SOP の文章だけでは破られる。`scripts/cf-rotate-sa-key.sh` は state file (`/tmp/cf-rotate-sa-key.state` または `.rotate-sa-key.state`) に「staging put 済 / staging verify 済 / production put 可」の 3 状態を保存し、staging verify が PASS していない状態で `--env production` を渡しても helper 自体が exit 1 する。SOP 順序を bash 側で再現することで「production を先に上書き」事故が起きないようにする。

## L-UT25SAK-003: 値検証は UT-26 経由でのみ可能、`secret list` は name 確認まで

Cloudflare Secrets は配置後の値読み取りができないため、helper / SOP の完了判定は `bash scripts/cf.sh secret list --env <env>` で **name 存在のみ**確認し、**機能検証は UT-26 の Sheets API 疎通テスト**で行う 2 段構成にする。helper 内に `wrangler tail` 60 秒待機を組み込み、UT-26 で疎通 PASS が出てから次フェーズへ進む順序を helper の `verify` サブコマンドで提供する。

## L-UT25SAK-004: bats テストは helper の副作用を隔離するため tmp HOME / tmp HISTFILE を fixture 化する

`scripts/__tests__/cf-rotate-sa-key.bats` は実 Cloudflare / 実 1Password を呼ばないが、helper の `HISTFILE=/dev/null` / `set +o history` を bats テスト中に効かせると bats 自身の trace が壊れるリスクがあるため、テスト fixture では `HOME=$BATS_TEST_TMPDIR` / `HISTFILE=$BATS_TEST_TMPDIR/.hist` で隔離する。helper の副作用と bats の trace を両立させるパターンを fixture 化することで、shellcheck PASS と bats PASS を同時に維持できる。

## L-UT25SAK-005: aiworkflow-requirements の 500 行超過 reference は新規追加分が 1〜2 行でも分割タイミングを記録する

`references/deployment-secrets-management.md` は本タスク追加前に 649 行で、SOP 逆参照 1 行 + 変更履歴 1 行で 651 行となった。次に同 reference へ 50 行以上の追記が発生したら `references/secrets-rotation-runbook-index.md` などへ rotation 系を切り出す責務分離を検討する。本 lesson を起点に「500 行近傍 reference の追記閾値」を意識する。

## L-UT25SAK-006: 90 日採用根拠は SOP 冒頭に必ず明記する

ローテーション頻度は NIST SP 800-57（暗号鍵管理ライフサイクル）と Google IAM ベストプラクティス（90 日以内推奨）を採用根拠として SOP `## ローテーション頻度の決定` で明示する。90 日 / 180 日のいずれを選ぶかは運用負荷 vs 漏洩リスク低減のトレードオフであり、根拠を SOP に書かないと「なぜ 90 日か」が運用引き継ぎで失われる。

## L-UT25SAK-007: 完了記録テンプレは 8 必須フィールド + fingerprint 頭 16 文字のみ

完了記録 `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` は実施日 / 実施者 / 旧 fingerprint / 新 fingerprint / staging 検証時刻 / production 検証時刻 / disable 時刻 / delete 時刻の 8 フィールドを必須化する。fingerprint は **頭 16 文字のみ**記載（完全一致での参照は IAM 上の `gcloud iam service-accounts keys list` で取得できるため、記録側はトレース用に短縮）。完全な fingerprint や JSON private_key_id をそのまま記録すると、records ディレクトリ自体が機微情報蓄積点になる。
