"""Cloudflare R2 & Local Lakehouse Storage Inspection Tool.

Calculates real-time storage metrics:
- Total object count and volume in Bytes, MB, GB.
- Granular breakdown by Medallion Lakehouse Zone (Bronze, Silver, Gold).
- Capacity analysis against Cloudflare R2 Free Tier quota (10 GB/month).
- Local disk cache usage comparison.

Usage:
    ./.venv/bin/python tools/check_storage.py
"""

import sys
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple
from tabulate import tabulate

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.storage.r2_client import R2Client


def format_size(bytes_val: int) -> str:
    """Chuyen doi byte sang dinh dang de doc (Bytes, KB, MB, GB)."""
    if bytes_val < 1024:
        return f"{bytes_val} B"
    elif bytes_val < 1024 ** 2:
        return f"{bytes_val / 1024:.2f} KB"
    elif bytes_val < 1024 ** 3:
        return f"{bytes_val / (1024 ** 2):.2f} MB"
    else:
        return f"{bytes_val / (1024 ** 3):.3f} GB"


def get_dir_size(path: Path) -> Tuple[int, int]:
    """Tinh dung luong va so file trong thu muc local."""
    total_size = 0
    total_files = 0
    if not path.exists():
        return 0, 0
    for entry in path.rglob("*"):
        if entry.is_file():
            total_files += 1
            total_size += entry.stat().st_size
    return total_size, total_files


def inspect_r2_storage() -> Dict[str, Any]:
    """Quet toan bo bucket R2 de thong ke dung luong va so luong objects."""
    r2 = R2Client()
    s3_client = r2.s3
    bucket_name = r2.bucket_name

    paginator = s3_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket_name)

    total_objects = 0
    total_bytes = 0

    # Phan loai theo cac tang Medallion
    zones = {
        "bronze/arxiv/batches/": {"label": "Bronze: Batch Bundles (OAI JSON)", "count": 0, "bytes": 0},
        "bronze/arxiv/raw_html/": {"label": "Bronze: Raw Academic HTML5", "count": 0, "bytes": 0},
        "bronze/arxiv/raw_metadata/": {"label": "Bronze: Raw Metadata Individual", "count": 0, "bytes": 0},
        "silver/": {"label": "Silver: Structured Parquet Lakehouse", "count": 0, "bytes": 0},
        "gold/": {"label": "Gold: LanceDB Vector Table & Index", "count": 0, "bytes": 0},
        "other": {"label": "Other Objects / Uncategorized", "count": 0, "bytes": 0},
    }

    for page in pages:
        contents = page.get("Contents", [])
        for item in contents:
            total_objects += 1
            size = item.get("Size", 0)
            key = item.get("Key", "")
            total_bytes += size

            categorized = False
            for prefix in ["bronze/arxiv/batches/", "bronze/arxiv/raw_html/", "bronze/arxiv/raw_metadata/", "silver/", "gold/"]:
                if key.startswith(prefix):
                    zones[prefix]["count"] += 1
                    zones[prefix]["bytes"] += size
                    categorized = True
                    break

            if not categorized:
                zones["other"]["count"] += 1
                zones["other"]["bytes"] += size

    return {
        "bucket_name": bucket_name,
        "endpoint": settings.get_r2_endpoint(),
        "total_objects": total_objects,
        "total_bytes": total_bytes,
        "zones": zones,
    }


