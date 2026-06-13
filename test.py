from playwright.sync_api import sync_playwright

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print("CONSOLE:", msg.text))
        page.on("pageerror", lambda err: print("PAGE ERROR:", err.message))
        page.goto('http://localhost:8000')
        page.wait_for_timeout(2000)
        browser.close()

run_test()
