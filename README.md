# ArenaHub

Aplicativo web para gestão e agendamento de quadras esportivas de areia, com React, Tailwind CSS, Supabase Auth, Supabase Database e React Query.

## Requisitos

- Node.js 20+
- Projeto Supabase criado
- Chaves `anon` e `service_role` do Supabase

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Copie as variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha `.env.local`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

4. No SQL Editor do Supabase, execute:

```sql
-- conteúdo de supabase/schema.sql
```

5. Depois execute o seed das quadras e horários:

```sql
-- conteúdo de supabase/seed.sql
```

6. Para criar o gestor de exemplo no Supabase Auth, rode:

```bash
npm run seed
```

Credenciais do gestor:

- E-mail: `admin@arenuhub.com`
- Senha: `admin123`

## Rodar localmente

```bash
npm run dev
```

Sem `.env.local`, o app entra em modo demo local automaticamente. Nesse modo, as quadras, horários, reservas e sessão do gestor ficam salvos no `localStorage` do navegador.

Login demo local:

- E-mail: `admin@arenuhub.com`
- Senha: `admin123`

Rotas principais:

- `/` - agendamento público
- `/login` - login do gestor
- `/dashboard` - reservas do gestor
- `/dashboard/courts` - gestão de quadras e horários

## Observações de banco

O arquivo `supabase/schema.sql` cria as tabelas `courts`, `time_slots` e `reservations`, habilita RLS e adiciona um índice único parcial para impedir duas reservas `confirmed` no mesmo `court_id + date + slot_id`.

O WhatsApp é salvo apenas com dígitos e DDI `55`, no formato aceito pelo link `wa.me`.
