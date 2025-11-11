"""CLI for LLM Test Framework."""

import asyncio
import click
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint

from llm_test_framework import (
    YAMLLoader,
    ParallelTestRunner,
    DeepEvalClient,
    FileResultStore
)

console = Console()


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """LLM Test Framework - Test your LLM applications."""
    pass


@cli.command()
@click.argument("suite_path", type=click.Path(exists=True))
@click.option("--test-ids", help="Comma-separated test case IDs to run")
@click.option("--max-concurrency", default=10, help="Maximum concurrent tests")
@click.option("--deepeval-url", default="http://localhost:8001", help="DeepEval service URL")
@click.option("--export", help="Export results to file (HTML or JSON)")
@click.option("--export-format", type=click.Choice(["html", "json"]), default="html")
def run(suite_path, test_ids, max_concurrency, deepeval_url, export, export_format):
    """Run test suite."""
    asyncio.run(_run_tests(suite_path, test_ids, max_concurrency, deepeval_url, export, export_format))


async def _run_tests(suite_path, test_ids, max_concurrency, deepeval_url, export, export_format):
    """Run tests implementation."""
    try:
        # Load suite
        with console.status("[bold green]Loading test suite..."):
            suite = YAMLLoader.load_suite(suite_path)
        
        console.print(f"[bold]Test Suite:[/bold] {suite.name}")
        console.print(f"[bold]Total Tests:[/bold] {len(suite.test_cases)}")
        
        # Filter test cases if specified
        if test_ids:
            ids = [id.strip() for id in test_ids.split(",")]
            suite.test_cases = [tc for tc in suite.test_cases if tc.id in ids]
            console.print(f"[bold]Filtered to:[/bold] {len(suite.test_cases)} tests")
        
        if not suite.test_cases:
            console.print("[red]No test cases to run![/red]")
            return
        
        # Check service
        async with DeepEvalClient(base_url=deepeval_url) as client:
            with console.status("[bold green]Checking DeepEval service..."):
                is_healthy = await client.health_check()
            
            if not is_healthy:
                console.print(f"[red]✗[/red] DeepEval service not running at {deepeval_url}")
                console.print("\nStart it with: cd service && docker-compose up -d")
                return
            
            console.print(f"[green]✓[/green] DeepEval service is running")
            
            # Create result store
            result_store = FileResultStore()
            
            # Create runner
            runner = ParallelTestRunner(
                deepeval_client=client,
                max_concurrency=max_concurrency,
                default_adapter=suite.default_adapter,
                result_store=result_store
            )
            
            # Run tests with progress
            console.print(f"\n[bold]Running {len(suite.test_cases)} tests...[/bold]\n")
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Executing tests...", total=None)
                
                test_run, results = await runner.run_tests(
                    test_cases=suite.test_cases,
                    suite_name=suite.name
                )
                
                progress.update(task, completed=True)
            
            # Display results
            _display_results(test_run, results)
            
            # Export if requested
            if export:
                result_store.export_results(test_run.id, export, format=export_format)
                console.print(f"\n[green]✓[/green] Results exported to: {export}")
    
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise


def _display_results(test_run, results):
    """Display test results in a table."""
    # Summary
    console.print("\n" + "="*60)
    console.print(f"[bold]Test Run:[/bold] {test_run.id}")
    duration = (test_run.end_time - test_run.start_time).total_seconds()
    console.print(f"[bold]Duration:[/bold] {duration:.2f}s")
    console.print("="*60)
    
    # Stats
    table = Table(show_header=False, box=None)
    table.add_row("Total", str(test_run.total_tests))
    table.add_row("[green]Passed[/green]", f"[green]{test_run.passed}[/green]")
    table.add_row("[red]Failed[/red]", f"[red]{test_run.failed}[/red]")
    table.add_row("[yellow]Errors[/yellow]", f"[yellow]{test_run.errors}[/yellow]")
    table.add_row("[blue]Skipped[/blue]", f"[blue]{test_run.skipped}[/blue]")
    
    console.print(table)
    console.print("="*60 + "\n")
    
    # Detailed results
    results_table = Table(show_header=True, header_style="bold magenta")
    results_table.add_column("Test Case", style="cyan")
    results_table.add_column("Status")
    results_table.add_column("Metrics", style="dim")
    results_table.add_column("Duration", justify="right")
    
    for result in results:
        # Status icon
        status_map = {
            "passed": "[green]✓ passed[/green]",
            "failed": "[red]✗ failed[/red]",
            "error": "[yellow]⚠ error[/yellow]",
            "skipped": "[blue]⊘ skipped[/blue]"
        }
        status = status_map.get(result.status, result.status)
        
        # Metrics summary
        if result.metrics:
            metrics = ", ".join([
                f"{m.name}: {m.score:.2f}" for m in result.metrics[:2]
            ])
            if len(result.metrics) > 2:
                metrics += f" (+{len(result.metrics)-2} more)"
        else:
            metrics = "-"
        
        # Duration
        duration = f"{result.duration_ms:.0f}ms" if result.duration_ms else "-"
        
        results_table.add_row(
            result.test_case_id,
            status,
            metrics,
            duration
        )
    
    console.print(results_table)
    
    # Results location
    console.print(f"\n[dim]Results saved to: test_results/runs/{test_run.id}/[/dim]")


