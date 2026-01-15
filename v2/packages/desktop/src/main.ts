import { invoke } from "@tauri-apps/api/core";

interface BackendReadyData {
  url: string;
  password?: string;
}

async function initializeApp() {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  // Show loading state
  root.innerHTML = `
    <div style="text-align: center;">
      <h1>HA Assist Desktop</h1>
      <p>Connecting to backend...</p>
    </div>
  `;

  try {
    // Wait for backend to be ready
    const backendData = await invoke<BackendReadyData>("ensure_backend_ready");
    
    console.log("Backend ready:", backendData.url);

    // Store backend URL and password globally for web app
    (window as any).__HA_ASSIST__ = {
      backendUrl: backendData.url,
      password: backendData.password,
    };

    // Show success and next steps
    root.innerHTML = `
      <div style="text-align: center; max-width: 600px; padding: 20px;">
        <h1>HA Assist Desktop</h1>
        <p style="color: #4ade80;">✓ Backend connected</p>
        <p style="color: #888; margin-top: 20px;">Backend URL: ${backendData.url}</p>
        <p style="color: #888; margin-top: 10px; font-size: 12px;">
          TODO: Load and mount web app components from @ha-assist/web
        </p>
      </div>
    `;

    // TODO: Import and mount the web app
    // import('@ha-assist/web').then(webApp => {
    //   webApp.mount(root, { backendUrl: backendData.url, password: backendData.password });
    // });

  } catch (error) {
    console.error("Failed to connect to backend:", error);
    root.innerHTML = `
      <div style="text-align: center; color: #ef4444;">
        <h1>Connection Error</h1>
        <p>Failed to connect to backend</p>
        <p style="font-size: 12px; color: #888;">${error}</p>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
