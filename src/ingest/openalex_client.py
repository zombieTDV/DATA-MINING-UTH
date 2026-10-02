"""src/ingest/openalex_client.py — OpenAlex API Client & Abstract Reconstructor."""
from __future__ import annotations

import logging
import time
from typing import Any, Optional
import urllib.parse

import requests

logger = logging.getLogger("OpenAlexClient")


def reconstruct_abstract(inverted_index: Optional[dict[str, list[int]]]) -> str:
    """
    Reconstruct full abstract text from OpenAlex's inverted index representation.
    In OpenAlex API, abstracts are returned as:
        {"word": [pos1, pos2], ...}
    This function sorts all words by position and joins them into coherent prose.
    """
    if not inverted_index or not isinstance(inverted_index, dict):
        return ""

    positions: list[tuple[int, str]] = []
    for word, indices in inverted_index.items():
        if isinstance(indices, list):
            for idx in indices:
                positions.append((idx, word))

    positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in positions).strip()


class OpenAlexClient:
    """
    Polite REST API client for OpenAlex Works endpoint.
    Complies with OpenAlex polite pool guidelines by supplying a User-Agent
    with contact mailto and adhering to request pacing.
    """

    BASE_URL = "https://api.openalex.org/works"

    def __init__(
        self,
        base_url: str = "https://api.openalex.org/works",
        user_agent: Optional[str] = None,
        mailto: str = "student@uth.edu.vn",
        request_delay: float = 0.5,
        timeout: int = 20,
    ) -> None:
        self.base_url = base_url
        self.mailto = mailto
        self.request_delay = max(0.1, request_delay)
        self.timeout = timeout
        self.session = requests.Session()
        ua = user_agent or f"UTH-DataMining-Student/1.0 (mailto:{self.mailto})"
        self.session.headers.update({
            "User-Agent": ua,
            "Accept": "application/json",
        })

    def _get_with_retry(self, url: str, params: Optional[dict[str, Any]] = None, max_retries: int = 3) -> dict[str, Any]:
        """Execute HTTP GET with exponential backoff on transient errors or rate limits."""
        for attempt in range(max_retries):
            try:
                time.sleep(self.request_delay)
                response = self.session.get(url, params=params, timeout=self.timeout)

                if response.status_code == 200:
                    return response.json()
                elif response.status_code in (429, 503):
                    wait_time = (2 ** attempt) + 1.0
                    logger.warning("HTTP %d received. Backing off for %.1fs (attempt %d/%d)", response.status_code, wait_time, attempt + 1, max_retries)
                    time.sleep(wait_time)
                else:
                    logger.error("HTTP %d error querying OpenAlex: %s", response.status_code, response.text[:200])
                    response.raise_for_status()
            except (requests.RequestException, TimeoutError) as err:
                if attempt == max_retries - 1:
                    logger.error("Failed to query OpenAlex after %d attempts: %s", max_retries, err)
                    raise
                wait_time = (2 ** attempt) + 0.5
                logger.warning("Network error (%s). Retrying in %.1fs...", err, wait_time)
                time.sleep(wait_time)

        raise RuntimeError(f"Failed to fetch data from {url} after {max_retries} retries.")

    def parse_work_item(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Normalize raw OpenAlex work item JSON into standard schema."""
        raw_id = raw.get("id", "")
        # Standardize ID: e.g. "https://openalex.org/W12345" -> "openalex:W12345"
        openalex_id = raw_id.split("/")[-1] if raw_id else ""
        paper_id = f"openalex:{openalex_id}" if openalex_id else "unknown"

        # Abstract reconstruction
        abstract = reconstruct_abstract(raw.get("abstract_inverted_index"))

        # Authors
        authors: list[str] = []
        for authorship in raw.get("authorships", []):
            author_obj = authorship.get("author", {})
            name = author_obj.get("display_name")
            if name:
                authors.append(name)

        # Topics & Keywords
        topics: list[str] = []
        for topic in raw.get("topics", []):
            display_name = topic.get("display_name")
            if display_name:
                topics.append(display_name)

        keywords: list[dict[str, Any]] = []
        raw_keywords = raw.get("keywords", [])
        if isinstance(raw_keywords, list):
            for kw in raw_keywords:
                if isinstance(kw, dict):
                    display_name = kw.get("display_name")
                    score = float(kw.get("score", 1.0))
                    if display_name:
                        keywords.append({"keyword": display_name, "score": score})

        # Venue
        venue = ""
        primary_loc = raw.get("primary_location") or {}
        source_obj = primary_loc.get("source") or {}
        if source_obj.get("display_name"):
            venue = source_obj.get("display_name")

        # Resolving PDF URL
        pdf_url = ""
        open_access = raw.get("open_access") or {}
        best_oa = raw.get("best_oa_location") or {}
        
        if primary_loc.get("pdf_url"):
            pdf_url = primary_loc["pdf_url"]
        elif best_oa.get("pdf_url"):
            pdf_url = best_oa["pdf_url"]
        elif open_access.get("oa_url") and open_access.get("oa_url", "").lower().endswith(".pdf"):
            pdf_url = open_access["oa_url"]
        elif primary_loc.get("landing_page_url") and "arxiv.org/abs/" in primary_loc.get("landing_page_url", ""):
            # Fallback for arXiv landing page -> direct PDF
            arxiv_abs = primary_loc["landing_page_url"]
            arxiv_id = arxiv_abs.split("/abs/")[-1].split("v")[0]
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

        # IDs
        ids = raw.get("ids", {})
        doi = ids.get("doi", raw.get("doi", ""))
        arxiv_id = ids.get("arxiv", "")

        # Referenced works (outgoing citations)
        raw_refs = raw.get("referenced_works", [])
        referenced_works = [r.split("/")[-1] for r in raw_refs if isinstance(r, str)]

        return {
            "paper_id": paper_id,
            "openalex_id": openalex_id,
            "title": (raw.get("title") or "").strip(),
            "abstract": abstract,
            "year": int(raw.get("publication_year") or 0),
            "publication_date": raw.get("publication_date", ""),
            "venue": venue,
            "doi": doi,
            "arxiv_id": arxiv_id,
            "authors": authors,
            "citation_count": int(raw.get("cited_by_count") or 0),
            "topics": topics,
            "keywords": keywords,
            "pdf_url": pdf_url,
            "referenced_works": referenced_works,
            "raw_payload": raw,
        }

    def fetch_llm_papers_stratified(
        self,
        start_year: int = 2017,
        end_year: int = 2026,
        per_year_limit: int = 25,
        topic_ids: Optional[list[str]] = None,
    ) -> list[dict[str, Any]]:
        """
        Harvest papers stratified across publication years [start_year, end_year].
        Queries OpenAlex for LLM papers, sorting by citation count descending
        to ensure high landmark and citation relevance per year.
        """
        all_results: list[dict[str, Any]] = []
        seen_paper_ids: set[str] = set()

        if topic_ids:
            joined_topics = "|".join(topic_ids)
        else:
            joined_topics = "T10181|T10028|T11550|T12031"

        for year in range(start_year, end_year + 1):
            logger.info("Harvesting top %d LLM papers for year %d from OpenAlex...", per_year_limit, year)
            
            filter_query = (
                f"publication_year:{year},"
                f"language:en,"
                f"primary_topic.id:{joined_topics}"
            )

            year_count = 0
            page = 1
            max_per_page = 200

            while year_count < per_year_limit:
                current_per_page = min(max_per_page, per_year_limit - year_count)
                params = {
                    "filter": filter_query,
                    "sort": "cited_by_count:desc",
                    "per-page": current_per_page,
                    "page": page,
                }

                try:
                    data = self._get_with_retry(self.base_url, params=params)
                    works = data.get("results", [])
                    if not works:
                        logger.info("No more works found for year %d at page %d.", year, page)
                        break

                    added_in_page = 0
                    for item in works:
                        parsed = self.parse_work_item(item)
                        pid = parsed.get("paper_id")
                        if pid and pid not in seen_paper_ids:
                            seen_paper_ids.add(pid)
                            all_results.append(parsed)
                            year_count += 1
                            added_in_page += 1
                            if year_count >= per_year_limit:
                                break

                    logger.info("Year %d [page %d]: retrieved %d works (total for year: %d/%d)", year, page, added_in_page, year_count, per_year_limit)

                    if len(works) < current_per_page:
                        break

                    page += 1
                except Exception as err:
                    logger.error("Failed harvesting year %d at page %d: %s. Continuing...", year, page, err)
                    break

        return all_results