@cli.command()
@click.option("--suite", help="Filter by suite name")
@click.option("--limit", default=10, help="Number of runs to show")
def list_runs(suite, limit):
    """List recent test runs."""
    store = FileResultStore()
    runs = store.list_runs(suite_name=suite, limit=limit)
    
    if not runs:
        console.print("[yellow]No test runs found[/yellow]")
        return
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Run ID", style="cyan")
    table.add_column("Suite")
    table.add_column("Timestamp")
    table.add_column("Total", justify="right")
    table.add_column("Passed", justify="right", style="green")
    table.add_column("Failed", justify="right", style="red")
    
    for run in runs:
        table.add_row(
            run["id"][:8] + "...",
            run["suite_name"],
            run["start_time"][:19],
            str(run["total_tests"]),
            str(run["passed"]),
            str(run["failed"])
        )
    
    console.print(table)


@cli.command()
@click.argument("test_case_id")
@click.option("--limit", default=5, help="Number of results to show")
def history(test_case_id, limit):
    """Show history for a test case."""
    store = FileResultStore()
    results = store.get_test_case_history(test_case_id, limit=limit)
    
    if not results:
        console.print(f"[yellow]No history found for {test_case_id}[/yellow]")
        return
    
    console.print(f"[bold]History for {test_case_id}[/bold]\n")
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Timestamp")
    table.add_column("Status")
    table.add_column("Metrics")
    table.add_column("Duration", justify="right")
    
    for result in results:
        status_map = {
            "passed": "[green]✓[/green]",
            "failed": "[red]✗[/red]",
            "error": "[yellow]⚠[/yellow]"
        }
        status = status_map.get(result["status"], result["status"])
        
        metrics = ""
        for m in result.get("metrics", []):
            icon = "✓" if m["passed"] else "✗"
            metrics += f"{icon} {m['name']}: {m['score']:.2f}\n"
        
        duration = f"{result.get('duration_ms', 0):.0f}ms"
        
        table.add_row(
            result["timestamp"][:19],
            status,
            metrics.strip(),
            duration
        )
    
    console.print(table)


@cli.command()
@click.argument("run_id")
@click.argument("output_file")
@click.option("--format", "export_format", type=click.Choice(["html", "json"]), default="html")
def export(run_id, output_file, export_format):
    """Export test results."""
    store = FileResultStore()
    
    try:
        store.export_results(run_id, output_file, format=export_format)
        console.print(f"[green]✓[/green] Results exported to: {output_file}")
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")


@cli.command()
@click.argument("suite_path", type=click.Path(exists=True))
def validate(suite_path):
    """Validate test suite YAML."""
    try:
        with console.status("[bold green]Validating test suite..."):
            suite = YAMLLoader.load_suite(suite_path)
        
        console.print(f"[green]✓[/green] Valid test suite: {suite.name}")
        console.print(f"  Version: {suite.version}")
        console.print(f"  Test Cases: {len(suite.test_cases)}")
        
        # Check for issues
        issues = []
        for tc in suite.test_cases:
            if not tc.metrics:
                issues.append(f"  - {tc.id}: No metrics defined")
            if not tc.adapter and not suite.default_adapter:
                issues.append(f"  - {tc.id}: No adapter configured")
        
        if issues:
            console.print("\n[yellow]Warnings:[/yellow]")
            for issue in issues:
                console.print(issue)
        else:
            console.print("[green]  No issues found[/green]")
    
    except Exception as e:
        console.print(f"[red]✗ Invalid test suite:[/red] {str(e)}")


@cli.command()
@click.argument("directory", type=click.Path(exists=True))
def list_suites(directory):
    """List all test suites in a directory."""
    suites = YAMLLoader.load_suites_from_directory(directory)
    
    if not suites:
        console.print(f"[yellow]No test suites found in {directory}[/yellow]")
        return
    
    console.print(f"[bold]Found {len(suites)} test suites:[/bold]\n")
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Suite Name", style="cyan")
    table.add_column("Version")
    table.add_column("Tests", justify="right")
    table.add_column("Adapters")
    
    for suite in suites:
        adapter_types = set()
        for tc in suite.test_cases:
            if tc.adapter:
                adapter_types.add(tc.adapter.get("type", "?"))
            elif suite.default_adapter:
                adapter_types.add(suite.default_adapter.get("type", "?"))
        
        table.add_row(
            suite.name,
            suite.version,
            str(len(suite.test_cases)),
            ", ".join(adapter_types) if adapter_types else "-"
        )
    
    console.print(table)


if __name__ == "__main__":
    cli()
