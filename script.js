const broker = 'wss://broker.emqx.io:8084/mqtt';

const topics = {
  sensor1: 'bru/cba1',
  sensor2: 'bru/cba2'
};

const client = mqtt.connect(broker);

// Gauge dan Chart storage
const panels = {
  sensor1: {
    gauge: null,
    chart: null,
    statusEl: document.getElementById('mqtt-status-1'),
    canvasId: 'gaugeCanvas1',
    chartId: 'gaugeChart1',
  },
  sensor2: {
    gauge: null,
    chart: null,
    statusEl: document.getElementById('mqtt-status-2'),
    canvasId: 'gaugeCanvas2',
    chartId: 'gaugeChart2',
  }
};

// Inisialisasi gauge & chart
for (const key in panels) {
  const panel = panels[key];

  panel.gauge = new RadialGauge({
    renderTo: panel.canvasId,
    width: 300,
    height: 300,
    units: "Value",
    title: key.toUpperCase(),
    minValue: 0,
    maxValue: 100,
    majorTicks: ["0", "20", "40", "60", "80", "100"],
    minorTicks: 4,
    strokeTicks: true,
    highlights: [
      { from: 0, to: 50, color: "rgba(74,222,128,0.3)" },
      { from: 50, to: 80, color: "rgba(250,204,21,0.3)" },
      { from: 80, to: 100, color: "rgba(248,113,113,0.4)" }
    ],
    colorPlate: "#1f2937",
    colorMajorTicks: "#ccc",
    colorMinorTicks: "#ccc",
    colorTitle: "#fff",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    colorNeedleStart: "rgba(255, 255, 255, 1)",
    colorNeedleEnd: "rgba(255, 255, 255, .9)",
    animationRule: "bounce",
    animationDuration: 500,
    value: 0
  }).draw();

  const ctx = document.getElementById(panel.chartId).getContext('2d');
  panel.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        fill: true,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: '#333' } },
        x: { ticks: { color: '#ccc' }, grid: { display: false } }
      }
    }
  });
}

// MQTT Events
client.on('connect', () => {
  console.log('Connected to broker');

  for (const key in topics) {
    const topic = topics[key];
    client.subscribe(topic);
    panels[key].statusEl.innerHTML =
      `<span class="inline-block px-3 py-1 rounded-full bg-green-500 text-white">Connected</span>`;
  }
});

client.on('message', (topic, message) => {
  for (const key in topics) {
    if (topics[key] === topic) {
      const value = parseFloat(message.toString());
      const panel = panels[key];

      if (!isNaN(value)) {
        panel.gauge.value = value;
        const time = new Date().toLocaleTimeString();
        panel.chart.data.labels.push(time);
        panel.chart.data.datasets[0].data.push(value);
        if (panel.chart.data.labels.length > 20) {
          panel.chart.data.labels.shift();
          panel.chart.data.datasets[0].data.shift();
        }
        panel.chart.update();
      }
    }
  }
});

// Tombol kontrol
function sendControl(sensorKey, command) {
  const controlTopic = `kontrol/${sensorKey}`;
  client.publish(controlTopic, command);
  console.log(`Kirim ke ${controlTopic}: ${command}`);
}
