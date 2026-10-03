"""Local GGUF LLM Inference Client using llama-cpp-python with Apple Silicon Metal acceleration."""

import logging
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Union

from src.config.settings import settings

logger = logging.getLogger(__name__)


class QwenGGUFEngine:
    """Wrapper around llama_cpp.Llama for Qwen2.5-7B-Instruct GGUF model."""

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        n_ctx: int = 4096,
        n_gpu_layers: int = -1,
        verbose: bool = False,
    ):
        """Initializes the GGUF engine.

        Args:
            model_path: Path to the GGUF file. Defaults to settings.LLM_MODEL_PATH.
            n_ctx: Context window length.
            n_gpu_layers: Number of layers to offload to GPU/Metal (-1 = all layers).
            verbose: Enable llama.cpp debug output.
        """
        raw_path = model_path or settings.LLM_MODEL_PATH
        self.model_path = Path(raw_path)
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"GGUF model file not found at: {self.model_path}. "
                "Ensure models/qwen2.5-7b-instruct-q4_k_m/qwen2.5-7b-instruct-q4_k_m.gguf exists."
            )

        logger.info(f"[LLM] Loading GGUF model from {self.model_path} (n_ctx={n_ctx}, n_gpu_layers={n_gpu_layers})...")

        try:
            from llama_cpp import Llama
        except ImportError as e:
            raise ImportError(
                "Package llama-cpp-python is required. Install via `pip install llama-cpp-python`."
            ) from e

        self.llm = Llama(
            model_path=str(self.model_path),
            n_ctx=n_ctx,
            n_gpu_layers=n_gpu_layers,
            verbose=verbose,
        )
        logger.info("[LLM] Model loaded successfully with hardware acceleration.")

    def generate(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1536,
        temperature: float = 0.2,
        top_p: float = 0.9,
    ) -> str:
        """Executes a chat completion call and returns the text response."""
        response = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            stream=False,
        )
        return response["choices"][0]["message"]["content"]

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1536,
        temperature: float = 0.2,
        top_p: float = 0.9,
    ) -> Iterator[str]:
        """Streams chat completion tokens in real-time."""
        response_stream = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            stream=True,
        )
        for chunk in response_stream:
            delta = chunk["choices"][0].get("delta", {})
            content = delta.get("content", "")
            if content:
                yield content
