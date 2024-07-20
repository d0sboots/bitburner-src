import Root from "./doc/en/index.md?raw";
import { AllPages } from "./pages";

export type Document = typeof Root;

export const getPage = (title: string): Document => AllPages["en/" + title] ?? Root;
