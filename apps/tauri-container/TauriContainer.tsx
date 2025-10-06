import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { commands } from "../../shared/api";
import { useTheme } from "../../shared/contexts/ThemeContext";

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
  {
    id: "friends-app",
    name: "Friends",
    description: "Manage your friends list with avatars, tags, and meeting history",
    path: "/apps/friends-app/index.html",
  },
  {
    id: "wardrobe-app",
    name: "Wardrobe",
    description: "Manage your clothing with background-removed images and wear tracking",
    path: "/apps/wardrobe-app/index.html",
  },
];

export default function TauriContainer() {
  const { theme, setTheme } = useTheme();

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
    <div className="min-h-screen bg-primary p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Command Center
            </h1>
            <p className="text-secondary">Select an application to launch</p>
          </div>

          {/* Theme Switcher */}
          <div className="flex gap-2 bg-surface rounded-lg p-1 border border-primary">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded transition-colors ${
                theme === 'light'
                  ? 'bg-accent text-white'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Light theme"
            >
              ☀️
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded transition-colors ${
                theme === 'dark'
                  ? 'bg-accent text-white'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Dark theme"
            >
              🌙
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`px-3 py-2 rounded transition-colors ${
                theme === 'auto'
                  ? 'bg-accent text-white'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Auto theme"
            >
              💻
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => launchApp(app)}
              className="bg-surface rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left border border-primary hover:bg-surface-hover"
            >
              <h2 className="text-xl font-semibold text-primary mb-2">
                {app.name}
              </h2>
              <p className="text-secondary">{app.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
