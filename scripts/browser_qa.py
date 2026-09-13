from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "evidence"
EVIDENCE.mkdir(exist_ok=True)


def assert_no_horizontal_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), (
        f"horizontal overflow at {page.viewport_size}"
    )


def assert_button_targets(page):
    small = page.locator("button").evaluate_all(
        "buttons => buttons.filter(button => { "
        "const rect = button.getBoundingClientRect(); "
        "return rect.width && rect.height && (rect.width < 48 || rect.height < 48); "
        "}).map(button => ({ label: button.innerText, width: button.getBoundingClientRect().width, "
        "height: button.getBoundingClientRect().height }))"
    )
    assert not small, f"buttons below 48 CSS px: {small}"


def press_slots(page, indices, prefix="quantity"):
    for index in indices:
        page.locator(f'[data-prefix="{prefix}"][data-slot="{index}"]').click()


def main():
    errors = []
    with sync_playwright() as playwright:
        chrome_path = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=str(chrome_path) if chrome_path.exists() else None,
        )
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:4173", wait_until="networkidle")
        assert page.get_by_role("heading", name="Let’s make ten.").is_visible()
        assert_button_targets(page)
        page.get_by_role("button", name="Start the lesson").click()
        assert page.get_by_role("heading", name="Show 5.").is_visible()
        assert_no_horizontal_overflow(page)
        assert_button_targets(page)

        # Wrong answers get a retry cue and cannot reveal the next-round action.
        press_slots(page, [0])
        page.get_by_role("button", name="Check my set").click()
        assert "need 4 more" in page.locator(".feedback").inner_text()
        assert page.get_by_role("button", name="Next set →").count() == 0
        for index in [1, 2, 3, 4]:
            page.locator(f'[data-prefix="quantity"][data-slot="{index}"]').click()
        page.get_by_role("button", name="Check my set").click()
        assert page.get_by_role("button", name="Next set →").is_visible()
        page.screenshot(path=EVIDENCE / "01-counting.png", full_page=True)
        page.get_by_role("button", name="Next set →").click()

        page.get_by_role("button", name="Check my set").click()
        assert page.get_by_role("button", name="Next set →").is_visible()
        page.get_by_role("button", name="Next set →").click()
        press_slots(page, range(10))
        page.get_by_role("button", name="Check my set").click()
        assert page.get_by_role("button", name="Finish counting →").is_visible()
        page.get_by_role("button", name="Finish counting →").click()
        page.get_by_role("button", name="Continue to make ten").click()

        # Required make-ten examples plus all five rounds.
        assert page.get_by_role("heading", name="7 + ? = 10").is_visible()
        press_slots(page, [7, 8, 9], "bond")
        page.get_by_role("button", name="Check the frame").click()
        assert "7 + 3 = 10" in page.locator(".feedback").inner_text()
        page.screenshot(path=EVIDENCE / "02-make-ten.png", full_page=True)
        page.get_by_role("button", name="Try another pair →").click()
        for index in range(10):
            page.locator(f'[data-prefix="bond"][data-slot="{index}"]').click()
        page.get_by_role("button", name="Check the frame").click()
        assert "0 + 10 = 10" in page.locator(".feedback").inner_text()
        page.get_by_role("button", name="Try another pair →").click()
        for index in range(5, 10):
            page.locator(f'[data-prefix="bond"][data-slot="{index}"]').click()
        page.get_by_role("button", name="Check the frame").click()
        assert "5 + 5 = 10" in page.locator(".feedback").inner_text()
        page.get_by_role("button", name="Try another pair →").click()
        for index in range(2, 10):
            page.locator(f'[data-prefix="bond"][data-slot="{index}"]').click()
        page.get_by_role("button", name="Check the frame").click()
        page.get_by_role("button", name="Try another pair →").click()
        for index in range(1, 10):
            page.locator(f'[data-prefix="bond"][data-slot="{index}"]').click()
        page.get_by_role("button", name="Check the frame").click()
        page.get_by_role("button", name="Finish the pairs →").click()
        page.get_by_role("button", name="Open the story path").click()

        # Check both hint levels and each original story answer.
        answers = [5, 5, 10, 5, 7, 5, 5]
        for story_index, answer in enumerate(answers):
            heading = page.locator(".work-card h2")
            assert heading.is_visible()
            page.get_by_role("button", name="Give me a hint").click()
            page.wait_for_function("document.querySelector('#announcer').textContent.length > 0")
            page.get_by_role("button", name="Show one small step").click()
            page.wait_for_function("document.querySelector('#announcer').textContent.includes(' = ')")

            if story_index == 0:
                page.locator('[data-action="story-up"]').focus()
                page.keyboard.press("Enter")
                assert page.evaluate("document.activeElement.matches('[data-action=story-up]')")
                page.keyboard.press("Enter")
                assert page.evaluate("document.activeElement.matches('[data-action=story-up]')")

            # Use the illustrated story sequence for the final transfer challenge.
            current = int(page.locator(".counter-total").inner_text())
            if story_index == 6:
                for _ in range(4):
                    page.locator('[data-action="story-up"]').click()
                for _ in range(2):
                    page.locator('[data-action="story-down"]').click()
            else:
                while current < answer:
                    page.locator('[data-action="story-up"]').click()
                    current += 1
                while current > answer:
                    page.locator('[data-action="story-down"]').click()
                    current -= 1
            assert int(page.locator(".counter-total").inner_text()) == answer, (
                f"story {story_index}: expected {answer}, tray has {page.locator('.counter-total').inner_text()}"
            )
            page.get_by_role("button", name="Check my answer").click()
            if page.locator(".equation-answer strong").count() == 0:
                raise AssertionError(
                    f"story {story_index}: answer {answer}, feedback={page.locator('.feedback').inner_text()}, "
                    f"tray={page.locator('.counter-total').inner_text()}"
                )
            assert page.locator(".equation-answer strong").inner_text().endswith(f"= {answer}")
            page.wait_for_function("document.querySelector('#announcer').textContent.includes('Your tray shows')")
            if story_index == 0:
                page.screenshot(path=EVIDENCE / "03-story-practice.png", full_page=True)
            next_name = "Try a fresh challenge →" if story_index == 5 else "Next story →"
            if story_index == 6:
                next_name = "See my garden →"
            page.get_by_role("button", name=next_name).click()
        assert page.get_by_role("heading", name="Look what you figured out.").is_visible()

        # Reset/replay and persistence through a page reload.
        page.get_by_role("button", name="Grow another garden").click()
        page.get_by_role("button", name="Start the lesson").click()
        press_slots(page, [0, 1])
        page.reload(wait_until="networkidle")
        assert page.get_by_role("heading", name="Show 5.").is_visible()
        assert page.locator('[data-prefix="quantity"][aria-pressed="true"]').count() == 2
        page.get_by_role("button", name="Start over").click()
        assert page.get_by_role("heading", name="Let’s make ten.").is_visible()

        # Keyboard path: skip link, then start and operate a ten-frame control.
        page.reload(wait_until="networkidle")
        page.keyboard.press("Tab")
        assert page.evaluate("document.activeElement.classList.contains('skip-link')")
        page.keyboard.press("Enter")
        assert page.evaluate("document.activeElement.id === 'app-main'")
        page.keyboard.press("Tab")
        assert page.evaluate("document.activeElement.matches('[data-action=start]')")
        page.keyboard.press("Enter")
        assert page.get_by_role("heading", name="Show 5.").is_visible()
        assert page.locator('[data-prefix="quantity"][data-slot="0"]').is_visible()

        # Reduced-motion preference disables smooth scrolling and long transitions.
        reduced = browser.new_context(
            viewport={"width": 768, "height": 900}, reduced_motion="reduce"
        )
        reduced_page = reduced.new_page()
        reduced_page.goto("http://127.0.0.1:4173", wait_until="networkidle")
        assert_no_horizontal_overflow(reduced_page)
        duration = reduced_page.locator(".progress-track span").evaluate(
            "element => getComputedStyle(element).transitionDuration"
        )
        assert duration in ("1e-05s", "0.00001s", "0.01ms")
        reduced.close()

        # Touch-capable 360px viewport and mobile walkthrough capture.
        mobile = browser.new_context(
            viewport={"width": 360, "height": 800}, is_mobile=True, has_touch=True
        )
        mobile_page = mobile.new_page()
        mobile_page.goto("http://127.0.0.1:4173", wait_until="networkidle")
        assert_no_horizontal_overflow(mobile_page)
        assert_button_targets(mobile_page)
        mobile_page.get_by_role("button", name="Start the lesson").tap()
        assert mobile_page.get_by_role("heading", name="Show 5.").is_visible()
        assert_no_horizontal_overflow(mobile_page)
        mobile_page.locator('[data-prefix="quantity"][data-slot="0"]').tap()
        mobile_page.locator('[data-prefix="quantity"][data-slot="1"]').tap()
        mobile_page.locator('[data-screen="stories"]').tap()
        assert mobile_page.get_by_role("heading", name="Move the counters.").is_visible()
        assert_no_horizontal_overflow(mobile_page)
        assert_button_targets(mobile_page)
        mobile_page.locator('[data-action="story-up"]').tap()
        assert mobile_page.locator(".counter-total").inner_text() == "3"
        mobile_page.screenshot(path=EVIDENCE / "04-mobile-story.png", full_page=True)
        mobile_page.get_by_role("button", name="Start over").tap()
        assert mobile_page.get_by_role("heading", name="Let’s make ten.").is_visible()
        mobile_page.screenshot(path=EVIDENCE / "05-mobile-welcome.png", full_page=True)
        mobile.close()

        assert errors == [], f"browser errors: {errors}"
        chrome_version = browser.version
        browser.close()
    print(
        f"Browser QA passed in Chrome {chrome_version}: math journey, retries, hints, "
        "persistence, keyboard, touch, reduced motion, and 360px viewport."
    )


if __name__ == "__main__":
    main()
