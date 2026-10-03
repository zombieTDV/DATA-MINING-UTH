"""Filesystem object store for running the same ingestion flow without R2."""

import datetime
import json
from pathlib import Path, PurePosixPath

from src.utils.hasher import compute_sha256


class LocalObjectStore:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.bucket_name = "local"

    def _path(self, key):
        key_path = PurePosixPath(key)
        if key_path.is_absolute() or ".." in key_path.parts or not key_path.parts:
            raise ValueError("Object key must be a relative path without traversal")
        target = self.root.joinpath(*key_path.parts).resolve()
        if not target.is_relative_to(self.root):
            raise ValueError("Object key escapes local root")
        return target

    def object_exists(self, key):
        return self._path(key).is_file()

    def upload_bytes(self, data, key, content_type=None, metadata=None):
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        digest = compute_sha256(data)
        if key.startswith("bronze/"):
            if path.exists():
                if compute_sha256(path) != digest:
                    raise FileExistsError(
                        "Immutable Bronze object already exists with different contents"
                    )
            else:
                with path.open("xb") as file:
                    file.write(data)
        else:
            temporary = path.with_suffix(path.suffix + ".tmp")
            temporary.write_bytes(data)
            temporary.replace(path)
        manifest = self.root / "_manifests" / (compute_sha256(key.encode()) + ".json")
        manifest.parent.mkdir(parents=True, exist_ok=True)
        manifest.write_text(
            json.dumps(
                {
                    "key": key,
                    "sha256": digest,
                    "size_bytes": len(data),
                    "content_type": content_type,
                    "metadata": metadata or {},
                },
                indent=2,
            )
        )
        return {
            "bucket": self.bucket_name,
            "key": key,
            "uri": path.as_uri(),
            "size_bytes": len(data),
            "sha256": digest,
        }

    def upload_text(self, text, key, content_type=None, metadata=None):
        return self.upload_bytes(text.encode("utf-8"), key, content_type, metadata)

    def upload_json(self, payload, key, metadata=None):
        return self.upload_text(
            json.dumps(payload, ensure_ascii=False, indent=2), key, "application/json", metadata
        )

    def upload_file(self, file_path, key, content_type=None):
        return self.upload_bytes(Path(file_path).read_bytes(), key, content_type)

    def get_text(self, key):
        return self._path(key).read_text(encoding="utf-8")

    def get_json(self, key):
        return json.loads(self.get_text(key))

    def list_objects(self, prefix="", max_keys=None):
        objects = []
        for path in sorted(self.root.rglob("*")):
            if path.is_file():
                key = path.relative_to(self.root).as_posix()
                if key.startswith(prefix) and not key.startswith("_manifests/"):
                    objects.append(
                        {
                            "key": key,
                            "size": path.stat().st_size,
                            "last_modified": datetime.datetime.fromtimestamp(
                                path.stat().st_mtime, datetime.timezone.utc
                            ).isoformat(),
                        }
                    )
        return objects if max_keys is None else objects[:max_keys]
