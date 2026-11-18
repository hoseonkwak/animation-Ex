import Zdog from "zdog"

const illoElem = document.querySelector('.illo')
const sceneSize = 96
const TAU = Zdog.TAU
let displaySize

const illo = new Zdog.Illustration({
  element: illoElem,
  scale: 5.8,
  resize: 'fullscreen',
  onResize(width, height) {
    displaySize = Math.min(width, height)
    this.zoom = Math.floor(displaySize / sceneSize)
  },
})

const heart = new Zdog.Group({
  addTo: illo,
  scale: 1,
})

const size = 4
const thickness = size/10.538

// left top
new Zdog.Cylinder({
  diameter: size/0.6075,
  length: thickness,
  addTo: heart,
  translate: { x: -size/1.7325, y: -size/5.75 },
  color: '#ff69ad',
  backface: '#ff69ad',
  stroke: false,
}),

// right top
new Zdog.Cylinder({
  diameter: size/0.609,
  length: thickness,
  addTo: heart,
  translate: { x: size/1.84, y: -size/5.75 },
  color: '#ff69ad',
  backface: '#ff69ad',
  stroke: false,
}),

// bottom
new Zdog.Cylinder({
  diameter: size/0.62,
  length: thickness,
  addTo: heart,
  translate: { x: -size/80, y: size/2.45 },
  color: '#ff69ad',
  backface: '#ff69ad',
  stroke: false,
}),

// left connector
new Zdog.Box({
  addTo: heart,
  width: size/1.15,
  height: size,
  depth: thickness,
  stroke: false,
  fill: true,
  color: '#ff69ad',
  translate: { x: -size/1.88, y: size/3.04 },
  rotate: { z: TAU/8.05 }
}),

// right connector
new Zdog.Box({
  addTo: heart,
  width: size/1.15,
  height: size,
  depth: thickness,
  stroke: false,
  fill: true,
  color: '#ff69ad',
  translate: { x: size/2.053, y: size/2.919 },
  rotate: { z: -TAU/8 }
}),

// left cheek
new Zdog.Shape({
  addTo: heart,
  translate: { x: -size/1.363, y: -size/10 },
  stroke: size*3.77,
  color: '#e34198'
}),

// right cheek
new Zdog.Shape({
  addTo: heart,
  translate: { x: size/1.428, y: -size/10 },
  stroke: size*3.77,
  color: '#e34198'
}),

// left eye
new Zdog.Shape({
  addTo: heart,
  translate: { x: -size/4.0625, y: -size/3.389 },
  stroke: size/0.893,
  color: '#461036'
}),

// right eye
new Zdog.Shape({
  addTo: heart,
  translate: { x: size/4.75, y: -size/3.389 },
  stroke: size/0.893,
  color: '#461036'
}),

// mouth
new Zdog.Shape({
  addTo: heart,
  path: [
    { x: -size/4.017, y: -size/25 }, // start
    { bezier: [
      { x: -size/6.666, y: size/7.575 }, // start control point
      { x: size/8.992, y: size/7.575 }, // end control point
      { x: size/4.75, y: -size/25 }, // end
    ]},
  ],
  closed: false,
  stroke: size/1.666,
  color: '#461036',
  backface: '#461036',
})

const cloud1 = new Zdog.Group({
  addTo: illo,
  scale: 1,
})

const cloud1Parts = [
  new Zdog.Shape({
    addTo: cloud1,
    stroke: size * 3,
    color: '#fff'
  }),

  new Zdog.Shape({
    addTo: cloud1,
    stroke: size * 3,
    color: '#fff',
    translate: { x: size/5, y: -size/10 }
  }),

  new Zdog.Shape({
    addTo: cloud1,
    stroke: size * 3,
    color: '#fff',
    translate: { x: size/5, y: size/10 }
  }),

  new Zdog.Shape({
    addTo: cloud1,
    stroke: size * 3,
    color: '#fff',
    translate: { x: size/2.5, y: size/12.5 }
  }),

  new Zdog.Shape({
    addTo: cloud1,
    stroke: size * 3,
    color: '#fff',
    translate: { x: size/2.22, y: -size/10 }
  }),

  new Zdog.Shape({
    addTo: cloud1,
    stroke: size * 2,
    color: '#fff',
    translate: { x: size/1.66, y: 0 }
  })
]

const cloud2 = new Zdog.Group({
  addTo: illo,
  scale: 1,
})

const cloud2Parts = [
  new Zdog.Shape({
    addTo: cloud2,
    stroke: size * 3.5,
    color: '#fff'
  }),

  new Zdog.Shape({
    addTo: cloud2,
    stroke: size * 3.5,
    color: '#fff',
    translate: { x: size/5, y: -size/10 }
  }),

  new Zdog.Shape({
    addTo: cloud2,
    stroke: size * 3.5,
    color: '#fff',
    translate: { x: size/5, y: size/10 }
  }),

  new Zdog.Shape({
    addTo: cloud2,
    stroke: size * 2.5,
    color: '#fff',
    translate: { x: size/2.5, y: size/12.5 }
  }),

  new Zdog.Shape({
    addTo: cloud2,
    stroke: size * 3,
    color: '#fff',
    translate: { x: size/2.22, y: -size/10 }
  }),

  new Zdog.Shape({
    addTo: cloud2,
    stroke: size * 2,
    color: '#fff',
    translate: { x: size/1.66, y: 0 }
  })
]

const animate = () => {
  const timeElapsed = Date.now() - start
  heart.rotate.set({
    y: Math.sin(timeElapsed / 400) / 2.3,
    z: Math.sin(timeElapsed / 400) / 8.1
  })
  heart.translate.set({
    y: Math.sin(timeElapsed / 100) / 2
  })
  cloud1.translate.set({
    x: Math.sin(timeElapsed / 2000) * 2 - size * 1.5,
    y: -size*1.25,
    z: -1
  })
  cloud2.translate.set({
    x: Math.sin(timeElapsed / 3000) * 5 + size/2,
    y: size*1.5,
    z: 1
  })
  cloud1Parts.forEach((part, i) => {
    part.translate.y += Math.sin(timeElapsed / (500 * (i/5))) / 500
  })
  cloud2Parts.forEach((part, i) => {
    part.translate.y += Math.sin(timeElapsed / (500 * (i/5))) / 500
  })
  illo.updateGraph()
  illo.renderGraph()
  requestAnimationFrame(animate)
}

const start = Date.now()
animate()