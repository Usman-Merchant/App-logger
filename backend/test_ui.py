import streamlit as st
import pandas as pd
import numpy as np
import requests
import ollama
import matplotlib.pyplot as plt
from urllib.parse import urlencode

API_BASE_URL = "http://127.0.0.1:8000"  # Replace with your FastAPI server URL

# Functions to fetch data from FastAPI

def run_pipeline():
    response = requests.post(f"{API_BASE_URL}/run_pipeline")
    return response.json()

def automation():
    response = requests.post(f"{API_BASE_URL}/process-automation/")
    return response.json()

def fetch_failed_logs_by_module():
    try:
        response = requests.get(f"{API_BASE_URL}/error_logs/")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching failed logs: {e}")
        return []

def fetch_real_time_logs():
    try:
        response = requests.get(f"{API_BASE_URL}/logs/")
        response.raise_for_status()  # Raises an error if status code is not 200
        return response.json()  # If valid JSON, return
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching logs: {e}")  # ✅ Show error in UI
        return []
    except requests.exceptions.JSONDecodeError:
        st.error("Invalid JSON response received from server.")  # ✅ Handle JSON errors
        return []

def fetch_logs_by_module(module_name):
    try:
        response = requests.get(f"{API_BASE_URL}/error_logs/{module_name}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching logs for {module_name}: {e}")
        return []

def generate_resolution(api_issue):
    try:
        response = ollama.chat(
            model='llama3.2:1b',
            messages=[
                {"role": "system", "content": "You are an expert in debugging APIs. Provide concise resolutions."},
                {"role": "user", "content": f"Analyze this API issue and suggest a resolution:\n\n{str(api_issue)}"}
            ]
        )
        if hasattr(response, 'message') and hasattr(response.message, 'content'):
            return response.message.content
        elif isinstance(response, dict) and 'message' in response:
            return response['message'].get('content', 'No resolution found.')
        else:
            return f"Unexpected response format: {response}"
    except Exception as e:
        return f"Error generating resolution: {e}"

# Streamlit UI
st.set_page_config(page_title="API Logger Dashboard", layout="wide")
st.title("📊 API Logger Dashboard")

# Data Refresh Buttons
col1, col2, col3 = st.columns(3)

with col1:
    refresh_button = st.button("Refresh")
    if refresh_button:
        run_pipeline()
        st.write("Saving Logs to database.")

with col2:
    logs_button = st.button("Get Logs")
    if logs_button:
        fetch_real_time_logs()
        st.write("Fetching Logs from database.")

# Sidebar Navigation with Query Param Synchronization
menu = ["Overview", "Most Failed APIs"]

# 1️⃣ Get current query params
query_params = st.query_params

# 2️⃣ Determine default_choice from query params or fallback to first item
default_choice = query_params.get("choice", [menu[0]])[0]

if default_choice in menu:
    default_index = menu.index(default_choice)
else:
    default_index = 0

# 3️⃣ Create sidebar selectbox, defaulting to what's in URL
choice = st.sidebar.selectbox("Navigate", menu, index=default_index)

# 4️⃣ If user changed choice, update query params so it persists in URL
if choice != default_choice:
    st.query_params.update({"choice": choice})

st.write(f"Current selection: {choice}")

########################
# Overview Page (example)
########################
if choice == "Overview":
    st.header("📊 Overview of API's")

    real_time_logs = fetch_real_time_logs()

    if real_time_logs:
        df_logs = pd.DataFrame(real_time_logs)

        df_logs.index = np.arange(1, len(df_logs) + 1)
        st.dataframe(df_logs[["module", "uri", "created_at", "status", "risk_range", "verb"]])
    else:
        st.warning("No data available to display.")

elif choice == "Most Failed APIs":
    st.header("Most Failed APIs")
    most_failed_apis = fetch_failed_logs_by_module()

    if most_failed_apis:
        df_failed = pd.DataFrame(most_failed_apis)
        df_failed.index = np.arange(1, len(df_failed) + 1)

        # Create clickable links with proper module name encoding
        def make_module_link(module_name: str) -> str:
            params = {
                "choice": "Most Failed APIs",
                "details_module": module_name.strip()  # Ensure no whitespace
            }
            query_string = urlencode(params)
            return f'<a href="?{query_string}" target="_self" style="color:blue;text-decoration:none;">Module Details</a>'

        df_failed["View Details"] = df_failed["module"].apply(make_module_link)

        # Show the DataFrame with clickable links
        st.markdown(df_failed.to_html(escape=False, index=False), unsafe_allow_html=True)

        # Handle URL parameters and fetch module details
        url_params = st.query_params
        selected_module = url_params.get("details_module")

        if selected_module:
            # Debug output to verify selected module
            st.write(f"Debug - Selected Module: {selected_module}")

            logs_data = fetch_logs_by_module(selected_module)
            if logs_data:
                df_module_logs = pd.DataFrame(logs_data)
                st.subheader(f"Logs for {selected_module}")
                st.dataframe(df_module_logs)
                    
                # Show resolution buttons only for the selected module
                for index, row in df_failed.iterrows():
                    if row['module'] == selected_module:
                        api_info = f"Module: {row['module']}, Failed Count: {row['api_failed_count']}"
                        if st.button(f"Generate Resolution for {row['module']}"):
                            resolution = generate_resolution(api_info)
                            st.write(f"**Resolution for {row['module']}:** {resolution}")
                    
                    # Automation button
                automate_button = st.button("Automate")
                if automate_button:
                    automation()
            else:
                st.warning(f"No logs found for {selected_module}")
    else:
        st.info("Congrats! No failed APIs found.")

