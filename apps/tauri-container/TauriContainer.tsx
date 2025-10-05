import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { commands } from "../../shared/api";

interface App {
  id: string;
  name: string;
  description: string;
  path: string;
}

const apps: App[] = [
  {
    id: "example-app",
    name: "Example App",
    description: "A sample application demonstrating the pattern",
    path: "/apps/example-app/index.html",
  },
  {
    id: "calendar-app",
    name: "Calendar",
    description: "Select dates and emit calendar events",
    path: "/apps/calendar-app/index.html",
  },
  {
    id: "weather-app",
    name: "Weather",
    description: "Display weather data and react to calendar events",
    path: "/apps/weather-app/index.html",
  },
];

export default function TauriContainer() {
  const launchApp = async (app: App) => {
    // Create unique window ID by appending timestamp
    const windowId = `${app.id}-${Date.now()}`;

    const webview = new WebviewWindow(windowId, {
      url: app.path,
      title: app.name,
      width: 800,
      height: 600,
    });

    await webview.once("tauri://created", () => {
      console.log(`Window created for ${app.name}`);
    });

    await webview.once("tauri://error", (e) => {
      console.error(`Error creating window for ${app.name}:`, e);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Command Center
        </h1>
        <p className="text-gray-600 mb-8">Select an application to launch</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => launchApp(app)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {app.name}
              </h2>
              <p className="text-gray-600">{app.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
