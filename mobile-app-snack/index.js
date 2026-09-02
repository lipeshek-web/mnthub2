/**
 * Entrada para rodar FORA do Snack (expo start / expo export).
 * Dentro do Snack, o runtime deles envolve o App.js automaticamente e este
 * arquivo é simplesmente ignorado — pode conviver sem problema.
 */
import { registerRootComponent } from "expo";
import App from "./App.js";

registerRootComponent(App);
