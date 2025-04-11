const broker = 'wss://broker.emqx.io:8084/mqtt';
const topic = 'bru/cba';
let currentValue = 0;

// Inisialisasi Gauge
const gauge = new RadialGauge({
  renderTo: 'gaugeCanvas',
  width: 300,
  height: 300,
  units: "Value",
  title: "Sensor",
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

// Inisialisasi Chart
const ctx = document.getElementById('gaugeChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Data Sensor',
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
      y: {
        beginAtZero: true,
        ticks: { color: '#ccc' },
        grid: { color: '#333' }
      },
      x: {
        ticks: { color: '#ccc' },
        grid: { display: false }
      }
    }
  }
});

// Koneksi MQTT
const client = mqtt.connect(broker);
const mqttStatus = document.getElementById('mqtt-status');

client.on('connect', () => {
  console.log('Terhubung ke MQTT broker');
  mqttStatus.innerHTML =
    `<span class="inline-block px-3 py-1 rounded-full bg-green-500 text-white">Connected</span>`;
  client.subscribe(topic, (err) => {
    if (!err) {
      document.getElementById('topic-label').innerText = topic;
    }
  });
});

client.on('close', () => {
  mqttStatus.innerHTML =
    `<span class="inline-block px-3 py-1 rounded-full bg-red-500 text-white">Disconnected</span>`;
});

client.on('error', (err) => {
  console.error('MQTT Error:', err);
  mqttStatus.innerHTML =
    `<span class="inline-block px-3 py-1 rounded-full bg-red-500 text-white">Error</span>`;
});

client.on('message', (topic, message) => {
  const newValue = parseFloat(message.toString());
  gauge.value = newValue;
  currentValue = newValue;

  // Update grafik
  const timeLabel = new Date().toLocaleTimeString();
  chart.data.labels.push(timeLabel);
  chart.data.datasets[0].data.push(newValue);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
});

// Fungsi Kirim Kontrol
function sendControl(command) {
  const controlTopic = 'kontrol/perangkat';
  client.publish(controlTopic, command);
  console.log(`Kirim ke ${controlTopic}: ${command}`);
}
