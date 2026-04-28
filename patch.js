const fs = require('fs');

// 1. App.jsx - Fix header search and INRED text
let appJsx = fs.readFileSync('src/App.jsx', 'utf8');
appJsx = appJsx.replace(/CORP/g, 'INRED');

appJsx = appJsx.replace(
  /<div className="header-search.*?">([\s\S]*?)<\/div>/,
  '<div className="header-search search-field__row" style={{ width: \\'min(420px, 100%)\\', background: \\'#1e3a8a\\', border: \\'1px solid rgba(255,255,255,.1)\\', borderRadius: 6, padding: \\'6px 12px\\', display: \\'flex\\', alignItems: \\'center\\', gap: 8, transition: \\'all 0.2s ease\\', cursor: \\'text\\' }}>\n              <Search size={14} color="#93c5fd" />\n              <input\n                type="search"\n                placeholder="Buscar tickets, temas..."\n                value={textSearch}\n                onChange={(e) => setTextSearch(e.target.value)}\n                style={{ width: \\'100%\\', background: \\'transparent\\', border: \\'none\\', color: \\'#fff\\', outline: \\'none\\', fontSize: \\'.84rem\\' }}\n              />\n            </div>'
);

fs.writeFileSync('src/App.jsx', appJsx);

// 2. Sidebar.jsx - INRED text
let sidebarJsx = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
sidebarJsx = sidebarJsx.replace(/CORP/g, 'INRED');
fs.writeFileSync('src/components/Sidebar.jsx', sidebarJsx);

// 3. analytics.js - Global search functionality
let analyticsJs = fs.readFileSync('src/lib/analytics.js', 'utf8');

const searchLogic = const baseTickets = data.tickets.filter((ticket) => {\n    let match = matchesTicket(ticket, state, activeFilters, geoFilter, priorityFilter, activeCategory, stopEvents);\n    if (match && state.textSearch) {\n      match = matchesText(ticket, state.textSearch);\n    }\n    return match;\n  });;

const oldLogicBase = const baseTickets = data.tickets.filter((ticket) => matchesTicket(ticket, state, activeFilters, geoFilter, priorityFilter, activeCategory, stopEvents));;

if (analyticsJs.includes(oldLogicBase)) {
  analyticsJs = analyticsJs.replace(oldLogicBase, searchLogic);
}

fs.writeFileSync('src/lib/analytics.js', analyticsJs);
console.log('Modifications completed.');
