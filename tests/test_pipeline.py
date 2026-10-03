"""Regression tests for lakehouse integrity and resumable ingestion."""

import json
from unittest.mock import Mock

import pyarrow.parquet as pq
import pytest

from src.config.settings import Settings
from src.indexing.chunker import AcademicChunker
from src.ingestion.arxiv_batch_harvester import ArxivBatchHarvester
from src.storage.duckdb_engine import DuckDBEngine
from src.transformation.html_parser import AcademicHTMLParser
from src.transformation.silver_writer import SilverLakehouseWriter


def test_settings_precedence_and_paths(tmp_path):
    env = tmp_path / ".env"
    env.write_text("R2_BUCKET_NAME=file-bucket\nARXIV_CATEGORIES=cs.AI,cs.AI,stat.ML\n")
    config = Settings(
        env_file=env, environ={"R2_BUCKET_NAME": "environment-bucket", "SILVER_DIR": str(tmp_path)}
    )
    assert config.R2_BUCKET_NAME == "environment-bucket"
    assert config.ARXIV_CATEGORIES == ["cs.AI", "stat.ML"]
    assert config.SILVER_DIR == tmp_path


@pytest.mark.parametrize("delay", ["-1", "0", "nan", "inf"])
def test_invalid_request_delay(delay):
    with pytest.raises(ValueError):
        Settings(env_file=None, environ={"ARXIV_REQUEST_DELAY_SECONDS": delay})


def test_endpoint_normalization():
    config = Settings(
        env_file=None, environ={"R2_ENDPOINT_URL": "example.r2.cloudflarestorage.com/"}
    )
    assert config.get_r2_endpoint() == "https://example.r2.cloudflarestorage.com"


def test_html_parser_without_optional_lxml():
    parsed = AcademicHTMLParser().parse(
        '<article><h1>Example</h1><section class="ltx_section"><h2>Methods</h2><p>A scientific method with sufficiently long descriptive text.</p></section></article>'
    )
    assert parsed["parsed_title"] == "Example"
    assert parsed["sections"][0]["section_type"] == "methodology"


def test_silver_partition_and_upsert(tmp_path):
    writer = SilverLakehouseWriter(local_only=True, local_silver_dir=tmp_path)
    records = [
        writer.prepare_record(
            {"paper_id": str(year), "title": "First", "published_date": f"{year}-01-01"}, {}
        )
        for year in [2024, 2025]
    ]
    result = writer.save_and_upload_parquet(records)
    assert len(result["partitions"]) == 2
    records[0]["title"] = "Updated"
    writer.save_and_upload_parquet([records[0], records[0]])
    table = pq.ParquetFile(tmp_path / "year=2024" / "papers.parquet").read()
    assert table.num_rows == 1
    assert table.column("title").to_pylist() == ["Updated"]
    with DuckDBEngine(silver_dir=tmp_path) as engine:
        assert len(engine.query_silver_local()) == 2
        assert not engine._remote_ready
        with pytest.raises(ValueError):
            engine.query_silver_local(-1)


def test_empty_silver(tmp_path):
    with DuckDBEngine(silver_dir=tmp_path) as engine, pytest.raises(FileNotFoundError):
        engine.query_silver_local()


def test_bounded_chunks_and_abstract_dedup():
    text = " ".join(f"word{i}" for i in range(131))
    paper = {
        "paper_id": "p",
        "abstract": "An abstract",
        "sections_json": json.dumps(
            [
                {"section_type": "abstract", "content": "An abstract"},
                {"section_type": "methodology", "content": text, "paragraphs": [text]},
            ]
        ),
    }
    chunks = AcademicChunker(max_chunk_words=30).chunk_paper(paper)
    assert sum(c["section_type"] == "abstract" for c in chunks) == 1
    assert all(c["word_count"] <= 30 for c in chunks)
    words = [c["text"] for c in chunks if c["section_type"] != "abstract"]
    assert " ".join(words) == text


