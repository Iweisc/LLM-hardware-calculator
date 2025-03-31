# PRD: LLM Hardware Calculator Website

## 1. Introduction

This document outlines the requirements for the "LLM Hardware Calculator," a web application designed to help users estimate the hardware resources (primarily VRAM and RAM) required to run Large Language Models (LLMs) locally on their machines. The calculator will allow users to input various parameters of an LLM and receive technically detailed hardware requirement estimations. The website aims to be a go-to resource for AI developers, researchers, and hobbyists, featuring a top-notch user interface and leveraging popular, modern web frameworks.

## 2. Goals

*   **Accurate Estimations:** Provide reasonably accurate estimates for VRAM and RAM based on user inputs.
*   **User-Friendly Interface:** Offer an intuitive, clean, and highly polished user experience.
*   **Technical Depth:** Present results with sufficient technical detail to be useful for informed decisions.
*   **Educational Value:** Help users understand the factors influencing hardware requirements for LLMs.
*   **Performance:** Ensure the website is fast and responsive.
*   **Maintainability:** Build using modern, well-supported technologies for ease of future updates.

## 3. Target Audience

*   **AI/ML Developers & Researchers:** Professionals working with LLMs who need to provision hardware or select models based on available resources.
*   **Hobbyists & Enthusiasts:** Individuals interested in running LLMs locally for personal projects or experimentation.
*   **Students:** Learners in the AI/ML field exploring LLM deployment.
*   **Hardware Buyers:** Users looking to purchase or upgrade hardware specifically for running LLMs.

## 4. Features

### 4.1. Core Calculator Functionality

*   **User Inputs:**
    *   **Model Parameters (Required):** Number of parameters (e.g., 7B, 13B, 70B). Input as billions or millions.
    *   **Quantization Precision (Required):** Select from common precision formats (e.g., FP32, FP16, BF16, INT8, INT4). Explain the trade-offs (size/speed vs accuracy).
    *   **Context Length (Optional, with default):** Maximum sequence length the user plans to use (e.g., 2048, 4096, 8192, 32k). Defaults to a common value (e.g., 4096).
    *   **Batch Size (Optional, with default):** Inference batch size (defaults to 1). Primarily impacts KV cache size.
*   **Calculation Logic:**
    *   Estimate VRAM requirements based on:
        *   Model weights size (Parameters * Bytes per Parameter based on quantization).
        *   KV Cache size (Estimated based on parameters, layers (derived/estimated), context length, batch size, and precision). *Initial implementation might use simplified estimations.*
        *   Activation memory estimation (Simplified, potentially a fixed overhead or percentage based on model size).
        *   Inference framework/CUDA overhead (Add a fixed buffer, e.g., 1-2 GB).
    *   Estimate RAM requirements based on:
        *   Model weights size (For loading before potential GPU transfer).
        *   OS and base application overhead.
*   **Output Display:**
    *   **Estimated VRAM:** Display minimum and recommended VRAM in GB.
    *   **Estimated RAM:** Display minimum and recommended RAM in GB.
    *   **Breakdown (Optional/Advanced View):** Show how the VRAM estimate is composed (Model Size, Est. KV Cache, Overhead).
    *   **Assumptions:** Clearly state any assumptions made in the calculation (e.g., simplified activation memory, specific overhead buffer).

### 4.2. User Interface & User Experience (UI/UX)

*   **Modern Design:** Clean, aesthetically pleasing layout. Use of a professional color palette and typography.
*   **Intuitive Inputs:** Use clear labels, tooltips explaining technical terms (like quantization, context length), and potentially sliders or dropdowns for ease of use. Input validation (e.g., ensure parameter count is numeric).
*   **Clear Results:** Present calculated hardware requirements prominently and understandably.
*   **Responsiveness:** Fully responsive design adapting to desktop, tablet, and mobile screen sizes.
*   **Interactivity:** Provide immediate feedback as user changes input parameters. Consider subtle animations or transitions.

### 4.3. Technology Stack (Proposed)

*   **Frontend Framework:** React (using Vite for build tooling) or Next.js.
    *   *Justification:* Extremely popular, large ecosystem, component-based architecture suits UI development. Next.js adds features like routing and potential SSR/SSG if needed later.
*   **UI Library/Styling:**
    *   Tailwind CSS for utility-first styling and rapid development.
    *   *Alternatively:* A component library like Material UI (MUI), Chakra UI, or Mantine for pre-built, high-quality components, combined with custom styling.
    *   *Justification:* Enables building a polished UI efficiently. Tailwind offers flexibility; component libraries offer ready-made building blocks.
*   **Backend Framework (Optional - Phase 1 might be Client-Side):**
    *   Node.js with Express or Fastify.
    *   *Alternatively:* Python with FastAPI.
    *   *Justification:* If calculation logic becomes complex or requires server-side resources/data, these are popular, performant choices. Node.js pairs well with React. Python/FastAPI is strong in the ML ecosystem. For a pure calculator, complex backend logic might be overkill initially; calculations could be done in JavaScript on the client-side.
