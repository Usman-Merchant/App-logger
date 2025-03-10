import os
from dotenv import load_dotenv

load_dotenv()

WORKSPACE_URL = os.getenv("WORKSPACE_URL")
API_URL = os.getenv("API_URL")
HEADERS = {"Authorization": f"Bearer {os.getenv('API_KEY')}"}

JIRA_SERVER = os.getenv("JIRA_SERVER")
JIRA_USER = os.getenv("JIRA_USER")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")

SLACK_TOKEN = os.getenv("SLACK_TOKEN")
SLACK_CHANNEL = os.getenv("SLACK_CHANNEL")\

POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
POSTGRES_USER = "postgres"
POSTGRES_DATABASE = "xano_logs"
POSTGRES_PASSWORD = "root"