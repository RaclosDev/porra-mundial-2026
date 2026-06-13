import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--window-size=1920,1080')
options.add_argument('--disable-gpu')

try:
    driver = webdriver.Chrome(options=options)
    driver.get("http://localhost:8000")
    time.sleep(1)
    
    # Click on Search tab to make it active
    search_tab = driver.find_element(By.ID, "nav-search")
    search_tab.click()
    time.sleep(0.5)
    
    # Try to click the select
    condition_select = driver.find_element(By.ID, "search-condition")
    
    is_enabled = condition_select.is_enabled()
    is_displayed = condition_select.is_displayed()
    
    print(f"Enabled: {is_enabled}")
    print(f"Displayed: {is_displayed}")
    
    # Try to click it
    condition_select.click()
    print("Click successful")
    
    driver.quit()
except Exception as e:
    print(f"Error: {e}")
