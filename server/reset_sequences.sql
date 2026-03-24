-- Reset all auto-increment sequences to max ID + 1 for each table
-- This preserves existing records while resetting the sequence counter

DO $$
DECLARE
    seq RECORD;
    max_id BIGINT;
BEGIN
    -- Get all sequences in the public schema
    FOR seq IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        -- Extract table and column name from sequence name
        -- PostgreSQL sequences are typically named: tablename_columnname_seq
        DECLARE
            table_name TEXT;
            col_name TEXT;
            next_val BIGINT;
        BEGIN
            -- Parse sequence name (e.g., "event_logs_id_seq" -> "event_logs", "id")
            table_name := SUBSTRING(seq.sequence_name FROM 1 FOR POSITION('_seq' IN seq.sequence_name) - 2);
            
            -- Get the max ID from the table + 1
            EXECUTE 'SELECT COALESCE(MAX(id), 0) + 1 FROM ' || quote_ident(table_name)
            INTO next_val;
            
            -- Set the sequence to the next value
            EXECUTE 'SELECT setval(''' || seq.sequence_name || ''', ' || next_val || ')';
            
            RAISE NOTICE 'Reset sequence % to %', seq.sequence_name, next_val;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not reset sequence %: %', seq.sequence_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'All sequences reset complete!';
END $$;
