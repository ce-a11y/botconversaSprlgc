import nlp from "compromise";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Para carregar a chave da OpenAI no .env

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Sua chave da OpenAI


// Lista de frases que podem indicar um nome
const padroesNome = [
  "meu nome é", "pode me chamar de", "eu sou o", "eu sou a",
  "aqui é o", "aqui é a", "me conhecem como", "me chame de",
  "sou o", "sou a", "opa, sou o", "opa, sou a", "eu me chamo",
  "pode chamar de"
];

async function extrairNome(mensagem) {
    let mensagemLimpa = mensagem.toLowerCase().trim();

    // Verifica se a mensagem contém um dos padrões
    for (let padrao of padroesNome) {
        if (mensagemLimpa.startsWith(padrao)) {
            mensagemLimpa = mensagemLimpa.replace(padrao, "").trim();
            break;
        }
    }

    // Usa a biblioteca compromise para tentar identificar um nome
    let doc = nlp(mensagemLimpa);
    let nomes = doc.people().out('array');

    // Se a compromise encontrou algum nome, retorna ele
    if (nomes.length > 0) {
        return nomes[0]; // Pegamos apenas o primeiro nome
    }

    // Se não achou com a biblioteca, pega a última palavra (exemplo: "meu nome é Thiago")
   // let palavras = mensagemLimpa.split(" ");
    //if (palavras.length > 0) {
    //    return palavras[palavras.length - 1];
    // }


    return await extrairNomeComIA(mensagem);

  }


  async function extrairNomeComIA(frase) {
    try {
      const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
              model: "gpt-4-turbo", // Usa GPT-4 Turbo (mais barato)
              messages: [
                  { role: "system", content: "Você é um assistente que extrai nomes de mensagens enviadas por usuários." },
                  { role: "user", content: `Qual o nome na seguinte frase? Responda apenas o nome, sem explicação: "${frase}"` }
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
      return `${nomeExtraido} no gpt` || "Nenhum nome detectado";

  } catch (error) {
      console.error("Erro na OpenAI:", error);
      return "Nenhum nome detectado";
  }
}

// Teste
(async () => {
  console.log(await extrairNome("Meu nome é João")); // João
  console.log(await extrairNome("Pode me chamar de Maria Clara")); // Maria Clara
  console.log(await extrairNome("Opa, sou o Rafael")); // Rafael
  console.log(await extrairNome("Aqui é o Felipe")); // Felipe
  console.log(await extrairNome("Chama de Ricardo")); // Ricardo
  console.log(await extrairNome("Bananilson. Foi esse o nome queMinha mãe me batizou.")); // Tenta IA
})();