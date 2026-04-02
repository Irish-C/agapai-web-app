-- Reset all auto-increment sequences to max ID + 1
-- Lists each table explicitly to avoid parsing issues

SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM roles));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM users));
SELECT setval('location_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM location));
SELECT setval('camera_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM camera));
SELECT setval('event_type_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM event_type));
SELECT setval('event_class_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM event_class));
SELECT setval('event_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM event_logs));
SELECT setval('global_settings_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM global_settings));
