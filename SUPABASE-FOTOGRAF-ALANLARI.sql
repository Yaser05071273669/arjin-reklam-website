-- Arjin Reklam: ana sayfa + hizmetler fotoğraf alanları (mevcut SQL'e EK olarak bir kez çalıştırın)
-- Var olan arjin_photo_changes ve depolama bucket'ını değiştirmez.
CREATE TABLE IF NOT EXISTS public.arjin_page_photos (
 page_type text NOT NULL CHECK (page_type IN ('home','services')),
 slot_key text NOT NULL CHECK (slot_key IN ('service-01','service-02','service-03','service-04','service-05','service-06')),
 image_path text NOT NULL CHECK (image_path LIKE 'gallery/%'),
 thumb_path text,
 alt_text text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(page_type,slot_key)
);
ALTER TABLE public.arjin_page_photos ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.arjin_page_photos TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.arjin_page_photos TO authenticated;
CREATE POLICY "Arjin public read page photos" ON public.arjin_page_photos
  FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY "Arjin admin insert page photos" ON public.arjin_page_photos
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.arjin_is_photo_admin()));
CREATE POLICY "Arjin admin update page photos" ON public.arjin_page_photos
  FOR UPDATE TO authenticated USING ((SELECT public.arjin_is_photo_admin())) WITH CHECK ((SELECT public.arjin_is_photo_admin()));
CREATE POLICY "Arjin admin delete page photos" ON public.arjin_page_photos
  FOR DELETE TO authenticated USING ((SELECT public.arjin_is_photo_admin()));
