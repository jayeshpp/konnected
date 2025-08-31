import fs from "fs";
import path from "path";
import mjml2html from "mjml";
import Handlebars from "handlebars";

const templatesDir = path.join(__dirname, "templates");

// Load and compile a template
export function renderTemplate(templateName: string, variables: Record<string, any>) {
  const templatePath = path.join(templatesDir, `${templateName}.html`);
  const htmlContent = fs.readFileSync(templatePath, "utf-8");

  // Compile with Handlebars
  const compiled = Handlebars.compile(htmlContent);
  return compiled(variables);
}

// Register partials (header/footer, etc.)
export function registerPartials() {
  const partialsDir = path.join(templatesDir, "partials");
  if (!fs.existsSync(partialsDir)) return;

  fs.readdirSync(partialsDir).forEach((file) => {
    if (file.endsWith(".mjml")) {
      const name = path.basename(file, ".mjml");
      const content = fs.readFileSync(path.join(partialsDir, file), "utf-8");
      const { html } = mjml2html(content);
      Handlebars.registerPartial(name, html);
    }
  });
}
