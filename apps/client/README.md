<div align="center" style="margin: 30px;">
<a href="https://refine.dev/">
  <img alt="refine logo" src="https://refine.ams3.cdn.digitaloceanspaces.com/readme/refine-readme-banner.png">
</a>

</br>
</br>

<div align="center">
    <a href="https://refine.dev">Home Page</a> |
    <a href="https://discord.gg/refine">Discord</a> |
    <a href="https://refine.dev/examples/">Examples</a> |
    <a href="https://refine.dev/blog/">Blog</a> |
    <a href="https://refine.dev/docs/">Documentation</a>
</div>
</div>

</br>
</br>

<div align="center"><strong>Build your <a href="https://reactjs.org/">React</a>-based CRUD applications, without constraints.</strong><br>An open source, headless web application framework developed with flexibility in mind.

<br />
<br />

[![Discord](https://img.shields.io/discord/837692625737613362.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/refine)
[![Twitter Follow](https://img.shields.io/twitter/follow/refine_dev?style=social)](https://twitter.com/refine_dev)

<a href="https://www.producthunt.com/posts/refine-3?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-refine&#0045;3" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=362220&theme=light&period=daily" alt="refine - 100&#0037;&#0032;open&#0032;source&#0032;React&#0032;framework&#0032;to&#0032;build&#0032;web&#0032;apps&#0032;3x&#0032;faster | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

</div>

## Try this example on your local

```bash
npm create refine-app@latest -- --example finefoods-material-ui
```

## Try this example on CodeSandbox

<br/>

[![Open finefoods-material-ui example from refine](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/embed/github/refinedev/refine/tree/main/examples/finefoods-material-ui?view=preview&theme=dark&codemirror=1)

## Modulo de agendamento (n8n + Google Agenda)

O modulo foi adicionado na rota `/agendamentos` e envia os agendamentos para um webhook do n8n.

### Variaveis de ambiente

Crie um arquivo `.env` em `workspace-client/apps/client`:

```bash
VITE_N8N_SCHEDULING_WEBHOOK_URL="https://seu-n8n/webhook/agendamentos"
VITE_N8N_WEBHOOK_TOKEN=""
```

- `VITE_N8N_SCHEDULING_WEBHOOK_URL`: webhook que recebe o agendamento no n8n.
- `VITE_N8N_WEBHOOK_TOKEN` (opcional): enviado como `Authorization: Bearer <token>`.

### Payload enviado pelo frontend

```json
{
  "source": "prevent-auto-mecanica-client",
  "sentAt": "2026-02-22T12:00:00.000Z",
  "appointment": {
    "id": "uuid",
    "status": "pending",
    "serviceType": "Revisao preventiva",
    "notes": "Cliente pediu avaliacao completa",
    "startAt": "2026-02-24T15:00:00.000Z",
    "endAt": "2026-02-24T16:00:00.000Z",
    "durationMinutes": 60,
    "timezone": "America/Sao_Paulo"
  },
  "customer": {
    "name": "Nome do cliente",
    "phone": "(62) 99999-9999",
    "email": "cliente@email.com"
  },
  "vehicle": {
    "model": "HB20 1.0",
    "plate": "ABC1D23"
  }
}
```

### Resposta esperada do n8n

Quando o fluxo criar o evento no Google Agenda, retorne JSON com pelo menos um dos campos de evento:

```json
{
  "eventId": "google-calendar-event-id",
  "eventLink": "https://calendar.google.com/calendar/event?eid=...",
  "message": "Evento criado com sucesso"
}
```

Campos aceitos para link/id: `eventId`, `calendarEventId`, `id`, `eventLink`, `calendarEventLink`, `htmlLink`, `webViewLink`.

### Fluxo n8n sugerido

1. `Webhook` (POST) recebe o payload do frontend.
2. `Set` ou `Code` monta os campos do evento (titulo, descricao, inicio e fim).
3. `Google Calendar` cria o evento na agenda desejada.
4. `Respond to Webhook` retorna `eventId`, `eventLink` e `message`.

## Preparacao para backend

O frontend ja esta com camada API-first para `Clientes` e `Agendamentos`, com fallback automatico para `localStorage`.

### Variaveis de ambiente (backend)

```bash
VITE_USE_BACKEND="false"
VITE_BACKEND_API_URL="http://localhost:9090"
VITE_BACKEND_AUTH_TOKEN=""
VITE_GEMINI_API_KEY=""
VITE_GEMINI_MODEL="gemini-1.5-flash"
VITE_GEMINI_PROXY_URL=""
```

- `VITE_USE_BACKEND`: `true` para usar API HTTP; `false` para manter localStorage.
- `VITE_BACKEND_API_URL`: base da API Gateway (sem barra final).
- `VITE_BACKEND_AUTH_TOKEN` (opcional): token estático de desenvolvimento. Em produção o frontend usa `ms-auth` e armazena `accessToken`/`refreshToken` dinamicamente.
- `VITE_GEMINI_API_KEY` (opcional): chave Gemini para analise IA direto no frontend.
- `VITE_GEMINI_MODEL` (opcional): modelo Gemini (default `gemini-1.5-flash`).
- `VITE_GEMINI_PROXY_URL` (opcional): endpoint proxy para Gemini via backend (recomendado em producao).

### Contrato esperado (Auth)

- `POST /auth/login` -> `AuthResponse`
- `POST /auth/signup` -> `AuthResponse`
- `POST /auth/refresh` -> `AuthResponse`
- `POST /auth/logout` -> `204`
- `GET /auth/me` -> `SessionResponse`
- `POST /auth/me/profile-photo` -> `SessionResponse`
- `POST /auth/me/sidebar-image` -> `SessionResponse`
- `POST /auth/me/workshop-logo` -> `SessionResponse`

### Contrato esperado (Clientes)

- `GET /customers` -> `Customer[]` ou `{ "data": Customer[] }`
- `POST /customers` -> `Customer` ou `{ "data": Customer }`
- `PATCH /customers/:id` -> `Customer` ou `{ "data": Customer }` (pode retornar sem body)
- `DELETE /customers/:id` -> `204` ou `200`

### Contrato esperado (Agendamentos)

- `GET /scheduling/appointments` -> `SchedulingAppointment[]` ou `{ "data": SchedulingAppointment[] }`
- `POST /scheduling/appointments` -> `SchedulingAppointment` ou `{ "data": SchedulingAppointment }`
- `PATCH /scheduling/appointments/:id` -> `SchedulingAppointment` ou `{ "data": SchedulingAppointment }` (pode retornar sem body)

### Contrato esperado (Ordens de Servico)

- `GET /service-orders` -> `ServiceOrderRecord[]` ou `{ "data": ServiceOrderRecord[] }`
- `POST /service-orders` -> `ServiceOrderRecord` ou `{ "data": ServiceOrderRecord }`
- `PATCH /service-orders/:id` -> `ServiceOrderRecord` ou `{ "data": ServiceOrderRecord }` (pode retornar sem body)
- `DELETE /service-orders` -> `204` ou `200` para limpar historico

Os tipos completos usados pelo frontend estao em:
- `src/services/customers.ts`
- `src/services/scheduling.ts`
