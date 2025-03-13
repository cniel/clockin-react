import sqlite3

# Connect to the source database (where 'etudiants' table already exists)
source_conn = sqlite3.connect('data/compensations_exams.db')
source_cursor = source_conn.cursor()

# Connect to the destination database (where the 'etudiants' table will be replicated)
dest_conn = sqlite3.connect('data/clockin.db')
dest_cursor = dest_conn.cursor()

# Step 1: Create 'etudiants' table in the destination database if it doesn't exist
create_table_query = '''
CREATE TABLE IF NOT EXISTS etudiants (
    etudiantid TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT,
    designationlong TEXT
);
'''
dest_cursor.execute(create_table_query)
dest_conn.commit()

# Step 2: Fetch all data from the 'etudiants' table in the source database
source_cursor.execute('SELECT etudiantid, nom, prenom, designationlong FROM etudiants')
etudiants = source_cursor.fetchall()

# Step 3: Insert all data into the 'etudiants' table in the destination database
insert_query = '''
INSERT INTO etudiants (etudiantid, nom, prenom, designationlong)
VALUES (?, ?, ?, ?)
ON CONFLICT(etudiantid) DO NOTHING;  -- To avoid duplicate entries in case of conflicts
'''
dest_cursor.executemany(insert_query, etudiants)
dest_conn.commit()

# Close connections
source_conn.close()
dest_conn.close()

print(f"Copied {len(etudiants)} students to the destination database.")
