
MOCHA_OPTS= --check-leaks
REPORTER = spec

test:test-integration

test-integration:
	@NODE_ENV=test node test/runner.js
