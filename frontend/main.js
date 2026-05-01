const canvas = document.getElementById('wafer');
const ctx = canvas.getContext('2d');

function formatNum(num, digits = 2) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(num);
}

function drawWafer(diameterMm, dieAreaMm2, yieldRate) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const R = Math.min(w, h) * 0.42;
  const cx = w / 2;
  const cy = h / 2;

  const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.05);
  halo.addColorStop(0, '#1f4ca3');
  halo.addColorStop(1, '#0b1532');
  ctx.beginPath();
  ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#f4f7ff';
  ctx.fill();
  ctx.strokeStyle = '#6f89be';
  ctx.lineWidth = 2;
  ctx.stroke();

  const dieSide = Math.sqrt(dieAreaMm2);
  const scale = (2 * R) / diameterMm;
  const diePx = Math.max(dieSide * scale, 4);

  for (let y = cy - R; y < cy + R; y += diePx) {
    for (let x = cx - R; x < cx + R; x += diePx) {
      const corners = [[x, y], [x + diePx, y], [x, y + diePx], [x + diePx, y + diePx]];
      const inWafer = corners.every(([px, py]) => ((px - cx) ** 2 + (py - cy) ** 2) <= R ** 2);
      if (!inWafer) continue;

      const isGood = Math.random() < yieldRate;
      ctx.fillStyle = isGood ? '#7add9f' : '#ef8d8d';
      ctx.fillRect(x + 0.5, y + 0.5, diePx - 1, diePx - 1);
    }
  }
}

function renderResult(data) {
  const result = document.getElementById('result');
  const yieldPercent = (data.yield || 0) * 100;
  const statusClass = yieldPercent >= 80 ? 'good' : 'bad';
  const statusText = yieldPercent >= 80 ? 'Healthy Yield' : 'Yield Risk';

  result.innerHTML = `
    <div class="metric">
      <div class="label">Cost per Die</div>
      <div class="value">$${formatNum(data.costPerDieUsd, 2)}</div>
    </div>
    <div class="metric">
      <div class="label">Dies per Wafer</div>
      <div class="value">${formatNum(data.diesPerWafer, 2)}</div>
    </div>
    <div class="metric">
      <div class="label">Good Dies per Wafer</div>
      <div class="value">${formatNum(data.goodDiesPerWafer, 2)}</div>
    </div>
    <div class="metric">
      <div class="label">Yield</div>
      <div class="value">${formatNum(yieldPercent, 2)}% <span class="badge ${statusClass}">${statusText}</span></div>
    </div>
    <div class="metric">
      <div class="label">Model Used</div>
      <div class="value">${data.yieldModelUsed}</div>
    </div>
  `;
}

async function calculate() {
  const payload = {
    waferDiameterMm: Number(document.getElementById('waferDiameter').value),
    dieAreaMm2: Number(document.getElementById('dieArea').value),
    defectDensityPerCm2: Number(document.getElementById('defectDensity').value),
    waferCostUsd: Number(document.getElementById('waferCost').value),
    yieldModel: document.getElementById('yieldModel').value
  };

  const response = await fetch('http://localhost:5000/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  renderResult(data);
  drawWafer(payload.waferDiameterMm, payload.dieAreaMm2, data.yield);
}

document.getElementById('calcBtn').addEventListener('click', calculate);
drawWafer(300, 120, 0.8);
