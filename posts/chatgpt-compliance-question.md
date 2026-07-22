---
title: ChatGPT and Compliance: The Fine Print Most Businesses Never Read
description: If you're pasting client, patient, or financial data into ChatGPT, there's fine print worth reading first — what's actually covered, what isn't, and what running locally does and doesn't solve.
tag: Compliance
dek: A lot of professionals are pasting client data into ChatGPT without ever checking what plan they're actually on — and it matters more than most people realize.
slug: chatgpt-compliance-question
devto_tags: ai, privacy, compliance, business
---

If you're a therapist, a lawyer, a bookkeeper, or basically anyone who handles other people's sensitive information for a living, there's a decent chance you've pasted some of it into ChatGPT at some point — a client intake note to help draft a summary, a contract clause to get a second opinion on, a spreadsheet of numbers to sanity-check. Most people never check what plan they're actually on before doing that. It turns out to matter a lot.

## What the fine print actually says

OpenAI does not sign a Business Associate Agreement — the legal document HIPAA requires before a third party can handle protected health information — for the Free, Plus, Pro, Team, or self-serve Business plans. Only ChatGPT Enterprise and the newer ChatGPT for Healthcare tier (announced January 2026) are HIPAA-eligible, and only after your organization signs that agreement directly with OpenAI.

The GDPR side has the same shape. OpenAI offers a Data Processing Addendum — the agreement that lets a business use a third-party processor under GDPR — for ChatGPT Business, Enterprise, Edu, and the API. Individual ChatGPT Plus doesn't come with one.

Training data works similarly. On Free, Plus, and Pro personal accounts, your conversations are used to improve OpenAI's models **by default** — you have to manually turn this off in Settings → Data Controls → "Improve the model for everyone." Even after opting out, a conversation you give a thumbs-up or thumbs-down to can still get used for training regardless of that setting.

None of this means ChatGPT is bad at what it does, or that OpenAI is hiding anything — the Enterprise and Healthcare tiers exist specifically to solve this, with real contractual protections behind them. The catch is what plan most people are actually on: a solo therapist, a freelance bookkeeper, or a two-person law office is almost never paying for ChatGPT Enterprise. They're on Plus, at $20/month, which is the plan without a BAA, without a DPA, and with training-on-by-default.

## Who this actually matters for

- **Healthcare professionals** — anyone who'd need a BAA before this counts as HIPAA-compliant handling of patient information.
- **Lawyers and anyone bound by client confidentiality** — attorney-client privilege and bar association rules don't care what OpenAI's terms of service say; they care what you agreed to when you took the client.
- **Financial and accounting professionals** — GLBA and similar frameworks treat client financial data with the same third-party-processor scrutiny.
- **Anyone under an NDA** — this one doesn't need a named regulation. If a client contract says their data doesn't go to third parties, pasting it into a consumer AI product is the third party question, full stop.

## What running locally actually changes — and what it doesn't

Here's the honest version, not the marketing version: if the AI model runs on your own machine and the data never gets transmitted anywhere, there's no third-party processor in the picture at all — which means the BAA question, the DPA question, and the "does this count as a subprocessor" question all become moot, because there's no subprocessor. That's a real, structural difference, not a technicality.

What it doesn't do is automatically make you compliant with everything else those frameworks require. HIPAA also covers things like access controls on the device itself, encryption at rest, audit logging, staff training, and breach notification procedures — all of which are still on you regardless of where the AI runs. Running locally removes one specific, real risk (data leaving your control and landing on a third party's servers under a consumer agreement that doesn't cover it). It doesn't replace the rest of a real compliance program, and if you need a formal HIPAA or GDPR posture, that's a conversation for a compliance professional, not a blog post.

## Where AI Partner fits into this

AI Partner 2.0 runs entirely on your own computer through a local model — nothing you type, upload, or discuss ever gets transmitted to us or anyone else. That doesn't make you "HIPAA compliant" by itself (nothing does, by itself — it's a program, not a checkbox), but it does mean the specific question this whole post is about — is my AI vendor a subprocessor I need a signed agreement with — simply doesn't apply, because there's no vendor in the data path at all.

| | ChatGPT Plus ($20/mo) | ChatGPT Enterprise/Healthcare | AI Partner 2.0 |
|---|---|---|---|
| HIPAA BAA available | No | Yes, with agreement | Not applicable — no third-party processor |
| GDPR DPA available | No | Yes | Not applicable — no third-party processor |
| Training on your data | On by default, manual opt-out | Off by default | N/A — nothing ever leaves your device |
| Cost | $20/mo | Custom enterprise pricing | $29–$49 once |
| Who it's realistically built for | Individuals, casual use | Large orgs with procurement teams | Solopreneurs, freelancers, small practices |

The middle column is a legitimate, real option if you're a large healthcare system or enterprise with a procurement team to negotiate that agreement. It's just not what most solo practitioners and small businesses are actually signed up for.

## Bottom line

If you're already on ChatGPT Enterprise or the Healthcare tier with a signed BAA, this doesn't apply to you — you've already solved this problem the way OpenAI built it to be solved. If you're a solo professional on Plus pasting client information into it because it's convenient, it's worth at least knowing which plan you're actually on before you keep doing that.

**Sources:** [HIPAA Journal — Is ChatGPT HIPAA Compliant? Updated for 2026](https://www.hipaajournal.com/is-chatgpt-hipaa-compliant/) · [OpenAI Help Center — How your data is used to improve model performance](https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance) · [OpenAI Enterprise Privacy](https://openai.com/enterprise-privacy/)
