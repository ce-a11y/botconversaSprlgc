import nlp from "compromise";
import axios from "axios";
import { configDotenv } from "dotenv";
import { extrairNomeComIA, formatarNome } from "./functions.js";



const padroesNome = [
    "meu nome é", "pode me chamar de", "eu sou o", "eu sou a",
    "aqui é o", "aqui é a", "me conhecem como", "me chame de",
    "sou o", "sou a", "opa, sou o", "opa, sou a", "eu me chamo",
    "pode chamar de"
  ];

  export async function extrairNome(mensagem) {
    let mensagemLimpa = mensagem.toLowerCase().trim();

    for (let padrao of padroesNome) {
        if (mensagemLimpa.startsWith(padrao)) {
            mensagemLimpa = mensagemLimpa.replace(padrao, "").trim();
            break;
        }  
    }

    let doc = nlp(mensagemLimpa);
    let nomes = doc.people().out('array');

    if (nomes.length > 0) {
        return { nome: `${formatarNome(nomes[0])}` };
    }

    return await extrairNomeComIA(mensagem);


  }