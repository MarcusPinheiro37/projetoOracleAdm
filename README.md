# Projeto Oracle ADM - Oracle Free 23ai com ORDS e Dashboard de Monitoramento

## Descrição

Este repositório reúne um ambiente local de **Oracle Database Free 23ai** com **ORDS** executado via container e um **dashboard web simples** para monitorar estatísticas atuais do banco Oracle.

A solução foi organizada para um contexto acadêmico/demonstrativo. O fluxo principal é:

```text
Oracle Free 23ai
  -> views administrativas do Oracle
  -> endpoints REST publicados pelo ORDS
  -> dashboard HTML/CSS/JavaScript
  -> atualização periódica das métricas
```

O projeto resolve o problema de demonstrar, de forma simples, como consultar métricas administrativas do Oracle e apresentá-las em uma interface web sem criar um backend adicional em Node.js, Python, Java ou Go. A camada de API é feita pelo próprio **Oracle REST Data Services (ORDS)**.

## Estrutura do Projeto

```text
projetoOracleAdm/
├── README.md
├── Premissa.md
├── free-full-23ai/
│   ├── compose/
│   │   ├── compose.yaml
│   │   └── install_container.log
│   ├── containerfile/
│   │   └── Containerfile
│   ├── manual/
│   │   └── comandos.md
│   └── script/
│       ├── down.sh
│       └── up.sh
└── monitor-oracle/
    ├── README.md
    ├── docs/
    │   ├── Passos.md
    │   ├── metricas.md
    │   └── roteiro_apresentacao.md
    ├── sql/
    │   ├── configuracao_ords.sql
    │   ├── consultas_monitoramento.sql
    │   └── grants_monitoramento.sql
    └── web/
        ├── app.js
        ├── index.html
        └── style.css
```

Principais responsabilidades:

- `free-full-23ai/`: arquivos para subir o Oracle Free 23ai e o ORDS em containers.
- `monitor-oracle/sql/`: scripts SQL para criar o usuário de monitoramento, conceder permissões e publicar endpoints REST no ORDS.
- `monitor-oracle/web/`: frontend estático do dashboard.
- `monitor-oracle/docs/`: roteiro detalhado para configurar o ORDS e explicar a solução.
- `Premissa.md`: descrição do objetivo acadêmico do dashboard.

## Tecnologias Utilizadas

- **Oracle Database Free 23ai**: banco de dados monitorado.
- **Oracle REST Data Services (ORDS)**: camada REST usada para expor consultas SQL como endpoints HTTP.
- **Docker Compose**: orquestração principal dos containers Oracle e ORDS.
- **Docker/Containerfile**: definição da imagem local baseada na imagem oficial do Oracle Database Free.
- **Podman**: alternativa documentada nos scripts `up.sh`, `down.sh` e no manual.
- **SQL/PLSQL**: criação de usuário, permissões e configuração dos endpoints ORDS.
- **HTML, CSS e JavaScript puro**: dashboard web sem dependências de pacote.
- **Fetch API do navegador**: consumo dos endpoints REST do ORDS.

Não foram identificados arquivos de dependências de Node.js, Python, Java, Maven, Gradle ou similares no repositório.

## Pré-requisitos

Para usar o caminho principal com Docker Compose, tenha instalado:

- Docker Desktop ou Docker Engine;
- Docker Compose;
- um navegador web moderno;
- um cliente Oracle, como DBeaver, SQL Developer ou SQL*Plus, para executar os scripts SQL de configuração.

Recomendação de recursos para o ambiente local:

- memória disponível para Docker/WSL: **8 GB ou mais**;
- espaço em disco: **30 GB ou mais**.

Para usar os scripts alternativos em `free-full-23ai/script/`, tenha também:

- Podman;
- Bash.

## Configuração do Ambiente

### 1. Subir Oracle e ORDS com Docker Compose

Acesse a pasta do arquivo `compose.yaml`:

```bash
cd free-full-23ai/compose
```

Suba o ambiente:

```bash
docker compose up -d
```

Na primeira execução, o processo pode demorar porque o Docker precisa baixar/criar imagens, criar volumes, iniciar o banco e aguardar o healthcheck do Oracle antes de iniciar o ORDS.

Verifique o status dos containers:

```bash
docker compose ps
```

Acompanhe os logs do Oracle:

```bash
docker compose logs -f oracle-free-full-23ai
```

Acompanhe os logs do ORDS:

```bash
docker compose logs -f ords
```

### 2. Configuração padrão do banco

O `compose.yaml` configura o Oracle com os seguintes valores locais:

```text
Host externo: localhost
Porta externa Oracle: 1522
Porta interna Oracle: 1521
PDB / Service Name: FREEPDB1
Usuário administrativo: system
Senha administrativa definida no compose: OraclePwd123
URL base do ORDS: http://localhost:8181/ords
```

Para conexão como `SYS`, use a role `SYSDBA` no cliente Oracle.

> Atenção: as senhas presentes no repositório são valores de laboratório/desenvolvimento. Não use esses valores em ambiente compartilhado, público ou de produção. O recomendado é substituir credenciais sensíveis por variáveis de ambiente ou arquivos `.env` não versionados.

