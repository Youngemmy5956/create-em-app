"use strict";

const c = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  red:     "\x1b[31m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  cyan:    "\x1b[36m",
  magenta: "\x1b[35m",
};

const paint  = (col, t)  => `${col}${t}${c.reset}`;
const log    = (msg = "") => console.log(msg);
const info   = (msg)     => log(paint(c.cyan,            `  ${msg}`));
const ok     = (msg)     => log(paint(c.green,           `  ✅ ${msg}`));
const warn   = (msg)     => log(paint(c.yellow,          `  ⚠️  ${msg}`));
const step   = (msg)     => log(paint(c.magenta + c.bold, `\n  ▶ ${msg}`));
const header = (msg)     => log(paint(c.cyan + c.bold,   msg));
const spin   = (msg)     => process.stdout.write(paint(c.yellow, `  ⏳ ${msg}...`));
const done   = ()        => process.stdout.write(paint(c.green,  " done\n"));

module.exports = { c, paint, log, info, ok, warn, step, header, spin, done };
