# Contributing to Wi-Fi Kids

We welcome contributions from the community and hackathon teammates!  
This guide explains how to get started.

---

## 🛠 Development Setup
1. Fork the repo and clone locally:
   ```bash
   git clone https://github.com/viniciusvollrath/WiFi-Kids
   cd WiFi-Kids
   ```
2. Copy `.env.example` → `.env` and configure your API keys.  
3. Run services:
   ```bash
   docker compose up --build
   ```
4. Open the backend at `http://localhost:8000/docs` and the quiz UI at `/portal`.

---

## 🌳 Branch Strategy
- `main` → stable, demo-ready code (protected branch).  
- `dev/*` → feature branches (example: `dev/langchain-quiz`, `dev/openwrt-config`).  
- PRs require **at least one review** before merge.  

---

## 🧪 Testing
- Unit tests live in `backend/tests/`.  
- Run tests:
   ```bash
   pytest backend/tests
   ```

---

## ✅ Contribution Checklist
- [ ] Add/update tests for new features.  
- [ ] Update docs in `docs/` if architecture changes.  
- [ ] Follow PEP8 / Black for Python code.  
- [ ] Commit messages: short & descriptive (e.g. `feat: add persona presets`).  

---

## 📬 Issues
- Use [GitHub Issues](../../issues) to report bugs or suggest features.  
- Label issues as `bug`, `enhancement`, or `docs`.  

---

Thanks for contributing to Wi-Fi Kids! 💡
