PORT ?= 8000

.PHONY: serve
serve:
	@echo "Serving at http://localhost:$(PORT)/"
	python3 -m http.server $(PORT) --bind 127.0.0.1

# Encrypt projects/<slug>/ into projects/vault/. Prompts for the password.
# First time, or to change it: make projects CHANGE_PASSWORD=1
.PHONY: projects
projects:
	@if [ -n "$$PROJECTS_PASSWORD" ]; then pw="$$PROJECTS_PASSWORD"; \
	elif ( : < /dev/tty ) 2>/dev/null; then printf "Projects password: " > /dev/tty; stty -echo < /dev/tty; read pw < /dev/tty; stty echo < /dev/tty; echo > /dev/tty; \
	else echo "No terminal to type a password into. Run this in Terminal, or set PROJECTS_PASSWORD." >&2; exit 1; fi; \
	[ -n "$$pw" ] || { echo "Empty password; nothing built." >&2; exit 1; }; \
	PROJECTS_PASSWORD="$$pw" CHANGE_PASSWORD="$(CHANGE_PASSWORD)" node tools/build-projects.mjs
