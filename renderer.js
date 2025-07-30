window.addEventListener('DOMContentLoaded', async () => {
  await loadDevices();

  document.getElementById('create-fb').addEventListener('click', autocreateFB);
  document.getElementById('create-threads').addEventListener('click', autocreateThreads);
});

const logSection = document.getElementById('log-section');
const outputMap = {};
let deviceList = [];

async function loadDevices() {
  const devices = await window.electronAPI.getDeviceConfigs();
  const list = document.getElementById('device-list');
  list.innerHTML = '';
  logSection.innerHTML = '';
  deviceList = devices;

  if (devices.length === 0) {
    list.innerHTML = '<li><em>No devices connected</em></li>';
    return;
  }

  devices.forEach((d, idx) => {
    const li = document.createElement('li');
    li.textContent = `#${idx + 1} - ${d.udid} (port: ${d.appiumPort})`;
    list.appendChild(li);

    const container = document.createElement('div');
    container.className = 'bg-white rounded-lg shadow overflow-hidden';
    container.innerHTML = `
      <div class="bg-gray-100 px-4 py-2 font-semibold">Device ${idx + 1} - ${d.udid}</div>
      <div class="overflow-x-auto max-h-64">
        <table class="w-full text-sm text-left border border-gray-200">
          <thead class="bg-gray-200">
            <tr>
              <th class="border px-2 py-1">#</th>
              <th class="border px-2 py-1">Device</th>
              <th class="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody id="log-table-${d.udid}" class="text-xs">
          </tbody>
        </table>
      </div>
    `;
    logSection.appendChild(container);
    outputMap[d.udid] = document.getElementById(`log-table-${d.udid}`);
  });
}

window.electronAPI.onFBLog((_, message) => {
  const [udid, log] = message.split('::');
  const tbody = outputMap[udid];
  if (!tbody) return;

  const index = tbody.children.length + 1;
  const time = new Date().toLocaleTimeString();
  const isSuccess = log.includes('success') || log.includes('✅');

  const row = document.createElement('tr');
  row.className = isSuccess ? 'bg-green-100' : 'bg-red-100';
  row.innerHTML = `
    <td class="border px-2 py-1">${index}</td>
    <td class="border px-2 py-1">${log}</td>
    <td class="border px-2 py-1">${time}</td>
    <td class="border px-2 py-1">${isSuccess ? 'Live' : 'Fail'}</td>
  `;
  tbody.appendChild(row);
});

async function autocreateFB() {
  // Clear logs and start message
  Object.keys(outputMap).forEach(udid => {
    outputMap[udid].innerHTML = '';
    appendStatus(udid, '⌛ Creating FB...', false);
  });

  await window.electronAPI.startCreateFB();
}

async function autocreateThreads() {
  Object.keys(outputMap).forEach(udid => {
    outputMap[udid].innerHTML = '';
    appendStatus(udid, '⌛ Creating Threads...', false);
  });

  const results = await window.electronAPI.startCreateThreads();

  results.forEach((res, idx) => {
    const udid = deviceList[idx]?.udid;
    if (!udid) return;
    const isSuccess = res.status === 'fulfilled';
    appendStatus(udid, isSuccess ? '✅ Success' : `❌ Failed: ${res.reason}`, isSuccess);
  });
}

function appendStatus(udid, text, isSuccess = true) {
  const tbody = outputMap[udid];
  if (!tbody) return;

  const index = tbody.children.length + 1;
  const time = new Date().toLocaleTimeString();

  const row = document.createElement('tr');
  row.className = isSuccess ? 'bg-green-100' : 'bg-red-100';
  row.innerHTML = `
    <td class="border px-2 py-1">${index}</td>
    <td class="border px-2 py-1">${text}</td>
    <td class="border px-2 py-1">${time}</td>
    <td class="border px-2 py-1">${isSuccess ? 'Live' : 'Fail'}</td>
  `;
  tbody.appendChild(row);
}