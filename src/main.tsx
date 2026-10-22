import { createRoot } from "react-dom/client";
import { Presentation } from "./deck/Presentation";

// No StrictMode: it would mount the Reveal instance twice in development.
createRoot(document.getElementById("root")!).render(<Presentation />);