### 3. Criar usuário e permissões de monitoramento

Depois que o banco estiver pronto, conecte no Oracle no PDB `FREEPDB1` como usuário administrativo (`SYSTEM` ou `SYS`) e execute o script:

```text
monitor-oracle/sql/grants_monitoramento.sql
```

Esse script cria o usuário `MONITOR_APP` e concede permissões de leitura em views administrativas usadas pelo dashboard, como `V_$INSTANCE`, `V_$DATABASE`, `V_$SESSION`, `V_$SYSTEM_EVENT`, `V_$SQLAREA` e `DBA_TABLESPACE_USAGE_METRICS`.

### 4. Publicar endpoints no ORDS

Conecte no Oracle como o usuário `MONITOR_APP` e execute:

```text
monitor-oracle/sql/configuracao_ords.sql
```

Esse script habilita o schema `MONITOR_APP` no ORDS e cria o módulo REST `monitor` com os endpoints necessários para o dashboard.

Endpoints criados:

```text
GET http://localhost:8181/ords/monitor_app/monitor/health
GET http://localhost:8181/ords/monitor_app/monitor/stats/instance
GET http://localhost:8181/ords/monitor_app/monitor/stats/database
GET http://localhost:8181/ords/monitor_app/monitor/stats/container
GET http://localhost:8181/ords/monitor_app/monitor/stats/sessions
GET http://localhost:8181/ords/monitor_app/monitor/stats/waits
GET http://localhost:8181/ords/monitor_app/monitor/stats/sql
GET http://localhost:8181/ords/monitor_app/monitor/stats/tablespaces
```

O arquivo `monitor-oracle/docs/Passos.md` contém um roteiro detalhado e comandos individuais para essa configuração.

### 5. Variáveis de ambiente e configurações importantes

Não foi identificado arquivo `.env` no repositório.

As principais variáveis/configurações aparecem diretamente no Docker Compose e nos scripts:

| Nome | Onde aparece | Função | Valor padrão identificado |
| --- | --- | --- | --- |
| `ORACLE_PWD` | `compose.yaml`, `Containerfile`, `up.sh` | Senha administrativa do Oracle | `OraclePwd123` |
| `ORACLE_PDB` | `compose.yaml`, `Containerfile`, `up.sh` | Nome do PDB/service | `FREEPDB1` |
| `DBHOST` | `compose.yaml` | Host do banco visto pelo ORDS | `oracle-free-full-23ai` |
| `DBPORT` | `compose.yaml` | Porta interna do Oracle | `1521` |
| `DBSERVICENAME` | `compose.yaml` | Service name usado pelo ORDS | `FREEPDB1` |
| `ORDS_PWD` | `compose.yaml` | Senha configurada para ORDS | `OrdsPwd123` |
| `ORACLE_USER_PWD` | `compose.yaml` | Senha de usuário Oracle auxiliar do ORDS | `OracleUserPwd123` |
| `CONTAINER_NAME` | `up.sh`, `down.sh` | Nome do container Podman | `oracle-free-full-23ai` |
| `HOST_PORT` | `up.sh` | Porta externa do Oracle no Podman | `1522` |
| `VOLUME_NAME` | `up.sh`, `down.sh` | Volume de dados do Oracle no Podman | `oracle-free-full-23ai-data` |
| `REMOVE_VOLUME` | `down.sh` | Remove volume no encerramento via Podman | `false` |

## Como Executar

### Opção principal: Docker Compose

```bash
cd free-full-23ai/compose
docker compose up -d
```

Depois, valide:

```bash
docker compose ps
```

Acesse o ORDS no navegador:

```text
http://localhost:8181/ords
```

Após configurar o usuário `MONITOR_APP` e os endpoints ORDS, abra o dashboard:

```text
monitor-oracle/web/index.html
```

O dashboard consome a API configurada em `monitor-oracle/web/app.js`:

```text
http://localhost:8181/ords/monitor_app/monitor
```

Se o navegador bloquear as chamadas por CORS ao abrir o frontend por uma origem diferente, configure as origens permitidas no ORDS conforme documentado em `monitor-oracle/docs/Passos.md`.

### Opção alternativa: Podman

O repositório também inclui scripts para subir somente o Oracle com Podman, sem Docker Compose e sem ORDS:

```bash
bash free-full-23ai/script/up.sh
```

Para parar o container:

```bash
bash free-full-23ai/script/down.sh
```

Para remover também o volume de dados ao parar:

```bash
REMOVE_VOLUME=true bash free-full-23ai/script/down.sh
```

Também há um comando manual equivalente em:

```text
free-full-23ai/manual/comandos.md
```

> Observação: a opção Podman documentada no repositório sobe o banco Oracle. O dashboard completo depende do ORDS e dos endpoints REST configurados.

## Como Testar

Não foram identificados testes automatizados no repositório.

Validações manuais recomendadas:

1. Verificar os containers:

   ```bash
   cd free-full-23ai/compose
   docker compose ps
   ```