def oai_record(index):
    return {
        "header": {},
        "metadata": {
            "arXiv": {
                "id": f"2501.{index:05d}",
                "title": f"Paper {index}",
                "abstract": "Test abstract",
                "authors": {"author": {"keyname": "Author"}},
                "categories": "cs.AI",
                "created": "2025-01-01",
            }
        },
    }


@pytest.fixture
def batch(tmp_path, monkeypatch):
    import src.ingestion.arxiv_batch_harvester as module

    r2 = Mock()
    r2.object_exists.return_value = False
    r2.upload_file.side_effect = lambda **kw: {
        "uri": "s3://fixture/" + kw["key"],
        "size_bytes": 1,
        "sha256": "fixture",
    }
    writer = SilverLakehouseWriter(r2_client=r2, local_silver_dir=tmp_path / "silver")
    monkeypatch.setattr(module, "SilverLakehouseWriter", lambda **kw: writer)
    harvester = ArxivBatchHarvester(
        r2_client=r2, checkpoint_dir=tmp_path / "checkpoints", request_delay=0
    )
    page = {
        "records_raw": [oai_record(i) for i in range(3)],
        "resumption_token": None,
        "raw_xml": "<fixture/>",
    }
    harvester.fetch_oai_page = Mock(return_value=page)
    yield harvester, r2, writer
    harvester.close()


def test_resume_partial_page_without_loss(batch):
    harvester, _, writer = batch
    assert harvester.harvest_large_corpus(total_target=1) == 1
    checkpoint = harvester.load_checkpoint()
    assert checkpoint["page_offset"] == 1
    assert not checkpoint["exhausted"]
    assert harvester.harvest_large_corpus(total_target=3) == 3
    table = pq.ParquetFile(writer.local_dir / "year=2025" / "papers.parquet").read()
    assert table.num_rows == 3
    assert harvester.load_checkpoint()["exhausted"]
    assert harvester.harvest_large_corpus(total_target=4) == 3
    assert harvester.fetch_oai_page.call_count == 2


def test_upload_failure_does_not_advance_checkpoint(batch):
    harvester, r2, _ = batch
    r2.upload_file.side_effect = RuntimeError("upload failed")
    with pytest.raises(RuntimeError, match="upload failed"):
        harvester.harvest_large_corpus(total_target=1)
    assert not harvester.checkpoint_file.exists()


def test_bronze_failure_stops_silver(batch):
    harvester, r2, writer = batch
    r2.upload_text.side_effect = RuntimeError("Bronze failed")
    with pytest.raises(RuntimeError, match="Bronze failed"):
        harvester.harvest_large_corpus(total_target=1)
    assert not list(writer.local_dir.rglob("*.parquet"))


def test_resume_changed_filters_rejected(batch):
    harvester, _, _ = batch
    harvester.harvest_large_corpus(total_target=1)
    with pytest.raises(ValueError, match="filters differ"):
        harvester.harvest_large_corpus(total_target=3, categories=["cs.CL"])


def test_corrupt_checkpoint_rejected(batch):
    harvester, _, _ = batch
    harvester.checkpoint_file.write_text("broken json")
    with pytest.raises(RuntimeError, match="Invalid batch checkpoint"):
        harvester.load_checkpoint()


def test_offline_demo(tmp_path):
    pytest.importorskip("lancedb")
    from src.pipelines.run_demo import run_demo

    report = json.loads(run_demo(tmp_path).read_text())
    assert report["paper_count"] == 2
    assert report["chunk_count"] == 4
    assert len(report["search_results"]) == 2


