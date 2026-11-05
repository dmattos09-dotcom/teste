# AutoDM: automação de comentários e DMs no Instagram

Funciona como o ManyChat:

1. Alguém comenta a **palavra-chave** (ex.: `QUERO`) no seu post.
2. O sistema **responde o comentário em público** ("Te mandei no direct! 📩"). Ele sorteia entre várias respostas, para parecer natural.
3. Ele também **manda uma DM** com o texto e o **botão de link** que você configurar.
4. Fica tudo salvo no **histórico de leads**, que dá para exportar em CSV.

Extras:
- Você também pode disparar a automação quando a pessoa manda a palavra-chave **no direct**.
- Dá para limitar uma automação a **posts específicos**.

Ele roda de graça na **Vercel**. As palavras-chave você cadastra pelo **painel**, sem mexer em código.

---

## Visão geral da configuração (leva uns 40 minutos)

| # | Onde | O quê |
|---|------|-------|
| 1 | App do Instagram | Deixar a conta como **Profissional** |
| 2 | Meta for Developers | Criar o **app** |
| 3 | Meta for Developers | Gerar o **token** e copiar a **chave secreta** |
| 4 | Vercel | Publicar o sistema |
| 5 | Vercel | Conectar o banco (**Upstash Redis**) |
| 6 | Meta for Developers | Cadastrar o **webhook** |
| 7 | App do Instagram | Liberar o acesso às mensagens |
| 8 | Meta for Developers | Colocar o app em modo **Publicado (Live)** |
| 9 | Painel | Criar a primeira automação e testar |

---

### 1. Conta profissional no Instagram
No Instagram, vá em **Configurações → Tipo de conta e ferramentas → Mudar para conta profissional**. Pode ser **Criador de conteúdo** ou **Empresa**.

### 2. Criar o app na Meta
1. Acesse **developers.facebook.com** e entre com o seu Facebook. Se for a primeira vez, cadastre-se como desenvolvedor (é grátis).
2. Clique em **Meus apps → Criar app**.
3. No caso de uso, escolha **"Gerenciar mensagens e conteúdo no Instagram"** (em inglês: *Manage messaging & content on Instagram*).
4. Dê um nome ao app, por exemplo `AutoDM`, e conclua.

### 3. Token e chave secreta
No painel do app, abra **Instagram → Configuração da API com login do Instagram** (*API setup with Instagram business login*).

1. **Chave secreta do app do Instagram** (*Instagram app secret*): clique em "Mostrar" e copie. Esse valor vai em `IG_APP_SECRET`.
2. Na seção **"Gerar tokens de acesso"**, clique em **Adicionar conta** e entre com o seu Instagram. Depois clique em **Gerar token** e copie. Esse valor vai em `IG_ACCESS_TOKEN`.
   > O token vale 60 dias. O sistema **renova sozinho** toda semana (precisa do banco do passo 5).

Por enquanto, deixe essa página aberta.

### 4. Publicar na Vercel
1. Acesse **vercel.com → Add New → Project** e importe o repositório `dmattos09-dotcom/teste`.
2. Em **Root Directory**, clique em *Edit* e escolha **`autodm`**. Esse passo é importante.
3. Em **Environment Variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `IG_APP_SECRET` | a chave secreta do passo 3 |
   | `IG_ACCESS_TOKEN` | o token do passo 3 |
   | `WEBHOOK_VERIFY_TOKEN` | uma senha inventada, ex.: `minha-senha-webhook-123` |
   | `ADMIN_PASSWORD` | a senha para entrar no painel |
   | `CRON_SECRET` | outra senha inventada (usada na renovação do token) |

4. Clique em **Deploy**. No fim, você recebe um endereço como `https://autodm-xxxx.vercel.app`.

### 5. Conectar o banco (Upstash Redis, grátis)
1. No projeto da Vercel, vá em **Storage → Create Database → Upstash (Redis)**, escolha o plano grátis e conecte ao projeto.
2. As variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` são criadas sozinhas.
3. Vá em **Deployments → ⋯ → Redeploy** para o sistema passar a usar o banco.

> Sem esse passo, as automações somem a cada reinício, e o painel mostra um aviso amarelo.

### 6. Cadastrar o webhook na Meta
Volte à página do passo 3, na seção **"Configurar webhooks"**:
- **URL de callback:** `https://SEU-ENDERECO.vercel.app/api/webhook`
- **Token de verificação:** o mesmo valor de `WEBHOOK_VERIFY_TOKEN`
- Clique em **Verificar e salvar**.
- Na lista de campos, **assine** `comments` e `messages`.

