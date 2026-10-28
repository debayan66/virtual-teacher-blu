from huggingface_hub import snapshot_download
for repo in ["ai4bharat/indictrans2-en-indic-dist-200M",
             "ai4bharat/indictrans2-indic-en-dist-200M"]:
    print(repo, "->", snapshot_download(repo_id=repo))