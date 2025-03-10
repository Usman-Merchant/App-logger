import aiohttp
import asyncio
import csv
import os
from config import API_URL, HEADERS

# Define output file path
OUTPUT_CSV = "data/request_history.csv"
PAGE_SIZE = 300  # Adjust as needed
MAX_CONCURRENT_REQUESTS = 30  # Control concurrency

async def fetch_page(session, page):
    """Fetch a single page of request history data."""
    params = {"page": page, "limit": PAGE_SIZE}
    async with session.get(API_URL, headers=HEADERS, params=params) as response:
        if response.status != 200:
            print(f"Error fetching page {page}: HTTP {response.status}")
            return None
        try:
            data = await response.json()
            return data
        except Exception as e:
            print(f"Error parsing JSON on page {page}: {e}")
            return None

async def fetch_all_pages():
    """Fetch all pages asynchronously and save to CSV."""
    async with aiohttp.ClientSession() as session:
        first_page_data = await fetch_page(session, 1)
        if not first_page_data or "items" not in first_page_data:
            print("Error: 'items' key missing in API response:", first_page_data)
            return
        
        total_pages = first_page_data.get("total_pages", 1)
        fieldnames = first_page_data["items"][0].keys() if first_page_data["items"] else []
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

        # Write CSV headers
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

        semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

        async def fetch_and_write(page):
            async with semaphore:
                data = await fetch_page(session, page)
                if data and "items" in data:
                    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as csvfile:
                        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                        writer.writerows(data["items"])

        # Fetch all pages concurrently
        tasks = [fetch_and_write(page) for page in range(1, total_pages + 1)]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(fetch_all_pages())
    print(f"Data successfully saved to {OUTPUT_CSV}")