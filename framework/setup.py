"""Setup script for llm-test-framework."""

from setuptools import setup, find_packages

setup(
    name="llm-test-framework",
    version="0.1.0",
    description="Test framework for LLM applications with DeepEval integration",
    packages=find_packages(),
    python_requires=">=3.10",
    entry_points={
        "console_scripts": [
            "llm-test=llm_test_framework.cli.main:cli",
        ],
    },
    install_requires=[
        "httpx>=0.27.0",
        "pyyaml>=6.0.1",
        "jmespath>=1.0.1",
        "playwright>=1.40.0",
        "websockets>=12.0",
        "pydantic>=2.5.0",
        "python-dotenv>=1.0.0",
        "click>=8.1.0",
        "rich>=13.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "ruff>=0.1.0",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Testing",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
