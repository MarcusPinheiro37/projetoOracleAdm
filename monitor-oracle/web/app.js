'use strict';

/*
  Ajuste esta constante se o mapping do ORDS for diferente.

  Estrutura esperada:
  http://localhost:8181/ords/{schema_mapping}/{module_base_path}

  Exemplo:
  Schema ORDS: monitor_app
  Module base path: /monitor/
*/
const API_BASE = 'http://localhost:8181/ords/monitor_app/monitor';

const REFRESH_INTERVAL_MS = 10000;

const endpoints = {
  health: '/health',
  instance: '/stats/instance',
  database: '/stats/database',
  container: '/stats/container',
  sessions: '/stats/sessions',
  waits: '/stats/waits',
  sql: '/stats/sql',
  tablespaces: '/stats/tablespaces'
};

let refreshTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('api-base').textContent = API_BASE;

  document
    .getElementById('refresh-button')
    .addEventListener('click', loadDashboard);

  loadDashboard();

  refreshTimer = setInterval(loadDashboard, REFRESH_INTERVAL_MS);
});

async function loadDashboard() {
  setGlobalStatus('loading', 'Atualizando');

  const results = await Promise.allSettled([
    fetchFromOrds(endpoints.health),
    fetchFromOrds(endpoints.instance),
    fetchFromOrds(endpoints.database),
    fetchFromOrds(endpoints.container),
    fetchFromOrds(endpoints.sessions),
    fetchFromOrds(endpoints.waits),
    fetchFromOrds(endpoints.sql),
    fetchFromOrds(endpoints.tablespaces)
  ]);

  const [
    healthResult,
    instanceResult,
    databaseResult,
    containerResult,
    sessionsResult,
    waitsResult,
    sqlResult,
    tablespacesResult
  ] = results;

  updateHealthCard(healthResult);
  updateInstanceCard(instanceResult);
  updateDatabaseCard(databaseResult);
  updateContainerCard(containerResult);

  updateSessionsTable(sessionsResult);
  updateWaitsTable(waitsResult);
  updateSqlTable(sqlResult);
  updateTablespacesTable(tablespacesResult);

  updateLastUpdated();

  const hasError = results.some((result) => result.status === 'rejected');

  if (hasError) {
    setGlobalStatus('warning', 'Parcial');
  } else {
    setGlobalStatus('success', 'Online');
  }
}

async function fetchFromOrds(path) {
  const url = `${API_BASE}${path}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status} ao consultar ${url}`);
  }

  return response.json();
}

function getItems(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [payload];
}

function getFirstItem(payload) {
  const items = getItems(payload);
  return items.length > 0 ? items[0] : {};
}

function getValue(row, ...keys) {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }

    const lowerKey = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(row, lowerKey)) {
      return row[lowerKey];
    }

    const upperKey = key.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(row, upperKey)) {
      return row[upperKey];
    }
  }

  return null;
}

function updateHealthCard(result) {
  const element = document.getElementById('card-health');

  if (result.status === 'rejected') {
    element.textContent = 'Erro';
    return;
  }

  const row = getFirstItem(result.value);
  const status = getValue(row, 'status', 'STATUS');

  element.textContent = status || 'OK';
}

function updateInstanceCard(result) {
  const nameElement = document.getElementById('card-instance-name');
  const statusElement = document.getElementById('card-instance-status');

  if (result.status === 'rejected') {
    nameElement.textContent = 'Erro';
    statusElement.textContent = 'Não foi possível consultar v$instance';
    return;
  }

  const row = getFirstItem(result.value);

  const instanceName = getValue(row, 'instance_name', 'INSTANCE_NAME');
  const status = getValue(row, 'status', 'STATUS');
  const databaseStatus = getValue(row, 'database_status', 'DATABASE_STATUS');

  nameElement.textContent = instanceName || '-';
  statusElement.textContent = `Status: ${status || '-'} | Database: ${databaseStatus || '-'}`;
}

function updateDatabaseCard(result) {
  const nameElement = document.getElementById('card-database-name');
  const modeElement = document.getElementById('card-database-mode');

  if (result.status === 'rejected') {
    nameElement.textContent = 'Erro';
    modeElement.textContent = 'Não foi possível consultar v$database';
    return;
  }

  const row = getFirstItem(result.value);

  const databaseName = getValue(row, 'name', 'NAME');
  const openMode = getValue(row, 'open_mode', 'OPEN_MODE');
  const logMode = getValue(row, 'log_mode', 'LOG_MODE');

  nameElement.textContent = databaseName || '-';
  modeElement.textContent = `Open mode: ${openMode || '-'} | Log mode: ${logMode || '-'}`;
}

function updateContainerCard(result) {
  const element = document.getElementById('card-container');

  if (result.status === 'rejected') {
    element.textContent = 'Erro';
    return;
  }

  const row = getFirstItem(result.value);
  const container = getValue(row, 'current_container', 'CURRENT_CONTAINER');

  element.textContent = container || '-';
}

