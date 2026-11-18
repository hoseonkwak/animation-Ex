// No runtime JS, just a dynamic creation of keyframes
let keyframes = '';

for (let i = 1; i <= 52; i++) {
    keyframes += `
        @keyframes a${i} {
            0%, 15%, ${36 + i}%, 100% { transform: rotateY(0deg); }
            25%, ${35 + i}% { transform: rotateY(calc(var(--i) * ${-0.7 - 0.001 * i}deg)); }
        }
    `;
}

const style = document.createElement('style');
style.innerHTML = keyframes;
document.head.appendChild(style);
