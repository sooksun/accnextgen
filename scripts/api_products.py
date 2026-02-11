#!/usr/bin/env python3
"""
Product API Fetcher for AccNextGen
====================================
Feature 2: Get goods data from Official Open APIs

Supported APIs:
  1. LnwShop Open API  — https://docs.open.lnwshop.com/
  2. Shopee Open Platform — https://open.shopee.com/
  3. Lazada Open Platform — https://open.lazada.com/
  4. BigC OSX API — https://bgcd-osxapi.bigc.co.th/

Usage:
  python api_products.py --source lnwshop
  python api_products.py --source shopee --keyword "printer"
  python api_products.py --source lazada --filter live --limit 50
  python api_products.py --source bigc --keyword "paper"
  python api_products.py --source all
  python api_products.py --source lnwshop --dry-run
  python api_products.py --source demo-lnwshop

Environment variables (in .env):
  See each provider section for required keys.
"""

import argparse
import hashlib
import hmac
import json
import logging
import os
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional
from urllib.parse import urlencode

import requests
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
log = logging.getLogger("api-fetcher")


# ============================================================
#  Data Model (same as scrape_products.py)
# ============================================================

@dataclass
class ScrapedGoods:
    goods_id: Optional[str]
    goods_name: str
    price_per_piece: float
    discount: Optional[float]
    images_url: Optional[str]
    get_web_url: Optional[str]
    record_dateTime: str
    group_name: Optional[str] = None

    def to_api_dict(self) -> dict:
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
        return asdict(self)


# ============================================================
#  1. LnwShop Open API
#     Docs: https://docs.open.lnwshop.com/
# ============================================================

