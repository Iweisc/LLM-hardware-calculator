# LLM Hardware Calculator

A web application designed to help users estimate the hardware resources (primarily VRAM and RAM) required to run Large Language Models (LLMs) locally on their machines.

## Project Purpose

The LLM Hardware Calculator aims to be a go-to resource for AI developers, researchers, and hobbyists who need to:

- Estimate hardware requirements for running specific LLM configurations
- Make informed decisions about which models can run on their existing hardware
- Understand the relationship between model parameters, quantization, and memory requirements

## Live Demo

The application is deployed and available at:
[https://llm-hardware-calculator-jevjxxcl8-zawads-projects-748eb895.vercel.app](https://llm-hardware-calculator-jevjxxcl8-zawads-projects-748eb895.vercel.app)

## Documentation

This repository contains the following documentation:

- [Product Requirements Document](prd.md) - Detailed specification of the application
- [TODO List](todo.md) - Development roadmap and task breakdown

## Getting Started

### Local Development
1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open your browser to `http://localhost:5173`

### Deployment
The project is configured for deployment with Vercel. Any changes pushed to the main branch will trigger a new deployment.

## Features (Planned)

- **Model Parameter Input**: Specify model size (e.g., 7B, 13B, 70B)
- **Quantization Options**: Select from common precision formats (FP32, FP16, BF16, INT8, INT4)
- **Context Length & Batch Size**: Fine-tune your specific use case
- **Detailed Estimations**: Get minimum and recommended VRAM and RAM requirements
- **Technical Breakdown**: View how the estimates are calculated

## License

[MIT](LICENSE)
