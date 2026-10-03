"""Local Embedding Generator using Nomic Embed Text v1.5.

Optimized for academic research literature with 8,192 token context support
and running locally on Apple Silicon (MPS), CUDA, or CPU.
"""

from pathlib import Path
from typing import List, Union
import torch
import torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer

from src.config.settings import settings


class NomicEmbedder:
    """Offline Embedding model running locally with Nomic-embed-text-v1.5."""

    def __init__(self, model_path: Union[str, Path, None] = None, device: str = "auto"):
        self.model_path = Path(model_path or settings.EMBEDDING_MODEL_PATH)
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Thư mục mô hình không tồn tại tại: {self.model_path}. "
                "Vui lòng kiểm tra lại đường dẫn models/nomic-embed-text-v1.5"
            )

        # Tự động nhận diện phần cứng (Ưu tiên Apple Silicon MPS -> CUDA -> CPU)
        if device == "auto":
            if torch.backends.mps.is_available():
                self.device = torch.device("mps")
            elif torch.cuda.is_available():
                self.device = torch.device("cuda")
            else:
                self.device = torch.device("cpu")
        else:
            self.device = torch.device(device)

        # Khởi tạo Tokenizer và Model
        self.tokenizer = AutoTokenizer.from_pretrained(str(self.model_path))
        self.model = AutoModel.from_pretrained(str(self.model_path), trust_remote_code=True)
        self.model.to(self.device)
        self.model.eval()

    def _mean_pooling(self, model_output, attention_mask):
        """Tính trung bình cộng các vector token có xét attention mask (Mean Pooling)."""
        token_embeddings = model_output[0]
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        return sum_embeddings / sum_mask

    def embed_documents(self, texts: List[str], batch_size: int = 8) -> List[List[float]]:
        """Sinh vector nhúng cho danh sách tài liệu/chunks (tự động gắn tiền tố search_document:)."""
        all_embeddings = []

        # Chuẩn bị văn bản theo chuẩn của Nomic
        formatted_texts = [f"search_document: {t}" for t in texts]

        for i in range(0, len(formatted_texts), batch_size):
            batch = formatted_texts[i : i + batch_size]
            encoded_input = self.tokenizer(
                batch,
                padding=True,
                truncation=True,
                max_length=1024,
                return_tensors="pt",
            ).to(self.device)

            with torch.no_grad():
                try:
                    model_output = self.model(**encoded_input)
                except Exception as e:
                    # Fallback sang CPU neu MPS bao loi bo nho
                    if self.device.type == "mps":
                        torch.mps.empty_cache()
                        cpu_input = {k: v.to("cpu") for k, v in encoded_input.items()}
                        self.model.to("cpu")
                        model_output = self.model(**cpu_input)
                        self.model.to(self.device)
                    else:
                        raise e

                embeddings = self._mean_pooling(model_output, encoded_input["attention_mask"].to(model_output[0].device))
                # L2 Normalize
                embeddings = F.normalize(embeddings, p=2, dim=1)
                all_embeddings.extend(embeddings.cpu().tolist())

            if self.device.type == "mps":
                torch.mps.empty_cache()

        return all_embeddings

    def embed_query(self, query: str) -> List[float]:
        """Sinh vector nhúng cho câu truy vấn tìm kiếm của người dùng (tự động gắn tiền tố search_query:)."""
        formatted_query = f"search_query: {query}"
        encoded_input = self.tokenizer(
            [formatted_query],
            padding=True,
            truncation=True,
            max_length=1024,
            return_tensors="pt",
        ).to(self.device)

        with torch.no_grad():
            model_output = self.model(**encoded_input)
            embeddings = self._mean_pooling(model_output, encoded_input["attention_mask"])
            embeddings = F.normalize(embeddings, p=2, dim=1)
            return embeddings.cpu().tolist()[0]
