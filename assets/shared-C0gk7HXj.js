(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const t of r)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function n(r){const t={};return r.integrity&&(t.integrity=r.integrity),r.referrerPolicy&&(t.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?t.credentials="include":r.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(r){if(r.ep)return;r.ep=!0;const t=n(r);fetch(r.href,t)}})();class i{static showErrorMessage(e,n,o="application"){const r=document.getElementById(e);if(!r){console.error("Error container not found:",e);return}const t="https://sji-api.dimensiondoor.xyz";r.innerHTML=`
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <h3 style="color: #dc3545; margin-bottom: 1rem;">
                        ${this.getErrorTitle(n,o)}
                    </h3>
                    <p style="color: #6c757d; margin-bottom: 1rem;">
                        ${this.getErrorMessage(n,o)}
                    </p>
                    <p style="color: #6c757d; font-size: 0.9rem;">
                        Expected API endpoint: <code>${t}</code>
                    </p>
                    <p style="color: #6c757d; font-size: 0.9rem;">
                        Check the console for more details.
                    </p>
                    <button onclick="location.reload()" 
                            style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0d6efd; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </div>
        `}static getErrorTitle(e,n){var o;return(o=e.message)!=null&&o.includes("fetch")||e.name==="TypeError"?"API Connection Error":n==="map"?"Map Initialization Error":"Application Error"}static getErrorMessage(e,n){var o;return(o=e.message)!=null&&o.includes("fetch")||e.name==="TypeError"?"Unable to connect to the data API. This application requires a backend API server to provide GeoJSON data.":n==="map"?"Failed to initialize the interactive map. Please check your internet connection and try again.":"An unexpected error occurred while loading the application."}static logError(e,n,o={}){console.group(`🔴 Error in ${n}`),console.error("Error:",e),console.error("Stack:",e.stack),console.error("Additional info:",o),console.groupEnd()}}class a{static async initialize(e,n,o="Application"){document.readyState==="loading"&&await new Promise(r=>{document.addEventListener("DOMContentLoaded",r)});try{console.log(`🚀 Initializing ${o}...`);const r=new n(e);return console.log(`✅ ${o} initialized successfully`),r}catch(r){throw i.logError(r,o.toLowerCase()),i.showErrorMessage(e,r,"application"),r}}static setupGlobalErrorHandlers(){window.addEventListener("unhandledrejection",e=>{i.logError(e.reason,"unhandled-promise"),e.preventDefault()}),window.addEventListener("error",e=>{i.logError(e.error,"global-error",{filename:e.filename,lineno:e.lineno,colno:e.colno})})}}export{a as A};
//# sourceMappingURL=shared-C0gk7HXj.js.map
