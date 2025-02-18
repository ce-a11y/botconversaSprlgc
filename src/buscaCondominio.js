import axios from 'axios';
import dotenv from 'dotenv';
import levenshtein from 'fast-levenshtein';
import { filtraCondominio, removerAcentos, formatarNomeCondominio } from './functions.js'

dotenv.config();

const BASE_URL = "https://api.superlogica.net/v2/condor";
const APP_TOKEN = process.env.APP_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Função para buscar todos os condomínios
async function buscaListaCond() {
    try {
        const response = await axios.get(`${BASE_URL}/condominios/get?id=-1&somenteCondominiosAtivos=1&ignorarCondominioModelo=1&apenasColunasPrincipais=1&apenasDadosDoPlanoDeContas=0&comDataFechamento=1&itensPorPagina=50&pagina=1`, {
            headers: {
                "app_token": APP_TOKEN,
                "access_token": ACCESS_TOKEN
            }
        });
        return response.data; // Retorna a lista de condomínios da API
    } catch (error) {
        console.error("Erro ao obter lista de condomínios:", error);
        return [];
    }
}


//busca nome do condominio

export async function buscaCondominio(nomeCondominio) {

    if (!nomeCondominio) {
        return {mensagem: "Digite o nome do condomínio!"}
    }
    
    const listaCondominio = await buscaListaCond();

    let encontrados = filtraCondominio(nomeCondominio, listaCondominio);


    if (encontrados === "" || !encontrados || encontrados.length === 0) {
        return { mensagem: "Nenhum condomínio encontrado com esse nome"}
    }

    if (encontrados.length === 1) {
        return { mensagem: ` Condomínio encontrado: ${encontrados[0].st_nome_cond}. Confirma essa opção?`,
            opcoes: encontrados.map(cond => ({
            id: cond.id,
            nome: formatarNomeCondominio(cond.nome) }))
        }
    }

    return { mensagem: "🏢 Encontramos mais de um condomínio. Escolha o seu:",
            opcoes: encontrados.map(cond => ({
            id: cond.id,
            nome: formatarNomeCondominio(cond.nome)})
        )
    }
        
}