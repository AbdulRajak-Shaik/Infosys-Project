import sqlite3

def inspect():
    conn = sqlite3.connect('soil_health.db')
    cur = conn.cursor()
    print("Tables:")
    for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table'"):
        print(" -", row[0])
    
    print("\nUsers:")
    for row in cur.execute("SELECT id, username, email, role, community FROM users"):
        print(" -", row)

if __name__ == "__main__":
    inspect()