def test_local_bronze_immutable_and_manifest(tmp_path):
    from src.storage.local_client import LocalObjectStore
    from src.utils.hasher import compute_sha256

    store = LocalObjectStore(tmp_path)
    saved = store.upload_json({"paper": 1}, "bronze/paper.json")
    assert saved["sha256"] == compute_sha256((tmp_path / "bronze/paper.json"))
    store.upload_json({"paper": 1}, "bronze/paper.json")
    with pytest.raises(FileExistsError):
        store.upload_json({"paper": 2}, "bronze/paper.json")
    assert store.get_json("bronze/paper.json") == {"paper": 1}
    assert len(store.list_objects(prefix="bronze/")) == 1
    assert len(list((tmp_path / "_manifests").glob("*.json"))) == 1


@pytest.mark.parametrize("key", ["../secret", "/absolute", "bronze/../../secret"])
def test_local_key_traversal_rejected(tmp_path, key):
    from src.storage.local_client import LocalObjectStore

    with pytest.raises(ValueError):
        LocalObjectStore(tmp_path).upload_text("payload", key)


def test_changed_page_rejected_on_resume(batch):
    harvester, _, _ = batch
    harvester.harvest_large_corpus(total_target=1)
    harvester.fetch_oai_page.return_value["records_raw"][0]["metadata"]["arXiv"]["title"] = (
        "Changed"
    )
    with pytest.raises(RuntimeError, match="Resumed page changed"):
        harvester.harvest_large_corpus(total_target=3)


def test_rss_date_and_abstract_normalized_in_silver(tmp_path):
    writer = SilverLakehouseWriter(local_only=True, local_silver_dir=tmp_path)
    record = writer.prepare_record(
        {
            "paper_id": "2610.00010",
            "published_date": "Fri, 02 Oct 2026 00:00:00 -0400",
            "abstract": "arXiv:2610.00010v1 Announce Type: new Abstract: Actual scientific abstract.",
        },
        {},
    )
    assert record["abstract"] == "Actual scientific abstract."
    assert record["published_date"].startswith("2026-10-02T")
    writer.save_and_upload_parquet([record])
    assert (tmp_path / "year=2026" / "papers.parquet").exists()


def test_upsert_preserves_legacy_partition_enrichment_and_fulltext(tmp_path):
    import pyarrow as pa

    writer = SilverLakehouseWriter(local_only=True, local_silver_dir=tmp_path)
    old = writer.prepare_record(
        {
            "paper_id": "legacy",
            "doi": "10.1/example",
            "journal_ref": "Existing journal",
            "published_date": "2024-01-01",
            "title": "Old title",
        },
        {
            "sections": [{"section_title": "Methods", "content": "Existing full text"}],
            "total_sections": 1,
            "total_words": 100,
        },
    )
    writer.save_and_upload_parquet([old], year="2026")
    path = tmp_path / "year=2026" / "papers.parquet"
    table = pq.ParquetFile(path).read().append_column("external_score", pa.array([7]))
    pq.write_table(table, path)
    incoming = writer.prepare_record(
        {"paper_id": "legacy", "published_date": "2024-01-01", "title": "Updated title"}, {}
    )
    writer.save_and_upload_parquet([incoming])
    assert not (tmp_path / "year=2024" / "papers.parquet").exists()
    row = pq.ParquetFile(path).read().to_pylist()[0]
    assert row["title"] == "Updated title"
    assert row["doi"] == "10.1/example"
    assert row["journal_ref"] == "Existing journal"
    assert row["external_score"] == 7
    assert row["clean_full_text"] == old["clean_full_text"]
    assert row["total_words"] == 100


def test_upsert_rejects_ambiguous_existing_partitions(tmp_path):
    writer = SilverLakehouseWriter(local_only=True, local_silver_dir=tmp_path)
    record = writer.prepare_record({"paper_id": "duplicate", "published_date": "2024-01-01"}, {})
    writer.save_and_upload_parquet([record], year="2024")
    writer.save_and_upload_parquet([record], year="2025")
    with pytest.raises(ValueError, match="Duplicate paper_id across Silver partitions"):
        writer.save_and_upload_parquet([record])
