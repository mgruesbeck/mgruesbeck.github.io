PORT ?= 8000

.PHONY: serve
serve:
	@echo "Serving at http://localhost:$(PORT)/"
	python3 -m http.server $(PORT) --bind 127.0.0.1

# Export resume/Melvin Gruesbeck.docx to PDF, and copy it to Forager if that project is next door.
FORAGER ?= ../forager/profile/resume.pdf
.PHONY: resume
resume:
	soffice --headless --convert-to pdf --outdir resume "resume/Melvin Gruesbeck.docx" >/dev/null 2>&1
	@echo "Wrote resume/Melvin Gruesbeck.pdf"
	@if [ -d "$(dir $(FORAGER))" ]; then cp "resume/Melvin Gruesbeck.pdf" "$(FORAGER)" && echo "Copied to $(FORAGER)"; fi

# Write each page's Content-Security-Policy again, with the hashes of its inline scripts.
# Run after any edit to an inline <script>; make check fails until you do.
.PHONY: csp
csp:
	@node tools/csp.mjs

# Run the browser checks in tools/check.mjs against a local copy of the site.
# First time: make check-setup
.PHONY: check check-setup
check:
	@node tools/check.mjs $(ONLY)
check-setup:
	cd tools && npm ci --no-audit --no-fund && npx playwright install webkit
