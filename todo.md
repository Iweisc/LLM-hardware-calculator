# TODO List: LLM Hardware Calculator Website

## Phase 1: Core Functionality & MVP

### Setup & Foundation
- [x] Initialize project repository (e.g., Git, GitHub/GitLab).
- [ ] Choose and set up frontend framework (React/Vite or Next.js).
- [ ] Choose and integrate styling approach (Tailwind CSS or UI Component Library like MUI/Chakra/Mantine).
- [ ] Set up basic project structure (components, styles, utilities folders).
- [ ] Implement basic layout (Header, Main Content Area, Footer).

### UI - Input Section
- [ ] Create component for "Model Parameters" input (Number input, billions/millions selection).
- [ ] Create component for "Quantization Precision" input (Dropdown/Radio buttons: FP32, FP16, BF16, INT8, INT4).
- [ ] Add tooltips/help text explaining Quantization options.
- [ ] Create component for "Context Length" input (Number input or slider, with default value).
- [ ] Add tooltip/help text explaining Context Length.
- [ ] Create component for "Batch Size" input (Number input, with default value 1).
- [ ] Add tooltip/help text explaining Batch Size.
- [ ] Implement input validation (e.g., numeric values, reasonable ranges).

### Calculation Logic (Client-Side JavaScript)
- [ ] Research/Refine formulas for VRAM estimation (Model size, KV Cache, Activations, Overhead). *Initial focus on Model Size + Overhead.*
- [ ] Implement helper function `getBytesPerParameter(quantization)`.
- [ ] Implement core function `calculateHardware(params, quantization, contextLength, batchSize)`.
- [ ] Calculate `ModelSizeGB`.
- [ ] Implement *initial simplified* `KVCacheGB` estimation.
- [ ] Implement *initial simplified* `ActivationEstimateGB`.
- [ ] Define `FixedOverheadGB`.
- [ ] Calculate `EstimatedVRAM_Min_GB`.
- [ ] Calculate `EstimatedVRAM_Rec_GB`.
- [ ] Calculate `EstimatedRAM_Min_GB` (including OS overhead assumption).
- [ ] Calculate `EstimatedRAM_Rec_GB`.
- [ ] Clearly document assumptions made in the calculations within the code.

### UI - Output Section
- [ ] Create component to display "Estimated Minimum VRAM".
- [ ] Create component to display "Estimated Recommended VRAM".
- [ ] Create component to display "Estimated Minimum RAM".
- [ ] Create component to display "Estimated Recommended RAM".
- [ ] (Optional - Advanced View) Create component to show VRAM breakdown (Model, KV Cache, Overhead).
- [ ] Create section to display calculation assumptions.

### Integration & Interactivity
- [ ] Connect input component states to the main application state.
- [ ] Trigger `calculateHardware` function whenever relevant inputs change.
- [ ] Update output display components dynamically based on calculation results.
- [ ] Ensure calculations are reasonably fast for real-time updates.

### Styling & UX Polish
- [ ] Apply chosen styling system (Tailwind/UI Library) consistently across all components.
- [ ] Ensure the entire application is responsive across desktop, tablet, and mobile screen sizes.
- [ ] Implement focus states, hover effects, and subtle transitions for a polished feel.
- [ ] Refine layout, spacing, typography, and color scheme for a top-notch UI.

### Testing & Deployment
- [ ] Perform basic cross-browser testing (Chrome, Firefox, Safari, Edge).
- [ ] Test responsiveness on different device emulators/physical devices.
- [ ] Validate calculation outputs against known examples or simple manual calculations.
- [ ] Set up deployment pipeline (e.g., Vercel, Netlify, GitHub Pages).
- [ ] Deploy the initial version.

### Documentation
- [x] Write a comprehensive README.md (Setup, How to Run, Overview, Tech Stack).
- [ ] Add code comments where necessary, especially for complex logic (calculations).

## Phase 2: Enhancements & Refinements (Post-MVP)

- [ ] **Improve Calculation Accuracy:**
    - [ ] Research more sophisticated KV Cache estimation methods.
    - [ ] Research better Activation memory estimation techniques.
    - [ ] Allow adjustment of overhead buffer assumptions.
    - [ ] Validate against more real-world benchmarks (e.g., `llama.cpp`, Hugging Face).
- [ ] **Features:**
    - [ ] Implement "Model Presets" dropdown.
    - [ ] Implement "Advanced Mode" with more inputs (layers, dimensions).
    - [ ] Add visualisations (e.g., bar charts for VRAM breakdown).
- [ ] **Backend (If Needed):**
    - [ ] Evaluate if backend is needed for complex calculations or data storage.
    - [ ] Set up backend framework (Node/Express, Python/FastAPI).
    - [ ] Migrate calculation logic if required.
    - [ ] Set up backend deployment.
- [ ] **Further Enhancements (Based on PRD Roadmap):**
    - [ ] Hardware suggestions.
    - [ ] Cost estimation links.
    - [ ] Throughput estimation (complex).
    - [ ] User accounts.
    - [ ] Community benchmarks integration.

## Continuous Tasks
- [ ] Monitor user feedback.
- [ ] Address bugs and issues.
- [ ] Keep dependencies updated.
- [ ] Monitor analytics (visitors, usage patterns).
