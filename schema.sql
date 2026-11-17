CREATE TABLE IF NOT EXISTS visitor_counter (
 id INTEGER PRIMARY KEY CHECK (id = 1),
 total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0)
);
INSERT OR IGNORE INTO visitor_counter (id, total) VALUES (1, 0);
