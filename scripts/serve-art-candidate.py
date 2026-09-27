"""Serve a candidate asset overlay on loopback without changing the working game."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class CandidateHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, candidate, **kwargs):
        self.candidate = candidate
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        path = unquote(urlsplit(self.path).path).lstrip('/')
        allowed = (
            not path
            or (not '/' in path and Path(path).suffix in {'.html', '.js', '.css'})
            or path.startswith(('assets/', 'node_modules/three/'))
        )
        if not allowed or '..' in Path(path).parts:
            self.send_error(404)
            return None
        return super().send_head()

    def translate_path(self, path):
        original = Path(super().translate_path(path))
        relative = original.relative_to(ROOT)
        candidate = (self.candidate / relative).resolve()
        if candidate.is_relative_to(self.candidate) and candidate.is_file():
            return str(candidate)
        return str(original)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--port', type=int, default=4184)
    arguments = parser.parse_args()
    candidate = arguments.candidate.resolve(strict=True)
    if not candidate.is_dir() or candidate == ROOT:
        parser.error('--candidate must be a separate existing directory')
    handler = partial(CandidateHandler, candidate=candidate)
    with ThreadingHTTPServer(('127.0.0.1', arguments.port), handler) as server:
        print(f'Candidate preview http://127.0.0.1:{arguments.port}/ from {candidate}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
