PORT ?= 8000

.PHONY: serve
serve:
	@echo "Serving at http://localhost:$(PORT)/"
	python3 -m http.server $(PORT) --bind 127.0.0.1
