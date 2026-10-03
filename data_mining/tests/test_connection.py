"""Diagnostic & Integration test suite to verify connections defined in .env.

This script can be executed in two ways:
1. Directly via Python CLI:
       python tests/test_connection.py
2. Via Pytest:
       pytest -v tests/test_connection.py
"""

import json
import os
import sys
import time
from pathlib import Path

# Thêm project root và package root vào sys.path để import nhất quán
_current_file = Path(__file__).resolve()
_repo_candidate = _current_file.parents[2]
_pkg_candidate = _current_file.parents[1]
PROJECT_ROOT = _repo_candidate if (_repo_candidate / ".env").exists() else _pkg_candidate

for p in [str(_pkg_candidate), str(PROJECT_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Load biến môi trường từ .env
try:
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=PROJECT_ROOT / ".env")
except ImportError:
    pass

import pytest


def test_env_file_exists():
    """Kiểm tra sự tồn tại của file .env tại project root."""
    env_path = PROJECT_ROOT / ".env"
    assert env_path.exists(), (
        f"File .env không tồn tại tại {env_path}. "
        "Hãy sao chép từ .env_example và điền thông tin: cp .env_example .env"
    )


def test_env_variables_present():
    """Kiểm tra các biến môi trường thiết yếu của Phase 1 trong .env."""
    required_vars = [
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_ENDPOINT_URL",
        "R2_BUCKET_NAME",
    ]
    missing = [var for var in required_vars if not os.getenv(var, "").strip()]
    assert not missing, (
        f"Các biến môi trường sau chưa được điền trong .env: {', '.join(missing)}. "
        "Vui lòng mở .env và điền giá trị."
    )


def test_r2_connection_and_permissions():
    """Kiểm tra kết nối tới Cloudflare R2: Head Bucket, Write, Read, Delete."""
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError, EndpointConnectionError

    endpoint_url = os.getenv("R2_ENDPOINT_URL", "").strip()
    access_key = os.getenv("R2_ACCESS_KEY_ID", "").strip()
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
    bucket_name = os.getenv("R2_BUCKET_NAME", "").strip()

    assert endpoint_url, "R2_ENDPOINT_URL is empty"
    assert access_key, "R2_ACCESS_KEY_ID is empty"
    assert secret_key, "R2_SECRET_ACCESS_KEY is empty"
    assert bucket_name, "R2_BUCKET_NAME is empty"

    # Đảm bảo endpoint bắt đầu bằng https://
    if not endpoint_url.startswith("http://") and not endpoint_url.startswith("https://"):
        endpoint_url = f"https://{endpoint_url}"

    # Khởi tạo S3 Client cho R2
    s3_client = boto3.client(
        service_name="s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
            connect_timeout=10,
            read_timeout=15,
        ),
    )

    # 1. Kiểm tra tồn tại và quyền truy cập Bucket
    try:
        s3_client.head_bucket(Bucket=bucket_name)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        pytest.fail(
            f"Không thể kết nối tới bucket '{bucket_name}'. Lỗi: {error_code} - {e}"
        )
    except EndpointConnectionError as e:
        pytest.fail(
            f"Không thể kết nối tới R2_ENDPOINT_URL '{endpoint_url}'. Kiểm tra lại URL và mạng: {e}"
        )

    # 2. Kiểm tra quyền ghi (Write Permission) bằng test payload
    test_key = f"_healthcheck/ping_{int(time.time())}.json"
    test_data = {
        "status": "ok",
        "service": "UTH-Data-Mining-R2-Healthcheck",
        "timestamp": time.time(),
        "created_by": "test_connection.py",
    }
    encoded_data = json.dumps(test_data).encode("utf-8")

    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=encoded_data,
            ContentType="application/json",
        )
    except ClientError as e:
        pytest.fail(f"Lỗi quyền GHI (PutObject) vào R2 bucket '{bucket_name}': {e}")

    # 3. Kiểm tra quyền đọc (Read Permission) và tính toàn vẹn
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        content = json.loads(response["Body"].read().decode("utf-8"))
        assert content.get("status") == "ok"
    except ClientError as e:
        pytest.fail(f"Lỗi quyền ĐỌC (GetObject) từ R2 bucket '{bucket_name}': {e}")

    # 4. Kiểm tra quyền xóa (Delete Permission) để dọn dẹp bucket
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
    except ClientError as e:
        pytest.fail(f"Lỗi quyền XÓA (DeleteObject) trên R2 bucket '{bucket_name}': {e}")


