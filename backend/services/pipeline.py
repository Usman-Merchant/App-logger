import subprocess
import sys

def run_pipeline():
    """Runs the pipeline scripts sequentially"""
    try:
        print("Running API Call...")
        subprocess.run([sys.executable, "scripts/api_call.py"], check=True)
        
        print("Running Logs Cleaning...")
        subprocess.run([sys.executable, "scripts/logs_cleaning.py"], check=True)

        print("Running Log Classification...")
        subprocess.run([sys.executable, "scripts/app.py"], check=True)

        print("Pipeline completed successfully.")

    except subprocess.CalledProcessError as e:
        print(f"Error in pipeline: {e}")