function updateSessionsTable(result) {
  const tbody = document.getElementById('sessions-table-body');

  if (result.status === 'rejected') {
    renderErrorRow(tbody, 3, 'Erro ao consultar sessões.');
    return;
  }

  const items = getItems(result.value);

  if (items.length === 0) {
    renderEmptyRow(tbody, 3, 'Nenhuma sessão encontrada.');
    return;
  }

  tbody.innerHTML = items
    .map((row) => {
      const username = getValue(row, 'username', 'USERNAME') || '-';
      const status = getValue(row, 'status', 'STATUS') || '-';
      const total = getValue(row, 'total_sessions', 'TOTAL_SESSIONS') || 0;

      return `
        <tr>
          <td>${escapeHtml(username)}</td>
          <td>${escapeHtml(status)}</td>
          <td>${formatNumber(total)}</td>
        </tr>
      `;
    })
    .join('');
}

function updateWaitsTable(result) {
  const tbody = document.getElementById('waits-table-body');

  if (result.status === 'rejected') {
    renderErrorRow(tbody, 3, 'Erro ao consultar waits.');
    return;
  }

  const items = getItems(result.value);

  if (items.length === 0) {
    renderEmptyRow(tbody, 3, 'Nenhum wait encontrado.');
    return;
  }

  tbody.innerHTML = items
    .map((row) => {
      const event = getValue(row, 'event', 'EVENT') || '-';
      const totalWaits = getValue(row, 'total_waits', 'TOTAL_WAITS') || 0;
      const timeWaited = getValue(row, 'time_waited', 'TIME_WAITED') || 0;

      return `
        <tr>
          <td>${escapeHtml(event)}</td>
          <td>${formatNumber(totalWaits)}</td>
          <td>${formatOracleWaitTime(timeWaited)}</td>
        </tr>
      `;
    })
    .join('');
}

function updateSqlTable(result) {
  const tbody = document.getElementById('sql-table-body');

  if (result.status === 'rejected') {
    renderErrorRow(tbody, 5, 'Erro ao consultar SQLs custosos.');
    return;
  }

  const items = getItems(result.value);

  if (items.length === 0) {
    renderEmptyRow(tbody, 5, 'Nenhum SQL encontrado.');
    return;
  }

  tbody.innerHTML = items
    .map((row) => {
      const sqlId = getValue(row, 'sql_id', 'SQL_ID') || '-';
      const executions = getValue(row, 'executions', 'EXECUTIONS') || 0;
      const elapsedTime = getValue(row, 'elapsed_time', 'ELAPSED_TIME') || 0;
      const cpuTime = getValue(row, 'cpu_time', 'CPU_TIME') || 0;
      const bufferGets = getValue(row, 'buffer_gets', 'BUFFER_GETS') || 0;

      return `
        <tr>
          <td><code>${escapeHtml(sqlId)}</code></td>
          <td>${formatNumber(executions)}</td>
          <td>${formatMicroseconds(elapsedTime)}</td>
          <td>${formatMicroseconds(cpuTime)}</td>
          <td>${formatNumber(bufferGets)}</td>
        </tr>
      `;
    })
    .join('');
}

function updateTablespacesTable(result) {
  const tbody = document.getElementById('tablespaces-table-body');

  if (result.status === 'rejected') {
    renderErrorRow(tbody, 3, 'Erro ao consultar tablespaces. Verifique privilégios.');
    return;
  }

  const items = getItems(result.value);

  if (items.length === 0) {
    renderEmptyRow(tbody, 3, 'Nenhum tablespace encontrado.');
    return;
  }

  tbody.innerHTML = items
    .map((row) => {
      const tablespaceName = getValue(row, 'tablespace_name', 'TABLESPACE_NAME') || '-';
      const usedPercentRaw = getValue(row, 'used_percent', 'USED_PERCENT') || 0;
      const usedPercent = Number(usedPercentRaw);

      return `
        <tr>
          <td>${escapeHtml(tablespaceName)}</td>
          <td>${formatPercent(usedPercent)}</td>
          <td>
            <div class="progress">
              <div class="progress-bar" style="width: ${clamp(usedPercent, 0, 100)}%"></div>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderErrorRow(tbody, colspan, message) {
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="table-message table-error">${escapeHtml(message)}</td>
    </tr>
  `;
}

function renderEmptyRow(tbody, colspan, message) {
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="table-message">${escapeHtml(message)}</td>
    </tr>
  `;
}

function setGlobalStatus(type, text) {
  const element = document.getElementById('status-pill');

  element.className = 'status-pill';

  if (type === 'success') {
    element.classList.add('status-success');
  } else if (type === 'warning') {
    element.classList.add('status-warning');
  } else if (type === 'error') {
    element.classList.add('status-error');
  } else {
    element.classList.add('status-loading');
  }

  element.textContent = text;
}

function updateLastUpdated() {
  const element = document.getElementById('last-updated');

  const now = new Date();

  element.textContent = now.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return '-';
  }

  return number.toLocaleString('pt-BR');
}

/*
  Em algumas views Oracle, elapsed_time e cpu_time em v$sqlarea
  são retornados em microssegundos.
*/
function formatMicroseconds(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return '-';
  }

  const seconds = number / 1_000_000;

  return `${seconds.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}s`;
}

/*
  Em v$system_event, time_waited costuma ser medido em centésimos de segundo.
  Por isso, dividimos por 100 para exibir uma leitura mais amigável.
*/
function formatOracleWaitTime(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return '-';
  }

  const seconds = number / 100;

  return `${seconds.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}s`;
}

function formatPercent(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return '-';
  }

  return `${number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function clamp(value, min, max) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return min;
  }

  return Math.min(Math.max(number, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}