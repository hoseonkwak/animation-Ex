if (
    (window.location.pathname.indexOf('/debug/') < 0) &&
    (window.location.pathname.indexOf('/fullembedgrid/') < 0) &&
    (window.location.pathname.indexOf('/type=embed/') < 0)
) {

    const scriptIconsStyle = document.createElement('style');
    scriptIconsStyle.innerText = `

        @import url("https://fonts.googleapis.com/css?family=Raleway:400,400i,700");
        
        .scriptIcons {
            font-family: Raleway, sans-serif;
            font-size: 16px;
        }

        .scriptIcons-button {
            position: absolute;
            bottom: 5px; left: 0;
            font: inherit;
            font-size: 20px;
            border: none;
            color: #fff;
            background-color: #333;
            padding: 3px 4px 6px 8px;
            border-radius: 1em 0 0 1em;
            box-shadow: 1px 2px 8px #0007;
            box-sizing: border-box;
            overflow: clip;
            cursor: pointer;
            translate: calc(var(--toX, 0%) * -1 - 100%);
            transition: translate 0.5s;
            opacity: 0.75;
        }
        
        .scriptIcons {
            font-family: Raleway, sans-serif;
            position: fixed;
            right: 0; bottom: 0;
            width: 0;
            contain: layout;
            
            &:hover {
                --toX: -100%;
                
                li {
                    transition-delay: var(--delay, 0s), 0s;
                }
            }
            
            ul {
                list-style: none;
                display: flex;
                flex-direction: column;
                padding: 0;
                margin: 0;
            }
            
            li {
                padding-block: 5px;
                width: 160px;
                translate: var(--toX, var(--fromX, 0));
                transition: translate 0.5s, opacity 0.25s;
                opacity: 0.75;
            
                &:hover {
                    opacity: 1;
                }
            }
            
            .scriptIcons-item {
                display: grid;
                grid-template-columns: 24px auto;
                align-items: center;
                gap: 0.5em;
                width: 100%;
                text-decoration: none;
                color: #fff;
                background-color: #333;
                padding: 0.25em;
                border-radius: 1em 0 0 1em;
                box-shadow: 1px 2px 8px #0007;
                box-sizing: border-box;
                overflow: clip;
                cursor: pointer;
            }
            
            img {
                width: 1.5em;
                mix-blend-mode: lighten;
            }
        }
    `;

    const scriptIcons = document.createElement('div');
    scriptIcons.classList="scriptIcons"
    scriptIcons.innerHTML = `
        <!-- v.0.1 -->
        <button class="scriptIcons-button">🔗</button>

        <ul>
            <li style="--delay: 0.5s">
                <a class="scriptIcons-item" href="https://ko-fi.com/amit_sheen" target="_blank">
                    <img src="/runtime/bulk-01m6n3a8emmgswa1a3mcpnnhtv/f10f7df8975dc3ffd05b/__codepen_assets__/de64e983fa51657c657975e9.png" alt="" />
                    Ko-fi
                </a>
            </li>
            <li style="--delay: 0.35s">
                <a class="scriptIcons-item" href="https://www.linkedin.com/in/amit-sheen" target="_blank">
                    <img src="/runtime/bulk-01m6n3a8emmgswa1a3mcpnnhtv/f10f7df8975dc3ffd05b/__codepen_assets__/6a835e86ea655f898c5bdf81.png" alt="" />
                    Linkedin
                </a>
            </li>
            <li style="--delay: 0.2s">
                <a class="scriptIcons-item" href="https://x.com/amit_sheen" target="_blank">
                    <img src="/runtime/bulk-01m6n3a8emmgswa1a3mcpnnhtv/f10f7df8975dc3ffd05b/__codepen_assets__/40848d850c7ee6fc71f3023d.png" alt="" />
                    X (twitter)
                </a>
            </li>
            <li style="--delay: 0.05s">
                <a class="scriptIcons-item" href="https://bsky.app/profile/amitsheen.bsky.social" target="_blank">
                    <img src="/runtime/bulk-01m6n3a8emmgswa1a3mcpnnhtv/f10f7df8975dc3ffd05b/__codepen_assets__/91978ec985d118de16604e92.png" alt="" />
                    Bluesky
                </a>
            </li>
            <li>
                <a class="scriptIcons-item" href="https://amitsh.com" target="_blank">
                    <img src="/runtime/bulk-01m6n3a8emmgswa1a3mcpnnhtv/f10f7df8975dc3ffd05b/__codepen_assets__/bfcdcc53e36e8787466f2986.png" alt="" />
                    Website
                </a>
            </li>
        </ul>
    `;

    document.querySelector('head').appendChild(scriptIconsStyle);
    document.querySelector('body').appendChild(scriptIcons);
}
