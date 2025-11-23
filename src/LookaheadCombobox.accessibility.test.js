// Basic accessibility checks for LookaheadCombobox (no Jest; run via node)
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToString } from 'react-dom/server';
import LookaheadCombobox from './LookaheadCombobox.jsx';

function assert(cond, msg){ if(!cond) throw new Error(msg); }

// Render static (no queries triggered because jsdom lacks fetch by default)
const html = renderToString(<LookaheadCombobox endpoint="/lookup/operators" value={null} placeholder="Type..." />);
const dom = new JSDOM(`<body>${html}</body>`);
const input = dom.window.document.querySelector('input[role="combobox"]');
assert(input, 'Combobox input not found');
assert(input.getAttribute('aria-autocomplete')==='list', 'aria-autocomplete incorrect');
assert(input.getAttribute('aria-expanded')==='false' || input.getAttribute('aria-expanded')==='true', 'aria-expanded missing');
console.log(JSON.stringify({ combobox_accessibility:'ok' }));