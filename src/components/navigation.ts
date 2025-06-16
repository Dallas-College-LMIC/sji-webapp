import { BRANDING } from '../js/constants';

export function createNavigation(activePageTitle: string = ''): string {
    return `
        <nav class="navbar navbar-expand-lg navbar-dark g-0 p-0 m-0" id="banner">
            <a class="navbar-brand p-0" href="${BRANDING.homeUrl}">
                <img src="${BRANDING.logoUrl}" id="dc_logo" alt="Dallas College Logo" />
            </a>
            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#bannertoggle"
            >
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse p-0 justify-content-start" id="bannertoggle">
                <ul class="navbar-nav p-0">
                    <a class="nav-link" href="index.html">Project Home</a>
                    <a class="nav-link ${activePageTitle === 'wage' ? 'active' : ''}" href="access_wagelvl.html">
                        Job Access by Wage Level
                    </a>
                    <a class="nav-link ${activePageTitle === 'occupation' ? 'active' : ''}" href="access_occupation.html">
                        Job Access by Occupation
                    </a>
                    <a class="nav-link">Job Access by School of (in progress)</a>
                    <a class="nav-link">Travelsheds by Tract (in progress)</a>
                </ul>
            </div>
        </nav>
    `;
}

export function renderNavigation(containerId: string, activePageTitle: string = ''): void {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createNavigation(activePageTitle);
    }
}