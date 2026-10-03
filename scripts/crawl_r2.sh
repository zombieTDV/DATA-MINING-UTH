#!/bin/sh
# Run the R2 batch crawler from any working directory, using the project virtualenv.
set -eu
CRAWL_SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CRAWL_PROJECT_DIR=$(CDPATH= cd -- "$CRAWL_SCRIPT_DIR/.." && pwd)
cd "$CRAWL_PROJECT_DIR"
if [ -x "$CRAWL_PROJECT_DIR/venv/bin/python" ]; then
    CRAWL_PYTHON="$CRAWL_PROJECT_DIR/venv/bin/python"
elif [ -x "$CRAWL_PROJECT_DIR/.venv/bin/python" ]; then
    CRAWL_PYTHON="$CRAWL_PROJECT_DIR/.venv/bin/python"
else
    printf '%s\n' 'Create a project virtualenv and install dependencies before crawling.' >&2
    exit 1
fi
exec "$CRAWL_PYTHON" -u -m src.pipelines.run_batch_ingest "$@"