2. Confirmar que o Oracle ficou pronto pelos logs:

   ```bash
   docker compose logs -f oracle-free-full-23ai
   ```

3. Confirmar que o ORDS responde no navegador:

   ```text
   http://localhost:8181/ords
   ```

4. Testar o healthcheck da API de monitoramento após executar os scripts SQL:

   ```text
   http://localhost:8181/ords/monitor_app/monitor/health
   ```

5. Testar os endpoints de métricas no navegador ou com `curl`:

   ```bash
   curl http://localhost:8181/ords/monitor_app/monitor/stats/instance
   curl http://localhost:8181/ords/monitor_app/monitor/stats/sessions
   ```

6. Abrir `monitor-oracle/web/index.html` e verificar se os cards e tabelas são preenchidos.

## Como Usar

1. Suba o ambiente Oracle + ORDS com Docker Compose.
2. Aguarde o banco ficar saudável e o ORDS iniciar.
3. Execute `monitor-oracle/sql/grants_monitoramento.sql` como usuário administrativo no PDB `FREEPDB1`.
4. Execute `monitor-oracle/sql/configuracao_ords.sql` conectado como `MONITOR_APP`.
5. Abra o dashboard em `monitor-oracle/web/index.html`.
6. A interface irá consultar os endpoints ORDS automaticamente.
7. As métricas são atualizadas a cada **10 segundos**.
8. Use o botão **Atualizar agora** para forçar uma nova consulta manual.

O dashboard exibe:

- status da API (`/health`);
- nome e status da instância Oracle;
- nome, modo de abertura e modo de log do banco;
- container atual;
- sessões agrupadas por usuário e status;
- principais eventos de espera;
- SQLs mais custosos por tempo acumulado;
- uso dos tablespaces.

## Principais Arquivos

| Arquivo | Função |
| --- | --- |
| `Premissa.md` | Define o tema, objetivo e escopo acadêmico do dashboard de estatísticas Oracle. |
| `free-full-23ai/compose/compose.yaml` | Orquestra Oracle Free 23ai, ORDS, portas, volumes, variáveis e healthcheck. |
| `free-full-23ai/containerfile/Containerfile` | Imagem local baseada em `container-registry.oracle.com/database/free:latest`. |
| `free-full-23ai/script/up.sh` | Sobe o Oracle com Podman usando variáveis configuráveis. |
| `free-full-23ai/script/down.sh` | Remove o container Podman e opcionalmente o volume de dados. |
| `free-full-23ai/manual/comandos.md` | Documenta o comando manual `podman run`. |
| `monitor-oracle/sql/grants_monitoramento.sql` | Cria o usuário `MONITOR_APP` e concede permissões nas views administrativas. |
| `monitor-oracle/sql/configuracao_ords.sql` | Habilita o schema no ORDS e define os endpoints REST de monitoramento. |
| `monitor-oracle/sql/consultas_monitoramento.sql` | Arquivo identificado no repositório, mas atualmente está vazio. |
| `monitor-oracle/web/index.html` | Estrutura HTML do dashboard. |
| `monitor-oracle/web/style.css` | Estilos visuais do dashboard. |
| `monitor-oracle/web/app.js` | Lógica de consumo dos endpoints, atualização automática e renderização das métricas. |
| `monitor-oracle/docs/Passos.md` | Roteiro detalhado para configurar usuário, grants, ORDS, CORS e endpoints. |
| `monitor-oracle/docs/metricas.md` | Arquivo identificado no repositório, mas atualmente está vazio. |
| `monitor-oracle/docs/roteiro_apresentacao.md` | Arquivo identificado no repositório, mas atualmente está vazio. |

## Observações Importantes

- O Oracle é exposto no host pela porta `1522`, mas dentro da rede Docker usa `1521`.
- O ORDS é exposto no host pela porta `8181` e usa a porta interna `8080` do container.
- O volume `oracle-free-full-23ai-data` preserva os dados do Oracle entre reinicializações do Compose.
- Evite executar `docker compose down -v` sem intenção explícita de apagar volumes, pois isso remove os dados persistidos.
- O dashboard depende de privilégios em views administrativas do Oracle. Se algum endpoint falhar, verifique os grants do usuário `MONITOR_APP`.
- Os endpoints `/stats/sql` e `/stats/tablespaces` podem exigir permissões específicas em `SYS.V_$SQLAREA` e `SYS.DBA_TABLESPACE_USAGE_METRICS`.
- Se o frontend for servido por outra origem, configure CORS no ORDS. O roteiro em `monitor-oracle/docs/Passos.md` mostra uma configuração para `http://localhost:5500` e `http://127.0.0.1:5500`.
- O repositório contém senhas diretamente em arquivos de configuração e scripts SQL. Para uso fora de laboratório local, substitua por variáveis de ambiente, segredos ou arquivos `.env` ignorados pelo Git.
- Não foi identificado pipeline de CI/CD.
- Não foram identificados testes automatizados.
- Não foram identificadas dependências de pacote a instalar para o frontend, pois ele usa HTML, CSS e JavaScript puro.
