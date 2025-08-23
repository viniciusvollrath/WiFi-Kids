#!/usr/bin/env python3
"""Test runner script for WiFi-Kids Backend."""

import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n🔧 {description}...")
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e}")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False


def install_dependencies():
    """Install test dependencies."""
    return run_command(
        ["pip", "install", "-e", "."],
        "Installing project dependencies"
    )


def run_unit_tests():
    """Run unit tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/unit/", "-v", "--tb=short"],
        "Running unit tests"
    )


def run_integration_tests():
    """Run integration tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/integration/", "-v", "--tb=short"],
        "Running integration tests"
    )


def run_analytics_tests():
    """Run analytics tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/analytics/", "-v", "--tb=short"],
        "Running analytics tests"
    )


def run_e2e_tests():
    """Run end-to-end tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/e2e/", "-v", "--tb=short"],
        "Running end-to-end tests"
    )


def run_all_tests():
    """Run all tests with coverage."""
    return run_command(
        [
            "python", "-m", "pytest", 
            "tests/", 
            "-v", 
            "--tb=short",
            "--cov=api",
            "--cov-report=term-missing",
            "--cov-report=html",
            "--cov-fail-under=80"
        ],
        "Running all tests with coverage"
    )


def run_specific_test_category(category):
    """Run tests for a specific category."""
    category_map = {
        "unit": run_unit_tests,
        "integration": run_integration_tests,
        "analytics": run_analytics_tests,
        "e2e": run_e2e_tests,
        "all": run_all_tests
    }
    
    if category not in category_map:
        print(f"❌ Unknown test category: {category}")
        print(f"Available categories: {', '.join(category_map.keys())}")
        return False
    
    return category_map[category]()


def run_linting():
    """Run code linting."""
    return run_command(
        ["python", "-m", "flake8", "api/", "--max-line-length=100"],
        "Running code linting"
    )


def run_type_checking():
    """Run type checking."""
    return run_command(
        ["python", "-m", "mypy", "api/", "--ignore-missing-imports"],
        "Running type checking"
    )


def generate_test_report():
    """Generate a comprehensive test report."""
    print("\n📊 Generating Test Report...")
    
    # Run tests with coverage
    success = run_command(
        [
            "python", "-m", "pytest", 
            "tests/", 
            "--cov=api",
            "--cov-report=html:htmlcov",
            "--cov-report=xml:coverage.xml",
            "--cov-report=term-missing",
            "--junitxml=test-results.xml"
        ],
        "Running tests with coverage and generating reports"
    )
    
    if success:
        print("\n📈 Test Report Generated:")
        print("  - HTML Coverage Report: htmlcov/index.html")
        print("  - XML Coverage Report: coverage.xml")
        print("  - JUnit Test Results: test-results.xml")
    
    return success


def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="WiFi-Kids Backend Test Runner")
    parser.add_argument(
        "--category", 
        choices=["unit", "integration", "analytics", "e2e", "all"],
        default="all",
        help="Test category to run"
    )
    parser.add_argument(
        "--install", 
        action="store_true",
        help="Install dependencies before running tests"
    )
    parser.add_argument(
        "--lint", 
        action="store_true",
        help="Run code linting"
    )
    parser.add_argument(
        "--type-check", 
        action="store_true",
        help="Run type checking"
    )
    parser.add_argument(
        "--report", 
        action="store_true",
        help="Generate comprehensive test report"
    )
    parser.add_argument(
        "--coverage", 
        action="store_true",
        help="Run tests with coverage"
    )
    
    args = parser.parse_args()
    
    print("🧪 WiFi-Kids Backend Test Runner")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Install dependencies if requested
    if args.install:
        if not install_dependencies():
            print("❌ Failed to install dependencies")
            sys.exit(1)
    
    # Run linting if requested
    if args.lint:
        if not run_linting():
            print("❌ Linting failed")
            sys.exit(1)
    
    # Run type checking if requested
    if args.type_check:
        if not run_type_checking():
            print("❌ Type checking failed")
            sys.exit(1)
    
    # Run tests
    if args.report:
        success = generate_test_report()
    elif args.coverage:
        success = run_all_tests()
    else:
        success = run_specific_test_category(args.category)
    
    if success:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
