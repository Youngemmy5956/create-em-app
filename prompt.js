"use strict";

const readline = require("readline");
const { paint, c } = require("./colors");

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise(res => rl.question(question, res));
}

async function askChoice(rl, question, choices) {
  const { log } = require("./colors");
  log();
  log(paint(c.bold, `  ${question}`));
  choices.forEach((ch, i) => log(paint(c.cyan, `    ${i + 1}. ${ch}`)));
  while (true) {
    const ans = (await ask(rl, paint(c.dim, `\n  Enter number (1-${choices.length}): `))).trim();
    const idx = parseInt(ans) - 1;
    if (idx >= 0 && idx < choices.length) return choices[idx];
    log(paint(c.red, `  Please enter a number between 1 and ${choices.length}`));
  }
}

async function askYesNo(rl, question) {
  const ans = (await ask(rl, paint(c.bold, `  ${question} `) + paint(c.dim, "(y/n): "))).trim().toLowerCase();
  return ans === "y" || ans === "yes" || ans === "";
}

module.exports = { createRL, ask, askChoice, askYesNo };
