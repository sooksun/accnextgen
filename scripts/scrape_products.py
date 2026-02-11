#!/usr/bin/env python3
"""
Product Web Scraper for AccNextGen
===================================
Scrapes goods data from Thai e-commerce websites and imports into the Product table.

Supported sites:
  - LnwShop (lnwshop.com)
  - Shopee (shopee.co.th) — via API + Selenium
  - Lazada (lazada.co.th) — via API + Selenium
  - Lotus's Shop Online (lotuss.com)
  - BaNANA Online (bnn.in.th)
  - JIB Online (jib.co.th)
  - BigC (bigc.co.th)

Scraped fields (7 fields):
  1. goods_id        → SKU / product code
  2. goods_name      → product name
  3. price_per_piece → unit price
  4. discount        → discount amount
  5. images_url      → product image URL
  6. get_web_url     → source page URL
  7. record_dateTime → scrape timestamp

Usage:
  python scrape_products.py --mode url    --url "https://www.bnn.in.th/th/c/mac"
  python scrape_products.py --mode url    --url "https://www.jib.co.th/web/product/..." --template jib
  python scrape_products.py --mode url    --url "https://shopee.co.th/search?keyword=paper" --template shopee
  python scrape_products.py --mode url    --url "https://www.lazada.co.th/catalog/?q=paper" --template lazada
  python scrape_products.py --mode file   --file products.csv
  python scrape_products.py --mode demo
  python scrape_products.py --mode demo   --site jib
  python scrape_products.py --mode url    --url "..." --dry-run --output-json out.json

Environment:
  API_BASE_URL  — default: http://localhost:3000
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin, urlparse, quote

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# ============================================================
#  Config
# ============================================================

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
IMPORT_ENDPOINT = f"{API_BASE_URL}/api/products/import"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("scraper")


# ============================================================
#  Data Model — 7 core fields + group
# ============================================================

@dataclass
class ScrapedGoods:
    """
    Represents one scraped product row.
    Maps directly to the API import schema.
    """
    goods_id: Optional[str]        # SKU / product code
    goods_name: str                # product name
    price_per_piece: float         # unit price (THB)
    discount: Optional[float]      # discount amount (THB) or None
    images_url: Optional[str]      # product image URL
    get_web_url: Optional[str]     # source page URL where scraped
    record_dateTime: str           # ISO timestamp of scrape
    group_name: Optional[str] = None  # product group/category name

    def to_api_dict(self) -> dict:
        """Convert to API import payload format."""
        return {
            "sku": self.goods_id.strip()[:50] if self.goods_id else None,
            "name": self.goods_name.strip()[:200],
            "unitPrice": max(0.0, round(float(self.price_per_piece), 2)),
            "discount": round(float(self.discount), 2) if self.discount else None,
            "imageUrl": self.images_url,
            "sourceUrl": self.get_web_url,
            "scrapedAt": self.record_dateTime,
            "groupName": self.group_name,
            "category": "GOODS",
            "unit": "ชิ้น",
            "isActive": True,
        }

    def to_raw_dict(self) -> dict:
        """Raw dict with original field names for JSON export."""
        return asdict(self)


# ============================================================
#  Scraping Template
# ============================================================

@dataclass
class ScrapingTemplate:
    """CSS selectors for extracting product fields from a page."""
    name: str
    # Container
    product_container: str
    # Fields
    sel_goods_id: str = ""
    sel_goods_name: str = ""
    sel_price: str = ""
    sel_discount: str = ""
    sel_image: str = ""
    sel_group: str = ""
    # Pagination
    pagination_next: str = ""
    max_pages: int = 5
    # Page behavior
    requires_js: bool = False      # needs Selenium/headless browser
    use_api: bool = False          # scrape via JSON API instead of HTML
    api_endpoint: str = ""         # API endpoint pattern
    wait_selector: str = ""        # CSS selector to wait for before scraping (Selenium)
    scroll_to_load: bool = False   # infinite scroll pages
    scroll_pause: float = 2.0     # seconds between scrolls
    headers: dict = None

    def __post_init__(self):
        if self.headers is None:
            self.headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }


# ============================================================
#  Templates for Thai E-commerce Sites
# ============================================================

TEMPLATES: dict[str, ScrapingTemplate] = {

    # --- Generic fallback ---
    "generic": ScrapingTemplate(
        name="Generic Product Page",
        product_container=".product, .product-card, .product-item, [data-product]",
        sel_goods_id=".sku, .product-sku, [data-sku], .product-code",
        sel_goods_name=".product-name, .product-title, h3, h4, .name, .title",
        sel_price=".price, .product-price, .amount, [data-price]",
        sel_discount=".discount, .sale, .promo, .old-price, del",
        sel_image="img",
    ),

    # --- LnwShop ---
    "lnwshop": ScrapingTemplate(
        name="LnwShop (lnwshop.com)",
        product_container=(
            ".product-item, .product-box, .product-card, "
            ".productItem, .item-product, "
            "[class*='product-'], [class*='Product'], "
            ".product-list-item, .product_item"
        ),
        sel_goods_id=".product-code, .sku, [data-sku], [data-product-id]",
        sel_goods_name=(
            ".product-name, .product-title, .productName, "
            "h3, h4, h2, a.product-name, .item-name"
        ),
        sel_price=(
            ".product-price, .price, .productPrice, "
            ".price-current, .sell-price, .sale-price, "
            "span.price, [class*='price']"
        ),
        sel_discount=(
            ".product-price-old, .old-price, .price-old, "
            "del, s, .original-price, .before-price"
        ),
        sel_image="img.product-img, img.product-image, img",
        sel_group=".product-category, .category-name, .breadcrumb li:last-child",
        pagination_next=".pagination .next a, a.page-next, .paging .next a",
    ),

    # --- Shopee (API-based) ---
    "shopee": ScrapingTemplate(
        name="Shopee Thailand (shopee.co.th)",
        product_container=(
            "[data-sqe='item'], "
            ".shopee-search-item-result__item, "
            ".col-xs-2-4, "
            "[class*='product-card'], "
            "li.search-item-result, "
            "div[data-index]"
        ),
        sel_goods_id="[data-item-id], [data-product-id]",
        sel_goods_name=(
            "[data-sqe='name'], "
            ".ie3A\\+n, .Cve6sh, "
            ".line-clamp-2, "
            "[class*='product-name'], "
            ".product-name, "
            "div[class*='name'] span"
        ),
        sel_price=(
            "[data-sqe='price'], "
            ".ZEgDH9, ._1xk7ak, ._341bF0, "
            "span[class*='price'], "
            "[class*='price-current'], "
            ".price span"
        ),
        sel_discount=(
            ".percent, ._218_dR, "
            "[class*='discount'], "
            ".discount-tag, "
            "span[class*='discount']"
        ),
        sel_image=(
            "img[class*='product'], "
            "img._3-N5L1, "
            "img[data-src], "
            "img"
        ),
        sel_group=".shopee-category-list__selected, [class*='category'] a.active",
        pagination_next=".shopee-mini-page-controller__next-btn",
        requires_js=True,
        use_api=True,
        api_endpoint="https://shopee.co.th/api/v4/search/search_items",
        wait_selector="[data-sqe='item'], .col-xs-2-4, [class*='product-card']",
        scroll_to_load=True,
    ),

    # --- Lazada ---
    "lazada": ScrapingTemplate(
        name="Lazada Thailand (lazada.co.th)",
        product_container=(
            "[data-qa-locator='product-item'], "
            ".Bm3ON, .ant-card, "
            "[class*='product-card'], "
            "div[data-tracking='product-card'], "
            ".gridItem, .card-product"
        ),
        sel_goods_id="[data-item-id], [data-product-id], [data-sku]",
        sel_goods_name=(
            ".RfADt a, "
            "[class*='product-title'], "
            ".product-title, "
            "a[title], "
            "h2, h3"
        ),
        sel_price=(
            ".ooOxS span, ._3PUKe span, "
            "[class*='price-current'], "
            ".price-current, "
            "span.currency"
        ),
        sel_discount=(
            ".WNoq3, "
            "[class*='discount'], "
            ".sale-tag, "
            "span[class*='discount']"
        ),
        sel_image=(
            "img.jBwCF, "
            "img[data-src], "
            "img[class*='product'], "
            "img"
        ),
        sel_group=".breadcrumb li:last-child, [class*='category-name']",
        pagination_next=".ant-pagination-next a, a[class*='next-page']",
        requires_js=True,
        use_api=True,
        api_endpoint="https://www.lazada.co.th/catalog/",
        wait_selector="[data-qa-locator='product-item'], .Bm3ON, .gridItem",
        scroll_to_load=True,
    ),

    # --- Lotus's Shop Online ---
    "lotuss": ScrapingTemplate(
        name="Lotus's Shop Online (lotuss.com)",
        product_container=(
            "[class*='product-card'], "
            "[class*='ProductCard'], "
            ".product-item, .product-tile, "
            "[data-testid*='product'], "
            "div[class*='Item'], "
            ".item-card"
        ),
        sel_goods_id="[data-product-id], [data-sku], .product-code",
        sel_goods_name=(
            "[class*='product-name'], "
            "[class*='ProductName'], "
            "[data-testid*='name'], "
            ".product-title, h3, h4, "
            "a[class*='product-link'], "
            "span[class*='name']"
        ),
        sel_price=(
            "[class*='product-price'], "
            "[class*='Price'], "
            "[data-testid*='price'], "
            ".price, span.price, "
            "[class*='selling-price']"
        ),
        sel_discount=(
            "[class*='original-price'], "
            "[class*='was-price'], "
            "del, s, "
            "[class*='discount'], "
            "[class*='save-price']"
        ),
        sel_image="img[class*='product'], img[data-src], img",
        sel_group="[class*='breadcrumb'] li:last-child, [class*='category-name']",
        pagination_next="a[class*='next'], button[class*='next']",
        requires_js=True,
        wait_selector="[class*='product-card'], [class*='ProductCard'], .product-item",
        scroll_to_load=True,
    ),

    # --- BaNANA Online ---
    "banana": ScrapingTemplate(
        name="BaNANA Online (bnn.in.th)",
        product_container=(
            "[class*='product-card'], "
            "[class*='ProductCard'], "
            ".product-item, .product-grid-item, "
            "[data-product], "
            ".product-listing-item, "
            "[class*='product-box']"
        ),
        sel_goods_id="[data-sku], [data-product-id], .product-sku",
        sel_goods_name=(
            "[class*='product-name'], "
            "[class*='ProductName'], "
            ".product-title, h3, h4, "
            "a[class*='product-link'], "
            ".product-card__name, "
            "[class*='product-info'] h3"
        ),
        sel_price=(
            "[class*='product-price'], "
            "[class*='price-current'], "
            "[class*='selling-price'], "
            ".price, .product-price, "
            "span[class*='price'] span"
        ),
        sel_discount=(
            "[class*='original-price'], "
            "[class*='was-price'], "
            "[class*='price-original'], "
            "del, s"
        ),
        sel_image="img[class*='product'], img[data-src], img[loading='lazy'], img",
        sel_group=(
            ".breadcrumb li:last-child a, "
            "[class*='breadcrumb'] li:nth-last-child(2), "
            "[class*='category']"
        ),
        pagination_next=(
            "a[class*='next'], "
            "a[rel='next'], "
            ".pagination .next a"
        ),
        requires_js=True,
        wait_selector="[class*='product-card'], .product-item, [class*='ProductCard']",
    ),

    # --- JIB Online ---
    "jib": ScrapingTemplate(
        name="JIB Online (jib.co.th)",
        product_container=(
            "[class*='product-item'], "
            "[class*='productItem'], "
            ".product-box, .product-card, "
            "[class*='item-product'], "
            ".jib-product, "
            "div[class*='product-list'] > div"
        ),
        sel_goods_id=(
            "[class*='product-code'], "
            ".sku, [data-sku], "
            "[class*='item-code'], "
            "span[class*='code']"
        ),
        sel_goods_name=(
            "[class*='product-name'], "
            "[class*='productName'], "
            ".product-title, h3, h4, "
            "a[class*='product-link'], "
            "a[title]"
        ),
        sel_price=(
            "[class*='product-price'], "
            "[class*='price-sell'], "
            "[class*='price-current'], "
            ".price, .price-normal, "
            "span[class*='price']"
        ),
        sel_discount=(
            "[class*='price-old'], "
            "[class*='price-origin'], "
            "[class*='original-price'], "
            "del, s, "
            "[class*='discount']"
        ),
        sel_image="img[class*='product'], img[data-src], img[loading='lazy'], img",
        sel_group=(
            ".breadcrumb li:last-child a, "
            "[class*='category-name'], "
            "[class*='breadcrumb'] a:last-of-type"
        ),
        pagination_next="a[class*='next'], a[rel='next'], .pagination .next a",
        requires_js=True,
        wait_selector="[class*='product-item'], .product-box, .product-card",
    ),

    # --- BigC ---
    "bigc": ScrapingTemplate(
        name="BigC Online (bigc.co.th)",
        product_container=(
            "[class*='product-card'], "
            "[class*='ProductCard'], "
            ".product-item, .product-tile, "
            "[data-testid*='product'], "
            "[class*='item-card']"
        ),
        sel_goods_id="[data-product-id], [data-sku], [data-item-id]",
        sel_goods_name=(
            "[class*='product-name'], "
            "[class*='ProductName'], "
            "[data-testid*='name'], "
            ".product-title, h3, h4, "
            "a[class*='product-link']"
        ),
        sel_price=(
            "[class*='product-price'], "
            "[class*='Price'], "
            "[data-testid*='price'], "
            ".price, span.price"
        ),
        sel_discount=(
            "[class*='original-price'], "
            "[class*='was-price'], "
            "[class*='old-price'], "
            "del, s, "
            "[class*='discount']"
        ),
        sel_image="img[class*='product'], img[data-src], img",
        sel_group="[class*='breadcrumb'] li:last-child, [class*='category-name']",
        pagination_next="a[class*='next'], button[class*='next']",
        requires_js=True,
        wait_selector="[class*='product-card'], [class*='ProductCard'], .product-item",
        scroll_to_load=True,
    ),

    # --- WooCommerce ---
    "woocommerce": ScrapingTemplate(
        name="WooCommerce",
        product_container=".products .product, ul.products li.product",
        sel_goods_id="",
        sel_goods_name=".woocommerce-loop-product__title, h2",
        sel_price=".price .amount, .price ins .amount",
        sel_discount=".price del .amount",
        sel_image=".attachment-woocommerce_thumbnail, img",
        pagination_next=".next.page-numbers",
    ),

    # --- HTML Table ---
    "table": ScrapingTemplate(
        name="HTML Table Layout",
        product_container="table tbody tr, .table tbody tr",
        sel_goods_id="td:nth-child(1), td.sku",
        sel_goods_name="td:nth-child(2), td.name",
        sel_price="td:nth-child(3), td.price",
        sel_discount="td:nth-child(4), td.discount",
        sel_image="td img",
    ),
}

# Alias mapping for easy CLI usage
SITE_ALIASES = {
    "lnw": "lnwshop",
    "lnwshop.com": "lnwshop",
    "shopee": "shopee",
    "shopee.co.th": "shopee",
    "lazada": "lazada",
    "lazada.co.th": "lazada",
    "lotuss": "lotuss",
    "lotus": "lotuss",
    "lotuss.com": "lotuss",
    "banana": "banana",
    "bnn": "banana",
    "bnn.in.th": "banana",
    "jib": "jib",
    "jib.co.th": "jib",
    "bigc": "bigc",
    "bigc.co.th": "bigc",
    "woo": "woocommerce",
    "woocommerce": "woocommerce",
    "table": "table",
    "generic": "generic",
}


def resolve_template(name_or_url: str) -> str:
    """Auto-detect template from URL hostname or template name."""
    lower = name_or_url.lower().strip()
    # Direct alias match
    if lower in SITE_ALIASES:
        return SITE_ALIASES[lower]
    # URL-based detection
    if lower.startswith("http"):
        host = urlparse(lower).hostname or ""
        for pattern, tmpl in [
            ("lnwshop", "lnwshop"),
            ("shopee", "shopee"),
            ("lazada", "lazada"),
            ("lotuss", "lotuss"),
            ("lotus", "lotuss"),
            ("bnn.in.th", "banana"),
            ("banana", "banana"),
            ("jib.co.th", "jib"),
            ("jib", "jib"),
            ("bigc", "bigc"),
        ]:
            if pattern in host:
                return tmpl
    # Fallback
    if lower in TEMPLATES:
        return lower
    return "generic"


# ============================================================
#  Price / Discount Parser
# ============================================================

def parse_price(text: str) -> float:
    """Extract numeric price from text like '฿1,234.50' or '1234 บาท'."""
    if not text:
        return 0.0
    cleaned = re.sub(r'[฿$€£¥]', '', text)
    cleaned = re.sub(r'(บาท|THB|baht)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[,\s]', '', cleaned)
    match = re.search(r'[\d]+\.?\d*', cleaned)
    return float(match.group()) if match else 0.0


def parse_discount(text: str, original_price: float = 0) -> Optional[float]:
    """
    Parse discount from text.
    - "20%" → percentage of original_price
    - "฿100" → flat amount
    - "-50" → flat amount
    - Old price > current → old - current
    """
    if not text:
        return None
    cleaned = text.strip()

    # Percentage discount: "20%", "-30%"
    pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', cleaned)
    if pct_match and original_price > 0:
        pct = float(pct_match.group(1))
        return round(original_price * pct / 100, 2)

    # If text contains an old/original price (strikethrough), discount = old - current
    old_price = parse_price(cleaned)
    if old_price > original_price > 0:
        return round(old_price - original_price, 2)

    # Flat amount
    if old_price > 0:
        return old_price

    return None


# ============================================================
#  Selenium Helper (for JS-rendered sites)
# ============================================================

def get_selenium_driver(headless: bool = True):
    """Create a Selenium WebDriver (Chrome/Chromium) with anti-detection."""
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
    except ImportError:
        log.error("Selenium not installed. Run: pip install selenium")
        log.error("For JS-rendered sites (Shopee, Lazada, JIB, BigC, BaNANA, Lotus's),")
        log.error("you need: pip install selenium")
        log.error("Also need Chrome/Chromium browser + chromedriver.")
        return None

    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=th-TH")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    )
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    try:
        driver = webdriver.Chrome(options=options)
        driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument",
            {"source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"},
        )
        return driver
    except Exception as e:
        log.error(f"Failed to create Selenium driver: {e}")
        log.error("Make sure Chrome and chromedriver are installed.")
        return None


def selenium_fetch_page(driver, url: str, template: ScrapingTemplate) -> Optional[BeautifulSoup]:
    """Use Selenium to load a page and return its HTML as BeautifulSoup."""
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
    except ImportError:
        return None

    log.info(f"  [Selenium] Loading: {url}")
    driver.get(url)

    # Wait for key elements to appear
    if template.wait_selector:
        try:
            selectors = [s.strip() for s in template.wait_selector.split(",")]
            for sel in selectors[:3]:
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, sel))
                    )
                    log.info(f"  [Selenium] Found: {sel}")
                    break
                except Exception:
                    continue
        except Exception:
            pass

    # Handle infinite scroll pages
    if template.scroll_to_load:
        last_height = driver.execute_script("return document.body.scrollHeight")
        scroll_count = 0
        while scroll_count < 5:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(template.scroll_pause)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
            scroll_count += 1
            log.info(f"  [Selenium] Scrolled {scroll_count} times")

    time.sleep(2)  # final settle
    html = driver.page_source
    return BeautifulSoup(html, "lxml")


# ============================================================
#  Shopee API Scraper
# ============================================================

def scrape_shopee_api(keyword: str, limit: int = 60) -> list[ScrapedGoods]:
    """Scrape Shopee via their public search API (faster than HTML)."""
    now_iso = datetime.now().isoformat()
    products = []

    log.info(f"  [Shopee API] Searching: '{keyword}'")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json",
        "Referer": "https://shopee.co.th/",
        "X-Requested-With": "XMLHttpRequest",
        "af-ac-enc-dat": "",
    }

    pages_to_fetch = min(3, (limit + 49) // 50)

    for page in range(pages_to_fetch):
        offset = page * 50
        params = {
            "keyword": keyword,
            "limit": 50,
            "newest": offset,
            "order": "relevancy",
            "page_type": "search",
            "scenario": "PAGE_GLOBAL_SEARCH",
            "version": 2,
        }

        try:
            resp = requests.get(
                "https://shopee.co.th/api/v4/search/search_items",
                params=params,
                headers=headers,
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                log.info(f"  [Shopee API] Page {page + 1}: {len(items)} items")

                for item in items:
                    info = item.get("item_basic", item)
                    name = info.get("name", "")
                    if not name:
                        continue

                    price_raw = info.get("price", 0)
                    price_before = info.get("price_before_discount", 0)
                    # Shopee stores price in units of 100000
                    price = price_raw / 100000 if price_raw > 10000 else price_raw
                    old_price = price_before / 100000 if price_before > 10000 else price_before

                    discount = round(old_price - price, 2) if old_price > price > 0 else None

                    image_id = info.get("image", "")
                    image_url = f"https://down-th.img.susercontent.com/file/{image_id}" if image_id else None

                    shop_id = info.get("shopid", "")
                    item_id = info.get("itemid", "")
                    detail_url = f"https://shopee.co.th/product/{shop_id}/{item_id}" if shop_id and item_id else None

                    sku = str(item_id) if item_id else None
                    category = info.get("category_name", None)

                    products.append(ScrapedGoods(
                        goods_id=sku,
                        goods_name=name,
                        price_per_piece=price,
                        discount=discount,
                        images_url=image_url,
                        get_web_url=detail_url,
                        record_dateTime=now_iso,
                        group_name=category or "Shopee",
                    ))
            else:
                log.warning(f"  [Shopee API] HTTP {resp.status_code}")
                break
        except Exception as e:
            log.error(f"  [Shopee API] Error: {e}")
            break

        if len(products) >= limit:
            break
        time.sleep(1)

    return products[:limit]


# ============================================================
#  Lazada API Scraper
# ============================================================

def scrape_lazada_api(keyword: str, limit: int = 60) -> list[ScrapedGoods]:
    """Scrape Lazada via catalog page + parse embedded JSON."""
    now_iso = datetime.now().isoformat()
    products = []

    log.info(f"  [Lazada] Searching: '{keyword}'")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
    }

    pages_to_fetch = min(3, (limit + 39) // 40)

    for page in range(1, pages_to_fetch + 1):
        url = f"https://www.lazada.co.th/catalog/?q={quote(keyword)}&page={page}"

        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                log.warning(f"  [Lazada] HTTP {resp.status_code}")
                break

            # Try to find embedded JSON in script tags
            soup = BeautifulSoup(resp.text, "lxml")

            # Lazada embeds product data in script tags
            for script in soup.find_all("script"):
                text = script.string or ""
                if "listItems" in text or "mods" in text:
                    # Extract JSON from window.__NEXT_DATA__ or similar
                    json_match = re.search(r'"listItems"\s*:\s*(\[.*?\])\s*[,}]', text)
                    if not json_match:
                        json_match = re.search(r'"items"\s*:\s*(\[.*?\])\s*[,}]', text)
                    if json_match:
                        try:
                            items = json.loads(json_match.group(1))
                            log.info(f"  [Lazada] Page {page}: {len(items)} items (from JSON)")

                            for item in items:
                                name = item.get("name", "") or item.get("title", "")
                                if not name:
                                    continue

                                price_str = item.get("price", item.get("priceShow", "0"))
                                price = parse_price(str(price_str))
                                if price <= 0:
                                    continue

                                old_price_str = item.get("originalPrice", "0")
                                old_price = parse_price(str(old_price_str))
                                discount = round(old_price - price, 2) if old_price > price else None

                                image_url = item.get("image", item.get("thumbUrl", None))
                                detail_url = item.get("productUrl", item.get("itemUrl", None))
                                if detail_url and detail_url.startswith("//"):
                                    detail_url = "https:" + detail_url

                                sku = str(item.get("itemId", item.get("nid", ""))) or None
                                category = item.get("categoryName", None)

                                products.append(ScrapedGoods(
                                    goods_id=sku,
                                    goods_name=name,
                                    price_per_piece=price,
                                    discount=discount,
                                    images_url=image_url,
                                    get_web_url=detail_url,
                                    record_dateTime=now_iso,
                                    group_name=category or "Lazada",
                                ))
                        except json.JSONDecodeError:
                            pass

            # Fallback: parse HTML directly
            if not products:
                containers = soup.select("[data-qa-locator='product-item'], .Bm3ON")
                log.info(f"  [Lazada] Page {page}: {len(containers)} containers (HTML)")
                for container in containers:
                    name_el = container.select_one(".RfADt a, [class*='product-title'], h2, h3")
                    name = name_el.get_text(strip=True) if name_el else ""
                    if not name:
                        continue

                    price_el = container.select_one(".ooOxS span, ._3PUKe span, [class*='price']")
                    price = parse_price(price_el.get_text(strip=True) if price_el else "")
                    if price <= 0:
                        continue

                    img_el = container.select_one("img")
                    img_url = (img_el.get("src") or img_el.get("data-src")) if img_el else None

                    link_el = container.select_one("a[href]")
                    link = link_el.get("href", "") if link_el else ""
                    if link.startswith("//"):
                        link = "https:" + link

                    products.append(ScrapedGoods(
                        goods_id=None,
                        goods_name=name,
                        price_per_piece=price,
                        discount=None,
                        images_url=img_url,
                        get_web_url=link or url,
                        record_dateTime=now_iso,
                        group_name="Lazada",
                    ))

        except Exception as e:
            log.error(f"  [Lazada] Error: {e}")
            break

        if len(products) >= limit:
            break
        time.sleep(1.5)

    return products[:limit]


# ============================================================
#  Web Scraper (HTML-based with optional Selenium)
# ============================================================

class ProductScraper:
    """Scrapes the 7 goods fields from web pages."""

    def __init__(self, template: ScrapingTemplate, use_selenium: bool = False):
        self.template = template
        self.session = requests.Session()
        self.session.headers.update(template.headers)
        self.use_selenium = use_selenium or template.requires_js
        self.driver = None

    def _ensure_driver(self):
        if self.driver is None:
            self.driver = get_selenium_driver(headless=True)

    def close(self):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        if self.use_selenium:
            self._ensure_driver()
            if self.driver:
                return selenium_fetch_page(self.driver, url, self.template)
            else:
                log.warning("  Selenium unavailable, falling back to requests...")

        try:
            log.info(f"  Fetching: {url}")
            resp = self.session.get(url, timeout=30)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "lxml")
        except Exception as e:
            log.error(f"  Failed: {e}")
            return None

    def _text(self, container, selector: str) -> str:
        if not selector:
            return ""
        for sel in selector.split(","):
            el = container.select_one(sel.strip())
            if el:
                return el.get_text(strip=True)
        return ""

    def _attr(self, container, selector: str, attr: str) -> str:
        if not selector:
            return ""
        for sel in selector.split(","):
            el = container.select_one(sel.strip())
            if el:
                val = el.get(attr, "")
                if val:
                    return val
        return ""

    def _img_url(self, container, selector: str, base_url: str) -> Optional[str]:
        if not selector:
            return None
        for sel in selector.split(","):
            el = container.select_one(sel.strip())
            if el:
                src = (
                    el.get("src") or
                    el.get("data-src") or
                    el.get("data-lazy-src") or
                    el.get("data-original") or
                    el.get("data-image") or
                    ""
                )
                if src:
                    if src.startswith("//"):
                        return "https:" + src
                    if src.startswith("/"):
                        return urljoin(base_url, src)
                    if src.startswith("data:"):
                        continue  # skip data URIs
                    return src
        return None

    def _link_url(self, container, base_url: str) -> Optional[str]:
        """Extract product detail link from container."""
        a = container.select_one("a[href]")
        if a:
            href = a.get("href", "")
            if href.startswith("//"):
                return "https:" + href
            if href.startswith("/"):
                return urljoin(base_url, href)
            if href.startswith("http"):
                return href
        return None

    def scrape_page(self, soup: BeautifulSoup, page_url: str) -> list[ScrapedGoods]:
        now_iso = datetime.now().isoformat()
        products = []
        containers = soup.select(self.template.product_container)
        log.info(f"  Found {len(containers)} product containers")

        for container in containers:
            # 2. goods_name
            goods_name = self._text(container, self.template.sel_goods_name)
            if not goods_name:
                continue

            # 3. price_per_piece
            price_text = self._text(container, self.template.sel_price)
            price = parse_price(price_text)
            if price <= 0:
                continue

            # 1. goods_id
            goods_id = self._text(container, self.template.sel_goods_id) or None

            # 4. discount
            discount_text = self._text(container, self.template.sel_discount)
            discount = parse_discount(discount_text, price)

            # 5. images_url
            images_url = self._img_url(container, self.template.sel_image, page_url)

            # 6. get_web_url — link to product detail, fallback to page URL
            get_web_url = self._link_url(container, page_url) or page_url

            # 7. record_dateTime
            record_dt = now_iso

            # 8. group_name (optional)
            group_name = self._text(container, self.template.sel_group) or None

            products.append(ScrapedGoods(
                goods_id=goods_id,
                goods_name=goods_name,
                price_per_piece=price,
                discount=discount,
                images_url=images_url,
                get_web_url=get_web_url,
                record_dateTime=record_dt,
                group_name=group_name,
            ))

        return products

    def get_next_url(self, soup: BeautifulSoup, current_url: str) -> Optional[str]:
        if not self.template.pagination_next:
            return None
        for sel in self.template.pagination_next.split(","):
            el = soup.select_one(sel.strip())
            if el and el.get("href"):
                return urljoin(current_url, el["href"])
        return None

    def scrape(self, url: str) -> list[ScrapedGoods]:
        all_products = []
        current_url = url
        page_num = 0

        while current_url and page_num < self.template.max_pages:
            page_num += 1
            log.info(f"--- Page {page_num} ---")
            soup = self.fetch_page(current_url)
            if not soup:
                break

            products = self.scrape_page(soup, current_url)
            all_products.extend(products)
            log.info(f"  Extracted {len(products)} products (total: {len(all_products)})")

            if not products and page_num == 1:
                log.warning("  No products found on first page. Page may require JS.")
                if not self.use_selenium:
                    log.warning("  Try adding --selenium flag for JS-rendered sites.")
                break

            current_url = self.get_next_url(soup, current_url)
            if current_url:
                time.sleep(1.5)  # polite delay

        self.close()
        return all_products


# ============================================================
#  Smart Scraper — auto-detect method per site
# ============================================================

def smart_scrape(url: str, template_name: str, keyword: str = "", use_selenium: bool = False) -> list[ScrapedGoods]:
    """
    Auto-select the best scraping strategy:
    - Shopee → API first, fallback to Selenium
    - Lazada → API + embedded JSON, fallback to Selenium
    - Others → HTML with optional Selenium
    """
    # Extract keyword from URL if not provided
    if not keyword:
        parsed = urlparse(url)
        params = dict(p.split("=", 1) for p in parsed.query.split("&") if "=" in p)
        keyword = params.get("keyword", params.get("q", params.get("search", "")))

    log.info(f"Site: {template_name} | URL: {url}")

    # Shopee — prefer API
    if template_name == "shopee":
        if keyword:
            products = scrape_shopee_api(keyword)
            if products:
                return products
            log.warning("  Shopee API returned no results, falling back to HTML scraper...")
        else:
            log.info("  No keyword detected, scraping page directly...")

    # Lazada — prefer API / embedded JSON
    if template_name == "lazada":
        if keyword:
            products = scrape_lazada_api(keyword)
            if products:
                return products
            log.warning("  Lazada API returned no results, falling back to HTML scraper...")
        else:
            log.info("  No keyword detected, scraping page directly...")

    # HTML-based scraping
    tmpl = TEMPLATES.get(template_name, TEMPLATES["generic"])
    scraper = ProductScraper(tmpl, use_selenium=use_selenium)
    products = scraper.scrape(url)
    return products


# ============================================================
#  CSV / Excel Import
# ============================================================

def import_from_file(filepath: str) -> list[ScrapedGoods]:
    """
    Import from CSV/Excel. Expected columns (flexible matching):
      goods_id / sku / รหัส             → goods_id
      goods_name / name / ชื่อสินค้า     → goods_name
      price_per_piece / price / ราคา     → price_per_piece
      discount / ส่วนลด                  → discount
      images_url / image / รูป           → images_url
      get_web_url / url / ลิงก์          → get_web_url
      group / หมวดหมู่                    → group_name
    """
    import pandas as pd

    ext = os.path.splitext(filepath)[1].lower()
    if ext in (".xlsx", ".xls"):
        df = pd.read_excel(filepath)
    elif ext == ".csv":
        try:
            df = pd.read_csv(filepath, encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(filepath, encoding="tis-620")
    else:
        raise ValueError(f"Unsupported file: {ext}. Use .csv, .xlsx, or .xls")

    log.info(f"Loaded {len(df)} rows from {filepath}")
    log.info(f"Columns: {list(df.columns)}")

    # Flexible column mapping
    col_map = {}
    for col in df.columns:
        c = str(col).lower().strip()
        if c in ("goods_id", "sku", "รหัส", "รหัสสินค้า", "product_code", "code", "id"):
            col_map["goods_id"] = col
        elif c in ("goods_name", "name", "ชื่อ", "ชื่อสินค้า", "product_name", "product", "สินค้า"):
            col_map["goods_name"] = col
        elif c in ("price_per_piece", "price", "ราคา", "unit_price", "unitprice", "ราคาต่อหน่วย"):
            col_map["price_per_piece"] = col
        elif c in ("discount", "ส่วนลด", "sale", "promo"):
            col_map["discount"] = col
        elif c in ("images_url", "image", "image_url", "img", "รูป", "รูปภาพ"):
            col_map["images_url"] = col
        elif c in ("get_web_url", "url", "source_url", "link", "ลิงก์", "เว็บ"):
            col_map["get_web_url"] = col
        elif c in ("group", "group_name", "หมวดหมู่", "category_name", "กลุ่ม", "กลุ่มสินค้า"):
            col_map["group_name"] = col

    if "goods_name" not in col_map or "price_per_piece" not in col_map:
        raise ValueError(
            f"ต้องมีคอลัมน์ goods_name (ชื่อ) และ price_per_piece (ราคา)\n"
            f"คอลัมน์ที่พบ: {list(df.columns)}"
        )

    now_iso = datetime.now().isoformat()
    products = []

    for _, row in df.iterrows():
        name = str(row[col_map["goods_name"]]).strip()
        price = parse_price(str(row[col_map["price_per_piece"]]))
        if not name or name.lower() == "nan" or price <= 0:
            continue

        def safe_str(key: str) -> Optional[str]:
            if key not in col_map:
                return None
            v = str(row.get(col_map[key], "")).strip()
            return v if v and v.lower() != "nan" else None

        discount_raw = safe_str("discount")
        discount_val = parse_price(discount_raw) if discount_raw else None

        products.append(ScrapedGoods(
            goods_id=safe_str("goods_id"),
            goods_name=name,
            price_per_piece=price,
            discount=discount_val if discount_val and discount_val > 0 else None,
            images_url=safe_str("images_url"),
            get_web_url=safe_str("get_web_url"),
            record_dateTime=now_iso,
            group_name=safe_str("group_name"),
        ))

    return products


# ============================================================
#  Demo Data
# ============================================================

DEMO_DATA = {
    "default": lambda: _demo_default(),
    "jib": lambda: _demo_jib(),
    "banana": lambda: _demo_banana(),
    "shopee": lambda: _demo_shopee(),
    "lazada": lambda: _demo_lazada(),
    "lotuss": lambda: _demo_lotuss(),
    "bigc": lambda: _demo_bigc(),
    "lnwshop": lambda: _demo_lnwshop(),
}


def _demo_default() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("PAP-A4-80", "กระดาษ A4 80 แกรม (5 รีม)", 750, 50, "https://img.example.com/paper-a4.jpg", "https://shop.example.com/paper-a4", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("INK-HP680-BK", "หมึกพิมพ์ HP 680 Black", 450, None, "https://img.example.com/ink-hp680-bk.jpg", "https://shop.example.com/ink-hp680-bk", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("INK-HP680-CL", "หมึกพิมพ์ HP 680 Color", 520, 30, "https://img.example.com/ink-hp680-cl.jpg", "https://shop.example.com/ink-hp680-cl", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("PEN-05-BOX", "ปากกาลูกลื่น 0.5mm (กล่อง 12 ด้าม)", 180, None, "https://img.example.com/pen-05.jpg", "https://shop.example.com/pen-05", now, "เครื่องเขียน"),
        ScrapedGoods("FLD-A4-W", "แฟ้มสันกว้าง A4", 45, 5, None, "https://shop.example.com/folder-a4", now, "เครื่องเขียน"),
        ScrapedGoods("NB-A5-LN", "สมุดบันทึก A5 มีเส้น", 65, None, "https://img.example.com/notebook-a5.jpg", "https://shop.example.com/notebook-a5", now, "เครื่องเขียน"),
        ScrapedGoods("GLU-UHU-21", "กาวแท่ง UHU 21g", 35, None, None, "https://shop.example.com/glue-uhu", now, "เครื่องเขียน"),
        ScrapedGoods("CLP-108", "คลิปหนีบกระดาษ No.108 (กล่อง)", 25, None, "https://img.example.com/clip-108.jpg", "https://shop.example.com/clip-108", now, "เครื่องเขียน"),
        ScrapedGoods("STP-MAX-10", "เครื่องเย็บกระดาษ MAX HD-10", 220, 20, "https://img.example.com/stapler-max.jpg", "https://shop.example.com/stapler-max", now, "เครื่องเขียน"),
        ScrapedGoods("STW-10", "ลวดเย็บ No.10 (กล่อง)", 15, None, None, "https://shop.example.com/staple-wire", now, "เครื่องเขียน"),
        ScrapedGoods("PC-DELL-V", "คอมพิวเตอร์ Dell Vostro i5/8GB/256SSD", 18500, 1500, "https://img.example.com/dell-vostro.jpg", "https://shop.example.com/dell-vostro", now, "คอมพิวเตอร์"),
        ScrapedGoods("MON-24", "จอมอนิเตอร์ 24 นิ้ว IPS", 4500, 300, "https://img.example.com/monitor-24.jpg", "https://shop.example.com/monitor-24", now, "คอมพิวเตอร์"),
        ScrapedGoods("KB-USB", "คีย์บอร์ด USB", 350, None, "https://img.example.com/keyboard.jpg", "https://shop.example.com/keyboard", now, "คอมพิวเตอร์"),
        ScrapedGoods("MS-LOGI-W", "เมาส์ไร้สาย Logitech M185", 490, 40, "https://img.example.com/mouse-logi.jpg", "https://shop.example.com/mouse-logi", now, "คอมพิวเตอร์"),
        ScrapedGoods("RTR-WIFI6", "เราเตอร์ WiFi 6 AX1500", 1890, 200, "https://img.example.com/router-wifi6.jpg", "https://shop.example.com/router-wifi6", now, "อุปกรณ์เครือข่าย"),
    ]


def _demo_jib() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("JIB-NB001", "Notebook Lenovo IdeaPad 3 15IAU7 i5/8GB/512SSD", 16990, 2000, "https://www.jib.co.th/img/nb-lenovo.jpg", "https://www.jib.co.th/web/product/readProduct/40/40", now, "โน้ตบุ๊ค"),
        ScrapedGoods("JIB-NB002", "Notebook ASUS VivoBook 15 OLED i7/16GB/512SSD", 24990, 3000, "https://www.jib.co.th/img/nb-asus.jpg", "https://www.jib.co.th/web/product/readProduct/41/41", now, "โน้ตบุ๊ค"),
        ScrapedGoods("JIB-MON01", "Monitor LG 27UL550 27\" 4K IPS", 7990, 1000, "https://www.jib.co.th/img/mon-lg.jpg", "https://www.jib.co.th/web/product/readProduct/42/42", now, "จอมอนิเตอร์"),
        ScrapedGoods("JIB-PRN01", "Printer HP LaserJet M111a", 3990, 500, "https://www.jib.co.th/img/prn-hp.jpg", "https://www.jib.co.th/web/product/readProduct/43/43", now, "เครื่องพิมพ์"),
        ScrapedGoods("JIB-KB01", "Keyboard Logitech K380 Multi-Device", 1290, 200, "https://www.jib.co.th/img/kb-logi.jpg", "https://www.jib.co.th/web/product/readProduct/44/44", now, "อุปกรณ์ต่อพ่วง"),
        ScrapedGoods("JIB-MS01", "Mouse Razer DeathAdder Essential", 890, 100, "https://www.jib.co.th/img/ms-razer.jpg", "https://www.jib.co.th/web/product/readProduct/45/45", now, "อุปกรณ์ต่อพ่วง"),
        ScrapedGoods("JIB-SSD01", "SSD Samsung 870 EVO 1TB", 2490, 300, "https://www.jib.co.th/img/ssd-samsung.jpg", "https://www.jib.co.th/web/product/readProduct/46/46", now, "สตอเรจ"),
        ScrapedGoods("JIB-RAM01", "RAM Kingston Fury Beast DDR5 16GB", 1890, None, "https://www.jib.co.th/img/ram-kingston.jpg", "https://www.jib.co.th/web/product/readProduct/47/47", now, "อุปกรณ์คอมพิวเตอร์"),
    ]


def _demo_banana() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("BNN-MBA-M3", "MacBook Air 13\" M3 8/256GB", 37900, None, "https://www.bnn.in.th/img/mba-m3.jpg", "https://www.bnn.in.th/th/p/mac/macbook-air-m3", now, "Mac"),
        ScrapedGoods("BNN-MBP-M3P", "MacBook Pro 14\" M3 Pro 18/512GB", 64900, 2000, "https://www.bnn.in.th/img/mbp-m3pro.jpg", "https://www.bnn.in.th/th/p/mac/macbook-pro-m3pro", now, "Mac"),
        ScrapedGoods("BNN-IP15-128", "iPhone 15 128GB", 28900, 1000, "https://www.bnn.in.th/img/ip15.jpg", "https://www.bnn.in.th/th/p/iphone/iphone-15", now, "iPhone"),
        ScrapedGoods("BNN-IPAD10", "iPad 10th Gen WiFi 64GB", 14900, 500, "https://www.bnn.in.th/img/ipad10.jpg", "https://www.bnn.in.th/th/p/ipad/ipad-10", now, "iPad"),
        ScrapedGoods("BNN-AW-SE", "Apple Watch SE 2nd Gen 40mm", 8900, None, "https://www.bnn.in.th/img/aw-se.jpg", "https://www.bnn.in.th/th/p/apple-watch/apple-watch-se", now, "Apple Watch"),
        ScrapedGoods("BNN-AP-PRO2", "AirPods Pro 2nd Gen USB-C", 8690, 300, "https://www.bnn.in.th/img/airpods-pro2.jpg", "https://www.bnn.in.th/th/p/accessories/airpods-pro-2", now, "อุปกรณ์เสริม"),
    ]


def _demo_shopee() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("SPE-001", "ปากกาลูกลื่น Pilot G-1 0.5mm กล่อง 12 ด้าม", 156, 20, "https://shopee.co.th/img/pen-pilot.jpg", "https://shopee.co.th/product/1/1001", now, "เครื่องเขียน"),
        ScrapedGoods("SPE-002", "กระดาษถ่ายเอกสาร A4 80 แกรม Double A (500 แผ่น)", 165, 15, "https://shopee.co.th/img/paper-da.jpg", "https://shopee.co.th/product/1/1002", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("SPE-003", "เครื่องคิดเลข Casio MX-12B 12 หลัก", 295, 30, "https://shopee.co.th/img/calc-casio.jpg", "https://shopee.co.th/product/1/1003", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("SPE-004", "แฟ้มเอกสาร A4 คละสี 12 แฟ้ม", 120, 10, "https://shopee.co.th/img/folder-color.jpg", "https://shopee.co.th/product/1/1004", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("SPE-005", "สายLAN Cat6 10 เมตร", 89, None, "https://shopee.co.th/img/lan-cat6.jpg", "https://shopee.co.th/product/1/1005", now, "อุปกรณ์เครือข่าย"),
    ]


def _demo_lazada() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("LZD-001", "เก้าอี้สำนักงาน รุ่น Ergonomic Mesh", 3490, 500, "https://lazada.co.th/img/chair.jpg", "https://www.lazada.co.th/products/i1001.html", now, "เฟอร์นิเจอร์สำนักงาน"),
        ScrapedGoods("LZD-002", "โต๊ะทำงานไม้ 120x60 cm", 2990, 300, "https://lazada.co.th/img/desk.jpg", "https://www.lazada.co.th/products/i1002.html", now, "เฟอร์นิเจอร์สำนักงาน"),
        ScrapedGoods("LZD-003", "ตู้เก็บเอกสาร 3 ลิ้นชัก", 1890, 200, "https://lazada.co.th/img/cabinet.jpg", "https://www.lazada.co.th/products/i1003.html", now, "เฟอร์นิเจอร์สำนักงาน"),
        ScrapedGoods("LZD-004", "หมึก Epson 003 Original (4 สี)", 920, 80, "https://lazada.co.th/img/ink-epson.jpg", "https://www.lazada.co.th/products/i1004.html", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("LZD-005", "กล่องเก็บเอกสาร A4 ชุด 5 ใบ", 250, 30, "https://lazada.co.th/img/box-a4.jpg", "https://www.lazada.co.th/products/i1005.html", now, "อุปกรณ์สำนักงาน"),
    ]


def _demo_lotuss() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("LT-001", "กระดาษ A4 80g Navigator 500 แผ่น", 175, 10, "https://lotuss.com/img/paper-navigator.jpg", "https://www.lotuss.com/th/product/paper-navigator", now, "เครื่องเขียนและอุปกรณ์"),
        ScrapedGoods("LT-002", "ปากกาเมจิก ตราม้า 12 สี", 65, None, "https://lotuss.com/img/pen-horse.jpg", "https://www.lotuss.com/th/product/pen-horse-12", now, "เครื่องเขียนและอุปกรณ์"),
        ScrapedGoods("LT-003", "เทปกาว OPP ใส 2 นิ้ว x 100 หลา", 45, 5, "https://lotuss.com/img/tape-opp.jpg", "https://www.lotuss.com/th/product/tape-opp-100y", now, "เครื่องเขียนและอุปกรณ์"),
        ScrapedGoods("LT-004", "กาแฟ Nescafe 3in1 30 ซอง", 189, 20, "https://lotuss.com/img/coffee-nescafe.jpg", "https://www.lotuss.com/th/product/nescafe-3in1-30", now, "เครื่องดื่ม"),
        ScrapedGoods("LT-005", "น้ำดื่ม Nestle Pure Life 1.5L x6", 79, None, "https://lotuss.com/img/water-nestle.jpg", "https://www.lotuss.com/th/product/nestle-water-6", now, "เครื่องดื่ม"),
    ]


def _demo_bigc() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("BC-001", "กระดาษชำระ Cellox 24 ม้วน", 249, 30, "https://bigc.co.th/img/tissue-cellox.jpg", "https://www.bigc.co.th/product/tissue-cellox-24", now, "ของใช้สำนักงาน"),
        ScrapedGoods("BC-002", "สบู่เหลวล้างมือ Dettol 500ml", 119, 10, "https://bigc.co.th/img/soap-dettol.jpg", "https://www.bigc.co.th/product/dettol-hand-soap", now, "ของใช้สำนักงาน"),
        ScrapedGoods("BC-003", "ถุงขยะ ชนิดหนา 30x40 นิ้ว 15 ใบ", 55, None, "https://bigc.co.th/img/bag-trash.jpg", "https://www.bigc.co.th/product/trash-bag-30x40", now, "ของใช้สำนักงาน"),
        ScrapedGoods("BC-004", "น้ำยาทำความสะอาด Ajax 900ml", 89, 10, "https://bigc.co.th/img/cleaner-ajax.jpg", "https://www.bigc.co.th/product/ajax-cleaner", now, "ของใช้สำนักงาน"),
        ScrapedGoods("BC-005", "แบตเตอรี่ AA Energizer Max 8 ก้อน", 179, 20, "https://bigc.co.th/img/battery-energizer.jpg", "https://www.bigc.co.th/product/energizer-aa-8", now, "อุปกรณ์ไฟฟ้า"),
    ]


def _demo_lnwshop() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("LNW-001", "กระเป๋าเอกสาร หนัง PU สีดำ", 590, 50, "https://lnwshop.com/img/bag-doc.jpg", "https://myshop.lnwshop.com/product/1", now, "กระเป๋า"),
        ScrapedGoods("LNW-002", "ปากกาหมึกซึม Parker Jotter", 790, None, "https://lnwshop.com/img/pen-parker.jpg", "https://myshop.lnwshop.com/product/2", now, "เครื่องเขียน"),
        ScrapedGoods("LNW-003", "สมุดวาดภาพ Canson A3 20 แผ่น", 185, 15, "https://lnwshop.com/img/sketchbook-canson.jpg", "https://myshop.lnwshop.com/product/3", now, "เครื่องเขียน"),
        ScrapedGoods("LNW-004", "แท่นชาร์จ USB-C 65W PD", 890, 100, "https://lnwshop.com/img/charger-65w.jpg", "https://myshop.lnwshop.com/product/4", now, "อุปกรณ์ไอที"),
        ScrapedGoods("LNW-005", "เคส iPad Air ฝาพับ Smart Cover", 450, 50, "https://lnwshop.com/img/case-ipad.jpg", "https://myshop.lnwshop.com/product/5", now, "อุปกรณ์เสริม"),
    ]


def generate_demo_products(site: str = "default") -> list[ScrapedGoods]:
    factory = DEMO_DATA.get(site, DEMO_DATA["default"])
    return factory()


# ============================================================
#  API Sender
# ============================================================

def send_to_api(
    products: list[ScrapedGoods],
    skip_duplicates: bool = True,
    match_by: str = "name",
    batch_size: int = 50,
) -> dict:
    """Send scraped goods to AccNextGen bulk import API."""
    total = {"imported": 0, "skipped": 0, "updated": 0, "errors": []}
    payloads = [p.to_api_dict() for p in products]
    batches = [payloads[i:i + batch_size] for i in range(0, len(payloads), batch_size)]

    log.info(f"Sending {len(payloads)} products in {len(batches)} batch(es)...")

    for idx, batch in enumerate(batches):
        log.info(f"  Batch {idx + 1}/{len(batches)} ({len(batch)} items)...")
        try:
            resp = requests.post(
                IMPORT_ENDPOINT,
                json={"products": batch, "skipDuplicates": skip_duplicates, "matchBy": match_by},
                headers={"Content-Type": "application/json"},
                timeout=60,
            )
            if resp.status_code == 200:
                r = resp.json()
                total["imported"] += r.get("imported", 0)
                total["skipped"] += r.get("skipped", 0)
                total["updated"] += r.get("updated", 0)
                total["errors"].extend(r.get("errors", []))
                log.info(f"    OK  imported={r.get('imported',0)}  skipped={r.get('skipped',0)}  updated={r.get('updated',0)}")
            else:
                log.error(f"    FAIL  HTTP {resp.status_code}: {resp.text[:200]}")
                total["errors"].append({"batch": idx, "error": f"HTTP {resp.status_code}"})
        except requests.exceptions.ConnectionError:
            log.error(f"    Cannot connect to {IMPORT_ENDPOINT} — is the dev server running?")
            total["errors"].append({"batch": idx, "error": "Connection refused"})
            break
        except Exception as e:
            log.error(f"    Error: {e}")
            total["errors"].append({"batch": idx, "error": str(e)})

    return total


# ============================================================
#  Pretty Print
# ============================================================

def print_table(products: list[ScrapedGoods], limit: int = 10):
    """Print products as a formatted table."""
    hdr = f"{'goods_id':>15s}  {'goods_name':<30s}  {'group':<15s}  {'price':>10s}  {'discount':>8s}  {'img':>3s}"
    log.info(hdr)
    log.info("-" * len(hdr))
    for p in products[:limit]:
        log.info(
            f"{(p.goods_id or '-'):>15s}  "
            f"{p.goods_name[:30]:<30s}  "
            f"{(p.group_name or '-')[:15]:<15s}  "
            f"{p.price_per_piece:>10,.2f}  "
            f"{(f'{p.discount:,.0f}' if p.discount else '-'):>8s}  "
            f"{'Y' if p.images_url else 'N':>3s}"
        )
    if len(products) > limit:
        log.info(f"  ... and {len(products) - limit} more")


# ============================================================
#  CLI
# ============================================================

ALL_TEMPLATES = list(TEMPLATES.keys())
ALL_SITES = ["lnwshop", "shopee", "lazada", "lotuss", "banana", "jib", "bigc"]

def main():
    parser = argparse.ArgumentParser(
        description="AccNextGen — Product Web Scraper (Thai E-Commerce)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Supported Thai sites:
  lnwshop   — LnwShop (lnwshop.com)
  shopee    — Shopee Thailand (shopee.co.th) *API+Selenium
  lazada    — Lazada Thailand (lazada.co.th) *API+Selenium
  lotuss    — Lotus's Shop Online (lotuss.com) *Selenium
  banana    — BaNANA Online (bnn.in.th) *Selenium
  jib       — JIB Online (jib.co.th) *Selenium
  bigc      — BigC Online (bigc.co.th) *Selenium

Templates: {', '.join(ALL_TEMPLATES)}

Examples:
  python scrape_products.py --mode demo
  python scrape_products.py --mode demo --site jib
  python scrape_products.py --mode demo --site shopee
  python scrape_products.py --mode url --url "https://shopee.co.th/search?keyword=paper"
  python scrape_products.py --mode url --url "https://www.jib.co.th/web/product/..." --selenium
  python scrape_products.py --mode url --url "https://www.bnn.in.th/th/c/mac" --template banana
  python scrape_products.py --mode file --file products.csv
  python scrape_products.py --mode url --url "..." --dry-run --output-json out.json

Notes:
  * Sites marked with *Selenium require: pip install selenium
    + Chrome/Chromium browser + chromedriver
  * Shopee/Lazada try API first, fallback to Selenium
  * Use --keyword to override search term for API-based scrapers
"""
    )

    parser.add_argument("--mode", required=True, choices=["url", "file", "demo"])
    parser.add_argument("--url", help="URL to scrape (mode=url)")
    parser.add_argument("--file", help="CSV/Excel path (mode=file)")
    parser.add_argument("--template", default=None, choices=ALL_TEMPLATES,
                        help="Scraping template (auto-detected from URL if omitted)")
    parser.add_argument("--site", default=None,
                        help="Site name for demo data (jib/banana/shopee/lazada/lotuss/bigc/lnwshop)")
    parser.add_argument("--keyword", default="", help="Search keyword (Shopee/Lazada API)")
    parser.add_argument("--max-pages", type=int, default=5)
    parser.add_argument("--skip-duplicates", action="store_true", default=True)
    parser.add_argument("--update-existing", action="store_true", default=False)
    parser.add_argument("--match-by", default="name", choices=["name", "sku"])
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't import")
    parser.add_argument("--selenium", action="store_true", help="Force Selenium for JS-rendered sites")
    parser.add_argument("--no-headless", action="store_true", help="Show browser window (debug)")
    parser.add_argument("--api-url", default=None, help="Override API base URL")
    parser.add_argument("--output-json", help="Save raw scraped data to JSON")

    args = parser.parse_args()

    global IMPORT_ENDPOINT
    if args.api_url:
        IMPORT_ENDPOINT = f"{args.api_url}/api/products/import"

    products: list[ScrapedGoods] = []

    # ---- URL mode ----
    if args.mode == "url":
        if not args.url:
            parser.error("--url required for mode=url")

        # Auto-detect template from URL if not specified
        template_name = args.template or resolve_template(args.url)
        log.info(f"Using template: {template_name} ({TEMPLATES[template_name].name})")

        tmpl = TEMPLATES[template_name]
        tmpl.max_pages = args.max_pages

        # Use smart_scrape for auto-detection of best method
        products = smart_scrape(
            args.url,
            template_name,
            keyword=args.keyword,
            use_selenium=args.selenium,
        )

    # ---- File mode ----
    elif args.mode == "file":
        if not args.file:
            parser.error("--file required for mode=file")
        if not os.path.exists(args.file):
            log.error(f"File not found: {args.file}")
            sys.exit(1)
        products = import_from_file(args.file)

    # ---- Demo mode ----
    elif args.mode == "demo":
        site = args.site or "default"
        log.info(f"Generating demo data for: {site}")
        products = generate_demo_products(site)

    # ---- Output ----
    if not products:
        log.warning("No products found.")
        sys.exit(0)

    log.info(f"\n{'=' * 60}")
    log.info(f"  Total products scraped: {len(products)}")
    log.info(f"{'=' * 60}")
    print_table(products)

    # Save JSON
    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump([p.to_raw_dict() for p in products], f, ensure_ascii=False, indent=2)
        log.info(f"\nSaved raw data to {args.output_json}")

    if args.dry_run:
        log.info("\n[DRY RUN] — no data sent to API.")
        return

    # Send to API
    results = send_to_api(
        products,
        skip_duplicates=not args.update_existing,
        match_by=args.match_by,
    )

    log.info(f"\n{'=' * 60}")
    log.info(f"  IMPORT RESULTS")
    log.info(f"{'=' * 60}")
    log.info(f"  Imported : {results['imported']}")
    log.info(f"  Skipped  : {results['skipped']}")
    log.info(f"  Updated  : {results['updated']}")
    log.info(f"  Errors   : {len(results['errors'])}")
    if results["errors"]:
        for err in results["errors"][:5]:
            log.warning(f"    {err}")


if __name__ == "__main__":
    main()