class LnwShopAPI:
    """
    LnwShop Open API client.
    Endpoints:
      GET /api/v1/products — list products
      GET /api/v1/products/:id — single product
    Auth: API Key + Secret in header
    """

    def __init__(self):
        self.api_key = os.getenv("LNWSHOP_API_KEY", "")
        self.api_secret = os.getenv("LNWSHOP_API_SECRET", "")
        self.shop_name = os.getenv("LNWSHOP_SHOP_NAME", "")
        self.base_url = f"https://{self.shop_name}.lnwshop.com/api/v1" if self.shop_name else ""

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.shop_name)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Key": self.api_key,
            "X-API-Secret": self.api_secret,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def fetch_products(self, keyword: str = "", limit: int = 100) -> list[ScrapedGoods]:
        if not self.is_configured:
            log.warning("[LnwShop] Not configured. Set LNWSHOP_API_KEY, LNWSHOP_SHOP_NAME in .env")
            return []

        now_iso = datetime.now().isoformat()
        products = []
        page = 1
        per_page = min(50, limit)

        while len(products) < limit:
            params = {"page": page, "per_page": per_page}
            if keyword:
                params["search"] = keyword

            try:
                log.info(f"  [LnwShop] Fetching page {page}...")
                resp = requests.get(
                    f"{self.base_url}/products",
                    params=params,
                    headers=self._headers(),
                    timeout=15,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("data", data.get("products", []))
                    if not items:
                        break
                    log.info(f"  [LnwShop] Page {page}: {len(items)} items")

                    for item in items:
                        name = item.get("name", item.get("title", ""))
                        if not name:
                            continue
                        price = float(item.get("price", item.get("sell_price", 0)))
                        if price <= 0:
                            continue

                        original_price = float(item.get("original_price", item.get("price_before", 0)))
                        discount = round(original_price - price, 2) if original_price > price else None

                        images = item.get("images", item.get("medias", []))
                        image_url = images[0].get("url", "") if images and isinstance(images[0], dict) else (images[0] if images else None)

                        products.append(ScrapedGoods(
                            goods_id=str(item.get("sku", item.get("id", ""))),
                            goods_name=name,
                            price_per_piece=price,
                            discount=discount,
                            images_url=image_url,
                            get_web_url=item.get("url", item.get("permalink", f"{self.base_url}/products/{item.get('id','')}")),
                            record_dateTime=now_iso,
                            group_name=item.get("category_name", item.get("category", {}).get("name", "LnwShop")),
                        ))
                else:
                    log.error(f"  [LnwShop] HTTP {resp.status_code}: {resp.text[:200]}")
                    break
            except Exception as e:
                log.error(f"  [LnwShop] Error: {e}")
                break

            page += 1
            time.sleep(0.5)

        return products[:limit]


# ============================================================
#  2. Shopee Open Platform
#     Docs: https://open.shopee.com/
# ============================================================

class ShopeeAPI:
    """
    Shopee Open Platform v2 client.
    Key Endpoints:
      /api/v2/product/get_item_list — list seller's products
      /api/v2/product/get_item_base_info — product details
      /api/v2/product/search_item — search products
    Auth: Partner ID + Partner Key + Access Token + HMAC-SHA256 signature
    """

    BASE_URL = "https://partner.shopeemobile.com"

    def __init__(self):
        self.partner_id = int(os.getenv("SHOPEE_PARTNER_ID") or "0")
        self.partner_key = os.getenv("SHOPEE_PARTNER_KEY", "")
        self.shop_id = int(os.getenv("SHOPEE_SHOP_ID") or "0")
        self.access_token = os.getenv("SHOPEE_ACCESS_TOKEN", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.partner_id and self.partner_key and self.access_token and self.shop_id)

    def _sign(self, path: str, timestamp: int) -> str:
        """Generate HMAC-SHA256 signature for Shopee API v2."""
        base_string = f"{self.partner_id}{path}{timestamp}{self.access_token}{self.shop_id}"
        return hmac.new(
            self.partner_key.encode(), base_string.encode(), hashlib.sha256
        ).hexdigest()

    def _request(self, path: str, params: dict = None) -> dict:
        ts = int(time.time())
        sign = self._sign(path, ts)
        query = {
            "partner_id": self.partner_id,
            "timestamp": ts,
            "access_token": self.access_token,
            "shop_id": self.shop_id,
            "sign": sign,
        }
        if params:
            query.update(params)

        resp = requests.get(f"{self.BASE_URL}{path}", params=query, timeout=15)
        return resp.json() if resp.status_code == 200 else {}

    def fetch_products(self, keyword: str = "", limit: int = 100) -> list[ScrapedGoods]:
        if not self.is_configured:
            log.warning("[Shopee] Not configured. Set SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID, SHOPEE_ACCESS_TOKEN in .env")
            return []

        now_iso = datetime.now().isoformat()
        products = []
        offset = 0
        page_size = min(50, limit)

        while len(products) < limit:
            log.info(f"  [Shopee] Fetching offset={offset}...")
            # v2.product.get_item_list
            data = self._request("/api/v2/product/get_item_list", {
                "offset": offset,
                "page_size": page_size,
                "item_status": "NORMAL",
            })

            response = data.get("response", {})
            items = response.get("item", [])
            if not items:
                break

            # Get detailed info for each item
            item_ids = [str(i["item_id"]) for i in items]
            detail_data = self._request("/api/v2/product/get_item_base_info", {
                "item_id_list": ",".join(item_ids),
            })
            detail_items = detail_data.get("response", {}).get("item_list", [])

            for item in detail_items:
                name = item.get("item_name", "")
                if not name:
                    continue

                # Price from first model/variant
                price_info = item.get("price_info", [{}])
                if isinstance(price_info, list) and price_info:
                    price = float(price_info[0].get("current_price", 0))
                    original = float(price_info[0].get("original_price", 0))
                else:
                    price = 0
                    original = 0

                if price <= 0:
                    continue

                discount = round(original - price, 2) if original > price else None

                images = item.get("image", {})
                image_list = images.get("image_url_list", [])
                image_url = image_list[0] if image_list else None

                item_id = item.get("item_id", "")

                products.append(ScrapedGoods(
                    goods_id=str(item.get("item_sku", item_id)),
                    goods_name=name,
                    price_per_piece=price,
                    discount=discount,
                    images_url=image_url,
                    get_web_url=f"https://shopee.co.th/product/{self.shop_id}/{item_id}",
                    record_dateTime=now_iso,
                    group_name=item.get("category_id", "Shopee"),
                ))

            offset += page_size
            has_next = response.get("has_next_page", False)
            if not has_next:
                break
            time.sleep(1)

        return products[:limit]


# ============================================================
#  3. Lazada Open Platform (Seller Center API)
#     Docs: https://open.lazada.com/
# ============================================================

class LazadaAPI:
    """
    Lazada Seller Center API client.
    Key Endpoint: GetProducts
    Auth: App Key + App Secret → HMAC-SHA256 signature
    """

    def __init__(self):
        self.app_key = os.getenv("LAZADA_APP_KEY", "")
        self.app_secret = os.getenv("LAZADA_APP_SECRET", "")
        self.access_token = os.getenv("LAZADA_ACCESS_TOKEN", "")
        self.api_url = os.getenv("LAZADA_API_URL", "https://api.lazada.co.th/rest")

    @property
    def is_configured(self) -> bool:
        return bool(self.app_key and self.app_secret and self.access_token)

    def _sign(self, api_path: str, params: dict) -> str:
        """Generate SHA256 signature for Lazada API."""
        sorted_params = sorted(params.items())
        concat = api_path + "".join(f"{k}{v}" for k, v in sorted_params)
        return hmac.new(
            self.app_secret.encode(), concat.encode(), hashlib.sha256
        ).hexdigest().upper()

    def _request(self, action: str, extra_params: dict = None) -> dict:
        api_path = "/products/get"
        params = {
            "app_key": self.app_key,
            "access_token": self.access_token,
            "timestamp": str(int(time.time() * 1000)),
            "sign_method": "sha256",
        }
        if extra_params:
            params.update(extra_params)

        params["sign"] = self._sign(api_path, params)

        resp = requests.get(f"{self.api_url}{api_path}", params=params, timeout=15)
        return resp.json() if resp.status_code == 200 else {}

    def fetch_products(self, keyword: str = "", limit: int = 100, filter_status: str = "all") -> list[ScrapedGoods]:
        if not self.is_configured:
            log.warning("[Lazada] Not configured. Set LAZADA_APP_KEY, LAZADA_APP_SECRET, LAZADA_ACCESS_TOKEN in .env")
            return []

        now_iso = datetime.now().isoformat()
        products = []
        offset = 0
        page_size = min(50, limit)

        while len(products) < limit:
            log.info(f"  [Lazada] Fetching offset={offset}...")
            params = {
                "filter": filter_status,
                "limit": str(page_size),
                "offset": str(offset),
            }
            if keyword:
                params["search"] = keyword

            data = self._request("GetProducts", params)

            if "data" in data:
                items = data["data"].get("products", [])
            elif "SuccessResponse" in data:
                items = data["SuccessResponse"].get("Body", {}).get("Products", [])
            else:
                log.error(f"  [Lazada] Unexpected response: {str(data)[:200]}")
                break

            if not items:
                break

            log.info(f"  [Lazada] Got {len(items)} products")

            for item in items:
                attrs = item.get("Attributes", item.get("attributes", {}))
                skus = item.get("Skus", item.get("skus", []))
                first_sku = skus[0] if skus else {}

                name = attrs.get("name", attrs.get("title", ""))
                if not name:
                    continue

                price = float(first_sku.get("price", first_sku.get("Price", 0)))
                special_price = float(first_sku.get("special_price", first_sku.get("SpecialPrice", 0)))
                if price <= 0:
                    continue

                discount = round(price - special_price, 2) if 0 < special_price < price else None
                actual_price = special_price if special_price > 0 else price

                images = first_sku.get("Images", first_sku.get("images", []))
                image_url = None
                for img in images:
                    if img:
                        image_url = img if isinstance(img, str) else img.get("url", img.get("Image", ""))
                        if image_url:
                            break

                product_url = first_sku.get("Url", first_sku.get("url", ""))
                if product_url and product_url.startswith("//"):
                    product_url = "https:" + product_url

                products.append(ScrapedGoods(
                    goods_id=str(first_sku.get("SellerSku", first_sku.get("seller_sku", ""))),
                    goods_name=name,
                    price_per_piece=actual_price,
                    discount=discount,
                    images_url=image_url,
                    get_web_url=product_url,
                    record_dateTime=now_iso,
                    group_name=attrs.get("brand", "Lazada"),
                ))

            offset += page_size
            time.sleep(1)

        return products[:limit]


# ============================================================
#  4. BigC OSX API
#     Docs: https://bgcd-osxapi.bigc.co.th/index.html
# ============================================================

class BigCAPI:
    """
    BigC OSX API client.
    Auth: API Key + Secret in header
    """

    def __init__(self):
        self.api_key = os.getenv("BIGC_API_KEY", "")
        self.api_secret = os.getenv("BIGC_API_SECRET", "")
        self.api_url = os.getenv("BIGC_API_URL", "https://bgcd-osxapi.bigc.co.th")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_url)

    def _headers(self) -> dict:
        return {
            "X-API-Key": self.api_key,
            "X-API-Secret": self.api_secret,
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def fetch_products(self, keyword: str = "", limit: int = 100) -> list[ScrapedGoods]:
        if not self.is_configured:
            log.warning("[BigC] Not configured. Set BIGC_API_KEY, BIGC_API_SECRET in .env")
            return []

        now_iso = datetime.now().isoformat()
        products = []
        page = 1
        page_size = min(50, limit)

        while len(products) < limit:
            log.info(f"  [BigC] Fetching page {page}...")
            params = {"page": page, "limit": page_size}
            if keyword:
                params["search"] = keyword
                params["q"] = keyword

            try:
                resp = requests.get(
                    f"{self.api_url}/api/v1/products",
                    params=params,
                    headers=self._headers(),
                    timeout=15,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("data", data.get("products", data.get("items", [])))
                    if not items:
                        break
                    log.info(f"  [BigC] Page {page}: {len(items)} items")

                    for item in items:
                        name = item.get("name", item.get("title", item.get("product_name", "")))
                        if not name:
                            continue
                        price = float(item.get("price", item.get("sell_price", item.get("selling_price", 0))))
                        if price <= 0:
                            continue

                        original_price = float(item.get("original_price", item.get("was_price", item.get("compare_price", 0))))
                        discount = round(original_price - price, 2) if original_price > price else None

                        image_url = (
                            item.get("image_url") or
                            item.get("image") or
                            item.get("thumbnail") or
                            (item.get("images", [None])[0] if item.get("images") else None)
                        )

                        products.append(ScrapedGoods(
                            goods_id=str(item.get("sku", item.get("product_id", item.get("id", "")))),
                            goods_name=name,
                            price_per_piece=price,
                            discount=discount,
                            images_url=image_url,
                            get_web_url=item.get("url", item.get("product_url", "")),
                            record_dateTime=now_iso,
                            group_name=item.get("category_name", item.get("category", "BigC")),
                        ))
                else:
                    log.error(f"  [BigC] HTTP {resp.status_code}: {resp.text[:200]}")
                    break
            except Exception as e:
                log.error(f"  [BigC] Error: {e}")
                break

            page += 1
            time.sleep(0.5)

        return products[:limit]


# ============================================================
#  Provider Registry
# ============================================================

PROVIDERS = {
    "lnwshop": LnwShopAPI,
    "shopee": ShopeeAPI,
    "lazada": LazadaAPI,
    "bigc": BigCAPI,
}


# ============================================================
#  Demo Data (simulate API responses)
# ============================================================

def demo_lnwshop() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("LNW-API-001", "ปากกา Parker IM Ballpoint", 890, 100, "https://myshop.lnwshop.com/img/parker-im.jpg", "https://myshop.lnwshop.com/product/1", now, "เครื่องเขียน"),
        ScrapedGoods("LNW-API-002", "กระเป๋าเอกสาร Samsonite", 2490, 300, "https://myshop.lnwshop.com/img/samsonite.jpg", "https://myshop.lnwshop.com/product/2", now, "กระเป๋า"),
        ScrapedGoods("LNW-API-003", "แท่นชาร์จ Anker 65W GaN", 1290, 150, "https://myshop.lnwshop.com/img/anker-65w.jpg", "https://myshop.lnwshop.com/product/3", now, "อุปกรณ์ไอที"),
        ScrapedGoods("LNW-API-004", "สายชาร์จ USB-C to C 2m", 290, None, "https://myshop.lnwshop.com/img/usbc-cable.jpg", "https://myshop.lnwshop.com/product/4", now, "อุปกรณ์ไอที"),
    ]


def demo_shopee() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("SPE-API-001", "เครื่องพิมพ์ HP Smart Tank 515 WiFi", 4990, 500, "https://shopee.co.th/img/hp-515.jpg", "https://shopee.co.th/product/shop1/i001", now, "เครื่องพิมพ์"),
        ScrapedGoods("SPE-API-002", "กระดาษ A4 Navigator 80g (5 รีม)", 850, 50, "https://shopee.co.th/img/navigator-5ream.jpg", "https://shopee.co.th/product/shop1/i002", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("SPE-API-003", "หมึกเติม Epson 003 แท้ 4 สี", 920, 80, "https://shopee.co.th/img/epson-003.jpg", "https://shopee.co.th/product/shop1/i003", now, "หมึกพิมพ์"),
        ScrapedGoods("SPE-API-004", "แฟ้มซอง A4 สีใส (20 ซอง)", 89, 10, "https://shopee.co.th/img/folder-clear.jpg", "https://shopee.co.th/product/shop1/i004", now, "อุปกรณ์สำนักงาน"),
        ScrapedGoods("SPE-API-005", "เครื่องเย็บกระดาษ SDI Heavy Duty", 350, 40, "https://shopee.co.th/img/stapler-sdi.jpg", "https://shopee.co.th/product/shop1/i005", now, "อุปกรณ์สำนักงาน"),
    ]


def demo_lazada() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("LZD-API-001", "โต๊ะทำงาน L-Shape 150x120cm", 5990, 800, "https://lazada.co.th/img/desk-lshape.jpg", "https://www.lazada.co.th/products/i2001.html", now, "เฟอร์นิเจอร์"),
        ScrapedGoods("LZD-API-002", "เก้าอี้สำนักงาน Ergonomic Pro", 8990, 1500, "https://lazada.co.th/img/chair-ergo.jpg", "https://www.lazada.co.th/products/i2002.html", now, "เฟอร์นิเจอร์"),
        ScrapedGoods("LZD-API-003", "ชั้นวางหนังสือ 5 ชั้น ไม้จริง", 2490, 300, "https://lazada.co.th/img/shelf-5tier.jpg", "https://www.lazada.co.th/products/i2003.html", now, "เฟอร์นิเจอร์"),
        ScrapedGoods("LZD-API-004", "ไวท์บอร์ด 90x120cm พร้อมขาตั้ง", 1590, 200, "https://lazada.co.th/img/whiteboard.jpg", "https://www.lazada.co.th/products/i2004.html", now, "อุปกรณ์สำนักงาน"),
    ]