*   **Deployment:** Netlify, Vercel (especially if using Next.js), or GitHub Pages for static frontend-only deployment. Cloud VM or container service if a backend is used.

## 5. Design & UI/UX Requirements

*   **Visual Style:** Minimalist, modern, tech-focused aesthetic. Avoid clutter.
*   **Key Elements:**
    *   Header/Navbar (Minimal: Title, maybe link to GitHub/About).
    *   Input Section: Logically grouped input fields with clear labels and helper text/tooltips.
    *   Output Section: Clearly delineated area displaying VRAM and RAM results. Use visual cues (e.g., icons, progress bars - used carefully) to enhance understanding.
    *   Footer (Optional: Links, disclaimer).
*   **Interactivity:** Real-time updates of the results as inputs are changed. Smooth transitions/animations for input changes or result display.

## 6. Technical Specifications

### 6.1. Calculation Formulas (Initial Proposal)

*   `BytesPerParam = get_bytes_per_parameter(Quantization)` (e.g., FP16=2, INT8=1, INT4=0.5)
*   `ModelSizeGB = (ModelParams * BytesPerParam) / (1024^3)`
*   *Simplified KV Cache Estimation (Needs Refinement/Research)*:
    *   `KVCacheGB = (ContextLength * EstLayers * EstHiddenDim * 2 * BytesPerParam * BatchSize) / (1024^3)`
    *   *Note:* `EstLayers` and `EstHiddenDim` might need to be roughly estimated based on `ModelParams` using common architectures, or simplified further. This is a key area for technical accuracy improvement.
*   `ActivationEstimateGB = ModelSizeGB * ActivationFactor` (Where `ActivationFactor` is a small multiplier, e.g., 0.1-0.3, needs refinement). Or a fixed overhead based on model size tiers.
*   `FixedOverheadGB = 1.5` (Covers CUDA context, framework overhead etc. - adjustable)
*   **`EstimatedVRAM_Min_GB = ModelSizeGB + FixedOverheadGB`** (Absolute minimum, might not fit KV cache or activations comfortably)
*   **`EstimatedVRAM_Rec_GB = ModelSizeGB + KVCacheGB + ActivationEstimateGB + FixedOverheadGB`** (Recommended for smoother inference)
*   **`EstimatedRAM_Min_GB = ModelSizeGB + OSRamOverheadGB`** (e.g., OSRamOverheadGB = 4GB)
*   **`EstimatedRAM_Rec_GB = EstimatedRAM_Min_GB * 1.2`** (Slight buffer)

*Disclaimer: These formulas are initial estimates and need validation and refinement based on empirical data and specific model architectures.*

### 6.2. Deployment

*   **Initial:** Static hosting (Vercel/Netlify/GitHub Pages) if calculations are purely client-side JavaScript.
*   **With Backend:** Containerized deployment (Docker) on cloud services (AWS EC2/ECS, Google Cloud Run, Azure App Service).

## 7. Future Considerations / Roadmap

*   **Model Presets:** Allow users to select specific popular LLMs (e.g., Llama 2 7B, Mixtral 8x7B) to auto-fill parameters.
*   **Advanced Mode:** Include more technical inputs (e.g., number of layers, hidden dimension, attention mechanism details if possible).
*   **Hardware Suggestions:** Suggest specific GPU models or tiers based on calculated VRAM.
*   **Cost Estimation:** Link hardware requirements to potential cloud instance costs or hardware purchase prices (highly complex).
*   **Throughput Estimation:** Estimate potential inference speed (tokens/sec) based on hardware/model (very complex, depends heavily on implementation).
*   **User Accounts:** Allow users to save calculations or hardware profiles.
*   **Community Benchmarks:** Integrate user-submitted benchmark data for real-world performance validation.

## 8. Success Metrics

*   **Unique Visitors & Page Views:** Tracked via web analytics (e.g., Google Analytics, Plausible).
*   **User Engagement:** Time on site, bounce rate, number of calculations performed.
*   **User Feedback:** Qualitative feedback via contact form or community channels.
*   **Search Engine Ranking:** Organic traffic for relevant keywords (e.g., "llm hardware calculator", "vram calculator llm").
*   **Accuracy:** Comparison of estimates against known real-world benchmarks for popular models.

## 9. Open Questions

*   How to accurately estimate KV Cache and Activation memory requirements across different model architectures without overly complex inputs?
*   What is the best way to derive/estimate parameters like layer count and hidden dimensions from just the total parameter count for the KV/Activation estimation?
*   Should calculations be performed client-side (JavaScript) for simplicity or server-side for potentially more complex logic/data access later? (Initial lean: Client-side).
*   What are the most critical quantization types and context lengths to support initially?
