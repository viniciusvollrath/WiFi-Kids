# Security Policy

Wi-Fi Kids is a parental-control system designed for minors.  
Security and privacy are **critical**.

---

## 🔒 Supported Versions
During the hackathon, only the **main branch** is maintained.  
Future releases may follow semantic versioning.

---

## ⚠️ Reporting a Vulnerability
If you discover a security issue (e.g., bypass of parental control, exposure of data, or unsafe AI prompts):
1. **Do not open a public issue**.  
2. Instead, email: **[add-sec-contact@email.com]**.  
3. Describe the vulnerability, impact, and steps to reproduce.  

We will respond within **7 days**.

---

## 🔑 Data & Privacy
- The prototype does **not store personal data** beyond session logs.  
- Parents must consent before usage reports are collected.  
- API keys must be stored in `.env` and **never committed**.  

---

## 🛡 Best Practices
- Change default demo credentials (`admin/admin`) immediately.  
- Enable HTTPS on OpenWRT for production use.  
- Rotate API keys regularly.  
- Follow [OWASP Top 10](https://owasp.org/www-project-top-ten/) guidance.  

---

Thank you for helping keep Wi-Fi Kids safe for families. 🛡
