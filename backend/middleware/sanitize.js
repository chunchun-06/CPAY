'use strict';

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

/**
 * sanitize — Combined middleware array for input sanitization.
 *
 * 1. express-mongo-sanitize: strips keys containing '$' or '.' to prevent
 *    NoSQL injection attacks.
 * 2. xss-clean: strips/escapes HTML tags in req.body, req.query, req.params
 *    to prevent XSS attacks.
 */
const sanitize = [
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      // optionally log attempted injections
    },
  }),
  xss(),
];

module.exports = sanitize;
