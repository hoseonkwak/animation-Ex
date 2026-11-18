import React, { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null,
React.createElement("main", null,
React.createElement(AnimatedCounter, { digits: 70, slots: 2 }),
React.createElement(AnimatedCounter, { digits: 909, slots: 3 }),
React.createElement(AnimatedCounter, { digits: 2001 }),
React.createElement(AnimatedCounter, { digits: 11938, slots: 5 }),
React.createElement(AnimatedCounter, { digits: 272106, slots: 6 }))));
function getSlotTravels(paddedDigits) {
  const travels = [];
  let previous = 0;
  for (const digit of paddedDigits) {
    const revolutions = Math.max(0, Math.ceil((previous + 1 - digit) / 10));
    const travel = digit === 0 && previous === 0 ? 0 : revolutions * 10 + digit;
    travels.push(travel);
    previous = travel;
  }
  return travels;
}
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
function AnimatedCounter({ digits, slots = 4, duration = 4000, hold = 1000, loop = true }) {
  const reducedMotion = usePrefersReducedMotion();
  const value = String(Math.max(0, Math.trunc(digits)));
  const slotCount = Math.max(slots, value.length);
  const paddedDigits = value.
  padStart(slotCount, "0").
  split("").
  map(Number);
  const travels = getSlotTravels(paddedDigits);
  const [rolled, setRolled] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setRolled(true);
      return;
    }
    setRolled(false);
    const timers = [];
    const schedule = (delay, action) => {
      timers.push(window.setTimeout(action, delay));
    };
    const runCycle = () => {
      schedule(hold, () => {
        setRolled(true);
        schedule(duration + hold, () => {
          setRolled(false);
          if (loop)
          schedule(duration, runCycle);
        });
      });
    };
    runCycle();
    return () => timers.forEach(window.clearTimeout);
  }, [value, slotCount, duration, hold, loop, reducedMotion]);
  return React.createElement("div", { className: "counter", role: "img", "aria-label": paddedDigits.join("") }, travels.map((travel, i) => {
    const slotKey = `slot-${i}`;
    const stripLength = (Math.floor(travel / 10) + 1) * 10;
    const stripDigits = Array.from({ length: stripLength }, (_, j) => j % 10);
    return React.createElement("div", { className: "counter__slot", "aria-hidden": "true", key: slotKey },
    React.createElement("div", { className: "counter__slot-digits", style: {
        "--offset": rolled ? travel : 0,
        "--roll-dur": `${duration}ms`
      } }, stripDigits.map((stripDigit, j) => {
      const digitKey = `digit-${i}-${j}`;
      return React.createElement("div", { key: digitKey, className: "counter__digit" }, stripDigit);
    })));
  }));
}