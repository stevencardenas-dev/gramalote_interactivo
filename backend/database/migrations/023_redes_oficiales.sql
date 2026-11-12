-- Enlaces oficiales de la Alcaldía de Gramalote en el pie de página y número
-- del botón flotante de ayuda por WhatsApp (Páginas › Redes sociales).
INSERT INTO site_settings (setting_key, setting_value, description)
VALUES (
  'page:redes',
  '{
    "supportWhatsapp": "573204177123",
    "social": [
      { "id": "instagram", "url": "https://www.instagram.com/alcaldiadegramalote/", "enabled": true },
      { "id": "whatsapp", "url": "https://api.whatsapp.com/send?phone=573204204077&text=%C2%BFTienes%20alguna%20sugerencia%20o%20necesitas%20informaci%C3%B3n%20sobre%20nuestra%20Alcald%C3%ADa%20de%20Gramalote%3F%20%C2%A1Estamos%20aqu%C3%AD%20para%20ayudarte!%20%E2%98%9D%EF%B8%8F", "enabled": true },
      { "id": "tiktok", "url": "https://www.tiktok.com/@alcaldiadegramalote", "enabled": true },
      { "id": "youtube", "url": "https://www.youtube.com/@Alcald%C3%ADadeGramalote", "enabled": true },
      { "id": "x", "url": "https://x.com/AGramalote21539", "enabled": true },
      { "id": "facebook", "url": "", "enabled": false },
      { "id": "linktree", "url": "", "enabled": false },
      { "id": "email", "url": "", "enabled": false }
    ]
  }',
  'Contenido editable de la página redes'
)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
