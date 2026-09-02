# 3D Web Experience Profile — Pozitif AI – Navori Publisher

- **Profile:** CDSK 3D Web Experience Standard v1.0-draft
- **Canonical reference:** `standard/12-3d-web-experience/STANDARD.md`
- **Profile status:** Proposed until the related ADR is accepted

Bu belge, 3D web deneyimi profilinin bu projedeki uygulama kaydıdır. Proje
bilgileri doğrulanmadan teknoloji, içerik, asset veya dönüşüm hedefi tahmin
edilmez; bilinmeyenler `TBD`, geçersiz alanlar gerekçeli `N/A` olur.

## Project brief

- **Project name:** Pozitif AI – Navori Publisher
- **Brand:** TBD
- **Sector:** TBD
- **Problem:** TBD
- **Target users:** TBD
- **Products/services:** TBD
- **Primary conversion:** TBD
- **Brand character:** TBD
- **Palette and typography:** TBD
- **References:** TBD
- **Available 3D/media assets:** TBD

## Experience concept

- **Concept name:** TBD
- **Core metaphor:** TBD
- **Main 3D object/scene:** TBD
- **User journey:** TBD
- **Scroll story and camera journey:** TBD
- **Scene transitions:** TBD
- **Final CTA scene:** TBD

## Scene map

| Scene                        | Purpose | 3D/DOM relationship | CTA/content | Status |
| ---------------------------- | ------- | ------------------- | ----------- | ------ |
| Entry / Hero                 | TBD     | TBD                 | TBD         | TBD    |
| Brand Story                  | TBD     | TBD                 | TBD         | TBD    |
| Products / Services          | TBD     | TBD                 | TBD         | TBD    |
| How It Works                 | TBD     | TBD                 | TBD         | TBD    |
| Proof / References / Data    | TBD     | TBD                 | TBD         | TBD    |
| Final Transformation         | TBD     | TBD                 | TBD         | TBD    |
| Contact / Reservation / Demo | TBD     | TBD                 | TBD         | TBD    |

## Architecture decisions

- **Framework/runtime:** TBD; record in ADR before binding.
- **Render standard:** WebGL 2 + Three.js + React Three Fiber + Drei + GLSL Shaders.
- **Canvas policy:** Prefer one central Canvas and SceneManager; multiple contexts require justification.
- **WebGL capability/fallback:** WebGL 2 check at startup; controlled WebGL 1 or static fallback: TBD.
- **Context lifecycle:** `webglcontextlost` / `webglcontextrestored` handling: TBD.
- **Renderer config and DPR limits:** Central config: TBD.
- **GPU resource cleanup:** Texture/geometry/material/render-target `dispose()` policy: TBD.
- **3D renderer and asset formats:** TBD.
- **WebGPU:** Optional/experimental only; production must not depend on it.
- **Scroll and animation ownership:** TBD; avoid dual ownership of one timeline.
- **State and content source:** TBD.
- **Analytics provider:** TBD; use an adapter.
- **Deployment and hosting:** TBD.
- **Security/privacy/form retention:** TBD; evaluate before implementation.

## Performance and fallback contract

- **High / Medium / Low thresholds:** TBD
- **Adaptive DPR and asset policy:** TBD
- **Mobile experience:** TBD
- **WebGL/reduced-motion fallback:** TBD
- **Loading/error experience:** TBD
- **Performance budget and measurement:** TBD
- **Real-device coverage:** Mobile Safari and low-GPU Android: TBD

## Acceptance checklist

- [ ] Marka ilk birkaç saniyede anlaşılır.
- [ ] 3D sahne anlatının anlamlı parçası.
- [ ] Scroll hikâyesi kontrol edilebilir ve kesintisiz.
- [ ] Mobil deneyim ayrı yorumlanmış.
- [ ] Low/Fallback ve reduced-motion deneyimleri çalışıyor.
- [ ] Canvas dışında semantik ve SEO uyumlu içerik var.
- [ ] Navigasyon, CTA ve form 3D'den bağımsız çalışıyor.
- [ ] İçerik, token'lar ve asset'ler merkezi kaynaklardan değiştirilebilir.
- [ ] Form validation, gizlilik ve hata/başarı durumları doğrulandı.
- [ ] Responsive, tarayıcı, gerçek mobil, klavye ve performans kontrolleri kaydedildi.

## Open questions and risks

- **Open questions:** TBD
- **Technical risks:** TBD
- **Performance risks:** TBD
- **Accessibility/SEO risks:** TBD
- **Required approvals:** TBD