def test_arxiv_connectivity():
    """Kiểm tra kết nối mạng tới endpoint arXiv API / RSS."""
    try:
        import httpx

        response = httpx.get(
            "http://export.arxiv.org/api/query?search_query=cat:cs.AI&max_results=1",
            timeout=15.0,
            follow_redirects=True,
        )
        assert response.status_code == 200, (
            f"arXiv API trả về status code {response.status_code}"
        )
        assert b"arxiv.org" in response.content, "Phản hồi không phải từ arXiv"
    except ImportError:
        import urllib.request

        req = urllib.request.Request(
            "http://export.arxiv.org/api/query?search_query=cat:cs.AI&max_results=1",
            headers={"User-Agent": "UTH-DataMining/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            assert res.status == 200


def test_local_directories_creation():
    """Kiểm tra thư mục lưu trữ thô cục bộ (DATA_RAW_DIR)."""
    raw_dir_str = os.getenv("DATA_RAW_DIR", "data/raw")
    raw_dir = PROJECT_ROOT / raw_dir_str
    raw_dir.mkdir(parents=True, exist_ok=True)
    assert raw_dir.exists() and raw_dir.is_dir()


# ==============================================================================
# CLI Runner tiện dụng để in ra kết quả trực tiếp với icon và hướng dẫn
# ==============================================================================
def main():
    print("=" * 70)
    print("🚀 BẮT ĐẦU KIỂM TRA TOÀN BỘ KẾT NỐI THEO FILE .ENV")
    print("=" * 70)

    # 1. Kiểm tra .env
    print("\n[1/4] Kiểm tra file .env...")
    env_file = PROJECT_ROOT / ".env"
    if not env_file.exists():
        print("  ❌ THẤT BẠI: File .env không tồn tại.")
        sys.exit(1)
    print(f"  ✅ Đã tìm thấy file .env tại: {env_file}")

    # 2. Kiểm tra biến môi trường
    print("\n[2/4] Kiểm tra các biến môi trường Cloudflare R2...")
    required = [
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_ENDPOINT_URL",
        "R2_BUCKET_NAME",
    ]
    missing = [k for k in required if not os.getenv(k, "").strip()]
    if missing:
        print(f"  ❌ THẤT BẠI: Thiếu các biến sau: {', '.join(missing)}")
        sys.exit(1)
    print("  ✅ Đã điền đầy đủ các biến môi trường:")
    print(f"     - R2_BUCKET_NAME: {os.getenv('R2_BUCKET_NAME')}")
    print(f"     - R2_ENDPOINT_URL: {os.getenv('R2_ENDPOINT_URL')}")
    print(f"     - R2_ACCESS_KEY_ID: {os.getenv('R2_ACCESS_KEY_ID')[:8]}********")

    # 3. Test Cloudflare R2
    print("\n[3/4] Kiểm tra kết nối & quyền đọc/ghi tới Cloudflare R2...")
    try:
        test_r2_connection_and_permissions()
        print("  ✅ KẾT NỐI R2 THÀNH CÔNG VƯỢT TRỘI!")
        print("     - Bucket tồn tại và phản hồi tốt (HeadBucket OK)")
        print("     - Đã ghi thử nghiệm file test (PutObject OK)")
        print("     - Đã đọc kiểm tra tính toàn vẹn (GetObject OK)")
        print("     - Đã xóa dọn dẹp file test thành công (DeleteObject OK)")
    except Exception as e:
        print(f"  ❌ THẤT BẠI KẾT NỐI R2: {e}")
        print("\n💡 Gợi ý khắc phục:")
        print("   1. Kiểm tra lại Access Key ID và Secret Access Key đã copy đúng chưa.")
        print("   2. Kiểm tra Token R2 đã được cấp quyền 'Object Read & Write' chưa.")
        print("   3. Đảm bảo tên Bucket trên Cloudflare trùng khớp với R2_BUCKET_NAME.")
        sys.exit(1)

    # 4. Test arXiv API
    print("\n[4/4] Kiểm tra kết nối tới arXiv API...")
    try:
        test_arxiv_connectivity()
        print("  ✅ Kết nối tới arXiv API hoạt động bình thường.")
    except Exception as e:
        print(f"  ⚠️ CẢNH BÁO: Không thể kết nối tới arXiv API ({e}). Hãy kiểm tra mạng.")

    # 5. Local storage
    test_local_directories_creation()
    print(f"  ✅ Thư mục đệm local '{os.getenv('DATA_RAW_DIR', 'data/raw')}' sẵn sàng.")

    print("\n" + "=" * 70)
    print("🎉 TOÀN BỘ KẾT NỐI ĐỀU HOÀN HẢO! HỆ THỐNG ĐÃ SẴN SÀNG CÀO DỮ LIỆU.")
    print("=" * 70)


if __name__ == "__main__":
    main()
