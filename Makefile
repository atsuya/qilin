REPORTER = nyan
TESTS = $(shell find test -name "*.test.js" -type f)
LEAKS = 'AggressiveTokenizer, tokenizer, RegexpTokenizer, WordTokenizer, WordPunctTokenizer, TreebankWordTokenizer, $$V, $$M, $$L, $$P'

all: test-all

test-all:
	@NODE_ENV=test QILIN_LOG_LEVEL=error ./node_modules/.bin/parallel-mocha \
		-p 2 \
		$(TESTS)

one:
	@NODE_ENV=test QILIN_LOG_LEVEL=error ./node_modules/.bin/parallel-mocha \
		-p 2 \
		${FILE}

.PHONY: test-all one
