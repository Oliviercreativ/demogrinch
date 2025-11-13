-- Migration : Ajout de 3 bons plans pour les boutiques avec demo=true
-- Date : 2025-01-XX
-- Description : Création de 3 bons plans associés aux boutiques démo

-- 1. Bon plan pour Salon Coiffure Élégance (ID: 38)
INSERT INTO banners (
  title,
  description,
  image_url,
  link_url,
  position,
  active,
  public,
  code_promo,
  company_name,
  shop_id,
  start_date,
  end_date,
  featured,
  views,
  clicks
) VALUES (
  'Coupe + Brushing à -20%',
  'Profitez d''une réduction exceptionnelle de 20% sur votre coupe et brushing. Offre valable tous les mardis et mercredis. Réservation recommandée.',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
  '/shop/salon-elegance',
  'bonplan',
  true,
  true,
  'COIFFE20',
  'Salon Coiffure Élégance',
  NULL,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  false,
  0,
  0
);

-- 2. Bon plan pour Boulangerie Artisanale (ID: 39)
INSERT INTO banners (
  title,
  description,
  image_url,
  link_url,
  position,
  active,
  public,
  code_promo,
  company_name,
  shop_id,
  start_date,
  end_date,
  featured,
  views,
  clicks
) VALUES (
  'Pain artisanal -10%',
  'Découvrez nos pains artisanaux avec une réduction de 10% sur tous les produits de boulangerie. Du lundi au vendredi de 8h à 12h.',
  'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=600&fit=crop',
  '/shop/boulangerie-artisanale',
  'bonplan',
  true,
  true,
  'PAIN10',
  'Boulangerie Artisanale',
  NULL,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  false,
  0,
  0
);

-- 3. Bon plan pour Fleurs & Cie (ID: 40) - Featured
INSERT INTO banners (
  title,
  description,
  image_url,
  link_url,
  position,
  active,
  public,
  code_promo,
  company_name,
  shop_id,
  start_date,
  end_date,
  featured,
  views,
  clicks
) VALUES (
  'Bouquet surprise -15%',
  'Surprenez vos proches avec un magnifique bouquet de fleurs fraîches. Réduction de 15% sur tous nos bouquets. Livraison gratuite à partir de 30€.',
  'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&h=600&fit=crop',
  '/shop/fleurs-cie',
  'bonplan',
  true,
  true,
  'FLEURS15',
  'Fleurs & Cie',
  NULL,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true,
  0,
  0
);

-- Vérification des insertions
SELECT 
  id,
  title,
  code_promo,
  company_name,
  position,
  active,
  public,
  featured,
  start_date,
  end_date
FROM banners
WHERE code_promo IN ('COIFFE20', 'PAIN10', 'FLEURS15')
ORDER BY created_at DESC;

