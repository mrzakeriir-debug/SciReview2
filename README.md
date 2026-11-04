# SciReview: Research Article Optimizer 📄🔬

> **An AI-powered peer review and manuscript optimization tool based on Tomislav Hengl and Michael Gould's 40 Rules of Thumb for Writing Research Articles.**

SciReview helps researchers, graduate students, and academic authors critically evaluate, revise, and polish scientific manuscripts before submitting them to peer-reviewed journals.

---

## ✨ Features

- **Automated 40-Step Review**: Assesses manuscripts across all three critical phases of scientific writing:
  - 📝 **Phase 1: Make Draft (Steps 1–22)**: Title, terminology, research questions, methodology, technical setup, and structured abstracts.
  - 🔍 **Phase 2: Revise (Steps 23–32)**: Clarity, alignment of conclusions to research questions, redundancy reduction, and coherence.
  - ✨ **Phase 3: Polish (Steps 33–40)**: Academic style, past vs. present tense, mathematical equations, abbreviations, figures, tables, and reference relevance.
- **Multiformat Manuscript Ingestion**: Directly paste your manuscript text or upload `.pdf` and `.docx` files.
- **Interactive Review Dashboard**:
  - Filter steps by category and status (`Passed`, `Warning`, `Failed`).
  - View targeted critique and specific, actionable recommendations for each step.
  - Overall readiness score (0–100).
- **Executive Export**: Download a full, formatted Word (`.docx`) report summarizing all step-by-step findings and recommendations to share with co-authors.
- **Full-Stack & Secure**: Client-agnostic server-side Gemini API execution with automatic retry and rate-limit mitigation.

---

## 🚀 Live Demo & Free Publishing

### Option 1: Share Directly from Google AI Studio (Instant & Free)
Your app is already deployed on Google Cloud Run through Google AI Studio!
- **Public URL**: You can share your **Shared App URL** (`https://ais-pre-...asia-southeast1.run.app`) directly with colleagues or link to it in your GitHub repository.
- Anyone can open and use the application in their web browser without installing anything.

### Option 2: Deploy for Free on Vercel, Render, or Railway
You can also deploy this repository for free to any cloud host:

1. Fork or push this repository to your GitHub account.
2. Sign in to [Render](https://render.com), [Railway](https://railway.app), or [Vercel](https://vercel.com).
3. Import your GitHub repository.
4. Add the environment variable:
   - `GEMINI_API_KEY`: Your free Google AI Studio API key (get one from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
5. Set Build & Start commands:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

---

## 💻 Local Development Setup

Follow these steps to run SciReview locally on your computer:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later)
- An API Key from [Google AI Studio](https://aistudio.google.com/app/apikey) (Free tier available)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/scireview-research-article-optimizer.git
   cd scireview-research-article-optimizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in a text editor and paste your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📖 How to Use

1. **Input Your Paper**:
   - **Option A**: Click **Upload PDF/Docx** and select your draft file.
   - **Option B**: Copy and paste your manuscript text directly into the input area.
2. **Run Analysis**:
   - Click the **Analyze Manuscript** button.
   - The analysis runs across all 40 rules of thumb using Google Gemini models.
3. **Explore the Dashboard**:
   - Review the **Overall Score**.
   - Browse the categorized tabs (**Make Draft**, **Revise**, and **Polish**).
   - Expand any rule card to see specific feedback and improvement advice.
4. **Export Your Report**:
   - Click **Download Word Report** to generate a `.docx` file ready for collaboration.

---

## 📚 Methodology Reference

SciReview is built upon the academic principles published by:
> **Hengl, T., & Gould, M. (2002).** *Rules of thumb for writing research articles.* ITC, Enschede, The Netherlands.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.
