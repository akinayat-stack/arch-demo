const canvas = document.getElementById('wafer');
const ctx = canvas.getContext('2d');

function drawWafer(diameterMm, dieAreaMm2, yieldRate) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const R = Math.min(w, h) * 0.42;
  const cx = w / 2;
  const cy = h / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#f4f7ff';
  ctx.fill();
  ctx.strokeStyle = '#2a3f7a';
  ctx.stroke();

  const dieSide = Math.sqrt(dieAreaMm2);
  const scale = (2 * R) / diameterMm;
  const diePx = Math.max(dieSide * scale, 4);

  for (let y = cy - R; y < cy + R; y += diePx) {
    for (let x = cx - R; x < cx + R; x += diePx) {
      const corners = [
        [x, y], [x + diePx, y], [x, y + diePx], [x + diePx, y + diePx]
      ];
      const inWafer = corners.every(([px, py]) => ((px - cx) ** 2 + (py - cy) ** 2) <= R ** 2);
      if (!inWafer) continue;

      const isGood = Math.random() < yieldRate;
      ctx.fillStyle = isGood ? '#7cd992' : '#f08a8a';
      ctx.fillRect(x + 0.5, y + 0.5, diePx - 1, diePx - 1);
    }
  }
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
  document.getElementById('result').textContent = JSON.stringify(data, null, 2);
  drawWafer(payload.waferDiameterMm, payload.dieAreaMm2, data.yield);
}

document.getElementById('calcBtn').addEventListener('click', calculate);
drawWafer(300, 120, 0.8);
