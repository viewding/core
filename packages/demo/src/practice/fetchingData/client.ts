import { html,reactiveRef, mount, radio, effect } from 'viewding'

const API_URL = `https://api.github.com/repos/vuejs/core/commits?per_page=3&sha=`
const branches = ['main', 'v2-compat']

const currentBranch = reactiveRef(branches[0])
const commits = reactiveRef<object[]>([])

effect(async () => {
    const url = `${API_URL}${currentBranch()}`
    commits((await (await fetch(url)).json()) as object[])
})

function truncate(v) {
    const newline = v.indexOf('\n')
    return newline > 0 ? v.slice(0, newline) : v
}

function formatDate(v) {
    return v.replace(/T|Z/g, ' ')
}
function template() {
    return html`
        <h1>Latest Vue Core Commits</h1>
        ${branches.map(
            (branch) => html`
                <input
                    type="radio"
                    id=${branch}
                    value=${branch}
                    name="branch"
                    .checked=${radio(currentBranch)}
                />
                <label :for="branch">${branch}</label>
            `
        )}
        <p>vuejs/vue@${currentBranch()}</p>
        <ul>
            ${commits().map((item) => {
                let { html_url, sha, author, commit } = item as any
                return html`
                    <li>
                        <a href=${html_url} target="_blank" class="commit"
                            >${sha.slice(0, 7)}</a
                        >
                        -
                        <span class="message">${truncate(commit.message)}</span
                        ><br />
                        by
                        <span class="author">
                            <a href=${author.html_url} target="_blank"
                                >${commit.author.name}</a
                            >
                        </span>
                        at
                        <span class="date"
                            >${formatDate(commit.author.date)}</span
                        >
                    </li>
                `
            })}
        </ul>
        <style>
            a {
                text-decoration: none;
                color: #42b883;
            }
            li {
                line-height: 1.5em;
                margin-bottom: 20px;
            }
            .author,
            .date {
                font-weight: bold;
            }
        </style>
    `
}

mount(document.body, template)
