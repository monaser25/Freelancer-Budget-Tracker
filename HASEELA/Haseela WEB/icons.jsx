/* ============================================================
   FlowLedger — icon set (simple stroke line icons)
   <Icon name="..." size={18} />
   ============================================================ */
const FL_ICONS = {
  overview:      '<path d="M3 12l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  transactions:  '<path d="M7 7h12"/><path d="M16 4l3 3-3 3"/><path d="M17 17H5"/><path d="M8 14l-3 3 3 3"/>',
  invoices:      '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  clients:       '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M19 20c0-2.5-1.2-4.6-3-5.5"/>',
  subscriptions: '<path d="M4 9a8 8 0 0 1 13.5-4L20 7"/><path d="M20 4v3h-3"/><path d="M20 15a8 8 0 0 1-13.5 4L4 17"/><path d="M4 20v-3h3"/>',
  analytics:     '<path d="M5 21V11"/><path d="M12 21V4"/><path d="M19 21v-7"/>',
  reports:       '<path d="M6 3h12v18H6z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/>',
  archive:       '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
  settings:      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search:        '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  bell:          '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  plus:          '<path d="M12 5v14"/><path d="M5 12h14"/>',
  sun:           '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:          '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  chevronDown:   '<path d="M6 9l6 6 6-6"/>',
  chevronRight:  '<path d="M9 6l6 6-6 6"/>',
  chevronLeft:   '<path d="M15 6l-6 6 6 6"/>',
  chevronUp:     '<path d="M6 15l6-6 6 6"/>',
  x:             '<path d="M18 6L6 18M6 6l12 12"/>',
  edit:          '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash:         '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  more:          '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  check:         '<path d="M20 6L9 17l-5-5"/>',
  arrowUp:       '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown:     '<path d="M12 5v14M5 12l7 7 7-7"/>',
  arrowUpRight:  '<path d="M7 17L17 7M7 7h10v10"/>',
  wifiOff:       '<path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M2 8.8A15 15 0 0 1 7 6"/><path d="M19 12.5a10 10 0 0 0-3-2.2"/><path d="M22 8.8a15 15 0 0 0-5-2.6"/><path d="M12 20h.01"/>',
  mail:          '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  lock:          '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye:           '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:        '<path d="M2 2l20 20"/><path d="M6.7 6.7C4 8.3 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.5-1.1"/><path d="M9.9 5.2A10 10 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-2.4 3.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  calendar:      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  filter:        '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  download:      '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  send:          '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  logout:        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  user:          '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  card:          '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  sparkle:       '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  command:       '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>',
  menu:          '<path d="M3 6h18M3 12h18M3 18h18"/>',
  panelLeft:     '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  dollar:        '<path d="M12 2v20"/><path d="M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.8 7 7s2.2 3 5 3.5 5 1.5 5 3.5-2.2 3.5-5 3.5-5-1.1-5-3"/>',
  receipt:       '<path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z"/><path d="M9 8h6M9 12h6"/>',
  trendUp:       '<path d="M3 17l6-6 4 4 7-7"/><path d="M17 8h4v4"/>',
  wallet:        '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><circle cx="17" cy="13" r="1.2"/>',
  pie:           '<path d="M12 3v9l8 4"/><path d="M21 12a9 9 0 1 1-9-9"/>',
  refresh:       '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  alert:         '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  info:          '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  building:      '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/>',
  clock:         '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

function Icon({ name, size = 18, stroke = 1.75, style, className }) {
  const path = FL_ICONS[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: path }} />
  );
}

window.Icon = Icon;
window.FL_ICONS = FL_ICONS;
