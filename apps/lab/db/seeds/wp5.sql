INSERT OR IGNORE INTO discovery_sources (id, key, name, base_url, active, config_json) VALUES
  ('discovery-wsss', 'wsss', 'WSSS', 'https://wsss.tistory.com/', 1, '{"requestIntervalMs":2000,"maxArticlesPerRun":200}');

INSERT OR IGNORE INTO tags (id, axis, key, label_ko, label_en, aliases_json) VALUES
  ('tag-technology-svg', 'technology', 'svg', 'SVG', 'SVG', '[]'),
  ('tag-trigger-drag', 'trigger', 'drag', '드래그', 'Drag', '[]'),
  ('tag-section-loading', 'section', 'loading', '로딩', 'Loading', '[]'),
  ('tag-section-slider', 'section', 'slider', '슬라이더', 'Slider', '[]'),
  ('tag-section-button', 'section', 'button', '버튼', 'Button', '[]'),
  ('tag-section-navigation', 'section', 'navigation', '내비게이션', 'Navigation', '[]'),
  ('tag-section-text', 'section', 'text', '텍스트', 'Text', '[]'),
  ('tag-motion-marquee', 'motion', 'marquee', '마키', 'Marquee', '[]');
