# SecuSync: LLM Security Testing Toolkit

SecuSync is a comprehensive security evaluation application designed to test Large Language Models (LLMs) against adversarial attacks. It provides a platform for defining target profiles, executing attack vectors (such as Prompt Injection and Jailbreaking), and analyzing vulnerability responses.

This toolkit serves as a Final Year Project (FYP) prototype aimed at automating the red-teaming process for LLM-integrated applications.

## Key Features

-   **Target Profiling**: Define system instructions, API endpoints, and security constraints for the target LLM.
-   **Automated Attack Execution**: Orchestrate prompt injection and manipulation attacks.
-   **Hybrid Analysis Engine**: Evaluate responses using a combination of Regex Deterministic Oracles and Semantic LLM Judges (Llama 3.3).
-   **Reporting**: Generate detailed Technical and Executive PDF reports with root cause analysis and risk assessment.
-   **Multi-Tenancy**: (Roadmap) Isolate testing environments and data per user.

## Architecture

The project follows a modern client-server architecture:

-   **Frontend**: React (Vite) + TailwindCSS + Lucide Icons. Provides a responsive dashboard for managing runs and viewing detailed logs.
-   **Backend**: Python FastAPI. Handles job orchestration, mutation logic, LLM connectivity, and report generation.
-   **Analysis**: Utilizes LangChain and OpenAI SDKs to interface with external LLM providers (Groq/OpenAI) for both attack generation and response auditing.

## Installation

### Prerequisites

-   Node.js v20+
-   Python 3.10+
-   API Key for Groq (Llama 3.3) or OpenAI (for the Analysis Engine)

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure Environment:
    Create a `.env` file in the `backend/` directory:
    ```ini
    JUDGE_API_KEY=your_api_key_here
    JUDGE_MODEL=llama-3.3-70b-versatile
    JUDGE_BASE_URL=https://api.groq.com/openai/v1
    ```
5.  Start the server:
    ```bash
    uvicorn app.main:app --reload
    ```

### Frontend Setup

1.  Navigate to the root directory:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```

## Deployment

The repository includes a `deployment/` directory with scripts for deploying to an Ubuntu AWS EC2 instance.

## License

Copyright (c) 2024-2025 AosawnX. All Rights Reserved.

Unauthorized copying, modification, distribution, or use of this file, via any medium, is strictly prohibited. The software is proprietary and confidential.
