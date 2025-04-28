import levenshtein from 'fast-levenshtein';
import fs from 'fs';
import axios from 'axios';
import { configDotenv } from 'dotenv';
import { logger } from './logger.js';

export function limparCPF(cpf) {
    return cpf.replace(/\D/g, ""); //deixa so numeros
}

export function validarCPF(cpf) {
    return cpf.length === 11; //"valida" o cpf. na real só ve se tem 11 digitos mesmo
}

export function formatarData(dataString) {
    const data = new Date(dataString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

export function formatarDataParaAPI(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
    const dia = String(data.getDate()).padStart(2, '0');
    const ano = data.getFullYear();
    return `${mes}/${dia}/${ano}`;
}

export function removerAcentos(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function filtraCondominio(nomeBusca, listaCondominios) {
    const palavrasRemover = ["condomínio", "condominio", "residencial", "edificio", "edifício", 
                            "apartamento", "prédio", "predio"]
    
    nomeBusca = removerAcentos(nomeBusca.toLowerCase().trim());
    
    palavrasRemover.forEach( palavra => {
        nomeBusca = nomeBusca.replace(new RegExp(`\\b${palavra}\\b`, "gi"), "").trim();
     })

     let encontrados = listaCondominios.map (u => {
        let nomeNormalizado = removerAcentos(u.st_nome_cond.toLowerCase());

        palavrasRemover.forEach( palavra => {
           nomeNormalizado = nomeNormalizado.replace(new RegExp(`\\b${palavra}\\b`, "gi"), "").trim();
        })
        
        //return nomeNormalizado.includes(nomeBusca);
        
        const distancia = levenshtein.get(nomeNormalizado, nomeBusca);
        const tamanhoMax = Math.max(nomeNormalizado.length, nomeBusca.length);
        const similaridade = 1 - distancia / tamanhoMax;

        //console.log("distancia:" + distancia);
        //console.log("tamanhoMax:" + tamanhoMax);
        //console.log("similaridade:" + similaridade);

        return {
            id: u.id_condominio_cond,
            nome: u.st_nome_cond,
            similaridade: similaridade
        };

    })

    encontrados = encontrados.filter(cond => cond.similaridade >= 0.75);

    if (encontrados.length === 0) {
        encontrados = encontrados.filter(cond => cond.similaridade >= 0.6)
    }

    encontrados.sort((a, b) => b.similaridade - a.similaridade);

    if (encontrados.length === 0) {
        encontrados = listaCondominios.filter( cond => 
            removerAcentos(cond.st_nome_cond.toLowerCase()).includes(nomeBusca)).map(cond => ({
                id: cond.id_condominio_cond,
                nome: cond.st_nome_cond,
                similaridade: 1
            })
            )
    }

    return encontrados;
    
}

export function formatarNomeCondominio(nome) {
    const palavrasRemover = ["condomínio", "condominio", "residencial", "edificio", "edifício", 
                              "apartamento", "prédio", "predio"];

    const palavrasMinusculas = ["de", "da", "do", "dos", "das", "e"];
   
    const numerosRomanos = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

    let nomeFormatado = removerAcentos(nome.toLowerCase().trim());

    palavrasRemover.forEach(palavra => {
        nomeFormatado = nomeFormatado.replace(new RegExp(`\\b${palavra}\\b`, "gi"), "").trim();
    });

    let palavras = nomeFormatado.split(" ");



    palavras = palavras.map((palavra, index) => {
        if(index === palavras.length - 1 && numerosRomanos.includes(palavra.toLowerCase())) {
            return palavra.toUpperCase();
        } else if (index > 0 && palavrasMinusculas.includes(palavra.toLowerCase())) {
            return palavra.toLowerCase();
        } else

        return palavra.charAt(0).toUpperCase() + palavra.slice(1);

    })

    return palavras.join(" ");
}

export function obterPeriodoDias(idCondominio) {
    const rawData = fs.readFileSync('./src/config-condominios.json');
    const configCondominios = JSON.parse(rawData);

    const condominioConfig = configCondominios.find(cond => cond.id === Number(idCondominio));
    return condominioConfig?.diasFiltro ?? 30; // Retorna diasFiltro se existir, senão 30
}
export function formatarNome(nome) {
    if (!nome) return "Nome inválido"; // Evita erros caso a string esteja vazia ou indefinida

    nome = nome.trim().replace(/[.,]+$/, "");  // Remove pontos no final da string
    const palavras = nome.split(" ");
    const primeiroNome = palavras[0];
    return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

export async function extrairNomeComIA(frase) {

    try {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;  
      const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
              model: "gpt-4-turbo", 
              messages: [
                  { role: "system", content: "Você é um assistente que extrai nomes de mensagens enviadas por usuários. Note que algum deles pode querer pregar peças e dizer nomes engraçadinhos. Nesses casos, tente identificar o real nome. Há a possibilidade de colocarem seus nomes no aumentativo, por zoeira. Pegue apenas o primeiro nome. Se o segundo nome tiver menos de três letras, ignore-o. Caso o usuário digite um apelido, retorne o nome mais comum associado a esse apelido." },
                  { role: "user", content: `Qual o nome na seguinte frase? Responda apenas o nome, sem explicação: "${frase}". Caso não haja nome na frase fornecida, responda apenas "NA"` }
              ],
              max_tokens: 10,
              temperature: 0.3
          },
          {
              headers: {
                  "Authorization": `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json"
              }
          }
      );

      const nomeExtraido = response.data.choices[0].message.content.trim();
      
      logger.info(`Encontrado o nome "${nomeExtraido} na mensagem ${frase}`);
      
      return { nome: `${nomeExtraido}` } || "NA"

  } catch (error) {
      console.error("Erro na OpenAI:", error);
      return "Nenhum nome detectado";
  }
}
