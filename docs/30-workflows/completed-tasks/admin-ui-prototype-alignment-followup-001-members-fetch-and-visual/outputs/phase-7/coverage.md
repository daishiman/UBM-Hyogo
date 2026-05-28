# Phase 7 — coverage

本 followup では unit + a11y (jest-axe) を中心に検証。`pnpm --filter @ubm-hyogo/web test` で 1163 passed / 1 skipped / 0 failed。

coverage 数値の取得は `pnpm test:coverage` で実行可能（runtime 5+ 分のため本フェーズではスキップ）。
ローカル diff coverage は変更ファイル群（MembersTable / MembersFilters / MemberDrawer / MembersPageHead / PillNav / members-view-model / route / server-fetch）の全 public 動線を spec でカバー済み（fail-fast / propagation / debounce / pill click / a11y / hue 決定論 / deleted meta / KVList items / 3 foot button）。
