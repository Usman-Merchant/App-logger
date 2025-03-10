from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncpg  # Async database support
from config import API_URL, HEADERS, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT
from services.pipeline import run_pipeline
from models.schemas import LogEntry
from scripts.app import process_logs

app = FastAPI(title="App Logger", description="Automated API Logging & Monitoring", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aquamarine-sunburst-782484.netlify.app/"],  # ✅ React Vite frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
)

# ------------------ Database Connection ------------------

async def get_db():
    """Establish a connection with PostgreSQL."""
    conn = await asyncpg.connect(
        user=POSTGRES_USER, 
        password=POSTGRES_PASSWORD, 
        database=POSTGRES_DATABASE, 
        host=POSTGRES_HOST, 
        port=POSTGRES_PORT
    )
    try:
        yield conn
    finally:
        await conn.close()


# ------------------ Pipeline ------------------

@app.post("/run_pipeline/")
async def start_pipeline(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_pipeline)
    return {"status": "Pipeline started"}


@app.post("/process-automation/")
async def run_automation(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_logs)
    return {"message": "Automation process started"}


# ------------------ Error Logs API ------------------

@app.get("/error_logs/")
async def get_error_logs(db=Depends(get_db)):
    """Fetch logs with status codes between 300-599 directly from PostgreSQL."""
    query = """
    SELECT module, status, Risk_range, verb, COUNT(*) AS API_Failed_Count
    FROM api_logs
    WHERE status BETWEEN 300 AND 599
    GROUP BY module, status, Risk_range, verb
    ORDER BY API_Failed_Count DESC;
    """
    records = await db.fetch(query)

    if not records:
        raise HTTPException(status_code=404, detail="No error logs found")

    return [dict(record) for record in records]


@app.get("/error_logs/{module}")
async def get_module_error_logs(module: str, db=Depends(get_db)):
    """Fetch all error logs for a specific module from PostgreSQL."""
    query = """
    SELECT * FROM api_logs 
    WHERE LOWER(module) = LOWER($1) AND status BETWEEN 300 AND 599
    """
    records = await db.fetch(query, module)

    if not records:
        raise HTTPException(status_code=404, detail=f"No logs found for module: {module}")

    return [dict(record) for record in records]


# ------------------ API Details ------------------

@app.get("/logs/")
async def get_all_logs(db=Depends(get_db)):
    """Fetch all logs directly from PostgreSQL."""
    query = "SELECT * FROM api_logs ORDER BY created_at DESC"
    
    try:
        records = await db.fetch(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if not records:
        return []  # ✅ Return empty JSON list instead of None

    return [dict(record) for record in records]