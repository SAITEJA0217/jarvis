import os
import sys
import shutil
import logging
import subprocess

log = logging.getLogger("desktop_skill")

def _chrome_executable() -> str | None:
    if sys.platform == "win32":
        for base in (
            os.environ.get("ProgramFiles", r"C:\Program Files"),
            os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
            os.environ.get("LOCALAPPDATA", ""),
        ):
            if not base:
                continue
            p = os.path.join(base, "Google", "Chrome", "Application", "chrome.exe")
            if os.path.isfile(p):
                return p
    return shutil.which("google-chrome") or shutil.which("chrome")

def open_url_in_chrome(url: str, new_window: bool = True) -> bool:
    """Opens a URL in Chrome."""
    u = url.strip()
    if not u:
        return False
    chrome = _chrome_executable()
    try:
        if chrome:
            args = [chrome]
            if new_window:
                args.append("--new-window")
            args.append(u)
            subprocess.Popen(args, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        else:
            import webbrowser
            webbrowser.open(u)
            return True
    except Exception as e:
        log.warning(f"Could not open {u} in Chrome: {e}")
        return False

def open_chrome() -> bool:
    """Launches Google Chrome."""
    log.info("Launching Chrome...")
    chrome = _chrome_executable()
    try:
        if chrome:
            subprocess.Popen([chrome, "--new-window"], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        else:
            log.warning("Chrome executable not found.")
            return False
    except Exception as e:
        log.warning(f"Could not open Chrome: {e}")
        return False

def open_github() -> bool:
    """Opens GitHub in Chrome."""
    log.info("Opening GitHub...")
    import webbrowser
    return webbrowser.open("https://github.com")

def open_youtube() -> bool:
    """Opens YouTube in Chrome."""
    log.info("Opening YouTube...")
    import webbrowser
    return webbrowser.open("https://youtube.com")

def open_cursor() -> bool:
    """Basic stub for opening Cursor IDE."""
    log.info("Launching Cursor IDE...")
    # This would contain the logic to find and launch cursor
    return True

def open_linkedin() -> bool:
    """Opens LinkedIn in Chrome."""
    log.info("Opening LinkedIn...")
    import webbrowser
    return webbrowser.open("https://linkedin.com")

def open_internlink() -> bool:
    """Opens InternLink in Chrome."""
    log.info("Opening InternLink...")
    import webbrowser
    return webbrowser.open("https://internlink.in")

