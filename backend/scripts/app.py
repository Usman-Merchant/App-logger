import json
import pandas as pd
from jira import JIRA
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import psycopg2
from psycopg2.extras import DictCursor
import ollama
import os
from config import JIRA_SERVER, JIRA_USER, JIRA_API_TOKEN, JIRA_PROJECT_KEY, SLACK_TOKEN, SLACK_CHANNEL, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_DATABASE, POSTGRES_PASSWORD

def generate_summary(module_name, status_code, message, uri, occurrences):
    prompt = f"""
    You are an AI assistant summarizing logs.
    Provide a professional summary:

    Module Name: {module_name}
    Status Code: {status_code}
    Message: {message}
    API Endpoint: {uri}
    Occurrences: {occurrences}

    Keep it clear and informative.
    """
    try:
        response = ollama.chat(model="granite3.1-dense", messages=[{"role": "user", "content": prompt}])
        return response['message']['content']
    except Exception as e:
        print(f"LLM summary generation failed: {e}")
        return f"Error in {module_name}: {message} (Status: {status_code}, Occurrences: {occurrences})"

def process_logs():
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname=POSTGRES_DATABASE,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT
        )
        cursor = conn.cursor(cursor_factory=DictCursor)

        # Fetch cleaned logs from the database
        query = """
        SELECT module, uri, created_at, status, request_headers, input, risk_range, verb
        FROM api_logs;
        """
        cursor.execute(query)
        logs = cursor.fetchall()

        # Convert to DataFrame
        df = pd.DataFrame(logs, columns=["Module", "uri", "created_at", "status", "request_headers", "input", "Risk_range", "verb"])

        if df.empty:
            print("No logs found in the database.")
            return

        # Group by URI and Status
        grouped_df = df.groupby(['uri', 'status']).agg({
            'Module': 'first',
            'created_at': 'min',
            'request_headers': 'first',
            'input': 'first',
            'Risk_range': 'first',
            'verb': 'first',
            'status': 'count'  # Count occurrences
        }).rename(columns={'status': 'occurrences'}).reset_index()

        # Initialize clients
        try:
            # Test Jira connection first
            jira = JIRA(server=JIRA_SERVER, basic_auth=(JIRA_USER, JIRA_API_TOKEN))
            try:
                # Test project access specifically
                jira.project(JIRA_PROJECT_KEY)
                print(f"Successfully connected to Jira and verified access to project {JIRA_PROJECT_KEY}")
            except Exception as e:
                print(f"Failed to access project {JIRA_PROJECT_KEY}. Error: {str(e)}")
                print("Please verify project key and user permissions")
                return

            slack_client = WebClient(token=SLACK_TOKEN)
            
            for index, row in grouped_df.iterrows():
                module = row['Module']
                uri = row['uri']
                created_at = row['created_at']
                status = row['status']
                occurrences = row['occurrences']
                request_headers = str(row['request_headers'])  # Convert to string to avoid JSON serialization issues
                input_data = str(row['input'])
                risk_range = str(row['Risk_range'])
                verb = row['verb']

                # Slack notifications for 300-499 errors
                if 300 <= status <= 499:
                    try:
                        summary = generate_summary(module, status, "Slack Notification", uri, occurrences)
                        if summary:
                            slack_client.chat_postMessage(channel=SLACK_CHANNEL, text=summary)
                        else:
                            print(f"Warning: Empty summary generated for {module} with status {status}")
                    except SlackApiError as e:
                        print(f'Failed to send Slack message: {e.response["error"]}')
                    except Exception as e:
                        print(f'Error generating/sending message for {module}: {str(e)}')

                # Jira ticket for 500+ errors
                if 500 <= status <= 599:
                    issue_dict = {
                        'project': {'key': JIRA_PROJECT_KEY},
                        'summary': f'High Risk - {module} Issue (Status {status})',
                        'description': f'''
                        *Module:* {module}
                        *URI:* {uri}
                        *Created At:* {created_at}
                        *Status:* {status}
                        *Occurrences:* {occurrences}
                        *Request Headers:* {request_headers}
                        *Input:* {input_data}
                        *Risk Range:* {risk_range}
                        *Verb:* {verb}
                        ''',
                        'issuetype': {'name': 'Task'},
                        'priority': {'name': 'High'}
                    }
                    try:
                        print(f"Creating Jira ticket for project: {JIRA_PROJECT_KEY}")
                        print(f"User: {JIRA_USER}")
                        new_issue = jira.create_issue(fields=issue_dict)
                        print(f'Successfully created Jira ticket: {new_issue.key}')
                    except Exception as e:
                        print(f'Failed to create Jira ticket. Error details: {str(e)}')
                        if hasattr(e, 'response'):
                            print(f'Response status: {e.response.status_code}')
                            print(f'Response text: {e.response.text}')
                        print(f'Issue dictionary: {json.dumps(issue_dict, indent=2)}')
                        
        except Exception as e:
            print(f"Error in automation: {str(e)}")

    except Exception as e:
        print(f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()