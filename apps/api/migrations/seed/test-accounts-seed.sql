INSERT OR REPLACE INTO schema_versions (revision_id, form_id, schema_hash, state, synced_at, field_count, unknown_field_count, source_url) VALUES
  ('TEST-REV-ACCOUNTS', 'TEST-FORM-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'active', '2026-06-03T10:30:00.000Z', 3, 0, 'seed:test-accounts');

INSERT OR REPLACE INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, edit_response_url, answers_json, raw_answers_json, extra_fields_json, unmapped_question_ids_json, search_text) VALUES
  ('TEST-RES-01', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-01@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-01', '{"fullName":"[TEST] 公開 ログイン 太郎","occupation":"経営者","ubmZone":"0_to_1","notificationOptOut":"false"}', '{"fullName":"[TEST] 公開 ログイン 太郎","occupation":"経営者","ubmZone":"0_to_1","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 公開 ログイン 太郎 経営者 0_to_1 test-mem-01@test.ubm-hyogo.invalid'),
  ('TEST-RES-02', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-02@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-02', '{"fullName":"[TEST] 会員限定 花子","occupation":"デザイナー","ubmZone":"1_to_10","notificationOptOut":"false"}', '{"fullName":"[TEST] 会員限定 花子","occupation":"デザイナー","ubmZone":"1_to_10","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 会員限定 花子 デザイナー 1_to_10 test-mem-02@test.ubm-hyogo.invalid'),
  ('TEST-RES-03', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-03@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-03', '{"fullName":"[TEST] 公開 複数出席 三郎","occupation":"マーケター","ubmZone":"10_to_100","notificationOptOut":"false"}', '{"fullName":"[TEST] 公開 複数出席 三郎","occupation":"マーケター","ubmZone":"10_to_100","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 公開 複数出席 三郎 マーケター 10_to_100 test-mem-03@test.ubm-hyogo.invalid'),
  ('TEST-RES-04', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-04@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-04', '{"fullName":"[TEST] 規約未同意 四郎","occupation":"営業","ubmZone":"Kobe","notificationOptOut":"false"}', '{"fullName":"[TEST] 規約未同意 四郎","occupation":"営業","ubmZone":"Kobe","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 規約未同意 四郎 営業 Kobe test-mem-04@test.ubm-hyogo.invalid'),
  ('TEST-RES-05', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-05@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-05', '{"fullName":"[TEST] 削除済 五郎","occupation":"士業","ubmZone":null,"notificationOptOut":"false"}', '{"fullName":"[TEST] 削除済 五郎","occupation":"士業","ubmZone":null,"notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 削除済 五郎 士業 test-mem-05@test.ubm-hyogo.invalid'),
  ('TEST-RES-06', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-06@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-06', '{"fullName":"[TEST] 最小公開 六郎","occupation":"製造","ubmZone":"Awaji","notificationOptOut":"false"}', '{"fullName":"[TEST] 最小公開 六郎","occupation":"製造","ubmZone":"Awaji","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 最小公開 六郎 製造 Awaji test-mem-06@test.ubm-hyogo.invalid'),
  ('TEST-RES-07', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-07@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-07', '{"fullName":"[TEST] 多タグ 通知停止 七海","occupation":"コミュニティ運営","ubmZone":"Hanshin","notificationOptOut":"true"}', '{"fullName":"[TEST] 多タグ 通知停止 七海","occupation":"コミュニティ運営","ubmZone":"Hanshin","notificationOptOut":"true"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 多タグ 通知停止 七海 コミュニティ運営 Hanshin test-mem-07@test.ubm-hyogo.invalid'),
  ('TEST-RES-08', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-08@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-08', '{"fullName":"[TEST] 未登録ゲート 八郎","occupation":"金融","ubmZone":null,"notificationOptOut":"false"}', '{"fullName":"[TEST] 未登録ゲート 八郎","occupation":"金融","ubmZone":null,"notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 未登録ゲート 八郎 金融 test-mem-08@test.ubm-hyogo.invalid'),
  ('TEST-RES-09', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-09@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-09', '{"fullName":"[TEST] 本人写真 九美","occupation":"人事","ubmZone":"Tanba","notificationOptOut":"false"}', '{"fullName":"[TEST] 本人写真 九美","occupation":"人事","ubmZone":"Tanba","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 本人写真 九美 人事 Tanba test-mem-09@test.ubm-hyogo.invalid'),
  ('TEST-RES-10', 'TEST-FORM-ACCOUNTS', 'TEST-REV-ACCOUNTS', 'TEST-SCHEMA-HASH-ACCOUNTS', 'test-mem-10@test.ubm-hyogo.invalid', '2026-06-03T10:30:00.000Z', 'https://forms.test.invalid/edit/TEST-RES-10', '{"fullName":"[TEST] 山田''太郎😀 長い名前エッジケース","occupation":"R&D / セキュリティ","ubmZone":"Tajima","notificationOptOut":"false"}', '{"fullName":"[TEST] 山田''太郎😀 長い名前エッジケース","occupation":"R&D / セキュリティ","ubmZone":"Tajima","notificationOptOut":"false"}', '{"source":"seed:test-accounts"}', '[]', '[TEST] 山田''太郎😀 長い名前エッジケース R&D / セキュリティ Tajima test-mem-10@test.ubm-hyogo.invalid');

INSERT OR REPLACE INTO response_fields (response_id, stable_key, value_json, raw_value_json) VALUES
  ('TEST-RES-01', 'fullName', '"[TEST] 公開 ログイン 太郎"', '"[TEST] 公開 ログイン 太郎"'),
  ('TEST-RES-01', 'occupation', '"経営者"', '"経営者"'),
  ('TEST-RES-01', 'ubmZone', '"0_to_1"', '"0_to_1"'),
  ('TEST-RES-02', 'fullName', '"[TEST] 会員限定 花子"', '"[TEST] 会員限定 花子"'),
  ('TEST-RES-02', 'occupation', '"デザイナー"', '"デザイナー"'),
  ('TEST-RES-02', 'ubmZone', '"1_to_10"', '"1_to_10"'),
  ('TEST-RES-03', 'fullName', '"[TEST] 公開 複数出席 三郎"', '"[TEST] 公開 複数出席 三郎"'),
  ('TEST-RES-03', 'occupation', '"マーケター"', '"マーケター"'),
  ('TEST-RES-03', 'ubmZone', '"10_to_100"', '"10_to_100"'),
  ('TEST-RES-04', 'fullName', '"[TEST] 規約未同意 四郎"', '"[TEST] 規約未同意 四郎"'),
  ('TEST-RES-04', 'occupation', '"営業"', '"営業"'),
  ('TEST-RES-04', 'ubmZone', '"Kobe"', '"Kobe"'),
  ('TEST-RES-05', 'fullName', '"[TEST] 削除済 五郎"', '"[TEST] 削除済 五郎"'),
  ('TEST-RES-05', 'occupation', '"士業"', '"士業"'),
  ('TEST-RES-05', 'ubmZone', 'null', 'null'),
  ('TEST-RES-06', 'fullName', '"[TEST] 最小公開 六郎"', '"[TEST] 最小公開 六郎"'),
  ('TEST-RES-06', 'occupation', '"製造"', '"製造"'),
  ('TEST-RES-06', 'ubmZone', '"Awaji"', '"Awaji"'),
  ('TEST-RES-07', 'fullName', '"[TEST] 多タグ 通知停止 七海"', '"[TEST] 多タグ 通知停止 七海"'),
  ('TEST-RES-07', 'occupation', '"コミュニティ運営"', '"コミュニティ運営"'),
  ('TEST-RES-07', 'ubmZone', '"Hanshin"', '"Hanshin"'),
  ('TEST-RES-08', 'fullName', '"[TEST] 未登録ゲート 八郎"', '"[TEST] 未登録ゲート 八郎"'),
  ('TEST-RES-08', 'occupation', '"金融"', '"金融"'),
  ('TEST-RES-08', 'ubmZone', 'null', 'null'),
  ('TEST-RES-09', 'fullName', '"[TEST] 本人写真 九美"', '"[TEST] 本人写真 九美"'),
  ('TEST-RES-09', 'occupation', '"人事"', '"人事"'),
  ('TEST-RES-09', 'ubmZone', '"Tanba"', '"Tanba"'),
  ('TEST-RES-10', 'fullName', '"[TEST] 山田''太郎😀 長い名前エッジケース"', '"[TEST] 山田''太郎😀 長い名前エッジケース"'),
  ('TEST-RES-10', 'occupation', '"R&D / セキュリティ"', '"R&D / セキュリティ"'),
  ('TEST-RES-10', 'ubmZone', '"Tajima"', '"Tajima"');

INSERT OR REPLACE INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at) VALUES
  ('TEST-MEM-01', 'test-mem-01@test.ubm-hyogo.invalid', 'TEST-RES-01', 'TEST-RES-01', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-02', 'test-mem-02@test.ubm-hyogo.invalid', 'TEST-RES-02', 'TEST-RES-02', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-03', 'test-mem-03@test.ubm-hyogo.invalid', 'TEST-RES-03', 'TEST-RES-03', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-04', 'test-mem-04@test.ubm-hyogo.invalid', 'TEST-RES-04', 'TEST-RES-04', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-05', 'test-mem-05@test.ubm-hyogo.invalid', 'TEST-RES-05', 'TEST-RES-05', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-06', 'test-mem-06@test.ubm-hyogo.invalid', 'TEST-RES-06', 'TEST-RES-06', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-07', 'test-mem-07@test.ubm-hyogo.invalid', 'TEST-RES-07', 'TEST-RES-07', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-08', 'test-mem-08@test.ubm-hyogo.invalid', 'TEST-RES-08', 'TEST-RES-08', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-09', 'test-mem-09@test.ubm-hyogo.invalid', 'TEST-RES-09', 'TEST-RES-09', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z'),
  ('TEST-MEM-10', 'test-mem-10@test.ubm-hyogo.invalid', 'TEST-RES-10', 'TEST-RES-10', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z');

INSERT OR REPLACE INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, hidden_reason, updated_by, updated_at, notification_opt_out) VALUES
  ('TEST-MEM-01', 'consented', 'consented', 'public', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-02', 'declined', 'consented', 'member_only', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-03', 'consented', 'consented', 'hidden', 0, 'test account hidden case', 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-04', 'consented', 'declined', 'member_only', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-05', 'consented', 'consented', 'public', 1, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-06', 'consented', 'consented', 'public', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-07', 'consented', 'consented', 'public', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 1),
  ('TEST-MEM-08', 'unknown', 'unknown', 'member_only', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-09', 'consented', 'consented', 'public', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0),
  ('TEST-MEM-10', 'consented', 'consented', 'public', 0, NULL, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 0);

INSERT OR REPLACE INTO meeting_sessions (session_id, title, held_on, note, created_at, created_by, deleted_at) VALUES
  ('TEST-MTG-01', '[TEST] 交流会', '2026-06-10', 'test account seed meeting', '2026-06-03T10:30:00.000Z', 'seed:test-accounts', NULL),
  ('TEST-MTG-02', '[TEST] 勉強会', '2026-07-10', 'test account seed meeting', '2026-06-03T10:30:00.000Z', 'seed:test-accounts', NULL),
  ('TEST-MTG-03', '[TEST] 相談会', '2026-08-10', 'test account seed meeting', '2026-06-03T10:30:00.000Z', 'seed:test-accounts', NULL);

INSERT OR REPLACE INTO member_attendance (member_id, session_id, assigned_at, assigned_by) VALUES
  ('TEST-MEM-01', 'TEST-MTG-01', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-01', 'TEST-MTG-02', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-02', 'TEST-MTG-01', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'TEST-MTG-01', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'TEST-MTG-02', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'TEST-MTG-03', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-05', 'TEST-MTG-02', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'TEST-MTG-01', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'TEST-MTG-02', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'TEST-MTG-03', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-09', 'TEST-MTG-03', '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-10', 'TEST-MTG-02', '2026-06-03T10:30:00.000Z', 'seed:test-accounts');

INSERT OR IGNORE INTO member_tags (member_id, tag_id, source, confidence, assigned_at, assigned_by) VALUES
  ('TEST-MEM-01', 'tag_b_it', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-01', 'tag_s_dev', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-01', 'tag_r_kobe', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-01', 'tag_ro_owner', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-01', 'tag_st_active', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-02', 'tag_s_design', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-02', 'tag_i_0to1', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-02', 'tag_r_nishinomiya', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'tag_s_marketing', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'tag_i_1to10', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'tag_r_himeji', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-03', 'tag_st_active', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-04', 'tag_s_sales', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-04', 'tag_r_kobe', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-05', 'tag_s_legal', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-05', 'tag_st_observer', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'tag_b_service', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'tag_s_ops', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'tag_i_dx', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'tag_r_hanshin', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'tag_ro_freelance', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-07', 'tag_st_active', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-08', 'tag_b_finance', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-09', 'tag_s_hr', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-09', 'tag_r_tanba', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-09', 'tag_ro_executive', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-10', 'tag_s_dev', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-10', 'tag_s_legal', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-10', 'tag_i_global', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts'),
  ('TEST-MEM-10', 'tag_r_tajima', 'seed', 1.0, '2026-06-03T10:30:00.000Z', 'seed:test-accounts');

INSERT OR REPLACE INTO member_photos (member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at, source, thumb_object_key, thumb_byte_size, content_hash, processing_status) VALUES
  ('TEST-MEM-01', 'test-accounts/TEST-MEM-01/avatar.jpg', 'image/jpeg', 1024, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 'admin', NULL, NULL, 'sha256-test-mem-01', 'none'),
  ('TEST-MEM-03', 'test-accounts/TEST-MEM-03/avatar.jpg', 'image/jpeg', 1024, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 'admin', NULL, NULL, 'sha256-test-mem-03', 'none'),
  ('TEST-MEM-09', 'test-accounts/TEST-MEM-09/avatar.jpg', 'image/jpeg', 1024, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 'self', 'test-accounts/TEST-MEM-09/thumb.jpg', 256, 'sha256-test-mem-09', 'completed'),
  ('TEST-MEM-10', 'test-accounts/TEST-MEM-10/avatar.jpg', 'image/jpeg', 1024, 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 'admin', NULL, NULL, 'sha256-test-mem-10', 'none');

INSERT OR REPLACE INTO deleted_members (member_id, deleted_by, deleted_at, reason, purged_at, retention_policy_version) VALUES
  ('TEST-MEM-05', 'seed:test-accounts', '2026-06-03T10:30:00.000Z', 'test account deleted case', NULL, NULL);

INSERT OR REPLACE INTO admin_member_notes (note_id, member_id, body, created_by, updated_by, created_at, updated_at, note_type, request_status, resolved_at, resolved_by_admin_id) VALUES
  ('TEST-NOTE-V01', 'TEST-MEM-01', json_object('reason', '都合により一時的に掲載を止めたいです', 'payload', json('{"desiredState":"hidden"}')), 'seed:test-accounts', 'seed:test-accounts', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', 'visibility_request', 'pending', NULL, NULL),
  ('TEST-NOTE-V02', 'TEST-MEM-02', json_object('reason', '公開できるようになったので掲載をお願いします', 'payload', json('{"desiredState":"public"}')), 'seed:test-accounts', 'seed:test-accounts', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', 'visibility_request', 'pending', NULL, NULL),
  ('TEST-NOTE-D01', 'TEST-MEM-07', json_object('reason', '退会を希望します', 'payload', json('{}')), 'seed:test-accounts', 'seed:test-accounts', '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z', 'delete_request', 'pending', NULL, NULL);

INSERT OR REPLACE INTO admin_users (admin_id, email, display_name, active, created_at) VALUES
  ('TEST-ADM-01', 'test-admin-01@test.ubm-hyogo.invalid', '[TEST] 管理者 有効1', 1, '2026-06-03T10:30:00.000Z'),
  ('TEST-ADM-02', 'test-admin-02@test.ubm-hyogo.invalid', '[TEST] 管理者 有効2', 1, '2026-06-03T10:30:00.000Z'),
  ('TEST-ADM-03', 'test-admin-03@test.ubm-hyogo.invalid', '[TEST] 管理者 無効', 0, '2026-06-03T10:30:00.000Z');
