"""Playwright adapter for UI testing."""

from playwright.async_api import async_playwright, Page, Browser
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class PlaywrightAdapter(BaseTriggerAdapter):
    """Adapter for UI testing with Playwright."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.playwright = None
        self.browser: Browser = None
        self.context = None
        self.page: Page = None
    
    async def setup(self):
        """Launch browser."""
        self.playwright = await async_playwright().start()
        
        browser_type = self.config.get("browser", "chromium")
        headless = self.config.get("headless", True)
        
        if browser_type == "chromium":
            self.browser = await self.playwright.chromium.launch(headless=headless)
        elif browser_type == "firefox":
            self.browser = await self.playwright.firefox.launch(headless=headless)
        elif browser_type == "webkit":
            self.browser = await self.playwright.webkit.launch(headless=headless)
        
        # Create context with optional video recording
        context_options = {}
        if self.config.get("video"):
            context_options["record_video_dir"] = "test_results/videos/"
        
        self.context = await self.browser.new_context(**context_options)
        self.page = await self.context.new_page()
    
    async def teardown(self):
        """Close browser."""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Execute UI automation steps."""
        try:
            base_url = self.config.get("base_url", "")
            steps = self.config.get("steps", [])
            
            variables = {
                "input": test_case["input"],
                "test_case_id": test_case["id"],
                **test_case.get("context", {}),
                **context
            }
            
            actual_output = ""
            screenshots = []
            
            # Execute steps
            for step in steps:
                action = step["action"]
                
                if action == "goto":
                    url = self._substitute_variables(step["url"], variables)
                    await self.page.goto(f"{base_url}{url}")
                
                elif action == "wait_for_selector":
                    selector = step["selector"]
                    timeout = step.get("timeout", 5000)
                    await self.page.wait_for_selector(selector, timeout=timeout)
                
                elif action == "fill":
                    selector = step["selector"]
                    value = self._substitute_variables(step["value"], variables)
                    await self.page.fill(selector, value)
                
                elif action == "click":
                    selector = step["selector"]
                    await self.page.click(selector)
                
                elif action == "extract_text":
                    selector = step["selector"]
                    element = await self.page.wait_for_selector(selector)
                    text = await element.inner_text()
                    
                    if step.get("save_as") == "actual_output":
                        actual_output = text
                
                elif action == "screenshot":
                    screenshot_path = f"test_results/screenshots/{test_case['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    Path(screenshot_path).parent.mkdir(parents=True, exist_ok=True)
                    await self.page.screenshot(path=screenshot_path)
                    screenshots.append(screenshot_path)
                
                elif action == "wait":
                    timeout = step.get("timeout", 1000)
                    await self.page.wait_for_timeout(timeout)
            
            return AdapterResult(
                actual_output=actual_output,
                metadata={
                    "screenshots": screenshots,
                    "page_url": self.page.url,
                    "page_title": await self.page.title()
                },
                success=True
            )
        
        except Exception as e:
            # Take screenshot on error
            error_screenshot = None
            if self.config.get("screenshot_on_error") and self.page:
                error_screenshot = f"test_results/screenshots/error_{test_case['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                Path(error_screenshot).parent.mkdir(parents=True, exist_ok=True)
                await self.page.screenshot(path=error_screenshot)
            
            return AdapterResult(
                actual_output="",
                metadata={
                    "error_screenshot": error_screenshot,
                    "page_url": self.page.url if self.page else None
                },
                success=False,
                error=str(e)
            )
