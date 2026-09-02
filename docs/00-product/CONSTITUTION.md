# Product Constitution

- **Version:** 0.1
- **Status:** Draft
- **Effective date:** TBD

## Purpose and Trust

Şirket kullanıcılarının Navori QL içeriğini doğal dille fakat en az yetki,
doğrulanmış hedef, açık insan onayı ve tam audit altında yayınlamasını sağlamak.

## Binding Principles

1. Repository tek doğruluk kaynağıdır.
2. Ajanlar belirsizliği gizlemez ve kritik kararı tek başına vermez.
3. MVP kapsamı açık onay olmadan genişletilmez.
4. Güvenlik, gizlilik ve veri minimizasyonu baştan değerlendirilir.
5. Önemli karar ADR olmadan bağlayıcı hale gelmez.
6. Kabul kriteri, uygun testler ve güncel dokümantasyon olmadan iş bitmiş sayılmaz.
7. Model çıktısı güvenilir veya yetkili değildir; backend doğrulaması zorunludur.
8. Gerçek yayın açık yetkili kullanıcı onayı olmadan başlatılamaz.
9. Video içeriği OpenAI'a, Navori secret'ları frontend'e gönderilemez.
10. Destructive Navori işlemleri MVP kapsamına alınamaz.

## Prohibited Practices

- Secret veya gereksiz hassas veriyi repository'ye yazmak.
- Bilinmeyen gereksinimi doğrulanmış gerçek gibi kullanmak.
- Modelin Navori adapter'ını doğrudan çalıştırması.
- Kullanıcı girdisinden dosya yolu veya Navori base URL oluşturmak.
- UI kontrolünü backend yetkilendirmesi yerine kullanmak.
- Varsayılan parola veya gerçek secret commit etmek.

## Amendment Process

Değişiklik ayrı ADR, etki analizi, açık onay ve changelog kaydı gerektirir.
