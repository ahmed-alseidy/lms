# LMS SaaS — Pricing

## 1. Your Costs (What You Pay)

### S3 Path (Free / Pro)

| Item | Approx. Cost | Notes |
|------|--------------|-------|
| **S3 storage** | ~$0.023/GB/mo | Depends on total video stored |
| **S3 egress** | ~$0.09/GB (first 10TB) | Per GB streamed to students |
| **Transcoding** | **$0** | Client-side FFmpeg |
| **CDN (optional)** | Varies | CloudFront or similar if you put S3 behind it |

S3 path: mostly **storage + egress**; no per-minute encode or DRM.

---

### Mux + DRM Path (Premium Only)

| Item | Approx. Cost | Notes |
|------|--------------|-------|
| **Mux Video – encoding** | ~$0.005–0.015/min delivered | Depends on resolution/quality; "delivered" = streamed |
| **Mux Video – storage** | ~$0.004/min stored/month | Encoded assets |
| **Mux DRM** | **~$100/mo base + ~$0.003 per license** | "License" ≈ one DRM play/session; 10k plays ≈ $30 on top of $100 |
| **Mux Data (optional)** | Extra | If you want Mux analytics |

Premium: **encoding + storage + $100/mo DRM + per-license**. The **$100 DRM base** is the main fixed cost.

---

## 2. Plan-Level Pricing (What to Charge Teachers)

Architecture: **S3 for Free/Pro, Mux+DRM for Premium only.**

| Plan | Stack | Your Cost (approx) | Example Price | Goal |
|------|-------|--------------------|---------------|------|
| **Free** | S3 only | Storage + egress | **$0** | Acquisition, upsell to Pro |
| **Pro** | S3 only | Same as Free, higher caps | **$X/mo** (e.g. $29–79) | Revenue, no DRM cost |
| **Premium** | Mux + DRM | $100 DRM + Mux encode/storage + egress | **$Y/mo** (e.g. $99–199) | Cover DRM + Mux + margin |

---

## 3. Premium Price (Rule of Thumb)

- **$100/mo DRM** + **~$0.01/min delivered** (Mux) + **~$0.005/min/mo stored** (Mux).
- Example: 5,000 min delivered → encode ~$50; 20,000 min stored ~$100; DRM $100 → **~$250/mo** cost for that teacher.
- **Premium list: $99–199/mo** is a reasonable band; **$149/mo** is a simple default.
- Revisit when: DRM pricing changes, many Premium teachers (spreading $100), or S3 egress grows.

---

## 4. Overage and Caps

**S3 (Free / Pro):**

- **Free:** e.g. **storage cap** (5–10GB), **egress cap** (e.g. 50GB/mo).
- **Pro:** higher caps; overage $/GB or upsell to Premium.

**Mux (Premium):**

- **Included delivered minutes** (e.g. 5,000 or 10,000/mo).
- **Overage:** e.g. $2–5 per 1,000 min above that.

---

## 5. Example Plan Table

| Plan | Price | Included (example) | Your Main Cost |
|------|-------|--------------------|----------------|
| **Free** | **$0** | 1–3 courses, 20 students, 2GB video, S3 | Storage + egress |
| **Pro** | **$49/mo** | 20 courses, 200 students, 50GB video, S3 | Storage + egress |
| **Premium** | **$149/mo** | 100 courses, 2,000 students, 200GB video, **Mux + DRM**, 10k delivered min | DRM $100 + Mux |

- **Overage (Premium):** e.g. $4 per 1,000 delivered min above 10k.
- **Annual:** e.g. 2 months free (Pro $490/yr, Premium $1,490/yr).

---

## 6. Metrics to Track

**S3 (Free + Pro):**

- Total **storage (GB)** per tenant and globally.
- **Egress (GB)** per tenant and globally.  
→ Caps and overage so S3 cost doesn’t spiral.

**Mux (Premium only):**

- **Delivered minutes** per Premium teacher (and total).
- **DRM license count** per month.  
→ Check: `(Premium revenue − $100 − Mux costs)`. Adjust Premium price or included minutes if needed.

---

## 7. Summary

- **S3 (Free/Pro):** Price to cover **storage + egress**; use caps/overage.
- **Premium (Mux+DRM):** Price to cover **$100 DRM base + Mux encoding/storage + DRM licenses**; **$99–199/mo** band, **$149** as default.
- Add **included minutes** and **overage** for Premium once you have real Mux usage.
- Revisit when: DRM or Mux pricing changes, Premium base grows, or S3 egress increases.