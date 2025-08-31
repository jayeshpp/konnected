import { renderTemplate } from "../templateLoader";
import fs from "fs";

const html = renderTemplate("inviteUser", {
  orgName: "Acme Inc.",
  inviterName: "Jane Doe",
  inviteUrl: "https://app.konnected.io/invite/123",
  year: new Date().getFullYear(),
});

fs.writeFileSync("preview.html", html);
console.log("✅ Preview saved to preview.html");
