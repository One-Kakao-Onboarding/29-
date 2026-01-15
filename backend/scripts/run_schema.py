#!/usr/bin/env python3
"""
Supabase 스키마 실행 스크립트
Supabase Management API를 사용하여 SQL을 실행합니다.
"""
import os
import sys
from pathlib import Path

try:
    import httpx
except ImportError:
    os.system("pip install httpx")
    import httpx


def run_schema():
    """init_schema.sql 파일을 Supabase에서 실행합니다."""

    # Supabase 설정
    project_ref = "fvlanbsclsewkfypomlr"
    access_token = os.getenv("SUPABASE_ACCESS_TOKEN")

    if not access_token:
        print("Error: SUPABASE_ACCESS_TOKEN environment variable is required")
        print("Set it using: source ~/.claude/deploy-config.sh")
        sys.exit(1)

    # SQL 파일 읽기
    schema_path = Path(__file__).parent / "init_schema.sql"
    if not schema_path.exists():
        print(f"Error: Schema file not found: {schema_path}")
        sys.exit(1)

    sql_content = schema_path.read_text()

    print("=" * 60)
    print("Supabase Schema Execution")
    print("=" * 60)
    print(f"\nProject: {project_ref}")
    print("Executing SQL...\n")

    # Supabase Management API를 통해 SQL 실행
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(
            url,
            headers=headers,
            json={"query": sql_content},
            timeout=60.0,
        )

        if response.status_code == 200 or response.status_code == 201:
            print("✅ Schema executed successfully!")
            result = response.json()
            if result:
                print(f"\nResult: {result}")
        else:
            print(f"❌ Error executing schema: {response.status_code}")
            print(f"Response: {response.text}")

            # 실패 시 수동 실행 안내
            print("\n" + "=" * 60)
            print("Manual execution instructions:")
            print("=" * 60)
            print("1. Go to https://supabase.com/dashboard")
            print(f"2. Select project: 29jo ({project_ref})")
            print("3. Go to SQL Editor")
            print("4. Copy and run the SQL from:")
            print(f"   {schema_path}")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nPlease run the schema manually in Supabase Dashboard")


if __name__ == "__main__":
    run_schema()
