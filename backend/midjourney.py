from playwright.sync_api import sync_playwright
from create_prompt import generate_pain_description
import time

browser = None
page = None
context = None
playwright_instance = None

def init():
    global browser, page, context, playwright_instance

    playwright_instance = sync_playwright().start()
    browser = playwright_instance.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()

    page.goto("https://discord.com/login")
    time.sleep(5)
    page.fill("input[name='email']", "amedilab@runi.ac.il")
    page.fill("input[name='password']", "BraiClab2024")
    page.keyboard.press("Enter")

    print("Page initialized")
    time.sleep(50)

def invoke(prompt):
    global page
    #
    # if page is None:
    #     init()
        # print("Playwright is not initialized.")
        # return

    print(f"Received prompt: {prompt}")
    page.keyboard.press("Meta+K")  # For macOS, adjust to "Control+K" for Windows if needed
    time.sleep(2)
    page.keyboard.type("boggartproject")
    time.sleep(2)
    page.keyboard.press("Enter")
    time.sleep(2)

    page.keyboard.type("/imagine")
    time.sleep(2)
    page.keyboard.press("Enter")
    time.sleep(2)

    page.keyboard.type(prompt)
    time.sleep(2)

    page.keyboard.press("Enter")

def download_image(url):
    global page


if __name__ == "__main__":
    print("Initializing Playwright...")

    pain_type="physical"
    intensity=9
    location="lower back pain"
    duration=4
    depth=6
    color="red"
    shape=5
    border="blurred"
    texture_touch=4
    texture_stroke=5
    texture_hold=2

    prompt = generate_pain_description(pain_type=pain_type,
                                       intensity=intensity,
                                       location=location,
                                       duration=duration,
                                       depth=depth,
                                       color=color,
                                       shape=shape,
                                       border=border,
                                       texture_touch=texture_touch,
                                       texture_stroke=texture_stroke,
                                       texture_hold=texture_hold)

    print("Prompt generated:", prompt)

    init()
    invoke(prompt=prompt)
