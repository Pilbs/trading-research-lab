import "./style.css";

import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";

const API_BASE = "http://localhost:3001";

document.querySelector("#app").innerHTML = `
  <main class="research-view">
    <header>
      <div>
        <h1>Trading Research Lab</h1>
        <p id="summary">Loading discovery dataset...</p>
      </div>

      <div class="event-controls">
        <button id="previous-event">Previous</button>
        <span id="event-position">-</span>
        <button id="next-event">Next</button>
      </div>
    </header>

    <section id="chart"></section>

    <section class="event-details">
      <h2>Selected event</h2>
      <pre id="event-details">Loading...</pre>
    </section>
  </main>
`;

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index],
      ])
    );
  });
}

async function loadData() {
  const [csvResponse, eventsResponse] = await Promise.all([
    fetch(`${API_BASE}/api/dataset/discovery`),
    fetch(
      `${API_BASE}/api/events/AAA_TESTING_every_100th_candle`
    ),
  ]);

  if (!csvResponse.ok) {
    throw new Error("Failed to load discovery dataset");
  }

  if (!eventsResponse.ok) {
    throw new Error("Failed to load events");
  }

  const csvText = await csvResponse.text();
  const eventPayload = await eventsResponse.json();

  return {
    candles: parseCsv(csvText),
    eventPayload,
  };
}

function initialiseChart(candles, eventPayload) {
  const container =
    document.querySelector("#chart");

  const chart = createChart(container, {
    autoSize: true,
    height: 600,
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
    layout: {
      background: { type: 'solid', color: '#121212' },
      textColor: '#D1D4DC',
    },
    grid: {
      vertLines: { color: '#2B2B43' },
      horzLines: { color: '#2B2B43' },
    },
  });

  const candleSeries = chart.addSeries(
    CandlestickSeries,
    {
      priceFormat: {
        type: "price",
        precision: 5,
        minMove: 0.00001,
      },
    }
  );

  const chartCandles = candles.map((candle) => ({
    // Lightweight Charts expects Unix seconds.
    time: Math.floor(
      Number(candle.time) / 1000
    ),
    open: Number(candle.mid_open),
    high: Number(candle.mid_high),
    low: Number(candle.mid_low),
    close: Number(candle.mid_close),
  }));

  candleSeries.setData(chartCandles);

  const markers = eventPayload.events.map(
    (event) => ({
      time: Math.floor(event.time / 1000),
      position: "aboveBar",
      shape: "arrowDown",
      color: "#2962ff",
      text: "event",
    })
  );

  createSeriesMarkers(
    candleSeries,
    markers
  );

  return {
    chart,
    candleSeries,
  };
}

function formatEvent(event) {
  return JSON.stringify(
    {
      hypothesisId: event.hypothesis_id,
      time: new Date(event.time).toISOString(),
      direction: event.direction,
      price: event.price,
      instrument: event.instrument,
      timeframe: event.timeframe,
      context: event.context,
    },
    null,
    2
  );
}

function initialiseEventNavigation({
  chart,
  events,
}) {
  let selectedIndex = 0;

  const previousButton =
    document.querySelector("#previous-event");

  const nextButton =
    document.querySelector("#next-event");

  const position =
    document.querySelector("#event-position");

  const details =
    document.querySelector("#event-details");

  function selectEvent(index) {
    selectedIndex = Math.max(
      0,
      Math.min(index, events.length - 1)
    );

    const event =
      events[selectedIndex];

    position.textContent =
      `${selectedIndex + 1} / ${events.length}`;

    details.textContent =
      formatEvent(event);

    const eventTime =
      Math.floor(event.time / 1000);

    // Show roughly 40 M5 candles either side.
    const windowSeconds =
      40 * 5 * 60;

    chart.timeScale().setVisibleRange({
      from: eventTime - windowSeconds,
      to: eventTime + windowSeconds,
    });

    previousButton.disabled =
      selectedIndex === 0;

    nextButton.disabled =
      selectedIndex === events.length - 1;
  }

  previousButton.addEventListener(
    "click",
    () => selectEvent(selectedIndex - 1)
  );

  nextButton.addEventListener(
    "click",
    () => selectEvent(selectedIndex + 1)
  );

  selectEvent(0);
}

async function main() {
  try {
    const {
      candles,
      eventPayload,
    } = await loadData();

    document.querySelector(
      "#summary"
    ).textContent =
      `${candles.length.toLocaleString()} candles · ` +
      `${eventPayload.eventCount.toLocaleString()} test events`;

    const {
      chart,
    } = initialiseChart(
      candles,
      eventPayload
    );

    initialiseEventNavigation({
      chart,
      events: eventPayload.events,
    });
  } catch (error) {
    document.querySelector(
      "#summary"
    ).textContent =
      `Error: ${error.message}`;

    console.error(error);
  }
}

main();