# MentorHub — API v1 (mobile)

API REST pública para consumo pelo app mobile (alunos). Todas as rotas ficam sob
`/api/v1`, retornam JSON e usam **JWT Bearer** para autenticação.

- **Base URL**: a mesma do site (ex.: `https://mentorhub.com.br`). Em desenvolvimento local: `http://<ip-da-máquina>:3000`.
- **Auth**: `Authorization: Bearer <token>` — token HS256 emitido no login, válido por **30 dias**.
- **Erros**: sempre `{ "error": "mensagem em pt-BR" }` com o status HTTP adequado. Rotas-chave também devolvem **`code`** estável para decisões do app (`RATE_LIMITED`, `INVALID_CREDENTIALS`, `BLOCKED`, `MFA_REQUIRED`, `VALIDATION`, `PAID_COURSE`, `COURSE_NOT_FOUND`, `MENTOR_NOT_FOUND`, `SELF_BOOKING`, `PAST_SLOT`, `SLOT_UNAVAILABLE`, `SLOT_TAKEN`) — o texto pode mudar, o código não.
- **429**: vem com `Retry-After` (segundos) e `code: "RATE_LIMITED"` (login tem limite de 10 tentativas/5 min por IP).
- **Cache**: GETs públicos de catálogo (`/courses`, `/mentors`, `/library`) com token AUSENTE respondem `Cache-Control: public, max-age=30, stale-while-revalidate=120`; com token, `no-store` (dados personalizados).
- **CORS**: liberado (`*`) — o app nativo não precisa, mas o Expo Go/web sim.
- **URLs**: todos os campos de imagem/PDF/anexo voltam **absolutos** (o app não precisa montar nada).

Segredo do token: variável `MOBILE_JWT_SECRET` no `.env` do servidor (fallback: `NEXTAUTH_SECRET`).

---

## Auth

### `POST /api/v1/auth/login`
Body: `{ "email": "ana@demo.com", "password": "demo123" }`

