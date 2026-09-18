import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(new URL("./resolver-hook.mjs", import.meta.url));