def demo_bigc() -> list[ScrapedGoods]:
    now = datetime.now().isoformat()
    return [
        ScrapedGoods("BC-API-001", "น้ำยาล้างจาน Sunlight 900ml", 69, 10, "https://bigc.co.th/img/sunlight-900.jpg", "https://www.bigc.co.th/product/sunlight-900", now, "ของใช้สำนักงาน"),
        ScrapedGoods("BC-API-002", "กระดาษทิชชู่ Scott 24 ม้วน", 259, 30, "https://bigc.co.th/img/scott-24.jpg", "https://www.bigc.co.th/product/scott-tissue-24", now, "ของใช้สำนักงาน"),
        ScrapedGoods("BC-API-003", "ถ่าน Panasonic Eneloop AA 4 ก้อน", 450, 50, "https://bigc.co.th/img/eneloop-aa4.jpg", "https://www.bigc.co.th/product/eneloop-aa-4", now, "อุปกรณ์ไฟฟ้า"),
        ScrapedGoods("BC-API-004", "แอลกอฮอล์เจล Dettol 500ml", 149, 20, "https://bigc.co.th/img/dettol-gel.jpg", "https://www.bigc.co.th/product/dettol-gel-500", now, "ของใช้สำนักงาน"),
    ]


DEMO_DATA = {
    "lnwshop": demo_lnwshop,
    "shopee": demo_shopee,
    "lazada": demo_lazada,
    "bigc": demo_bigc,
}


