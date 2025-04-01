# TODO List: LLM Hardware Calculator Website

## Phase 1: Core Functionality & MVP

### Setup & Foundation
- [x] Initialize project repository (e.g., Git, GitHub/GitLab).
- [x] Choose and set up frontend framework (React/Vite or Next.js).
- [x] Choose and integrate styling approach (Tailwind CSS or UI Component Library like MUI/Chakra/Mantine).
- [x] Set up basic project structure (components, styles, utilities folders).
- [x] Implement basic layout (Header, Main Content Area, Footer).

### UI - Input Section
- [x] Create component for "Model Parameters" input (Number input, billions/millions selection).
- [x] Create component for "Quantization Precision" input (Dropdown/Radio buttons: FP32, FP16, BF16, INT8, INT4).
- [x] Add tooltips/help text explaining Quantization options.
- [x] Create component for "Context Length" input (Number input or slider, with default value).
- [x] Add tooltip/help text explaining Context Length.
- [x] Create component for "Batch Size" input (Number input, with default value 1).
- [x] Add tooltip/help text explaining Batch Size.
- [x] Implement input validation (e.g., numeric values, reasonable ranges).

### Calculation Logic (Client-Side JavaScript)
- [x] Research/Refine formulas for VRAM estimation (Model size, KV Cache, Activations, Overhead). *Initial focus on Model Size + Overhead.*
- [x] Implement helper function `getBytesPerParameter(quantization)`.
- [x] Implement core function `calculateHardware(params, quantization, contextLength, batchSize)`.
- [x] Calculate `ModelSizeGB`.
- [x] Implement *initial simplified* `KVCacheGB` estimation.
- [x] Implement *initial simplified* `ActivationEstimateGB`.
- [x] Define `FixedOverheadGB`.
- [x] Calculate `EstimatedVRAM_Min_GB`.
- [x] Calculate `EstimatedVRAM_Rec_GB`.
- [x] Calculate `EstimatedRAM_Min_GB` (including OS overhead assumption).
- [x] Calculate `EstimatedRAM_Rec_GB`.
- [x] Clearly document assumptions made in the calculations within the code.

### UI - Output Section
- [x] Create component to display "Estimated Minimum VRAM".
- [x] Create component to display "Estimated Recommended VRAM".
- [x] Create component to display "Estimated Minimum RAM".
- [x] Create component to display "Estimated Recommended RAM".
- [x] (Optional - Advanced View) Create component to show VRAM breakdown (Model, KV Cache, Overhead).
- [x] Create section to display calculation assumptions.

### Integration & Interactivity
- [x] Connect input component states to the main application state.
- [x] Trigger `calculateHardware` function whenever relevant inputs change.
- [x] Update output display components dynamically based on calculation results.
- [x] Ensure calculations are reasonably fast for real-time updates.

### Styling & UX Polish
- [x] Apply chosen styling system (Tailwind/UI Library) consistently across all components.
- [x] Ensure the entire application is responsive across desktop, tablet, and mobile screen sizes.
- [x] Implement focus states, hover effects, and subtle transitions for a polished feel.
- [x] Refine layout, spacing, typography, and color scheme for a top-notch UI.

### Testing & Deployment
- [x] Perform basic cross-browser testing (Chrome, Firefox, Safari, Edge).
- [x] Test responsiveness on different device emulators/physical devices.
- [x] Validate calculation outputs against known examples or simple manual calculations.
- [x] Set up deployment pipeline (e.g., Vercel, Netlify, GitHub Pages).
- [x] Deploy the initial version.

### Documentation
- [x] Write a comprehensive README.md (Setup, How to Run, Overview, Tech Stack).
- [x] Add code comments where necessary, especially for complex logic (calculations).

## Phase 2: Enhancements & Refinements (Post-MVP)

- [x] **Improve Calculation Accuracy:**
    - [x] Research more sophisticated KV Cache estimation methods.
    - [x] Research better Activation memory estimation techniques.
    - [x] Allow adjustment of overhead buffer assumptions.
    - [x] Validate against more real-world benchmarks (e.g., `llama.cpp`, Hugging Face).
- [x] **Features:**
    - [x] Implement "Model Presets" dropdown.
    - [x] Implement "Advanced Mode" with more inputs (layers, dimensions).
    - [x] Add visualisations (e.g., bar charts for VRAM breakdown).
- [x] **Backend (If Needed):**
    - [x] Evaluate if backend is needed for complex calculations or data storage.
    - [x] Set up backend framework (Node/Express, Python/FastAPI).
    - [x] Migrate calculation logic if required.
    - [x] Set up backend deployment.
- [x] **Further Enhancements (Based on PRD Roadmap):**
    - [x] Hardware suggestions.
    - [x] Cost estimation links.
    - [x] Throughput estimation (complex).
    - [x] User accounts.
    - [x] Community benchmarks integration.

## Continuous Tasks
- [x] Monitor user feedback.
- [x] Address bugs and issues.
- [x] Keep dependencies updated.
- [x] Monitor analytics (visitors, usage patterns).
