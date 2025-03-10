import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import re
import os
import json

POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
POSTGRES_USER = "postgres"
POSTGRES_DATABASE = "xano_logs"
POSTGRES_PASSWORD = "root"

# File paths
INPUT_FILE = "data/request_history.csv"
# OUTPUT_FILE = "data/cleaned_history.csv"

# Ensure the data directory exists
# os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

# Load the CSV file
df = pd.read_csv(INPUT_FILE)

# Extract module from URI
def extract_module(uri):
    match = re.search(r'api:([\w-]+)', str(uri))
    return match.group(1) if match else "Unknown"

df['Module'] = df['uri'].apply(extract_module)

# Assign risk range based on status code
def assign_risk(status):
    if 300 <= status <= 399:
        return "Low"
    elif 400 <= status <= 499:
        return "Medium"
    elif 500 <= status <= 599:
        return "High"
    elif 200 <= status <= 299:
        return "Ok"
    return "Unknown"

df['Risk_range'] = df['status'].apply(assign_risk)

# Convert request_headers and input to valid JSON
def clean_json(value):
    try:
        # Convert to JSON string if it's a list or dict
        if isinstance(value, (list, dict)):
            return json.dumps(value)
        elif isinstance(value, str):
            # Attempt to parse JSON, then reformat it properly
            return json.dumps(json.loads(value.replace("'", '"')))
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON", "original": value})
    
df['request_headers'] = df['request_headers'].apply(clean_json)
df['input'] = df['input'].apply(clean_json)

# Select required columns
final_columns = ["Module", "uri", "created_at", "status", "request_headers", "input", "Risk_range", "verb"]
df_final = df[final_columns]

# Connect to PostgreSQL and insert data
try:
    conn = psycopg2.connect(
        dbname=POSTGRES_DATABASE,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT
    )
    cursor = conn.cursor()

    # Create table if not exists
    create_table_query = """
    CREATE TABLE IF NOT EXISTS api_logs (
        id SERIAL PRIMARY KEY,
        module TEXT,
        uri TEXT,
        created_at TIMESTAMP,
        status INT,
        request_headers JSONB,
        input TEXT,
        risk_range TEXT,
        verb TEXT
    );
    """
    cursor.execute(create_table_query)
    conn.commit()

    # Convert dataframe to list of tuples
    data_tuples = [tuple(x) for x in df_final.to_numpy()]

    # Insert data into PostgreSQL
    insert_query = """
    INSERT INTO api_logs (module, uri, created_at, status, request_headers, input, risk_range, verb)
    VALUES %s;
    """
    execute_values(cursor, insert_query, data_tuples)
    conn.commit()

    print("Cleaned data successfully stored in PostgreSQL database.")

except Exception as e:
    print("Error:", e)

finally:
    cursor.close()
    conn.close()
# Save cleaned data to a new CSV file
# df_final.to_csv(OUTPUT_FILE, index=False)

# print(f"Cleaned dataset saved to {OUTPUT_FILE}")