# ============================================================
#  API Sender (same as scrape_products.py)
# ============================================================

def send_to_api(
    products: list[ScrapedGoods],
    skip_duplicates: bool = True,
    match_by: str = "name",
    batch_size: int = 50,
) -> dict:
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
    hdr = f"{'goods_id':>15s}  {'goods_name':<30s}  {'group':<15s}  {'price':>10s}  {'discount':>8s}  {'src':>5s}"
    log.info(hdr)
    log.info("-" * len(hdr))
    for p in products[:limit]:
        log.info(
            f"{(p.goods_id or '-'):>15s}  "
            f"{p.goods_name[:30]:<30s}  "
            f"{(p.group_name or '-')[:15]:<15s}  "
            f"{p.price_per_piece:>10,.2f}  "
            f"{(f'{p.discount:,.0f}' if p.discount else '-'):>8s}  "
            f"{'API':>5s}"
        )
    if len(products) > limit:
        log.info(f"  ... and {len(products) - limit} more")


def print_status():
    """Show configuration status of all API providers."""
    log.info("=" * 60)
    log.info("  API Provider Status")
    log.info("=" * 60)
    for name, cls in PROVIDERS.items():
        instance = cls()
        status = "✓ Configured" if instance.is_configured else "✗ Not configured"
        log.info(f"  {name:12s}  {status}")
    log.info("=" * 60)


