from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import time

URL = "https://minigames.george.richmond.gg"
AUTH_URL = "https://auth.george.richmond.gg"
HEADLESS = True


def make_driver(headless: bool = False):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--no-sandbox")
    return webdriver.Firefox(options=opts)


driver = make_driver(headless=HEADLESS)

driver.get(URL)

driver.find_element(By.ID, "login-button").click()

wait = WebDriverWait(driver, 20)
wait.until(EC.url_contains(AUTH_URL))

driver.find_element(By.ID, "username").send_keys("bob")
driver.find_element(By.ID, "password").send_keys("Password1!")
driver.find_element(By.ID, "login").click()

wait.until(EC.url_contains(URL))
time.sleep(2)

cookies = driver.get_cookies()
print(f"\n{len(cookies)} Cookies after Login: \n")
for c in cookies:
    print(
        c["name"],
        "domain=", c.get("domain"),
        "path=", c.get("path"),
        "secure=", c.get("secure"),
    )

driver.find_element(By.ID, "logout-button").click()
time.sleep(2)

cookies = driver.get_cookies()
print(f"\n{len(cookies)} Cookies after Logout: \n")
for c in cookies:
    print(
        c["name"],
        "domain=", c.get("domain"),
        "path=", c.get("path"),
        "secure=", c.get("secure"),
    )
