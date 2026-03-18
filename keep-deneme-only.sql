-- AVILINGO V2: KEEP 'DENEME' ONLY
-- Bu kod, "DENEME" isminde olmayan TÜM şablonları ve sistemdeki tüm aday sınavlarını siler.
-- Sadece "DENEME" şablonunuz, sorularınız ve kullanıcılarınız kalır.

-- 1. Yabancı anahtar (foreign key) hatalarını önlemek için tüm sınav kayıtlarını siliyoruz.
DELETE FROM exam_answers;
DELETE FROM grades;
DELETE FROM certificates;
DELETE FROM proctoring_events;
DELETE FROM violations;
DELETE FROM exams;

-- 2. İsmi "DENEME" kelimesini içermeyen tüm şablonları siliyoruz!
DELETE FROM exam_templates WHERE name NOT ILIKE '%deneme%';

-- İşlem tamamlandı! Admin panelinizde sadece "DENEME" şablonu kalmış olacak.
