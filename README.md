# LLM Hardware Calculator

A web application designed to help users estimate the hardware resources (primarily VRAM and RAM) required to run Large Language Models (LLMs) locally on their machines.

## Project Purpose

The LLM Hardware Calculator aims to be a go-to resource for AI developers, researchers, and hobbyists who need to:

- Estimate hardware requirements for running specific LLM configurations
- Make informed decisions about which models can run on their existing hardware
- Understand the relationship between model parameters, quantization, and memory requirements
- Receive GPU recommendations based on their model configuration

## Live Demo

The application is deployed and available at:
[https://llm-hardware-calculator.vercel.app](https://llm-hardware-calculator.vercel.app)

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

## Features

- **Model Parameter Input**: Specify model size (e.g., 0.5B, 1B, 3B, 7B, 13B, 34B, 70B)
- **Quantization Options**: Select from a wide range of precision formats:
  - Full precision (FP32)
  - Half precision (FP16, BF16)
  - Lower precision (INT8, INT4, INT3, INT2)
  - GGUF-specific formats (Q4_0, Q4_1, Q5_0, etc.)
- **Context Length & Batch Size**: Fine-tune your specific use case with adjustable context length and batch size
- **Memory Architecture**: Choose between unified memory (e.g., Apple Silicon) and discrete GPU configurations
- **Multi-GPU Support**: Configure calculations for systems with multiple GPUs
- **Detailed Breakdowns**: View comprehensive memory breakdowns including model size, KV cache, activations, and overhead
- **GPU Compatibility**: Check your model against a database of consumer and professional GPUs
- **Hardware Recommendations**: Get optimal GPU configurations based on your model requirements
- **Interactive Visualizations**: Visual representations of memory requirements with comparative benchmarks

## Technical Implementation

The LLM Hardware Calculator uses the following technologies:

- **Frontend**: React with Vite for fast development and build times
- **Styling**: Tailwind CSS for utility-first styling and responsive design
- **State Management**: React hooks for local state management
- **Calculations**: Client-side JavaScript for real-time hardware requirement estimation
- **GPU Database**: Integrated database of consumer and professional GPUs with memory specifications

## License

[MIT](LICENSE)
