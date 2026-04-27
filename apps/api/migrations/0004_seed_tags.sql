-- 0004_seed_tags.sql
-- tag_definitions の初期 seed (6 カテゴリ × 41 行)
-- category: business(10) / skill(10) / interest(5) / region(8) / role(5) / status(3)
-- code 命名: <prefix>_<slug>。INSERT OR IGNORE で再実行を許容。

-- business (10)
INSERT OR IGNORE INTO tag_definitions (tag_id, code, label, category, active) VALUES
  ('tag_b_food',      'biz_food',      '飲食',         'business', 1),
  ('tag_b_it',        'biz_it',        'IT',           'business', 1),
  ('tag_b_mfg',       'biz_mfg',       '製造',         'business', 1),
  ('tag_b_consult',   'biz_consult',   'コンサル',     'business', 1),
  ('tag_b_finance',   'biz_finance',   '金融',         'business', 1),
  ('tag_b_retail',    'biz_retail',    '小売',         'business', 1),
  ('tag_b_realestate','biz_realestate','不動産',       'business', 1),
  ('tag_b_medical',   'biz_medical',   '医療・介護',   'business', 1),
  ('tag_b_education', 'biz_education', '教育',         'business', 1),
  ('tag_b_service',   'biz_service',   'サービス業',   'business', 1);

-- skill (10)
INSERT OR IGNORE INTO tag_definitions (tag_id, code, label, category, active) VALUES
  ('tag_s_design',    'skill_design',    'デザイン',           'skill', 1),
  ('tag_s_marketing', 'skill_marketing', 'マーケティング',     'skill', 1),
  ('tag_s_sales',     'skill_sales',     '営業',               'skill', 1),
  ('tag_s_dev',       'skill_dev',       '開発',               'skill', 1),
  ('tag_s_pm',        'skill_pm',        'プロジェクト管理',   'skill', 1),
  ('tag_s_finance',   'skill_finance',   'ファイナンス',       'skill', 1),
  ('tag_s_legal',     'skill_legal',     '法務',               'skill', 1),
  ('tag_s_hr',        'skill_hr',        '人事・採用',         'skill', 1),
  ('tag_s_writing',   'skill_writing',   'ライティング',       'skill', 1),
  ('tag_s_ops',       'skill_ops',       'バックオフィス',     'skill', 1);

-- interest (5)
INSERT OR IGNORE INTO tag_definitions (tag_id, code, label, category, active) VALUES
  ('tag_i_0to1',     'int_0to1',     '0to1',         'interest', 1),
  ('tag_i_1to10',    'int_1to10',    '1to10',        'interest', 1),
  ('tag_i_10to100',  'int_10to100',  '10to100',      'interest', 1),
  ('tag_i_dx',       'int_dx',       'DX',           'interest', 1),
  ('tag_i_global',   'int_global',   'グローバル',   'interest', 1);

-- region (8)
INSERT OR IGNORE INTO tag_definitions (tag_id, code, label, category, active) VALUES
  ('tag_r_kobe',      'region_kobe',      '神戸',     'region', 1),
  ('tag_r_nishinomiya','region_nishinomiya','西宮',    'region', 1),
  ('tag_r_himeji',    'region_himeji',    '姫路',     'region', 1),
  ('tag_r_hanshin',   'region_hanshin',   '阪神',     'region', 1),
  ('tag_r_kitaharima','region_kitaharima','北播磨',   'region', 1),
  ('tag_r_tanba',     'region_tanba',     '丹波',     'region', 1),
  ('tag_r_tajima',    'region_tajima',    '但馬',     'region', 1),
  ('tag_r_awaji',     'region_awaji',     '淡路',     'region', 1);

-- role (5)
INSERT OR IGNORE INTO tag_definitions (tag_id, code, label, category, active) VALUES
  ('tag_ro_owner',     'role_owner',     '経営者',         'role', 1),
  ('tag_ro_solo',      'role_solo',      '個人事業主',     'role', 1),
  ('tag_ro_employee',  'role_employee',  '会社員',         'role', 1),
  ('tag_ro_executive', 'role_executive', '役員',           'role', 1),
  ('tag_ro_freelance', 'role_freelance', 'フリーランス',   'role', 1);

-- status (3)
INSERT OR IGNORE INTO tag_definitions (tag_id, code, label, category, active) VALUES
  ('tag_st_active',    'st_active',    'active',     'status', 1),
  ('tag_st_observer',  'st_observer',  'observer',   'status', 1),
  ('tag_st_candidate', 'st_candidate', 'candidate',  'status', 1);