# ============================================================
#  CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="AccNextGen — Product API Fetcher (Official Open APIs)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Feature 2: Get Goods from Official APIs

Supported sources:
  lnwshop   — LnwShop Open API (https://docs.open.lnwshop.com/)
  shopee    — Shopee Open Platform (https://open.shopee.com/)
  lazada    — Lazada Seller Center API (https://open.lazada.com/)
  bigc      — BigC OSX API (https://bgcd-osxapi.bigc.co.th/)
  all       — Fetch from all configured sources

Demo mode (no API keys needed):
  demo-lnwshop, demo-shopee, demo-lazada, demo-bigc

Examples:
  python api_products.py --source lnwshop
  python api_products.py --source shopee --keyword "printer"
  python api_products.py --source lazada --filter live --limit 50
  python api_products.py --source all
  python api_products.py --source demo-shopee --dry-run
  python api_products.py --status
"""
    )

    parser.add_argument("--source", default=None,
                        help="API source: lnwshop, shopee, lazada, bigc, all, demo-*")
    parser.add_argument("--keyword", default="", help="Search keyword")
    parser.add_argument("--filter", default="all", help="Product filter (Lazada: all/live/inactive)")
    parser.add_argument("--limit", type=int, default=100, help="Max products to fetch")
    parser.add_argument("--skip-duplicates", action="store_true", default=True)
    parser.add_argument("--update-existing", action="store_true", default=False)
    parser.add_argument("--match-by", default="name", choices=["name", "sku"])
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--api-url", default=None, help="Override AccNextGen API URL")
    parser.add_argument("--output-json", help="Save raw data to JSON")
    parser.add_argument("--status", action="store_true", help="Show API configuration status")

    args = parser.parse_args()

    global IMPORT_ENDPOINT
    if args.api_url:
        IMPORT_ENDPOINT = f"{args.api_url}/api/products/import"

    # Status check
    if args.status:
        print_status()
        return

    if not args.source:
        parser.error("--source is required (lnwshop/shopee/lazada/bigc/all/demo-*)")

    products: list[ScrapedGoods] = []

    # Demo mode
    if args.source.startswith("demo-"):
        demo_name = args.source.replace("demo-", "")
        if demo_name in DEMO_DATA:
            log.info(f"Generating demo API data: {demo_name}")
            products = DEMO_DATA[demo_name]()
        else:
            log.error(f"Unknown demo source: {demo_name}. Available: {', '.join(DEMO_DATA.keys())}")
            sys.exit(1)

    # All configured sources
    elif args.source == "all":
        for name, cls in PROVIDERS.items():
            instance = cls()
            if instance.is_configured:
                log.info(f"\n{'='*40} {name.upper()} {'='*40}")
                fetched = instance.fetch_products(keyword=args.keyword, limit=args.limit)
                products.extend(fetched)
                log.info(f"  {name}: {len(fetched)} products fetched")
            else:
                log.info(f"  {name}: Skipped (not configured)")

    # Single source
    elif args.source in PROVIDERS:
        cls = PROVIDERS[args.source]
        instance = cls()
        if not instance.is_configured:
            log.error(f"[{args.source}] Not configured. Check .env file.")
            print_status()
            sys.exit(1)
        log.info(f"Fetching from: {args.source}")
        if args.source == "lazada":
            products = instance.fetch_products(keyword=args.keyword, limit=args.limit, filter_status=args.filter)
        else:
            products = instance.fetch_products(keyword=args.keyword, limit=args.limit)

    else:
        log.error(f"Unknown source: {args.source}")
        log.info(f"Available: {', '.join(PROVIDERS.keys())}, all, demo-*")
        sys.exit(1)

    # Output
    if not products:
        log.warning("No products found.")
        sys.exit(0)

    log.info(f"\n{'='*60}")
    log.info(f"  Total products fetched via API: {len(products)}")
    log.info(f"{'='*60}")
    print_table(products)

    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump([p.to_raw_dict() for p in products], f, ensure_ascii=False, indent=2)
        log.info(f"\nSaved to {args.output_json}")

    if args.dry_run:
        log.info("\n[DRY RUN] — no data sent to API.")
        return

    results = send_to_api(
        products,
        skip_duplicates=not args.update_existing,
        match_by=args.match_by,
    )

    log.info(f"\n{'='*60}")
    log.info(f"  IMPORT RESULTS")
    log.info(f"{'='*60}")
    log.info(f"  Imported : {results['imported']}")
    log.info(f"  Skipped  : {results['skipped']}")
    log.info(f"  Updated  : {results['updated']}")
    log.info(f"  Errors   : {len(results['errors'])}")


if __name__ == "__main__":
    main()
