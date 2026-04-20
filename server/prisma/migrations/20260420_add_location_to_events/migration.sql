-- Add location_id to event_logs to preserve location at event recording time
ALTER TABLE event_logs ADD COLUMN location_id BIGINT;

-- Add foreign key constraint to location table
ALTER TABLE event_logs ADD CONSTRAINT event_logs_location_id_fkey FOREIGN KEY (location_id) REFERENCES location(id) ON DELETE SET NULL;