`200` →
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "cmf...", "name": "Ana", "email": "ana@demo.com",
    "bio": "...", "avatarUrl": "https://.../uploads/....webp",
    "xp": 120, "studyStreak": 3, "longestStreak": 5,
    "role": "USER", "isMentor": false
  }
}
```
`401` credenciais erradas (`INVALID_CREDENTIALS`) · `403` conta bloqueada (`BLOCKED`) **ou** com 2FA ativo (`MFA_REQUIRED`; v1 não suporta TOTP — usar o site) · `429` limite de tentativas (`RATE_LIMITED` + `Retry-After`).

### `GET /api/v1/auth/me` *(Bearer)*
`200` → `{ "user": { ...mesmos campos, "creditCents": 0, "unreadNotifications": 2 } }`

---

## Biblioteca (livros e artigos)

### `GET /api/v1/library?kind=BOOK|ARTICLE&q=&category=&page=1&pageSize=20` *(Bearer)*
`200` →
```json
{
  "items": [{
    "id": "...", "kind": "BOOK", "title": "...", "description": "...",
    "category": "Tecnologia", "level": "INICIANTE",
    "coverUrl": "https://.../uploads/....webp", "readingMin": 15,
    "createdAt": "2025-11-01T12:00:00.000Z",
    "mentor": { "id": "...", "name": "Carlos", "avatarUrl": "https://..." }
  }],
  "page": 1, "pageSize": 20, "total": 12, "hasMore": false
}
```

### `GET /api/v1/library/:id` *(Bearer)*
`200` → card + `"pdfUrl": "https://.../uploads/livro.pdf"` (livros) ou `"content": "<texto>"` (artigos), `"mentor": { ..., "headline": "..." }`.
`404` se não existir/não publicado.

---

## Cursos

### `GET /api/v1/courses?q=&category=&level=&page=1` *(Bearer)*
`200` →
```json
{
  "items": [{
    "id": "...", "title": "...", "description": "...",
    "category": "Tecnologia", "level": "INICIANTE", "price": 0,
    "coverUrl": "https://...",
    "lessonCount": 8, "totalDurationMin": 120, "liveCount": 1,
    "mentorshipCount": 2, "studentCount": 34, "rating": 4.8, "reviewCount": 12,
    "mentor": { "id": "...", "name": "...", "headline": "...", "rating": 4.9, "avatarUrl": "..." },
    "enrolled": true
  }],
  "page": 1, "pageSize": 20, "total": 9, "hasMore": false
}
```

### `GET /api/v1/courses/:id` *(Bearer)*
`200` →
```json
{
  "course": { ...card acima },
  "themes": [
    { "id": "...", "title": "Módulo 1", "description": "...", "order": 0, "lessons": [ /* aulas */ ] }
  ],
  "lessons": [ /* aulas sem tema */ ],
  "enrollment": { "completedLessonIds": ["cmf..."], "completedAt": null }
}
```
Aula:
```json
{
  "id": "...", "title": "...", "description": "...", "kind": "RECORDED|TEXT|LIVE",
  "durationMin": 15, "order": 0,
  "videoUrl": "https://youtube.com/...", "content": "texto da aula",
  "startsAt": "2025-12-01T19:00", "meetingUrl": "https://meet...",
  "attachments": [{ "name": "Slides.pdf", "url": "https://.../uploads/..." }],
  "libraryItemId": null, "locked": false
}
```
> `locked: true` quando o aluno não está inscrito — `videoUrl`, `content`, `meetingUrl` e `attachments` vêm `null`/`[]`.
> `enrollment: null` quando não inscrito.

### `POST /api/v1/courses/:id/enroll` *(Bearer)*
`200` → `{ "ok": true, "alreadyEnrolled": false }`
`402` → `{ "error": "Este curso é pago. A compra é feita pelo site do MentorHub.", "price": 189 }`

### `PATCH /api/v1/courses/:id/enroll` *(Bearer)* — toggle de conclusão de aula
Body: `{ "lessonId": "cmf..." }`
`200` → `{ "completedLessonIds": ["..."], "xpAwarded": 10, "courseCompleted": false }`
`403` não inscrito · XP: 10/aula, bônus 50 ao concluir 100% (mesma regra do site).

---

## Mentores e sessões 1:1

### `GET /api/v1/mentors?q=&page=1` *(Bearer)*
`200` → `{ "items": [{ "id": "...", "name": "...", "headline": "...", "avatarUrl": "...", "hourlyRate": 120, "categories": ["Tecnologia"], "rating": 5, "reviewCount": 3, "experienceYears": 8 }], ... }` (ordenado por avaliação)

### `GET /api/v1/mentors/:id` *(Bearer)*
`200` → `{ "mentor": { ...card, "description": "...", "languages": ["Português"], "instagram": "...", "linkedin": "...", "website": "..." }, "reviews": [{ "id": "...", "rating": 5, "comment": "...", "author": "Ana", "createdAt": "..." }] }`

### `GET /api/v1/mentors/:id/slots?date=2025-12-01` *(Bearer)*
`200` → `{ "slots": ["09:00", "09:30", "14:00", ...] }` — janelas livres de 30 min (sessão de 60 min), já sem horários passados e sem conflitos com reservas ativas.

### `GET /api/v1/bookings` *(Bearer)*
`200` → `{ "items": [{ "id": "...", "startsAt": "2025-12-01T14:00", "durationMin": 60, "topic": "...", "notes": null, "status": "PENDING|CONFIRMED|COMPLETED|CANCELLED", "meetingRoom": "mentorhub-...", "price": 120, "createdAt": "...", "mentor": { "id": "...", "name": "...", "avatarUrl": "..." }, "reviewed": false }] }`

Opcionalmente paginado: `?page=&pageSize=` (máx. 50) → acrescenta `page/pageSize/total/hasMore`. Sem parâmetros devolve o histórico completo (teto de 500).

### `POST /api/v1/bookings` *(Bearer)*
Body: `{ "mentorId": "...", "startsAt": "2025-12-01T14:00", "durationMin": 60, "topic": "Carreira em dados", "notes": "opcional" }`
`201` → `{ "id": "...", "status": "PENDING", "meetingRoom": "...", "price": 120 }`
`409` horário fora da agenda (`SLOT_UNAVAILABLE`) ou conflito (`SLOT_TAKEN`). A checagem de conflito + criação rodam numa transação serializável — dois alunos competindo pelo mesmo horário nunca reservam os dois.

### `PATCH /api/v1/bookings/:id` *(Bearer)*
Body: `{ "action": "cancel" }` → `200 { "ok": true }` (só o próprio aluno; só PENDING/CONFIRMED).

---

## Home e notificações

### `GET /api/v1/home` *(Bearer)* — BOOTSTRAP em 1 chamada
Junta `auth/me` + contadores + `dashboard` numa única resposta (o app usa no arranque — menos round-trips):
```json
{
  "user": { "id": "...", "name": "Ana", "email": "...", "avatarUrl": "...", "xp": 120,
            "studyStreak": 3, "longestStreak": 5, "role": "USER", "isMentor": false,
            "creditCents": 6000, "unreadNotifications": 2 },
  "unreadMessages": 1,
  "enrolledCourses": [ /* idem dashboard */ ],
  "upcomingBookings": [ /* idem dashboard */ ],
  "newBooks": [ /* idem dashboard */ ],
  "recommendedCourses": [ /* idem dashboard */ ],
  "weeklyGoal": { "targetLessons": 5, "doneLessons": 2 }
}
```

### `GET /api/v1/dashboard` *(Bearer)*
`200` →
```json
{
  "user": { "xp": 120, "studyStreak": 3, "longestStreak": 5 },
  "enrolledCourses": [{ "id": "...", "title": "...", "coverUrl": "...", "category": "...", "progressPct": 40, "completedLessons": 4, "totalLessons": 10 }],
  "upcomingBookings": [ /* mesmos objetos de GET /bookings */ ],
  "newBooks": [ /* cards da biblioteca (BOOK) */ ],
  "recommendedCourses": [ /* cards de cursos não inscritos, mais populares */ ],
  "weeklyGoal": { "targetLessons": 5, "doneLessons": 2 }
}
```

### `GET /api/v1/notifications` *(Bearer)*
`200` → `{ "items": [{ "id": "...", "kind": "booking_confirmed", "title": "...", "body": "...", "readAt": null, "createdAt": "..." }], "unread": 2 }`

Opcionalmente paginado: `?page=&pageSize=` (máx. 50) → acrescenta `page/pageSize/total/hasMore`.

### `GET /api/v1/health` *(público)*
`200` → `{ "ok": true, "service": "mentorhub-v1", "time": "..." }` — batimento p/ o app distinguir "servidor fora do ar" de "servidor antigo".

### `POST /api/v1/notifications` *(Bearer)*
Body: `{ "action": "read-all" }` → `200 { "ok": true }`

---

## App mobile (Expo)

O código do app fica em **`mobile-app/`** (Expo SDK + expo-router + TypeScript):

```bash
cd mobile-app
npm install            # ou bun install / yarn
cp .env.example .env   # e aponte EXPO_PUBLIC_API_URL para a URL da API
npx expo start         # escaneie o QR com o Expo Go (Android/iPhone)
```

Para gerar os binários (APK/IPA): `npx eas build --platform android|ios` (requer conta Expo + Apple Developer para a App Store).

Contas de demonstração: `ana@demo.com` / `demo123` (aluna), `carlos@demo.com` / `demo123` (mentor).
