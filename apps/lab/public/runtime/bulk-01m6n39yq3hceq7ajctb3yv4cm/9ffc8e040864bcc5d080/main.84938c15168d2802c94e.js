import React, { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import clsx from "clsx";
createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null,
React.createElement(ToggleSwitchWithLegs, { label: "Dummy" })));
function ToggleSwitchWithLegs({ label, checked = false }) {
  const [isChecked, setIsChecked] = useState(checked);
  const [hasToggled, setHasToggled] = useState(false);
  function handleChange() {
    setIsChecked((val) => !val);
    setHasToggled(true);
  }
  return React.createElement("label", { className: "switch" },
  React.createElement("input", { className: clsx("switch__input", hasToggled && "switch__input--animated"), type: "checkbox", role: "switch", checked: isChecked, onChange: handleChange }),
  React.createElement("span", { className: "switch__sr" }, label),
  React.createElement(ToggleSwitchWithLegsDirt, null),
  React.createElement(ToggleSwitchWithLegsHandle, null));
}
function ToggleSwitchWithLegsDirt() {
  return React.createElement("svg", { className: "switch__dirt", viewBox: "0 0 24 24", width: "24", height: "24", "aria-hidden": "true" },
  React.createElement("g", { transform: "translate(0,21)" },
  React.createElement("g", { transform: "translate(12,0)" },
  React.createElement("g", { className: "switch__dirt-move switch__dirt-move--1" },
  React.createElement("circle", { className: "switch__dirt-particle", r: "3", transform: "translate(0,6)" }))),
  React.createElement("g", { transform: "translate(15,0)" },
  React.createElement("g", { className: "switch__dirt-move switch__dirt-move--2" },
  React.createElement("circle", { className: "switch__dirt-particle", r: "3", transform: "translate(0,6)" }))),
  React.createElement("g", { transform: "translate(18,0)" },
  React.createElement("g", { className: "switch__dirt-move switch__dirt-move--3" },
  React.createElement("circle", { className: "switch__dirt-particle", r: "3", transform: "translate(0,6)" }))),
  React.createElement("g", { transform: "translate(21,0)" },
  React.createElement("g", { className: "switch__dirt-move switch__dirt-move--4" },
  React.createElement("circle", { className: "switch__dirt-particle", r: "3", transform: "translate(0,6)" })))));
}
export default function ToggleSwitchWithLegsHandle() {
  return React.createElement("svg", { className: "switch__handle", viewBox: "0 0 24 36", width: "24", height: "36", "aria-hidden": "true" },
  React.createElement("clipPath", { id: "switch-handle-head" },
  React.createElement("circle", { r: "12", cx: "12", cy: "12" })),
  React.createElement("clipPath", { id: "switch-handle-legs" },
  React.createElement("rect", { y: "18", width: "24", height: "18" })),
  React.createElement("g", { clipPath: "url(#switch-handle-legs)" },
  React.createElement("g", { className: "switch__handle-legs", transform: "translate(0, 13)" },
  React.createElement("g", { stroke: "currentcolor", strokeLinecap: "round", strokeWidth: "1", transform: "translate(9,35.5)" },
  React.createElement("g", null,
  React.createElement("g", { className: "switch__handle-right-foot" },
  React.createElement("polyline", { points: "0 0, 3 0" })),
  React.createElement("g", { className: "switch__handle-right-leg-lower" },
  React.createElement("polyline", { points: "0 0, 0 -6" }),
  React.createElement("g", { transform: "translate(0,-6)" },
  React.createElement("g", { className: "switch__handle-right-leg-upper" },
  React.createElement("polyline", { points: "0 0, 0 -6" }))))),
  React.createElement("g", { transform: "translate(6,0)" },
  React.createElement("g", { className: "switch__handle-left-foot" },
  React.createElement("polyline", { points: "0 0, 3 0" })),
  React.createElement("g", { className: "switch__handle-left-leg-lower" },
  React.createElement("polyline", { points: "0 0, 0 -6" }),
  React.createElement("g", { transform: "translate(0,-6)" },
  React.createElement("g", { className: "switch__handle-left-leg-upper" },
  React.createElement("polyline", { points: "0 0, 0 -6" })))))))),
  React.createElement("g", { className: "switch__handle-body", transform: "translate(0, 12)" },
  React.createElement("g", { clipPath: "url(#switch-handle-head)" },
  React.createElement("circle", { className: "switch__handle-head", r: "12", cx: "12", cy: "12" }),
  React.createElement("g", { className: "switch__handle-face" },
  React.createElement("circle", { r: "1", cx: "-5", cy: "1" }),
  React.createElement("circle", { r: "1", cx: "5", cy: "1" }),
  React.createElement("path", { d: "M -2 2.5 H 2 A 2 2 0 0 1 -2 2.5" })))));
}