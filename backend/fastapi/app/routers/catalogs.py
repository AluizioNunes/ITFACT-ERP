from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
import os
from pathlib import Path
from pymongo import MongoClient
from bson import ObjectId

router = APIRouter()


def get_mongo():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    mongo_db_name = os.getenv("MONGO_DB", "erp")
    client = MongoClient(mongo_url)
    db = client[mongo_db_name]
    return client, db


def get_local_base() -> Path:
    base = os.getenv("LOCAL_EXTRACTED_DATA_PATH")
    if base:
        return Path(base)
    # Fallback: relative path when running outside container
    return Path(__file__).resolve().parents[2] / "extracted_data"


@router.get("/db/summary")
def db_summary():
    client, db = get_mongo()
    try:
        products = db["products"].count_documents({})
        pdfs = db["fs.files"].count_documents({"metadata.type": "pdf"})
        images = db["fs.files"].count_documents({"metadata.type": "image"})
        return {"products": products, "pdfs": pdfs, "images": images}
    finally:
        client.close()


@router.get("/db/products")
def db_products(limit: int = Query(50, ge=1, le=200), skip: int = Query(0, ge=0)):
    client, db = get_mongo()
    try:
        cursor = db["products"].find({}, {
            "manufacturer": 1,
            "pdf_source": 1,
            "pdf_name": 1,
            "pdf_url": 1,
            "pdf_file_id": 1,
            "page": 1,
            "table_index": 1,
            "row_index": 1,
        }).skip(skip).limit(limit)
        items = []
        for doc in cursor:
            doc["_id"] = str(doc.get("_id"))
            if doc.get("pdf_file_id"):
                doc["pdf_file_id"] = str(doc.get("pdf_file_id"))
            items.append(doc)
        return {"items": items, "limit": limit, "skip": skip}
    finally:
        client.close()


@router.get("/db/files")
def db_files(type: Optional[str] = Query(None, pattern="^(pdf|image)$"), limit: int = Query(50, ge=1, le=200), skip: int = Query(0, ge=0)):
    client, db = get_mongo()
    try:
        q = {}
        if type:
            q = {"metadata.type": type}
        cursor = db["fs.files"].find(q, {
            "filename": 1,
            "length": 1,
            "uploadDate": 1,
            "metadata": 1,
        }).skip(skip).limit(limit).sort("uploadDate", -1)
        items = []
        for f in cursor:
            items.append({
                "_id": str(f.get("_id")),
                "filename": f.get("filename"),
                "length": f.get("length"),
                "uploadDate": f.get("uploadDate"),
                "metadata": f.get("metadata", {}),
            })
        return {"items": items, "limit": limit, "skip": skip}
    finally:
        client.close()


@router.get("/db/file/{file_id}")
def db_file(file_id: str):
    client, db = get_mongo()
    try:
        fs_files = db["fs.files"]
        meta = fs_files.find_one({"_id": ObjectId(file_id)})
        if not meta:
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
        bucket = db["fs.chunks"]
        # Stream via GridFS using pymongo's GridFS API
        from gridfs import GridFS
        fs = GridFS(db)
        grid_out = fs.get(ObjectId(file_id))
        content_type = "application/pdf" if meta.get("metadata", {}).get("type") == "pdf" else "image/jpeg"
        headers = {"Content-Disposition": f"inline; filename={meta.get('filename')}"}
        return StreamingResponse(grid_out, media_type=content_type, headers=headers)
    finally:
        client.close()


@router.get("/local/summary")
def local_summary():
    base = get_local_base()
    pdfs_dir = base / "pdfs"
    imgs_dir = base / "images"
    sheets_dir = base / "spreadsheets"
    def count_files(p: Path) -> int:
        return sum(1 for _ in p.glob("**/*") if _.is_file()) if p.exists() else 0
    return {
        "pdfs": count_files(pdfs_dir),
        "images": count_files(imgs_dir),
        "spreadsheets": count_files(sheets_dir),
        "base": str(base),
    }


@router.get("/local/list")
def local_list(type: str = Query(..., pattern="^(pdfs|images|spreadsheets)$"), limit: int = Query(100, ge=1, le=500), skip: int = Query(0, ge=0)):
    base = get_local_base()
    dir_map = {
        "pdfs": base / "pdfs",
        "images": base / "images",
        "spreadsheets": base / "spreadsheets",
    }
    target = dir_map[type]
    if not target.exists():
        return {"items": [], "limit": limit, "skip": skip}
    all_files = [p for p in target.glob("**/*") if p.is_file()]
    sliced = all_files[skip:skip+limit]
    items = []
    for p in sliced:
        try:
            stat = p.stat()
            items.append({
                "name": p.name,
                "relpath": str(p.relative_to(base)),
                "size": stat.st_size,
                "mtime": stat.st_mtime,
            })
        except Exception:
            pass
    return {"items": items, "limit": limit, "skip": skip}


@router.get("/local/file")
def local_file(type: str = Query(..., pattern="^(pdfs|images|spreadsheets)$"), name: str = Query(...)):
    base = get_local_base()
    target = base / type / name
    if not target.exists() or not target.is_file():
        # allow nested relpath
        alt = base / name
        if not alt.exists() or not alt.is_file():
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
        target = alt
    media = "application/pdf" if type == "pdfs" else ("image/jpeg" if type == "images" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers = {"Content-Disposition": f"inline; filename={target.name}"}
    return StreamingResponse(open(target, "rb"), media_type=media, headers=headers)