def main():
    print("=" * 80)
    print("[STORAGE AUDIT] KIEM TRA DUNG LUONG VA SUC CHUA CLOUDFLARE R2 & LOCAL")
    print("=" * 80)

    try:
        r2_data = inspect_r2_storage()
    except Exception as e:
        print(f"[ERROR] Khong the ket noi toi Cloudflare R2: {e}")
        sys.exit(1)

    bucket_name = r2_data["bucket_name"]
    total_objects = r2_data["total_objects"]
    total_bytes = r2_data["total_bytes"]
    total_gb = total_bytes / (1024 ** 3)
    free_tier_gb = 10.0
    free_tier_pct = (total_gb / free_tier_gb) * 100
    remaining_free_gb = max(0.0, free_tier_gb - total_gb)

    # 1. Tong quan Bucket
    print(f"\n[1] THONG TIN BUCKET R2:")
    print(f"    - Ten Bucket:         {bucket_name}")
    print(f"    - Endpoint R2:        {r2_data['endpoint']}")
    print(f"    - Tong so objects:    {total_objects:,} files")
    print(f"    - Tong dung luong:    {format_size(total_bytes)} ({total_gb:.4f} GB)")

    # 2. Chi tiet tung phan vung Medallion
    print(f"\n[2] PHAN BO DUNG LUONG THEO TANG (MEDALLION LAKEHOUSE):")
    zone_rows = []
    for k, v in r2_data["zones"].items():
        if v["count"] > 0:
            pct = (v["bytes"] / max(1, total_bytes)) * 100
            zone_rows.append([
                v["label"],
                f"{v['count']:,}",
                format_size(v["bytes"]),
                f"{pct:.1f}%",
            ])

    if zone_rows:
        print(tabulate(zone_rows, headers=["Phan vung (Zone)", "So objects", "Dung luong", "Ty le"], tablefmt="pipe"))
    else:
        print("    [NOTICE] Bucket hien dang trong (0 objects).")

    # 3. Danh gia suc chua va han muc Free Tier
    print(f"\n[3] SUC CHUA VA HAN MUC (CLOUDFLARE R2 QUOTA & CAPACITY):")
    quota_table = [
        ["Goi mien phi hang thang (Free Tier)", f"{free_tier_gb:.2f} GB", "10.00 GB mien phi tron doi moi thang"],
        ["Dung luong da su dung", f"{total_gb:.4f} GB", f"{free_tier_pct:.2f}% han muc mien phi"],
        ["Dung luong mien phi con lai", f"{remaining_free_gb:.4f} GB", "Dung tiep khong phat sinh phi"],
        ["Gioi han suc chua toi da (Max Capacity)", "Khong gioi han (Petabytes)", "Tu dong mo rong theo quy mo du lieu"],
        ["Phi vuot han muc (neu tren 10GB)", "$0.015 / GB / thang", "Khoang 380 VND / GB / thang"],
        ["Phi bang thong tai ve (Egress Fee)", "$0.00 / GB (Mien phi 100%)", "Khong ton tien khi doc/truy van du lieu"],
    ]
    print(tabulate(quota_table, headers=["Chi tieu", "Gia tri hien tai", "Ghi chu chinh sach"], tablefmt="pipe"))

    # 4. Kiem tra dung luong dia cuc bo (Local Cache)
    print(f"\n[4] DUNG LUONG LUU TRU CUC BO (LOCAL DISK CACHE):")
    local_paths = [
        ("data/raw/html", "Local Raw HTML Cache", settings.ROOT_DIR / "data" / "raw" / "html"),
        ("data/silver", "Local Silver Parquet", settings.ROOT_DIR / "data" / "silver"),
        ("data/gold/lancedb", "Local Gold LanceDB Vectors", settings.ROOT_DIR / "data" / "gold" / "lancedb"),
        ("logs", "Pipeline Logs", settings.ROOT_DIR / "logs"),
    ]
    local_rows = []
    total_local_bytes = 0
    total_local_files = 0
    for rel_path, desc, p in local_paths:
        sz, files = get_dir_size(p)
        total_local_bytes += sz
        total_local_files += files
        local_rows.append([desc, str(p.relative_to(settings.ROOT_DIR)), f"{files:,}", format_size(sz)])

    local_rows.append(["TONG CONG LOCAL", "data/ + logs/", f"{total_local_files:,}", format_size(total_local_bytes)])
    print(tabulate(local_rows, headers=["Thanh phan", "Duong dan", "So file", "Dung luong"], tablefmt="pipe"))

    print("\n" + "=" * 80)
    print("[KET LUAN]")
    if total_gb < free_tier_gb:
        print(f"  He thong dang su dung {total_gb:.4f} GB / {free_tier_gb} GB mien phi ({free_tier_pct:.2f}%).")
        print(f"  Ban con {remaining_free_gb:.4f} GB mien phi hoan toan tren Cloudflare R2.")
    else:
        print(f"  He thong da dung {total_gb:.4f} GB (vuot han muc mien phi {total_gb - free_tier_gb:.4f} GB).")
    print("=" * 80)


if __name__ == "__main__":
    main()
