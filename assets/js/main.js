/* ==========================================================================
   Fibonacci 2026 — shared interactions
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ header --- */

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -------------------------------------------------------------- menu --- */

  var menu = document.getElementById("site-menu");
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");

  function openMenu() {
    if (!menu) return;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    if (closeBtn) closeBtn.focus();
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (openBtn) openBtn.focus();
  }
  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu && menu.classList.contains("is-open")) closeMenu();
  });
  if (menu) {
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* --------------------------------------------------- reveal on scroll --- */

  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------- presentation --- */

  var presentBtns = document.querySelectorAll("[data-presentation]");
  presentBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = document.body.classList.toggle("presentation");
      presentBtns.forEach(function (b) {
        b.setAttribute("aria-pressed", on ? "true" : "false");
        var label = b.querySelector(".presentation-label");
        if (label) label.textContent = on ? "Exit presentation" : "Presentation mode";
      });
      if (on) {
        document.querySelectorAll(".reveal").forEach(function (el) {
          el.classList.add("is-visible");
        });
      }
    });
  });

  /* ---------------------------------------------------------- back to top --- */

  document.querySelectorAll("[data-to-top]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------------------------------------------------------------- tabs --- */

  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var name = group.getAttribute("data-tabs");
    var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-tab]"));
    var panels = Array.prototype.slice.call(
      document.querySelectorAll('[data-panel^="' + name + ':"]')
    );

    function select(key) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-selected", b.getAttribute("data-tab") === key ? "true" : "false");
        b.setAttribute("tabindex", b.getAttribute("data-tab") === key ? "0" : "-1");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name + ":" + key);
      });
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        select(btn.getAttribute("data-tab"));
      });
      btn.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = buttons[(i + dir + buttons.length) % buttons.length];
        next.focus();
        select(next.getAttribute("data-tab"));
      });
    });
  });

  /* ------------------------------------------------------------ highlight --- */

  document.querySelectorAll("[data-highlight]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-highlight");
      var group = btn.closest("[data-highlight-group]");
      if (group) {
        group.querySelectorAll("[data-highlight]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
      }
      document.querySelectorAll("[data-lit]").forEach(function (node) {
        var key = node.getAttribute("data-lit");
        node.classList.toggle("is-lit", key === target);
        node.classList.toggle("is-lit-data", key === "esp32" && target === "esp32");
        if (key === "arduino" && target !== "arduino") node.classList.remove("is-lit");
      });
    });
  });

  /* ----------------------------------------------------------- field maps --- */

  var PATTERNS = {
    plain: function () { return "A"; },
    intercrop: function (c) { return c % 2 === 0 ? "A" : "B"; },
    advanced: function (c) { return c % 4 < 2 ? "A" : "B"; },
    mixed: function (c) { return c < 2 ? "A" : c < 4 ? "B" : "C"; },
    uniform: function () { return "A"; },
    selective: function () { return "A"; }
  };

  document.querySelectorAll("[data-field]").forEach(function (el) {
    var cols = parseInt(el.getAttribute("data-cols") || "6", 10);
    var rows = parseInt(el.getAttribute("data-rows") || "6", 10);
    var pattern = el.getAttribute("data-pattern") || "plain";
    var template = el.getAttribute("data-crops");
    var crops = template ? template.split(",") : null;
    var marker = el.getAttribute("data-marker") || "";
    var excluded = (el.getAttribute("data-excluded") || "").split(",").filter(Boolean);
    var treated = (el.getAttribute("data-treated") || "").split(",").filter(Boolean);

    el.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 1fr))";

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = document.createElement("div");
        cell.className = "cell";
        var id = String.fromCharCode(65 + r) + "-" + String(c + 1).padStart(2, "0");

        var crop = crops && crops[r] ? crops[r] : (PATTERNS[pattern] || PATTERNS.plain)(c);
        cell.setAttribute("data-crop", crop || "A");

        if (excluded.indexOf(id) !== -1) {
          cell.classList.add("is-excluded");
          cell.textContent = "·";
        } else if (treated.indexOf(id) !== -1) {
          cell.classList.add("is-treated");
          cell.textContent = crop || "A";
        } else {
          cell.textContent = crop || "A";
        }

        if (marker && marker.indexOf(id) !== -1) {
          cell.style.outline = "1px solid hsl(var(--signal) / 0.8)";
          cell.style.outlineOffset = "-1px";
        }

        cell.setAttribute("title", id + " · crop " + (crop || "A"));
        cell.dataset.cell = id;
        el.appendChild(cell);
      }
    }
  });

  /* ------------------------------------------------- serpentine rover map --- */

  var COLS = 6, ROWS = 4, CW = 72, CH = 46, OX = 46, OY = 56;

  function serpentineSteps() {
    var steps = [];
    for (var r = 0; r < ROWS; r++) {
      var order = r % 2 === 0 ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
      for (var i = 0; i < order.length; i++) {
        steps.push({
          col: order[i],
          row: r,
          phase: i === 0 && r > 0 ? "headland" : "cruise",
          heading: r % 2 === 0 ? "east" : "west"
        });
      }
    }
    return steps;
  }

  function cx(col) { return OX + col * CW + CW / 2; }
  function cy(row) { return OY + row * CH + CH / 2; }

  var roverMap = document.querySelector("[data-serpentine]");
  if (roverMap) {
    var steps = serpentineSteps();
    var width = OX * 2 + COLS * CW;
    var height = OY + ROWS * CH + 18;
    var idx = 0;
    var playing = !reduceMotion;
    var timer = null;

    var rowLabels = ["A", "B", "C", "D"];
    var cellsSvg = "";

    // headland bands
    var bands = [0, 1].map(function () { return ""; }).join("");

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var crop = c % 2 === 0 ? "A" : "B";
        var fill = crop === "A" ? "hsl(var(--signal) / 0.07)" : "hsl(var(--data) / 0.08)";
        var stroke = crop === "A" ? "hsl(var(--signal) / 0.22)" : "hsl(var(--data) / 0.24)";
        cellsSvg +=
          '<rect x="' + (OX + c * CW + 3) + '" y="' + (OY + r * CH + 3) +
          '" width="' + (CW - 6) + '" height="' + (CH - 6) +
          '" rx="4" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1"/>' +
          '<text x="' + cx(c) + '" y="' + (cy(r) + 3) + '" text-anchor="middle" ' +
          'font-family="var(--font-mono)" font-size="8" fill="' +
          (crop === "A" ? "hsl(var(--signal) / 0.65)" : "hsl(var(--data) / 0.7)") +
          '" letter-spacing="1">' + crop + "</text>";
      }
    }

    var labelsSvg = "";
    for (var rr = 0; rr < ROWS; rr++) {
      labelsSvg +=
        '<text x="' + (OX - 18) + '" y="' + (cy(rr) + 3) +
        '" text-anchor="middle" font-family="var(--font-mono)" font-size="7" ' +
        'fill="hsl(var(--muted-foreground) / 0.6)" letter-spacing="1">' +
        rowLabels[rr] + "</text>";
    }
    for (var cc = 0; cc < COLS; cc++) {
      labelsSvg +=
        '<text x="' + cx(cc) + '" y="' + (OY + ROWS * CH + 13) +
        '" text-anchor="middle" font-family="var(--font-mono)" font-size="7" ' +
        'fill="hsl(var(--muted-foreground) / 0.6)" letter-spacing="1">' +
        String(cc + 1).padStart(2, "0") + "</text>";
    }

    roverMap.innerHTML =
      '<svg viewBox="0 0 ' + width + " " + height + '" class="h-auto w-full" role="img" ' +
      'aria-label="Animated serpentine path across a six by four field grid. The rover crosses each row, turns at the headland and shifts to the next row.">' +
      '<defs><linearGradient id="trailGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="hsl(var(--signal) / 0.15)"/>' +
      '<stop offset="100%" stop-color="hsl(var(--signal) / 0.85)"/></linearGradient></defs>' +
      '<text x="' + OX + '" y="16" font-family="var(--font-mono)" font-size="7" letter-spacing="1.6" ' +
      'fill="hsl(var(--muted-foreground))">FIELD GRID · 6 × 4</text>' +
      '<text x="' + (width - OX) + '" y="16" text-anchor="end" font-family="var(--font-mono)" ' +
      'font-size="7" letter-spacing="1.4" fill="hsl(var(--muted-foreground) / 0.7)">HEADLAND BANDS AT ROW ENDS</text>' +
      '<rect x="' + (OX - 26) + '" y="' + (OY - 8) + '" width="' + (COLS * CW + 52) + '" height="14" ' +
      'rx="3" fill="hsl(var(--signal) / 0.05)" stroke="hsl(var(--signal) / 0.16)"/>' +
      '<rect x="' + (OX - 26) + '" y="' + (OY + ROWS * CH - 6) + '" width="' + (COLS * CW + 52) + '" height="14" ' +
      'rx="3" fill="hsl(var(--signal) / 0.05)" stroke="hsl(var(--signal) / 0.16)"/>' +
      cellsSvg + labelsSvg +
      '<polyline id="trail" fill="none" stroke="url(#trailGrad)" stroke-width="2" ' +
      'stroke-linejoin="round" stroke-linecap="round" points=""/>' +
      '<g id="rover"><circle r="7" fill="hsl(var(--signal) / 0.18)"/>' +
      '<circle r="3.2" fill="hsl(var(--signal))"/>' +
      '<circle r="8" fill="none" stroke="hsl(var(--signal) / 0.45)" stroke-width="1"/></g>' +
      "</svg>";

    var trail = roverMap.querySelector("#trail");
    var rover = roverMap.querySelector("#rover");
    var statusEl = document.querySelector("[data-serpentine-status]");
    var stepEl = document.querySelector("[data-serpentine-step]");

    function render() {
      var current = steps[idx];
      var pts = steps.slice(0, idx + 1).map(function (s) {
        return cx(s.col) + "," + cy(s.row);
      });
      pts.push(cx(current.col) + "," + cy(current.row));
      trail.setAttribute("points", pts.join(" "));
      rover.setAttribute("transform", "translate(" + cx(current.col) + "," + cy(current.row) + ")");

      if (statusEl) {
        statusEl.textContent =
          rowLabels[current.row] + "-" + String(current.col + 1).padStart(2, "0");
      }
      if (stepEl) {
        stepEl.textContent =
          "STEP " + (idx + 1) + "/" + steps.length + " · " + current.heading.toUpperCase();
      }
    }

    function advance() {
      idx = (idx + 1) % steps.length;
      render();
    }

    function play() {
      if (timer) clearInterval(timer);
      timer = setInterval(advance, 520);
    }

    var toggleBtn = document.querySelector("[data-serpentine-toggle]");
    var restartBtn = document.querySelector("[data-serpentine-restart]");

    function setPlaying(on) {
      playing = on;
      if (toggleBtn) toggleBtn.textContent = on ? "PAUSE" : "PLAY";
      if (on) play();
      else if (timer) { clearInterval(timer); timer = null; }
    }

    if (toggleBtn) toggleBtn.addEventListener("click", function () { setPlaying(!playing); });
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        idx = 0;
        render();
        if (!playing) setPlaying(true);
      });
    }

    render();
    if (!reduceMotion) play();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (timer) { clearInterval(timer); timer = null; }
      } else if (playing) play();
    });
  }

  /* --------------------------------------------------------- live dashboard --- */

  var dash = document.querySelector("[data-dashboard]");
  if (dash) {
    var el = function (key) { return dash.querySelector('[data-dc="' + key + '"]'); };

    var state = {
      moisture: 29.1,
      soilTemp: 20.8,
      ph: 6.8,
      n: 21,
      p: 18,
      k: 49,
      airTemp: 25.2,
      humidity: 61,
      heading: 95,
      cell: "B-02",
      sprayer: "ON",
      progress: 70
    };

    var trace = [26.4, 27.1, 27.8, 28.2, 27.6, 28.9, 29.4, 28.7, 29.1, 29.9, 30.2, 29.5, 29.1, 28.8, 29.3, 29.1];
    var cells = ["B-02", "C-03", "C-02", "C-01", "B-04"];
    var active = true;
    var tickTimer = null;

    function rand(base, spread, decimals) {
      var v = base + (Math.random() - 0.5) * spread;
      return decimals ? v.toFixed(decimals) : Math.round(v);
    }

    function sparkline() {
      var svg = dash.querySelector(".spark");
      if (!svg) return;
      var w = 300, h = 72, max = 36, min = 20;
      var stepX = w / (trace.length - 1);
      var pts = trace.map(function (v, i) {
        var y = h - ((v - min) / (max - min)) * h;
        return (i * stepX).toFixed(1) + "," + y.toFixed(1);
      });
      var line = pts.join(" ");
      var area = "0," + h + " " + line + " " + w + "," + h;

      var gridLines = [0.25, 0.5, 0.75].map(function (f) {
        return '<line x1="0" y1="' + (h * f) + '" x2="' + w + '" y2="' + (h * f) +
          '" stroke="hsl(var(--border))" stroke-width="0.6" stroke-dasharray="2 4"/>';
      }).join("");

      svg.innerHTML =
        '<defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="hsl(var(--signal) / 0.28)"/>' +
        '<stop offset="100%" stop-color="hsl(var(--signal) / 0)"/></linearGradient></defs>' +
        gridLines +
        '<polygon points="' + area + '" fill="url(#sparkFill)"/>' +
        '<polyline points="' + line + '" fill="none" stroke="hsl(var(--signal))" ' +
        'stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="' + w + '" cy="' + (h - ((trace[trace.length - 1] - min) / (max - min)) * h).toFixed(1) +
        '" r="2.6" fill="hsl(var(--signal))"/>';
    }

    function write(key, value, unit) {
      var node = el(key);
      if (!node) return;
      node.innerHTML = value + (unit ? "<small>" + unit + "</small>" : "");
    }

    function tick() {
      state.moisture = Math.max(24, Math.min(34, state.moisture + (Math.random() - 0.45) * 0.5));
      state.n = Math.max(12, Math.min(30, state.n + (Math.random() - 0.5) * 2));
      state.p = Math.max(10, Math.min(28, state.p + (Math.random() - 0.5) * 1.4));
      state.k = Math.max(36, Math.min(58, state.k + (Math.random() - 0.5) * 2.4));
      state.soilTemp = Math.max(18, Math.min(24, state.soilTemp + (Math.random() - 0.5) * 0.3));
      state.airTemp = Math.max(22, Math.min(29, state.airTemp + (Math.random() - 0.5) * 0.4));
      state.humidity = Math.max(52, Math.min(70, state.humidity + (Math.random() - 0.5) * 1.6));
      state.ph = Math.max(6.2, Math.min(7.2, state.ph + (Math.random() - 0.5) * 0.06));
      state.heading = (state.heading + (Math.random() - 0.5) * 2 + 360) % 360;

      trace.push(state.moisture);
      if (trace.length > 16) trace.shift();

      write("moisture", state.moisture.toFixed(1), "%");
      write("soiltemp", state.soilTemp.toFixed(1), "°C");
      write("ph", state.ph.toFixed(1));
      write("n", Math.round(state.n), "mg/kg");
      write("p", Math.round(state.p), "mg/kg");
      write("k", Math.round(state.k), "mg/kg");
      write("airtemp", state.airTemp.toFixed(1), "°C");
      write("humidity", Math.round(state.humidity), "%");
      write("heading", Math.round(state.heading), "°");

      var last = el("traceval");
      if (last) last.textContent = trace[trace.length - 1].toFixed(1) + "%";

      var sprayer = el("sprayer");
      if (sprayer) {
        var on = state.n < 30;
        state.sprayer = on ? "ON" : "OFF";
        sprayer.textContent = state.sprayer;
        sprayer.style.color = on ? "hsl(var(--signal))" : "hsl(var(--muted-foreground))";
      }

      sparkline();
    }

    sparkline();
    if (!reduceMotion) {
      tickTimer = setInterval(tick, 1600);
    }

    var feedBtn = dash.querySelector("[data-feed-toggle]");
    if (feedBtn) {
      feedBtn.addEventListener("click", function () {
        active = !active;
        feedBtn.setAttribute("aria-pressed", active ? "false" : "true");
        feedBtn.textContent = active ? "PAUSE FEED" : "RESUME FEED";
        var tag = dash.querySelector(".live-dot");
        if (tag) tag.classList.toggle("is-paused", !active);
        if (active) {
          if (!tickTimer) tickTimer = setInterval(tick, 1600);
        } else if (tickTimer) {
          clearInterval(tickTimer);
          tickTimer = null;
        }
      });
    }
  }

  /* ------------------------------------------------------- treatment cycle --- */

  document.querySelectorAll("[data-cycle]").forEach(function (node) {
    if (reduceMotion) return;
    var items = Array.prototype.slice.call(node.children);
    if (items.length < 2) return;
    var i = 0;
    setInterval(function () {
      items.forEach(function (it) { it.style.opacity = "0.38"; });
      items[i].style.opacity = "1";
      i = (i + 1) % items.length;
    }, 2400);
  });
})();