### 7. Liberar as mensagens no Instagram
No app do Instagram, vá em **Configurações → Mensagens e respostas → Ferramentas conectadas** e ative **"Permitir acesso às mensagens"**.

### 8. Colocar o app em modo Publicado
1. No app da Meta, abra **Configurações do app → Básico** e preencha:
   - **URL da Política de Privacidade:** `https://SEU-ENDERECO.vercel.app/privacidade.html` (essa página já vem pronta)
   - Ícone e categoria
2. Salve. Depois, no topo do painel, mude o **Modo do app** de *Desenvolvimento* para **Publicado (Live)**.

> **Sobre a análise da Meta (App Review):** para automatizar a **sua própria conta** (você é o administrador do app), o acesso padrão costuma bastar. Se o teste do passo 9 funcionar com o seu perfil, mas os comentários de **outras pessoas** não chegarem, peça **Acesso Avançado** para `instagram_business_manage_comments` e `instagram_business_manage_messages` em **Análise do app**. A Meta pede um vídeo curto mostrando o fluxo (comentar a palavra-chave e a DM chegar) e uma explicação de uso. A aprovação costuma levar de alguns dias a 2 semanas.

### 9. Primeira automação
1. Abra `https://SEU-ENDERECO.vercel.app` e entre com a `ADMIN_PASSWORD`.
2. Crie uma automação, por exemplo:
   - **Palavras-chave:** `QUERO, eu quero`
   - **Respostas públicas** (uma por linha):
     ```
     Te mandei no direct! 📩
     Corre lá no direct, {nome} 💌
     Enviado! Confere sua DM ✨
     ```
   - **DM:** `Oi {nome}! Aqui está o material que você pediu 👇`
   - **Botão:** `Acessar agora` → `https://seu-link.com`
3. Peça para alguém comentar `quero` num post seu, ou comente com uma segunda conta. O resultado aparece no **Histórico**.

---

## Regras da Meta (valem para qualquer ferramenta, ManyChat incluso)
- É **1 DM automática por comentário**, e só até **7 dias** depois do comentário.
- Depois que a pessoa **responde** a DM, abre uma **janela de 24h** em que dá para conversar à vontade.
- Comentários da sua própria conta são ignorados, assim como webhooks repetidos.
- Evite volume de spam. A Meta tem limites de envio por hora.

## Dicas de conteúdo, para a automação converter
- O CTA tem que estar **na tela e na legenda**: *"Comenta **GUIA** que eu te mando no direct"*.
- Use **uma palavra curta e única** por post (GUIA, ROTEIRO, LISTA). Evite palavras comuns como "sim".
- A DM precisa **entregar na hora** e puxar um próximo passo: *"Me conta: você já grava conteúdo ou tá começando?"*. A resposta abre a janela de 24h.
- O comentário público aumenta o engajamento do post. Por isso vale sortear várias frases diferentes.

## Como achar o ID de um post (para limitar a automação a ele)
Deixe o campo vazio para valer em todos os posts. Se quiser limitar, o ID aparece no **Histórico** (`mediaId`) depois do primeiro comentário naquele post.

## Para desenvolvedores
```
autodm/
├── api/webhook.js        # recebe eventos da Meta (GET = verificação, POST = eventos)
├── api/rules.js          # CRUD das automações (protegido por ADMIN_PASSWORD)
├── api/logs.js           # histórico / leads
├── api/refresh-token.js  # cron semanal que renova o token
├── lib/handler.js        # lógica: casar palavra-chave → responder + DM
├── lib/instagram.js      # chamadas à graph.instagram.com
├── lib/match.js          # normalização (sem acento/caixa) e matching
├── lib/store.js          # Upstash Redis (ou memória, sem config)
└── public/               # painel e política de privacidade
```
Testes: `npm test` (sem dependências, Node 20+).
