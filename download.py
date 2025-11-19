from huggingface_hub import hf_hub_download

try:
    path = hf_hub_download(
        repo_id="bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF",
        filename="Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
        local_dir="models"
    )
    print("下载完成，文件路径:", path)
except Exception as e:
    print("下载出错:", e)
