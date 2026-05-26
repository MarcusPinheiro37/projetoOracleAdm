# Oracle Free Full 23ai com ORDS/APEX

Este projeto sobe uma instância local do **Oracle Free Full 23ai** com **ORDS 24.4.0** e instalação/configuração do **APEX 24.1.0** via Docker Compose.

---

## Estrutura principal

```text
projetoOracleAdm
│   README.md
│
└───free-full-23ai
    ├───compose
    │   └───compose.yaml
    ├───containerfile
    │   └───Containerfile
    ├───manual
    │   └───comandos.md
    └───script
        ├───down.sh
        └───up.sh
```

---

## Pré-requisitos

Antes de executar, tenha instalado:

- Docker Desktop;
- Docker Compose;
- DBeaver, SQL Developer ou outro cliente Oracle, caso queira acessar o banco.

Recomendação mínima para evitar falhas na instalação do APEX:

```text
Memória Docker/WSL: 8 GB ou mais
Espaço em disco: 30 GB ou mais
```

---

## Como iniciar o projeto

Acesse a pasta do Compose:

```powershell
cd "<CAMINHO_DO_PROJETO>\free-full-23ai\compose"
```

Suba o ambiente:

```powershell
docker compose up
```

Ou em segundo plano:

```powershell
docker compose up -d
```

Na primeira execução, o processo pode demorar, pois o Docker irá:

1. construir/subir a imagem do Oracle;
2. criar a rede e os volumes;
3. iniciar o banco;
4. aguardar o banco ficar pronto;
5. iniciar o ORDS;
6. instalar/configurar o APEX, se necessário.

---

## Como saber se o banco iniciou

Acompanhe os logs:

```powershell
docker compose logs -f oracle-free-full-23ai
```

O banco estará pronto quando aparecer:

```text
DATABASE IS READY TO USE!
```

Para verificar os containers:

```powershell
docker compose ps
```

---

## Acesso ao banco pelo DBeaver/SQL Developer

Use os dados abaixo:

```text
Host: localhost
Porta: 1522
Service Name: FREEPDB1
Usuário: system
Senha: OraclePwd123
```

Para conectar como SYS:

```text
Host: localhost
Porta: 1522
Service Name: FREEPDB1
Usuário: sys
Senha: OraclePwd123
Role: SYSDBA
```

---

## Acesso ao ORDS/APEX

Após o ORDS iniciar corretamente, acesse:

```text
http://localhost:8181/ords
```

Ou:

```text
http://localhost:8181/ords/apex
```

---

## Parar o ambiente

Para parar os containers sem apagar os dados:

```powershell
docker compose down
```

Os dados do banco continuam salvos no volume:

```text
oracle-free-full-23ai-data
```

---

## Subir novamente

Depois de parar, basta executar novamente:

```powershell
docker compose up
```

Ou:

```powershell
docker compose up -d
```

---

## Logs úteis

Logs do banco Oracle:

```powershell
docker compose logs -f oracle-free-full-23ai
```

Logs do ORDS:

```powershell
docker compose logs -f ords
```

Logs do container auxiliar do ORDS:

```powershell
docker compose logs -f init-ords-variables
```

---

## Reset completo do ambiente

Use este comando somente se quiser apagar tudo e começar do zero.

```powershell
docker compose down

docker volume rm ords-config
docker volume rm ords-variables
docker volume rm oracle-free-full-23ai-data

docker compose up --build
```

Esse procedimento remove:

- dados do banco Oracle;
- configuração antiga do ORDS;
- arquivos auxiliares usados na inicialização.

---

## Reset somente do ORDS

Use quando quiser recriar apenas o ORDS, preservando o banco Oracle:

```powershell
docker compose down

docker volume rm ords-config
docker volume rm ords-variables

docker compose up
```

---

## Observações importantes

O Oracle é exposto no Windows pela porta `1522`, mas dentro da rede Docker ele usa a porta `1521`.

Por isso:

```text
DBeaver/Windows: localhost:1522
ORDS/Docker: oracle-free-full-23ai:1521
```

Evite usar:

```powershell
docker compose down -v
```

Esse comando remove todos os volumes do projeto, incluindo o volume de dados do banco.
