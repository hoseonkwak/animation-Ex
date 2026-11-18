import { gsap } from "gsap";
import { RoughEase } from "gsap/EasePack";

class RadioButtonEffect {
  constructor(radioBtnGroups, config) {
    this.config = config;
    this.previousGroup = null;
    this.timelines = new WeakMap();

    radioBtnGroups.forEach((group) => {
      this.registerTimelines(group);
      const radioBtn = gsap.utils.selector(group)("input[type='radio']")[0];
      const label = group.querySelector("label");
      const timelines = this.timelines.get(group);

      label.addEventListener("mouseenter", () => {
        timelines.scanlineMotion.play();
        timelines.scanlineFlicker.play();
      });

      label.addEventListener("mouseleave", () => {
        timelines.scanlineMotion.pause(0);
        timelines.scanlineFlicker.pause(0);
      });

      radioBtn.addEventListener("change", () => {
        if (this.previousGroup && this.previousGroup !== group) {
          const previousTimelines = this.timelines.get(this.previousGroup);
          if (previousTimelines) {
            previousTimelines.pinkOpacity.reverse();
            previousTimelines.blueOpacity.reverse();
            previousTimelines.scanlineFlicker.reverse();
            previousTimelines.scanlineDisplacement.pause(0);
          }
        }

        timelines.pinkOpacity.play();
        timelines.blueOpacity.play();
        timelines.scanlineFlicker.play();
        timelines.scanlineDisplacement.play();

        this.previousGroup = group;
      });
    });
  }

  registerTimelines(group) {
    const { duration, ease, easeOut } = this.config;
    const scanlinePattern = group.querySelector(".scanline-pattern");
    const scanline = group.querySelector(".scanline");
    const displacement = group.querySelector(".displace");
    const bluePolygon = group.querySelector(".blue");
    const pinkPolygon = group.querySelector(".pink");

    const createTimeline = (options = {}) =>
      gsap.timeline({
        paused: true,
        ...options
      });

    const timelines = {
      scanlineMotion: createTimeline(),
      scanlineFlicker: createTimeline(),
      scanlineDisplacement: createTimeline({
        repeat: -1,
        repeatDelay: 1
      }),
      pinkOpacity: createTimeline(),
      blueOpacity: createTimeline()
    };

    timelines.scanlineMotion.to(scanlinePattern, {
      attr: { y: 10 },
      duration: 0.35,
      ease: "none",
      repeat: -1
    });

    timelines.scanlineFlicker.to(scanline, {
      fill: "#1d3b57",
      duration,
      ease,
      repeat: -1,
      yoyo: true
    });

    timelines.scanlineDisplacement
      .to(displacement, {
        attr: {
          scale: () => gsap.utils.random(0.02, 0.15)
        },
        duration,
        ease,
        repeatRefresh: true
      })
      .to(displacement, {
        attr: { scale: 0 },
        duration,
        ease
      });

    timelines.blueOpacity.to(bluePolygon, {
      x: 60,
      rotation: -1080,
      transformOrigin: "center center",
      opacity: 1,
      ease,
      duration,
      easeReverse: easeOut,
    });

    timelines.pinkOpacity.to(pinkPolygon, {
      x: 60,
      rotation: 1080,
      transformOrigin: "center center",
      opacity: 1,
      ease,
      duration,
      easeReverse: easeOut,
    });

    this.timelines.set(group, timelines);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const config = {
    ease: RoughEase.ease.config({ strength: 6, points: 50 }),
    easeOut: "power2.in",
    duration: 1
  };

  const radioBtnGroups = document.querySelectorAll(".radio-btn-group");
  new RadioButtonEffect(radioBtnGroups, config);
});
