#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从公司通讯录 Excel 导入全国省区与中心主数据。
输出：data/provinces.json、data/centers.json、data/provinces_centers.csv
"""

import json
import csv
import os
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("请先安装 openpyxl: pip install openpyxl")
    exit(1)

# 项目根目录（脚本在 scripts/ 下）
ROOT = Path(__file__).resolve().parent.parent
EXCEL_PATH = ROOT / "公司通讯录（260319）.xlsx"
DATA_DIR = ROOT / "data"

# Excel 列索引（表头第 3 行，0-based）
COL_南北中 = 2   # 第一列「南北中」用于省区归属
COL_省公司片区 = 3
COL_级别1 = 4
COL_转运中心名称 = 5
COL_南北中2 = 6
COL_简称 = 7
COL_级别2 = 8
COL_属性 = 9
COL_经理负责人 = 10
COL_电话 = 11
COL_副经理 = 12
COL_电话2 = 13
COL_地址 = 14
COL_类型 = 15
COL_省区 = 16
COL_运营负责人 = 17
COL_分区名称 = 18


def safe_str(v):
    if v is None:
        return ""
    s = str(v).strip()
    return s if s and s != "-" else ""


def load_excel(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sh = wb.active
    rows = list(sh.iter_rows(values_only=True))
    wb.close()
    return rows


def parse_rows(rows):
    """表头第 3 行(索引2)，数据从第 4 行(索引3)开始"""
    if len(rows) < 4:
        return [], []
    data_rows = []
    for r in rows[3:]:
        if r[0] is None or (isinstance(r[0], str) and not r[0].strip()):
            continue
        data_rows.append(r)
    return data_rows


def extract_provinces(data_rows):
    """省区去重，保留顺序；带南北部（北/南/中）"""
    seen = set()
    provinces = []
    for r in data_rows:
        prov = safe_str(r[COL_省区]) if len(r) > COL_省区 else ""
        if not prov or prov in seen:
            continue
        seen.add(prov)
        ns = safe_str(r[COL_南北中]) if len(r) > COL_南北中 else ""
        north_south = "北部" if ns == "北" else ("南部" if ns == "南" else "中部")
        partition = safe_str(r[COL_分区名称]) if len(r) > COL_分区名称 else ""
        op_manager = safe_str(r[COL_运营负责人]) if len(r) > COL_运营负责人 else ""
        provinces.append({
            "code": f"P{len(provinces)+1:02d}",
            "name": prov,
            "northSouth": north_south,
            "partitionName": partition or prov,
            "operationManager": op_manager,
        })
    return provinces


def extract_centers(data_rows, province_name_to_code):
    centers = []
    for i, r in enumerate(data_rows):
        prov = safe_str(r[COL_省区]) if len(r) > COL_省区 else ""
        name = safe_str(r[COL_转运中心名称]) if len(r) > COL_转运中心名称 else ""
        short = safe_str(r[COL_简称]) if len(r) > COL_简称 else ""
        if not name and not short:
            continue
        typ = safe_str(r[COL_类型]) if len(r) > COL_类型 else ""
        level = safe_str(r[COL_级别2]) if len(r) > COL_级别2 else ""
        attr = safe_str(r[COL_属性]) if len(r) > COL_属性 else ""
        manager = safe_str(r[COL_经理负责人]) if len(r) > COL_经理负责人 else ""
        phone = r[COL_电话] if len(r) > COL_电话 else None
        if isinstance(phone, (int, float)):
            phone = str(int(phone)) if phone == int(phone) else str(phone)
        else:
            phone = safe_str(phone)
        addr = safe_str(r[COL_地址]) if len(r) > COL_地址 else ""
        province_code = province_name_to_code.get(prov, "")

        centers.append({
            "code": f"C{i+1:03d}",  # 可后续改为正式编码
            "name": name or short,
            "shortName": short or name,
            "provinceCode": province_code,
            "provinceName": prov,
            "type": typ,
            "level": level,
            "attribute": attr,
            "manager": manager,
            "phone": phone,
            "address": addr,
        })
    return centers


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def write_csv(path, provinces, centers):
    path.parent.mkdir(parents=True, exist_ok=True)
    headers = [
        "省区编码", "省区名称", "分区名称", "运营负责人",
        "中心编码", "中心名称", "中心简称", "类型", "级别", "属性",
        "负责人", "电话", "地址"
    ]
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for c in centers:
            prov = next((p for p in provinces if p["name"] == c["provinceName"]), {})
            w.writerow([
                prov.get("code", ""),
                c["provinceName"],
                prov.get("partitionName", ""),
                prov.get("operationManager", ""),
                c["code"],
                c["name"],
                c["shortName"],
                c["type"],
                c["level"],
                c["attribute"],
                c["manager"],
                c["phone"],
                c["address"],
            ])


def main():
    if not EXCEL_PATH.exists():
        print(f"未找到文件: {EXCEL_PATH}")
        exit(1)
    rows = load_excel(EXCEL_PATH)
    data_rows = parse_rows(rows)
    if not data_rows:
        print("未解析到数据行")
        exit(1)

    provinces = extract_provinces(data_rows)
    province_name_to_code = {p["name"]: p["code"] for p in provinces}
    centers = extract_centers(data_rows, province_name_to_code)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    write_json(DATA_DIR / "provinces.json", provinces)
    write_json(DATA_DIR / "centers.json", centers)
    write_csv(DATA_DIR / "provinces_centers.csv", provinces, centers)

    # 同步到 platform/data 供前端使用（JSON + 内嵌 JS，避免 file:// 下 fetch 失败）
    platform_data = ROOT / "platform" / "data"
    platform_data.mkdir(parents=True, exist_ok=True)
    write_json(platform_data / "provinces.json", provinces)
    write_json(platform_data / "centers.json", centers)
    js_content = (
        "/* 省区与中心主数据，由 scripts/import_provinces_centers.py 从通讯录 Excel 生成 */\n"
        "window.LOCATION_PROVINCES = " + json.dumps(provinces, ensure_ascii=False) + ";\n"
        "window.LOCATION_CENTERS = " + json.dumps(centers, ensure_ascii=False) + ";\n"
    )
    (platform_data / "location-data.js").write_text(js_content, encoding="utf-8")

    print(f"导入完成：省区 {len(provinces)} 个，中心 {len(centers)} 个")
    print(f"  - {DATA_DIR / 'provinces.json'}")
    print(f"  - {DATA_DIR / 'centers.json'}")
    print(f"  - {DATA_DIR / 'provinces_centers.csv'}")
    print(f"  - {platform_data / 'provinces.json'} (前端)")
    print(f"  - {platform_data / 'centers.json'} (前端)")
    print(f"  - {platform_data / 'location-data.js'} (内嵌，本地打开可用)")


if __name__ == "__main__":
    main()
