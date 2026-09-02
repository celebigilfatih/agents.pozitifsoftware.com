# Integrations

| Integration             | Purpose                                       | Owner                | Contract                                                         | Failure/fallback                                                |
| ----------------------- | --------------------------------------------- | -------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| OpenAI Responses API    | Türkçe talimatı strict intent'e dönüştürmek   | Backend AI adapter   | Official Responses API + versioned JSON schema                   | Key yoksa deterministic local parser/mock; yayın yetkisi vermez |
| Navori QL Server        | Group/player/playlist/media/publish işlemleri | Typed Navori adapter | Official REST API/API Addon; tenant contract doğrulaması gerekli | Varsayılan Mock adapter; real mod readiness `503` verir         |
| PostgreSQL              | Domain, audit ve önerilen queue kalıcılığı    | Data layer           | Versioned SQL migrations                                         | Readiness fail; mutasyon reddedilir                             |
| Local persistent volume | Geçici video                                  | Storage adapter      | Server-generated storage key                                     | Disk/retention alarmı; yeni upload kontrollü reddedilebilir     |

## Verified references

- Navori resmi dokümanı REST/JSON API ve API Addon gereksinimini doğrular:
  <https://na.navori.com/navoriservice/apidocumentation/>
- Navori SaaS sözleşmesi `GetToken`, token header'ı, `UploadFile`,
  `SetPlaylists` ve `PublishContent` payload'larını doğrular:
  <https://saas.navori.com/NavoriService/APIDocumentation/>
- OpenAI resmi Responses API referansı strict structured output kullanımını
  doğrular: <https://developers.openai.com/api/reference/resources/responses/methods/create>

SaaS `PublishContent` sözleşmesinde anlık seçenek `ASAP`, zamanlanmış seçenek
Navori'nin kendi yazımıyla `Defered` değeridir. `PublishedStatus` alanı mevcut
olsa da olası değerleri belgelenmediği için gerçek tenant çıktısıyla doğrulanır.
